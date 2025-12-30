import { useMemo, useState } from "react";
import { useHistory } from "react-router";
import { Button, Typography, useToast } from "@humansignal/ui";
import { useUpdatePageTitle, createTitleFromSegments } from "@humansignal/core";
import { Label } from "../../components/Form";
import { modal } from "../../components/Modal/Modal";
import { useModalControls } from "../../components/Modal/ModalPopup";
import Input from "../../components/Form/Elements/Input/Input";
import { Space } from "../../components/Space/Space";
import { Spinner } from "../../components/Spinner/Spinner";
import { useAPI } from "../../providers/ApiProvider";
import { useProject } from "../../providers/ProjectProvider";
import { cn } from "../../utils/bem";

export const DangerZone = () => {
  const { project } = useProject();
  const api = useAPI();
  const history = useHistory();
  const toast = useToast();
  const [processing, setProcessing] = useState(null);

  useUpdatePageTitle(createTitleFromSegments([project?.title, "危险区域"]));

  const showDangerConfirmation = ({ title, message, requiredWord, buttonText, onConfirm }) => {
    const isDev = process.env.NODE_ENV === "development";

    return modal({
      title,
      width: 600,
      allowClose: false,
      body: () => {
        const ctrl = useModalControls();
        const inputValue = ctrl?.state?.inputValue || "";

        return (
          <div>
            <Typography variant="body" size="medium" className="mb-tight">
              {message}
            </Typography>
            <Input
              label={`请输入 ${requiredWord} 以确认`}
              value={inputValue}
              onChange={(e) => ctrl?.setState({ inputValue: e.target.value })}
              autoFocus
              data-testid="danger-zone-confirmation-input"
              autoComplete="off"
            />
          </div>
        );
      },
      footer: () => {
        const ctrl = useModalControls();
        const inputValue = (ctrl?.state?.inputValue || "").trim().toLowerCase();
        const isValid = isDev || inputValue === requiredWord.toLowerCase();

        return (
          <Space align="end">
            <Button
              variant="neutral"
              look="outline"
              onClick={() => ctrl?.hide()}
              data-testid="danger-zone-cancel-button"
            >
              取消
            </Button>
            <Button
              variant="negative"
              disabled={!isValid}
              onClick={async () => {
                await onConfirm();
                ctrl?.hide();
              }}
              data-testid="danger-zone-confirm-button"
            >
              {buttonText}
            </Button>
          </Space>
        );
      },
    });
  };

  const handleOnClick = (type) => () => {
    const actionConfig = {
      reset_cache: {
        title: "重置缓存",
        message: (
          <>
            这将重置项目 <strong>{project.title}</strong> 的缓存。
          </>
        ),
        requiredWord: "cache",
        buttonText: "重置缓存",
      },
      tabs: {
        title: "删除标注标签页",
        message: (
          <>
            这将删除项目 <strong>{project.title}</strong> 的所有标注标签页。
          </>
        ),
        requiredWord: "tabs",
        buttonText: "删除标注标签页",
      },
      project: {
        title: "删除项目",
        message: (
          <>
            这将永久删除项目 <strong>{project.title}</strong> 及其所有数据。
          </>
        ),
        requiredWord: "delete",
        buttonText: "删除项目",
      },
    };

    const config = actionConfig[type];

    if (!config) {
      return;
    }

    showDangerConfirmation({
      ...config,
      onConfirm: async () => {
        setProcessing(type);
        try {
          if (type === "reset_cache") {
            await api.callApi("projectResetCache", {
              params: {
                pk: project.id,
              },
            });
            toast.show({ message: "缓存已重置" });
          } else if (type === "tabs") {
            await api.callApi("deleteTabs", {
              body: {
                project: project.id,
              },
            });
            toast.show({ message: "标注标签页已删除" });
          } else if (type === "project") {
            await api.callApi("deleteProject", {
              params: {
                pk: project.id,
              },
            });
            toast.show({ message: "项目已删除" });
            history.replace("/projects");
          }
        } catch (error) {
          toast.show({ message: `操作失败：${error.message}`, type: "error" });
        } finally {
          setProcessing(null);
        }
      },
    });
  };

  const buttons = useMemo(
    () => [
      {
        type: "annotations",
        disabled: true, //&& !project.total_annotations_number,
        label: `删除 ${project.total_annotations_number} 条标注`,
      },
      {
        type: "tasks",
        disabled: true, //&& !project.task_number,
        label: `删除 ${project.task_number} 个任务`,
      },
      {
        type: "predictions",
        disabled: true, //&& !project.total_predictions_number,
        label: `删除 ${project.total_predictions_number} 条预测`,
      },
      {
        type: "reset_cache",
        help: "当你无法修改标注配置且确认不存在冲突标签时，可重置缓存后重试。",
        label: "重置缓存",
      },
      {
        type: "tabs",
        help: "删除所有标注标签页和相关设置。",
        label: "删除标注标签页",
      },
      {
        type: "project",
        help: "永久删除项目及其全部数据。",
        label: "删除项目",
      },
    ],
    [project],
  );

  return (
    <div className={cn("simple-settings")}>
      <Typography variant="headline" size="medium" className="mb-tighter">
        危险区域
      </Typography>
      <Typography variant="body" size="medium" className="text-neutral-content-subtler !mb-base">
        这些操作不可撤销，请谨慎操作。
      </Typography>

      {project.id ? (
        <div style={{ marginTop: 16 }}>
          {buttons.map((btn) => {
            const waiting = processing === btn.type;
            const disabled = btn.disabled || (processing && !waiting);

            return (
              btn.disabled !== true && (
                <div className={cn("settings-wrapper")} key={btn.type}>
                  <Typography variant="title" size="large">
                    {btn.label}
                  </Typography>
                  {btn.help && <Label description={btn.help} style={{ width: 600, display: "block" }} />}
                  <Button
                    key={btn.type}
                    variant="negative"
                    look="outlined"
                    disabled={disabled}
                    waiting={waiting}
                    onClick={handleOnClick(btn.type)}
                    style={{ marginTop: 16 }}
                  >
                    {btn.label}
                  </Button>
                </div>
              )
            );
          })}
        </div>
      ) : (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
          <Spinner size={32} />
        </div>
      )}
    </div>
  );
};

DangerZone.title = "危险区域";
DangerZone.path = "/danger-zone";
