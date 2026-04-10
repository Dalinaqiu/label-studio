import { EnterpriseBadge, Select, Typography } from "@humansignal/ui";
import React from "react";
import { useHistory } from "react-router";
import { Button } from "@humansignal/ui";
import { Modal } from "../../components/Modal/Modal";
import { HeidiTips } from "../../components/HeidiTips/HeidiTips";
import { useAPI } from "../../providers/ApiProvider";
import { cn } from "../../utils/bem";
import { ConfigPage } from "./Config/Config";
import "./CreateProject.scss";
import { ImportPage } from "./Import/Import";
import { useImportPage } from "./Import/useImportPage";
import { useDraftProject } from "./utils/useDraftProject";
import { Input, TextArea } from "../../components/Form";
import { FF_LSDV_E_297, isFF } from "../../utils/feature-flags";
import { createURL } from "../../components/HeidiTips/utils";

const stepDefinitions = [
  {
    key: "name",
    title: "基本信息",
    description: "填写项目名称和说明，先建立清晰的项目上下文。",
  },
  {
    key: "import",
    title: "导入数据",
    description: "上传文件或导入数据源，确认这批任务从哪里来。",
  },
  {
    key: "config",
    title: "标注模板",
    description: "选择或编辑标注界面，确保字段和标签结构正确。",
  },
  {
    key: "review",
    title: "确认创建",
    description: "在创建前检查关键信息，减少返工和误操作。",
  },
];

const ProjectName = ({ name, setName, onSaveName, onSubmit, error, description, setDescription, show = true }) =>
  !show ? null : (
    <form
      className={cn("project-name")}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="w-full flex flex-col gap-2">
        <label className="w-full" htmlFor="project_name">
          项目名称
        </label>
        <Input
          name="name"
          id="project_name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={onSaveName}
          className="project-title w-full"
        />
        {error && <span className="-mt-1 text-negative-content">{error}</span>}
      </div>
      <div className="w-full flex flex-col gap-2">
        <label className="w-full" htmlFor="project_description">
          描述
        </label>
        <TextArea
          name="description"
          id="project_description"
          placeholder="可选的项目描述"
          rows="4"
          style={{ minHeight: 100 }}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="project-description w-full"
        />
      </div>
      {isFF(FF_LSDV_E_297) && (
        <details className="project-name__advanced">
          <summary className="project-name__advanced-toggle">更多设置</summary>
          <div className="project-name__advanced-body">
            <div className="w-full flex flex-col gap-2">
              <label>
                工作区
                <EnterpriseBadge className="ml-2" />
              </label>
              <Select placeholder="请选择" disabled options={[]} triggerClassName="!flex-1" />
              <Typography size="small" className="mt-tight mb-wider">
                通过将项目归入工作区简化项目管理。{" "}
                <a
                  href={createURL(
                    "https://docs.humansignal.com/guide/manage_projects#Create-workspaces-to-organize-projects",
                    {
                      experiment: "project_creation_dropdown",
                      treatment: "simplify_project_management",
                    },
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:no-underline"
                >
                  了解更多
                </a>
              </Typography>
              <HeidiTips collection="projectCreation" />
            </div>
          </div>
        </details>
      )}
    </form>
  );

const ReviewSection = ({ title, children }) => (
  <div className="rounded-medium border border-neutral-border bg-neutral-surface p-4">
    <Typography variant="title" size="small" className="text-neutral-content">
      {title}
    </Typography>
    <div className="mt-3">{children}</div>
  </div>
);

const ReviewStep = ({ name, description, sample, columns, uploadDisabled, project }) => {
  const labelConfig = project?.label_config ?? "<View></View>";
  const hasConfig = labelConfig !== "<View></View>";

  return (
    <div className="flex flex-col gap-4">
      <ReviewSection title="项目信息">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Typography variant="label" size="small" className="text-neutral-content-subtler">
              项目名称
            </Typography>
            <Typography variant="body" size="small" className="mt-1 text-neutral-content">
              {name || "未填写"}
            </Typography>
          </div>
          <div>
            <Typography variant="label" size="small" className="text-neutral-content-subtler">
              项目状态
            </Typography>
            <Typography variant="body" size="small" className="mt-1 text-neutral-content">
              草稿项目，创建后会自动进入任务处理页
            </Typography>
          </div>
          <div className="md:col-span-2">
            <Typography variant="label" size="small" className="text-neutral-content-subtler">
              项目描述
            </Typography>
            <Typography variant="body" size="small" className="mt-1 text-neutral-content">
              {description || "暂无描述"}
            </Typography>
          </div>
        </div>
      </ReviewSection>

      <ReviewSection title="导入摘要">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Typography variant="label" size="small" className="text-neutral-content-subtler">
              示例数据
            </Typography>
            <Typography variant="body" size="small" className="mt-1 text-neutral-content">
              {sample?.title ?? sample?.id ?? "未选择"}
            </Typography>
          </div>
          <div>
            <Typography variant="label" size="small" className="text-neutral-content-subtler">
              导入状态
            </Typography>
            <Typography variant="body" size="small" className="mt-1 text-neutral-content">
              {uploadDisabled ? "仍需确认 CSV/TSV 的处理方式" : "可直接继续创建"}
            </Typography>
          </div>
          <div className="md:col-span-2">
            <Typography variant="label" size="small" className="text-neutral-content-subtler">
              可用字段
            </Typography>
            <Typography variant="body" size="small" className="mt-1 text-neutral-content">
              {columns?.length ? columns.join("、") : "当前还没有可用字段，将按导入文件结构继续处理"}
            </Typography>
          </div>
        </div>
      </ReviewSection>

      <ReviewSection title="标注模板摘要">
        <Typography variant="body" size="small" className="text-neutral-content">
          {hasConfig ? "已配置标注模板，创建后可直接进入数据管理或标注流程。" : "当前仍是空模板，创建后需要补充标注配置。"}
        </Typography>
      </ReviewSection>
    </div>
  );
};

export const CreateProject = ({ onClose }) => {
  const [step, _setStep] = React.useState("name");
  const [waiting, setWaitingStatus] = React.useState(false);

  const { project, setProject: updateProject } = useDraftProject();
  const history = useHistory();
  const api = useAPI();

  const [name, setName] = React.useState("");
  const [error, setError] = React.useState();
  const [description, setDescription] = React.useState("");
  const [sample, setSample] = React.useState(null);
  const currentStepIndex = stepDefinitions.findIndex((item) => item.key === step);

  const setStep = React.useCallback((step) => {
    _setStep(step);
    const eventNameMap = {
      name: "project_name",
      import: "data_import",
      config: "labeling_setup",
      review: "review",
    };
    __lsa(`create_project.tab.${eventNameMap[step]}`);
  }, []);

  React.useEffect(() => {
    setError(null);
  }, [name]);

  const { columns, uploading, uploadDisabled, finishUpload, pageProps, uploadSample } = useImportPage(project, sample);

  // name intentionally skipped from deps:
  // this should trigger only once when we got project loaded
  React.useEffect(() => {
    if (project && !name && typeof project.title === "string") {
      setName(project.title);
    }
  }, [project]);

  const projectBody = React.useMemo(
    () => ({
      title: name,
      description,
      label_config: project?.label_config ?? "<View></View>",
    }),
    [name, description, project?.label_config],
  );

  const onCreate = React.useCallback(async () => {
    if (!project) return;
    // First, persist project with label_config so import/reimport validates against it
    const response = await api.callApi("updateProject", {
      params: {
        pk: project.id,
      },
      body: { ...projectBody, is_draft: false },
    });

    if (response === null) return;

    const imported = await finishUpload();

    if (!imported) return;

    setWaitingStatus(true);

    if (sample) await uploadSample(sample);

    __lsa("create_project.create", { sample: sample?.url });

    setWaitingStatus(false);

    history.push(`/projects/${response.id}/data`);
  }, [project, projectBody, finishUpload]);

  const onSaveName = async () => {
    if (!project) return false;
    if (!name?.trim()) {
      setError("请输入项目名称");
      return false;
    }
    if (error) return false;
    const res = await api.callApi("updateProjectRaw", {
      params: {
        pk: project.id,
      },
      body: {
        title: name,
      },
    });

    if (res.ok) return true;
    const err = await res.json();

    setError(err.validation_errors?.title);
    return false;
  };

  const validateStepBeforeMove = async (targetStep) => {
    if (step === "name" && targetStep !== "name") {
      const isSaved = await onSaveName();
      if (isSaved === false) return false;
      if (!name?.trim()) return false;
    }

    if (step === "import" && uploadDisabled && targetStep !== "import") {
      return false;
    }

    return true;
  };

  const goToStep = async (targetStep) => {
    const canMove = await validateStepBeforeMove(targetStep);
    if (!canMove) return;
    setStep(targetStep);
  };

  const goNext = async () => {
    const nextStep = stepDefinitions[currentStepIndex + 1];
    if (!nextStep) return;
    await goToStep(nextStep.key);
  };

  const goPrevious = () => {
    const previousStep = stepDefinitions[currentStepIndex - 1];
    if (!previousStep) return;
    setStep(previousStep.key);
  };

  const isNextDisabled = (step === "name" && !name?.trim()) || (step === "import" && uploadDisabled);
  const canCreate = Boolean(project) && !uploadDisabled && !error;
  const currentStep = stepDefinitions[currentStepIndex];
  const rootClass = cn("create-project");
  const currentStepHint =
    step === "name"
      ? "先把项目名称和说明填好，后续导入、配置和协作都会依赖这一步。"
      : step === "import"
        ? "上传完成后，如果包含 CSV 或 TSV，请先确认导入方式，再继续下一步。"
        : step === "config"
          ? "建议至少确认字段映射和标签结构，避免创建后再返工。"
          : "确认无误后再创建项目，系统会自动跳转到任务处理页。";

  const onDelete = React.useCallback(() => {
    const performClose = async () => {
      setWaitingStatus(true);
      if (project)
        await api.callApi("deleteProject", {
          params: {
            pk: project.id,
          },
        });
      setWaitingStatus(false);
      updateProject(null);
      onClose?.();
    };
    performClose();
  }, [project]);

  return (
    <Modal onHide={onDelete} closeOnClickOutside={false} allowToInterceptEscape fullscreen visible bare>
      <div className={rootClass}>
        <Modal.Header>
          <div className={rootClass.elem("header-copy")}>
            <h1>新建项目</h1>
            <Typography variant="body" size="small" className="mt-2 text-neutral-content-subtler">
              按步骤完成项目信息、数据导入和标注模板配置，创建后直接进入任务处理页。
            </Typography>
            <Typography variant="label" size="small" className={rootClass.elem("draft-note")}>
              当前是临时草稿，取消后会自动清理
            </Typography>
          </div>
        </Modal.Header>
        <div className={rootClass.elem("body")}>
          <div className={rootClass.elem("steps-shell")}>
            <div className={rootClass.elem("steps-header")}>
              <Typography variant="label" size="small" className="text-neutral-content-subtler">
                第 {currentStepIndex + 1} 步 / 共 {stepDefinitions.length} 步
              </Typography>
            </div>

            <div className={rootClass.elem("steps")} role="tablist" aria-label="创建项目步骤">
              {stepDefinitions.map((item, index) => {
                const isActive = item.key === step;
                const isCompleted = index < currentStepIndex;
                const isBlocked =
                  (item.key === "import" && !!error) ||
                  (item.key === "review" && uploadDisabled);

                return (
                  <React.Fragment key={item.key}>
                    <button
                      type="button"
                      className={rootClass.elem("step-item").mod({
                        active: isActive,
                        completed: isCompleted,
                        blocked: isBlocked,
                      })}
                      onClick={() => goToStep(item.key)}
                      role="tab"
                      aria-selected={isActive}
                    >
                      <span className={rootClass.elem("step-index").mod({ completed: isCompleted })}>
                        {isCompleted ? "✓" : index + 1}
                      </span>
                      <span className={rootClass.elem("step-copy")}>
                        <span className={rootClass.elem("step-title")}>{item.title}</span>
                        {isActive ? <span className={rootClass.elem("step-caption")}>{item.description}</span> : null}
                      </span>
                    </button>
                    {index < stepDefinitions.length - 1 ? <span className={rootClass.elem("step-divider")} /> : null}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          <section className={rootClass.elem("content")}>
            <div className={rootClass.elem("workspace")}>
              <div className={rootClass.elem("workspace-header")}>
                <Typography variant="title" size="medium" className="text-neutral-content">
                  {currentStep?.title}
                </Typography>
                <Typography variant="body" size="small" className="text-neutral-content-subtler">
                  {currentStep?.description}
                </Typography>
                <Typography variant="body" size="small" className={rootClass.elem("workspace-hint")}>
                  {currentStepHint}
                </Typography>
              </div>

              <div className={rootClass.elem("workspace-body")}>
                {step === "name" && (
                  <div className={rootClass.elem("stage-shell").mod({ form: true })}>
                    <ProjectName
                      name={name}
                      setName={setName}
                      error={error}
                      onSaveName={onSaveName}
                      onSubmit={goNext}
                      description={description}
                      setDescription={setDescription}
                    />
                  </div>
                )}
                {step === "import" && (
                  <div className={rootClass.elem("stage-shell")}>
                    <ImportPage
                      project={project}
                      show={true}
                      sample={sample}
                      onSampleDatasetSelect={setSample}
                      openLabelingConfig={() => setStep("config")}
                      {...pageProps}
                    />
                  </div>
                )}
                {step === "config" && (
                  <div className={rootClass.elem("stage-shell")}>
                    <ConfigPage
                      project={project}
                      onUpdate={(config) => {
                        updateProject({ ...project, label_config: config });
                      }}
                      show={true}
                      columns={columns}
                      disableSaveButton={true}
                    />
                  </div>
                )}
                {step === "review" && (
                  <div className={rootClass.elem("review")}>
                    <ReviewStep
                      name={name}
                      description={description}
                      sample={sample}
                      columns={columns}
                      uploadDisabled={uploadDisabled}
                      project={project}
                    />
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        <div className={rootClass.elem("footer")}>
          <div className={rootClass.elem("footer-meta")}>
            {step === "import" && uploadDisabled ? (
              <Typography variant="body" size="small" className="text-warning-content">
                继续前需要先确认 CSV/TSV 的处理方式。
              </Typography>
            ) : error ? (
              <Typography variant="body" size="small" className="text-negative-content">
                {error}
              </Typography>
            ) : null}
          </div>

          <div className={rootClass.elem("footer-actions")}>
            <Button look="outlined" variant="neutral" onClick={onDelete} waiting={waiting} aria-label="取消创建项目">
              取消
            </Button>
            {currentStepIndex > 0 ? (
              <Button look="outlined" variant="neutral" onClick={goPrevious} aria-label="上一步">
                上一步
              </Button>
            ) : null}

            {step !== "review" ? (
              <Button
                onClick={goNext}
                disabled={isNextDisabled}
                waiting={waiting || uploading}
                waitingClickable={false}
                aria-label="下一步"
              >
                下一步
              </Button>
            ) : (
              <Button
                onClick={onCreate}
                waiting={waiting || uploading}
                waitingClickable={false}
                disabled={!canCreate}
                aria-label="创建项目"
              >
                创建项目
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
