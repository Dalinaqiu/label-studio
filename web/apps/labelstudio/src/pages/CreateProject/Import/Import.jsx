import { SampleDatasetSelect } from "@humansignal/app-common/blocks/SampleDatasetSelect/SampleDatasetSelect";
import { ff, formatFileSize } from "@humansignal/core";
import { IconCode, IconErrorAlt, IconFileUpload, IconInfoOutline, IconTrash, IconUpload } from "@humansignal/icons";
import { Badge } from "@humansignal/shad/components/ui/badge";
import { cn as scn } from "@humansignal/shad/utils";
import { useAtomValue } from "jotai";
import Input from "libs/datamanager/src/components/Common/Input/Input";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useAPI } from "../../../providers/ApiProvider";
import { cn } from "../../../utils/bem";
import { unique } from "../../../utils/helpers";
import { sampleDatasetAtom } from "../utils/atoms";
import "./Import.scss";
import { Button, CodeBlock, SimpleCard, Spinner, Tooltip, Typography } from "@humansignal/ui";
import truncate from "truncate-middle";
import samples from "./samples.json";
import { importFiles } from "./utils";

const importClass = cn("upload_page");
const dropzoneClass = cn("dropzone");

// Constants for file display and animation
const FLASH_ANIMATION_DURATION = 2000; // 2 seconds
const FILENAME_TRUNCATE_START = 24;
const FILENAME_TRUNCATE_END = 24;

function flatten(nested) {
  return [].concat(...nested);
}

// Keep in sync with core.settings.SUPPORTED_EXTENSIONS on the BE.
const supportedExtensions = {
  text: ["txt"],
  audio: ["wav", "mp3", "flac", "m4a", "ogg"],
  video: ["mp4", "webm"],
  image: ["bmp", "gif", "jpg", "jpeg", "png", "svg", "webp"],
  medicalImage: ["dcm", "dicom", "svs", "tif", "tiff"],
  html: ["html", "htm", "xml"],
  pdf: ["pdf"],
  structuredData: ["csv", "tsv", "json"],
};
const allSupportedExtensions = flatten(Object.values(supportedExtensions));

function getFileExtension(fileName) {
  if (!fileName) {
    return fileName;
  }
  return fileName.split(".").pop().toLowerCase();
}

function traverseFileTree(item, path) {
  return new Promise((resolve) => {
    path = path || "";
    if (item.isFile) {
      // Avoid hidden files
      if (item.name[0] === ".") return resolve([]);

      resolve([item]);
    } else if (item.isDirectory) {
      // Get folder contents
      const dirReader = item.createReader();
      const dirPath = `${path + item.name}/`;

      dirReader.readEntries((entries) => {
        Promise.all(entries.map((entry) => traverseFileTree(entry, dirPath)))
          .then(flatten)
          .then(resolve);
      });
    }
  });
}

function getFiles(files) {
  // @todo this can be not a files, but text or any other draggable stuff
  return new Promise((resolve) => {
    if (!files.length) return resolve([]);
    if (!files[0].webkitGetAsEntry) return resolve(files);

    // Use DataTransferItemList interface to access the file(s)
    const entries = Array.from(files).map((file) => file.webkitGetAsEntry());

    Promise.all(entries.map(traverseFileTree))
      .then(flatten)
      .then((fileEntries) => fileEntries.map((fileEntry) => new Promise((res) => fileEntry.file(res))))
      .then((filePromises) => Promise.all(filePromises))
      .then(resolve);
  });
}

const Upload = ({ children, sendFiles }) => {
  const [hovered, setHovered] = useState(false);
  const onHover = (e) => {
    e.preventDefault();
    setHovered(true);
  };
  const onLeave = setHovered.bind(null, false);
  const dropzoneRef = useRef();

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      onLeave();
      getFiles(e.dataTransfer.items).then((files) => sendFiles(files));
    },
    [onLeave, sendFiles],
  );

  return (
    <div
      id="holder"
      className={dropzoneClass.mod({ hovered })}
      ref={dropzoneRef}
      onDragStart={onHover}
      onDragOver={onHover}
      onDragLeave={onLeave}
      onDrop={onDrop}
      // {...getRootProps}
    >
      {children}
    </div>
  );
};

const ErrorMessage = ({ error }) => {
  if (!error) return null;
  let extra = error.validation_errors ?? error.extra;
  // support all possible responses

  if (extra && typeof extra === "object" && !Array.isArray(extra)) {
    extra = extra.non_field_errors ?? Object.values(extra);
  }
  if (Array.isArray(extra)) extra = extra.join("; ");

  return (
    <div className={importClass.elem("error")}>
      <IconErrorAlt width="24" height="24" />
      {error.id && `[${error.id}] `}
      {error.detail || error.message}
      {extra && ` (${extra})`}
    </div>
  );
};

export const ImportPage = ({
  project,
  sample,
  show = true,
  onWaiting,
  onFileListUpdate,
  onSampleDatasetSelect,
  highlightCsvHandling,
  dontCommitToProject = false,
  csvHandling,
  setCsvHandling,
  addColumns,
  openLabelingConfig,
}) => {
  const [error, setError] = useState();
  const [newlyUploadedFiles, setNewlyUploadedFiles] = useState(new Set());
  const prevUploadedRef = useRef(new Set());
  const api = useAPI();
  const projectConfigured = project?.label_config !== "<View></View>";
  const sampleConfig = useAtomValue(sampleDatasetAtom);

  const processFiles = (state, action) => {
    if (action.sending) {
      return { ...state, uploading: [...action.sending, ...state.uploading] };
    }
    if (action.sent) {
      return {
        ...state,
        uploading: state.uploading.filter((f) => !action.sent.includes(f)),
      };
    }
    if (action.uploaded) {
      return {
        ...state,
        uploaded: unique([...state.uploaded, ...action.uploaded], (a, b) => a.id === b.id),
      };
    }
    if (action.ids) {
      const ids = unique([...state.ids, ...action.ids]);

      onFileListUpdate?.(ids);
      return { ...state, ids };
    }
    return state;
  };

  const [files, dispatch] = useReducer(processFiles, {
    uploaded: [],
    uploading: [],
    ids: [],
  });
  const showList = Boolean(files.uploaded?.length || files.uploading?.length || sample);

  const loadFilesList = useCallback(
    async (file_upload_ids) => {
      const query = {};

      if (file_upload_ids) {
        // should be stringified array "[1,2]"
        query.ids = JSON.stringify(file_upload_ids);
      }
      const files = await api.callApi("fileUploads", {
        params: { pk: project.id, ...query },
      });

      dispatch({ uploaded: files ?? [] });

      if (files?.length) {
        dispatch({ ids: files.map((f) => f.id) });
      }
      return files;
    },
    [project?.id],
  );

  const onError = (err) => {
    console.error(err);
    // @todo workaround for error about input size in a wrong html format
    if (typeof err === "string" && err.includes("RequestDataTooBig")) {
      const message = "导入的文件过大";
      const extra = err.match(/"exception_value">(.*)<\/pre>/)?.[1];

      err = { message, extra };
    }
    setError(err);
    onWaiting?.(false);
  };
  const onFinish = useCallback(
    async (res) => {
      const { could_be_tasks_list, data_columns, file_upload_ids } = res;

      dispatch({ ids: file_upload_ids });
      if (could_be_tasks_list && !csvHandling) setCsvHandling("choose");
      onWaiting?.(false);
      addColumns(data_columns);

      await loadFilesList(file_upload_ids);
      return res;
    },
    [addColumns, loadFilesList],
  );

  // Track newly uploaded files for flash animation
  useEffect(() => {
    const currentUploadedIds = new Set(files.uploaded.map((f) => f.id));
    const previousUploadedIds = prevUploadedRef.current;

    // Find files that were just uploaded (in current but not in previous)
    const justUploaded = new Set([...currentUploadedIds].filter((id) => !previousUploadedIds.has(id)));

    // Update the ref immediately after comparison to ensure it's available for next run
    prevUploadedRef.current = new Set(currentUploadedIds);

    // Clean up animation state for files that are no longer in the uploaded list
    setNewlyUploadedFiles((prev) => {
      const filtered = new Set([...prev].filter((id) => currentUploadedIds.has(id)));
      return filtered;
    });

    // Animate newly uploaded files (including first upload)
    if (justUploaded.size > 0) {
      // Apply animation class immediately for better responsiveness
      setNewlyUploadedFiles((prev) => new Set([...prev, ...justUploaded]));

      // Remove animation class after animation completes (CSS handles the animation timing)
      const timeoutId = setTimeout(() => {
        setNewlyUploadedFiles((prev) => {
          const updated = new Set(prev);
          justUploaded.forEach((id) => updated.delete(id));
          return updated;
        });
      }, FLASH_ANIMATION_DURATION);

      // Cleanup timeout on unmount or dependency change
      return () => clearTimeout(timeoutId);
    }
  }, [files.uploaded]);

  const importFilesImmediately = useCallback(
    async (files, body) => {
      importFiles({
        files,
        body,
        project,
        onError,
        onFinish,
        onUploadStart: (files) => dispatch({ sending: files }),
        onUploadFinish: (files) => dispatch({ sent: files }),
        dontCommitToProject,
      });
    },
    [project, onFinish],
  );

  const sendFiles = useCallback(
    (files) => {
      setError(null);
      onWaiting?.(true);
      files = [...files]; // they can be array-like object
      const fd = new FormData();

      for (const f of files) {
        if (!allSupportedExtensions.includes(getFileExtension(f.name))) {
          onError(new Error(`不支持文件 "${f.name}" 的类型。`));
          return;
        }
        fd.append(f.name, f);
      }
      return importFilesImmediately(files, fd);
    },
    [importFilesImmediately],
  );

  const onUpload = useCallback(
    (e) => {
      sendFiles(e.target.files);
      e.target.value = "";
    },
    [sendFiles],
  );

  const onLoadURL = useCallback(
    (e) => {
      e.preventDefault();
      setError(null);
      const url = urlRef.current?.value;

      if (!url) {
        return;
      }
      urlRef.current.value = "";
      onWaiting?.(true);
      const body = new URLSearchParams({ url });

      importFilesImmediately([{ name: url }], body);
    },
    [importFilesImmediately],
  );

  const openConfig = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      openLabelingConfig?.();
    },
    [openLabelingConfig],
  );

  useEffect(() => {
    if (project?.id !== undefined) {
      loadFilesList().then((files) => {
        if (csvHandling) return;
        // empirical guess on start if we have some possible tasks list/structured data problem
        if (Array.isArray(files) && files.some(({ file }) => /\.[ct]sv$/.test(file))) {
          setCsvHandling("choose");
        }
      });
    }
  }, [project?.id, loadFilesList]);

  const urlRef = useRef();

  if (!project) return null;
  if (!show) return null;

  const csvProps = {
    name: "csv",
    type: "radio",
    onChange: (e) => setCsvHandling(e.target.value),
  };

  return (
    <div className={importClass}>
      {highlightCsvHandling && <div className={importClass.elem("csv-splash")} />}
      <input id="file-input" type="file" name="file" multiple onChange={onUpload} style={{ display: "none" }} />

      <header className={importClass.elem("header")}>
        <div className={importClass.elem("source-bar")}>
          <div className={importClass.elem("source-copy")}>
            <Typography variant="title" size="small" className="text-neutral-content">
              选择数据来源
            </Typography>
            <Typography variant="body" size="small" className="text-neutral-content-subtler">
              支持本地文件、数据集 URL，也可以直接使用示例数据开始验证流程。
            </Typography>
          </div>
          <div className={importClass.elem("status")}>
            {files.uploaded.length ? `已上传 ${files.uploaded.length} 个文件` : "暂未上传文件"}
          </div>
        </div>

        <div className={importClass.elem("source-tags")}>
          <span>本地文件</span>
          <span>URL 导入</span>
          {ff.isActive(ff.FF_SAMPLE_DATASETS) && <span>示例数据</span>}
          <span>CSV / TSV</span>
        </div>

        <div className={importClass.elem("actions-row")}>
          <form className={importClass.elem("url-form")} method="POST" onSubmit={onLoadURL}>
            <Input placeholder="粘贴数据集 URL" name="url" ref={urlRef} rawClassName="h-[40px]" />
            <Button variant="primary" look="outlined" type="submit" aria-label="添加 URL">
              添加 URL
            </Button>
          </form>
          <Button
            variant="primary"
            look="outlined"
            type="button"
            onClick={() => document.getElementById("file-input").click()}
            leading={<IconUpload />}
            aria-label="上传文件"
          >
            上传{files.uploaded.length ? "更多" : ""}文件
          </Button>
          {ff.isActive(ff.FF_SAMPLE_DATASETS) && (
            <SampleDatasetSelect samples={samples} sample={sample} onSampleApplied={onSampleDatasetSelect} />
          )}
        </div>

        <div
          className={importClass.elem("csv-handling").mod({ highlighted: highlightCsvHandling, hidden: !csvHandling })}
        >
          <span>将 CSV / TSV 视为</span>
          <label>
            <input {...csvProps} value="tasks" checked={csvHandling === "tasks"} /> 任务列表
          </label>
          <label>
            <input {...csvProps} value="ts" checked={csvHandling === "ts"} /> 时间序列或整段文本文件
          </label>
        </div>
      </header>

      <ErrorMessage error={error} />

      <main>
        <Upload sendFiles={sendFiles} project={project}>
          <div
            className={scn("flex gap-4 w-full min-h-full", {
              "justify-center": !showList,
            })}
          >
            {!showList && (
              <div className="flex gap-4 justify-center items-start w-full h-full">
                <label htmlFor="file-input" className="w-full h-full">
                  <div className={`${dropzoneClass.elem("content")} w-full`}>
                    <IconFileUpload height="64" className={dropzoneClass.elem("icon")} />
                    <header>
                      拖放文件到这里
                    </header>
                    <p className={dropzoneClass.elem("subhead")}>或点击上传，从本地快速导入一批任务数据</p>

                    <dl>
                      <dt>图片</dt>
                      <dd>{supportedExtensions.image.join(", ")}</dd>
                      <dt>医学影像</dt>
                      <dd>{supportedExtensions.medicalImage.join(", ")}</dd>
                      <dt>音频</dt>
                      <dd>{supportedExtensions.audio.join(", ")}</dd>
                      <dt>
                        <div className="flex items-center gap-1">
                          视频
                          <Tooltip title="视频格式支持取决于你的浏览器。点击了解更多。">
                            <a
                              href="https://labelstud.io/tags/video#Video-format"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center"
                              aria-label="了解视频格式支持（在新标签页打开）"
                            >
                              <IconInfoOutline className="w-4 h-4 text-primary-content hover:text-primary-content-hover" />
                            </a>
                          </Tooltip>
                        </div>
                      </dt>
                      <dd>{supportedExtensions.video.join(", ")}</dd>
                      <dt>HTML / 超文本</dt>
                      <dd>{supportedExtensions.html.join(", ")}</dd>
                      <dt>文本</dt>
                      <dd>{supportedExtensions.text.join(", ")}</dd>
                      <dt>结构化数据</dt>
                      <dd>{supportedExtensions.structuredData.join(", ")}</dd>
                      <dt>PDF</dt>
                      <dd>{supportedExtensions.pdf.join(", ")}</dd>
                    </dl>
                    <div className="tips">
                      <b>导入建议</b>
                      <ul className="mt-2 ml-4 list-disc font-normal">
                        <li>
                          我们建议使用{" "}
                          <a
                            href="https://labelstud.io/guide/storage.html"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="云存储文档（在新标签页打开）"
                          >
                            云存储
                          </a>{" "}
                          代替直接上传，原因是{" "}
                          <a
                            href="https://labelstud.io/guide/tasks.html#Import-data-from-the-Label-Studio-UI"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="上传限制文档（在新标签页打开）"
                          >
                            上传限制
                          </a>
                          .
                        </li>
                        <li>
                          对于 PDF，请使用{" "}
                          <a
                            href="https://labelstud.io/templates/multi-page-document-annotation"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="多页文档标注文档（在新标签页打开）"
                          >
                            多页文档标注
                          </a>
                          。JSONL 或 Parquet（仅企业版）文件需要云存储。
                        </li>
                        <li>
                          查看文档以{" "}
                          <a target="_blank" href="https://labelstud.io/guide/predictions.html" rel="noreferrer">
                            导入预标注数据
                          </a>
                          .
                        </li>
                      </ul>
                    </div>
                  </div>
                </label>
              </div>
            )}

            {showList && (
              <div className="w-full">
                <SimpleCard
                  title="已导入文件"
                  className="w-full h-full"
                  contentClassName="overflow-y-auto h-[calc(100%-48px)]"
                >
                  <div className={importClass.elem("list-summary")}>
                    <div>
                      <Typography variant="body" size="small" className="text-neutral-content">
                        当前导入内容会作为任务来源，创建项目后可直接进入数据处理页继续操作。
                      </Typography>
                    </div>
                    <div className={importClass.elem("list-summary-meta")}>
                      <span>{sample ? "包含示例数据" : "未使用示例数据"}</span>
                      <span>{files.uploaded.length + files.uploading.length} 项</span>
                    </div>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th>文件</th>
                        <th>状态</th>
                        <th>大小</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sample && (
                        <tr key={sample.url}>
                          <td>
                            <div className="flex items-center gap-2">
                              {sample.title}
                              <Badge variant="info" className="h-5 text-xs rounded-sm">
                                示例
                              </Badge>
                            </div>
                          </td>
                          <td>{sample.description}</td>
                          <td>
                            <Button size="smaller" variant="negative" onClick={() => onSampleDatasetSelect(undefined)}>
                              <IconTrash className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      )}
                      {files.uploaded.map((file) => {
                        const truncatedFilename = truncate(
                          file.file,
                          FILENAME_TRUNCATE_START,
                          FILENAME_TRUNCATE_END,
                          "...",
                        );
                        return (
                          <tr
                            key={file.file}
                            className={newlyUploadedFiles.has(file.id) ? importClass.elem("upload-flash") : ""}
                          >
                            <td className={importClass.elem("file-name")}>
                              <Tooltip title={file.file}>
                                <Typography variant="body" size="small" className="truncate">
                                  {truncatedFilename}
                                </Typography>
                              </Tooltip>
                            </td>
                            <td>
                              <div className={importClass.elem("file-status-wrap")}>
                                <span className={importClass.elem("file-status")} />
                                <span className={importClass.elem("file-status-label")}>已上传</span>
                              </div>
                            </td>
                            <td className={importClass.elem("file-size")}>
                              <Typography
                                variant="body"
                                size="smaller"
                                className="text-nowrap text-neutral-content-subtle text-right"
                              >
                                {file.size ? formatFileSize(file.size) : ""}
                              </Typography>
                            </td>
                          </tr>
                        );
                      })}
                      {files.uploading.map((file, idx) => {
                        const truncatedFilename = truncate(
                          file.name,
                          FILENAME_TRUNCATE_START,
                          FILENAME_TRUNCATE_END,
                          "...",
                        );
                        return (
                          <tr key={`${idx}-${file.name}`}>
                            <td className={importClass.elem("file-name")}>
                              <Tooltip title={file.name}>
                                <Typography variant="body" size="small" className="truncate">
                                  {truncatedFilename}
                                </Typography>
                              </Tooltip>
                            </td>
                            <td>
                              <div className={importClass.elem("file-status-wrap")}>
                                <span className={importClass.elem("file-status").mod({ uploading: true })} />
                                <span className={importClass.elem("file-status-label")}>上传中</span>
                              </div>
                            </td>
                            <td className={importClass.elem("file-size")}>&nbsp;</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </SimpleCard>
              </div>
            )}

            {ff.isFF(ff.FF_JSON_PREVIEW) && (
              <div className="w-full h-full flex flex-col min-h-[400px]">
                {projectConfigured ? (
                  <SimpleCard
                    title="预期输入预览"
                    className="w-full h-full overflow-hidden flex flex-col"
                    contentClassName="h-[calc(100%-48px)]"
                    flushContent
                  >
                    {sampleConfig.data ? (
                      <div className={importClass.elem("code-wrapper")}>
                        <CodeBlock
                          title="预期输入预览"
                          code={sampleConfig?.data ?? ""}
                          className="w-full h-full"
                        />
                      </div>
                    ) : sampleConfig.isLoading ? (
                      <div className="w-full flex justify-center py-12">
                        <Spinner className="h-6 w-6" />
                      </div>
                    ) : sampleConfig.isError ? (
                      <div className="w-[calc(100%-24px)] text-lg text-negative-content bg-negative-background border m-3 rounded-md border-negative-border-subtle p-4">
                        出现错误，无法加载示例数据。
                      </div>
                    ) : null}
                  </SimpleCard>
                ) : (
                  <SimpleCard className="w-full h-full flex flex-col items-center justify-center text-center p-wide">
                    <div className="flex flex-col items-center gap-tight">
                      <div className="bg-primary-background rounded-largest p-tight flex items-center justify-center">
                        <IconCode className="w-6 h-6 text-primary-icon" />
                      </div>
                      <div className="flex flex-col items-center gap-tighter">
                        <div className="text-label-small text-neutral-content font-medium">查看 JSON 输入格式</div>
                        <div className="text-body-small text-neutral-content-subtler text-center">
                          请先设置{" "}
                          <Button
                            type="button"
                            look="string"
                            onClick={openConfig}
                            className="border-none bg-none p-0 m-0 text-primary-content underline"
                          >
                            标注配置
                          </Button>{" "}
                          才能预览预期的 JSON 数据格式
                        </div>
                      </div>
                    </div>
                  </SimpleCard>
                )}
              </div>
            )}
          </div>
        </Upload>
      </main>
    </div>
  );
};
