/**
 * @deprecated It was used only without FF_3873 in old interface.
 */

import { inject, observer } from "mobx-react";
import { IconBan, IconInfoOutline } from "@humansignal/icons";
import { Button, Tooltip } from "@humansignal/ui";
import { cn } from "../../utils/bem";
import { isDefined } from "../../utils/utilities";

import "./Controls.scss";
import { useCallback, useMemo, useState } from "react";

const TOOLTIP_DELAY = 0.8;
const WORKFLOW_REJECTED_STATUSES = ["REVIEW_REJECTED", "FINAL_REJECTED"];

const ButtonTooltip = inject("store")(
  observer(({ store, title, children }) => {
    return (
      <Tooltip title={title} disabled={!store.settings.enableTooltips}>
        {children}
      </Tooltip>
    );
  }),
);

const controlsInjector = inject(({ store }) => {
  return {
    store,
    history: store?.annotationStore?.selected?.history,
  };
});

export const Controls = controlsInjector(
  observer(({ store, history, annotation }) => {
    const isReview = store.hasInterface("review");
    const workflowStatus = store.task?.workflow_status;
    const isFinalReview = ["PENDING_FINAL_REVIEW", "FINAL_REVIEWING"].includes(workflowStatus);
    const isWorkflowRejectedAnnotationStage = !isReview && WORKFLOW_REJECTED_STATUSES.includes(workflowStatus ?? "");

    const historySelected = isDefined(store.annotationStore.selectedHistory);
    const { userGenerate, sentUserGenerate, versions, results, editable } = annotation;
    const buttons = [];

    const [isInProgress, setIsInProgress] = useState(false);

    // const isReady = store.annotationStore.selected.objects.every(object => object.isReady === undefined || object.isReady);
    const disabled = !editable || store.isSubmitting || historySelected || isInProgress; // || !isReady;
    const submitDisabled = store.hasInterface("annotations:deny-empty") && results.length === 0;

    const buttonHandler = useCallback(
      async (e, callback, tooltipMessage) => {
        const { addedCommentThisSession, currentComment, commentFormSubmit, inputRef } = store.commentStore;

        if (isInProgress) return;
        setIsInProgress(true);
        if (!inputRef.current || addedCommentThisSession) {
          callback();
        } else if ((currentComment ?? "").trim()) {
          e.preventDefault();
          await commentFormSubmit();
          callback();
        } else {
          const commentsInput = inputRef.current;

          store.commentStore.setTooltipMessage(tooltipMessage);
          commentsInput.scrollIntoView({
            behavior: "smooth",
          });
          commentsInput.focus({ preventScroll: true });
        }
        setIsInProgress(false);
      },
      [
        store.rejectAnnotation,
        store.skipTask,
        store.commentStore.currentComment,
        store.commentStore.inputRef,
        store.commentStore.commentFormSubmit,
        store.commentStore.addedCommentThisSession,
        isInProgress,
      ],
    );

    const RejectButton = useMemo(() => {
      const rejectLabel = isFinalReview ? "退回审核" : "退回标注";
      const rejectTooltip = isFinalReview ? "退回审核：[ Ctrl+Space ]" : "退回标注：[ Ctrl+Space ]";

      return (
        <ButtonTooltip key="reject" title={rejectTooltip}>
          <Button
            aria-label="拒绝当前标注"
            disabled={disabled}
            look="danger"
            onClick={async (e) => {
              if (store.hasInterface("comments:reject") ?? true) {
                buttonHandler(e, () => store.rejectAnnotation({}), "请在拒绝前填写备注");
              } else {
                console.log("rejecting");
                await store.commentStore.commentFormSubmit();
                store.rejectAnnotation({});
              }
            }}
          >
            {rejectLabel}
          </Button>
        </ButtonTooltip>
      );
    }, [disabled, store, isFinalReview]);

    if (isReview) {
      buttons.push(RejectButton);

      const acceptLabel = isFinalReview
        ? history.canUndo || annotation.versions.draft
          ? "修正并终审通过"
          : "终审通过"
        : history.canUndo || annotation.versions.draft
          ? "修正并通过"
          : "审核通过";
      const acceptTooltip = isFinalReview ? "终审通过：[ Ctrl+Enter ]" : "审核通过：[ Ctrl+Enter ]";

      buttons.push(
        <ButtonTooltip key="accept" title={acceptTooltip}>
          <Button
            aria-label="接受当前标注"
            disabled={disabled}
            look="primary"
            onClick={async () => {
              await store.commentStore.commentFormSubmit();
              store.acceptAnnotation();
            }}
          >
            {acceptLabel}
          </Button>
        </ButtonTooltip>,
      );
    } else if (annotation.skipped) {
      buttons.push(
        <div className={cn("controls").elem("skipped-info").toClassName()} key="skipped">
          <IconBan color="#d00" /> 已跳过
        </div>,
      );
      buttons.push(
        <ButtonTooltip key="cancel-skip" title="取消跳过：[]">
          <Button
            aria-label="取消跳过并返回标注"
            disabled={disabled}
            look="outlined"
            onClick={async () => {
              await store.commentStore.commentFormSubmit();
              store.unskipTask();
            }}
          >
            取消跳过
          </Button>
        </ButtonTooltip>,
      );
    } else {
      // Manager roles that can force-skip unskippable tasks (OW=Owner, AD=Admin, MA=Manager)
      const MANAGER_ROLES = ["OW", "AD", "MA"];

      if (store.hasInterface("skip") && !isWorkflowRejectedAnnotationStage) {
        const task = store.task;

        const isEnterprise = window.APP_SETTINGS?.billing?.enterprise;
        const skipDisabled = isEnterprise ? task?.allow_skip === false : false;
        const userRole = window.APP_SETTINGS?.user?.role;
        const hasForceSkipPermission = MANAGER_ROLES.includes(userRole);
        const canSkip = !skipDisabled || hasForceSkipPermission;
        const isDisabled = disabled || !canSkip;

        const tooltip = canSkip ? "跳过任务：[ Ctrl+Space ]" : "该任务不可跳过";

        const showInfoIcon = skipDisabled && hasForceSkipPermission;

        if (showInfoIcon) {
          buttons.push(
            <Tooltip key="skip-info" title="标注员和审核员无法跳过此任务">
              <IconInfoOutline width={20} height={20} className="text-neutral-content ml-auto cursor-pointer" />
            </Tooltip>,
          );
        }

        buttons.push(
          <ButtonTooltip key="skip" title={tooltip}>
            <Button
              aria-label="跳过当前任务"
              disabled={isDisabled}
              variant="negative"
              look="outlined"
              onClick={async (e) => {
                if (!canSkip) return;
                if (store.hasInterface("comments:skip") ?? true) {
                  buttonHandler(e, () => store.skipTask({}), "请在跳过前填写备注");
                } else {
                  await store.commentStore.commentFormSubmit();
                  store.skipTask({});
                }
              }}
            >
              跳过
            </Button>
          </ButtonTooltip>,
        );
      }

      if ((userGenerate && !sentUserGenerate) || (store.explore && !userGenerate && store.hasInterface("submit"))) {
        const title = submitDisabled
          ? "此项目不允许空标注"
          : isWorkflowRejectedAnnotationStage
            ? "修改后重新提交审核：[ Ctrl+Enter ]"
            : "保存结果：[ Ctrl+Enter ]";
        // span is to display tooltip for disabled button

        buttons.push(
          <ButtonTooltip key="submit" title={title}>
            <div className={cn("controls").elem("tooltip-wrapper").toClassName()}>
              <Button
                aria-label="提交当前标注"
                disabled={disabled || submitDisabled}
                look="primary"
              onClick={async () => {
                await store.commentStore.commentFormSubmit();
                store.submitAnnotation();
              }}
            >
              {isWorkflowRejectedAnnotationStage ? "重新提交审核" : "提交"}
            </Button>
          </div>
        </ButtonTooltip>,
      );
      }

      if ((userGenerate && sentUserGenerate) || (!userGenerate && store.hasInterface("update"))) {
        const isUpdate = sentUserGenerate || versions.result;
        const button = (
          <ButtonTooltip
            key="update"
            title={isWorkflowRejectedAnnotationStage ? "修改后重新提交审核：[ Alt+Enter ]" : "更新此任务：[ Alt+Enter ]"}
          >
            <Button
              aria-label="更新当前标注"
              disabled={disabled || submitDisabled}
              look="primary"
              onClick={async () => {
                await store.commentStore.commentFormSubmit();
                store.updateAnnotation();
              }}
            >
              {isWorkflowRejectedAnnotationStage ? "重新提交审核" : isUpdate ? "更新" : "提交"}
            </Button>
          </ButtonTooltip>
        );

        buttons.push(button);
      }
    }

    return (
      <div className={cn("controls").toClassName()}>
        <div className="grid grid-flow-col auto-cols-fr gap-tight items-center">{buttons}</div>
      </div>
    );
  }),
);
