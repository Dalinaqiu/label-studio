/**
 * Buttons for the bottom bar. Defined separately so the logic code is more readable.
 * Also they can be reused in custom buttons.
 * `on*OnComment()` are used for actions with comment attached to them.
 */

import { inject, observer } from "mobx-react";
import type React from "react";
import { memo, type ReactElement } from "react";
import { Tooltip, Button } from "@humansignal/ui";
import { IconInfoOutline } from "@humansignal/icons";
import type { MSTStore } from "../../stores/types";

type MixedInParams = {
  store: MSTStore;
  history: any;
};

export function controlsInjector<T extends {}>(fn: (props: T & MixedInParams) => ReactElement) {
  const wrapped = inject(({ store }) => {
    return {
      store,
      history: store?.annotationStore?.selected?.history,
    };
  })(fn);
  // inject type doesn't handle the injected props, so we have to force cast it
  return wrapped as unknown as (props: T) => ReactElement;
}

type ButtonTooltipProps = {
  title: string;
  children: JSX.Element;
};

export const ButtonTooltip = controlsInjector<ButtonTooltipProps>(
  observer(({ store, title, children }) => {
    return (
      <Tooltip title={title} disabled={!store.settings.enableTooltips}>
        {children}
      </Tooltip>
    );
  }),
);

type AcceptButtonProps = {
  disabled: boolean;
  history: any;
  store: MSTStore;
};

const isFinalReviewStage = (store: MSTStore) =>
  ["PENDING_FINAL_REVIEW", "FINAL_REVIEWING"].includes((store.task as any)?.workflow_status ?? "");

const getAcceptLabel = (store: MSTStore, hasChanges: boolean) => {
  if (isFinalReviewStage(store)) return hasChanges ? "修正并终审通过" : "终审通过";
  return hasChanges ? "修正并通过" : "审核通过";
};

const getAcceptTooltip = (store: MSTStore) =>
  isFinalReviewStage(store) ? "Final review approve: [ Ctrl+Enter ]" : "Approve review: [ Ctrl+Enter ]";

const getRejectLabel = (store: MSTStore) => {
  if (isFinalReviewStage(store)) return "退回审核";
  return "退回标注";
};

const getRejectTooltip = (store: MSTStore) =>
  isFinalReviewStage(store) ? "Return to reviewer: [ Ctrl+Space ]" : "Return to annotator: [ Ctrl+Space ]";

export const AcceptButton = memo(
  observer(({ disabled, history, store }: AcceptButtonProps) => {
    const annotation = store.annotationStore.selected;
    // changes in current sessions or saved draft
    const hasChanges = history.canUndo || annotation.versions.draft;

    return (
      <Button
        key="accept"
        tooltip={getAcceptTooltip(store)}
        aria-label="accept-annotation"
        disabled={disabled}
        onClick={async () => {
          annotation.submissionInProgress();
          await store.commentStore.commentFormSubmit();
          store.acceptAnnotation();
        }}
        data-testid="bottombar-accept-button"
      >
        {getAcceptLabel(store, hasChanges)}
      </Button>
    );
  }),
);

export const RejectButtonDefinition = {
  id: "reject",
  name: "reject",
  title: "退回",
  variant: "negative",
  look: "outlined",
  ariaLabel: "reject-annotation",
  tooltip: "Return task: [ Ctrl+Space ]",
  // @todo we need this for types compatibility, but better to fix CustomButtonType
  disabled: false,
};

export const getRejectButtonDefinition = (store: MSTStore) => ({
  ...RejectButtonDefinition,
  title: getRejectLabel(store),
  tooltip: getRejectTooltip(store),
});

type SkipButtonProps = {
  disabled: boolean;
  store: MSTStore;
  /**
   * Handler wrapper for skip with required comment,
   * conditions are checked in wrapper and if all good the `action` is called.
   **/
  onSkipWithComment: (event: React.MouseEvent, action: () => any) => void;
};

// Manager roles that can force-skip unskippable tasks (OW=Owner, AD=Admin, MA=Manager)
const MANAGER_ROLES = ["OW", "AD", "MA"];

export const SkipButton = memo(
  observer(({ disabled, store, onSkipWithComment }: SkipButtonProps) => {
    const task = store.task;
    const isEnterprise = (window as any).APP_SETTINGS?.billing?.enterprise;
    const skipDisabled = isEnterprise ? (task as any)?.allow_skip === false : false;
    const userRole = (window as any).APP_SETTINGS?.user?.role;
    const hasForceSkipPermission = MANAGER_ROLES.includes(userRole);
    const canSkip = !skipDisabled || hasForceSkipPermission;
    const isDisabled = disabled || !canSkip;

    const tooltip: string = canSkip ? "Cancel (skip) task [ Ctrl+Space ]" : "This task cannot be skipped";

    const showInfoIcon = skipDisabled && hasForceSkipPermission;

    return (
      <>
        {showInfoIcon && (
          <Tooltip title="Annotators and Reviewers will not be able to skip this task">
            <IconInfoOutline width={20} height={20} className="text-neutral-content ml-auto cursor-pointer" />
          </Tooltip>
        )}
        <Button
          key="skip"
          aria-label="skip-task"
          disabled={isDisabled}
          look="outlined"
          tooltip={tooltip}
          onClick={async (e) => {
            if (!canSkip) return;
            const action = () => store.skipTask({});
            const selected = store.annotationStore?.selected;
            if (store.hasInterface("comments:skip") ?? true) {
              onSkipWithComment(e, action);
            } else {
              selected?.submissionInProgress();
              await store.commentStore.commentFormSubmit();
              store.skipTask({});
            }
          }}
          data-testid="bottombar-skip-button"
        >
          Skip
        </Button>
      </>
    );
  }),
);

export const UnskipButton = memo(
  observer(({ disabled, store }: { disabled: boolean; store: MSTStore }) => {
    return (
      <Button
        key="cancel-skip"
        tooltip="Cancel skip: []"
        aria-label="cancel-skip"
        look="outlined"
        disabled={disabled}
        onClick={async () => {
          const selected = store.annotationStore?.selected;

          selected?.submissionInProgress();
          await store.commentStore.commentFormSubmit();
          store.unskipTask();
        }}
        data-testid="bottombar-unskip-button"
      >
        Cancel skip
      </Button>
    );
  }),
);
