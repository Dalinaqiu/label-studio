import { useCallback, useMemo, useRef, useState } from "react";
import { useUpdatePageTitle } from "@humansignal/core";
import { IconPlus } from "@humansignal/icons";
import { Button, PageHeader, useToast } from "@humansignal/ui";
import { TokenSettingsModal } from "@humansignal/app-common/blocks/TokenSettingsModal";
import { HeidiTips } from "../../../components/HeidiTips/HeidiTips";
import { modal } from "../../../components/Modal/Modal";
import { Space } from "../../../components/Space/Space";
import { cn } from "../../../utils/bem";
import { FF_AUTH_TOKENS, FF_LSDV_E_297, isFF } from "../../../utils/feature-flags";
import { InviteLink } from "./InviteLink";
import { PeopleList } from "./PeopleList";
import { SelectedUser } from "./SelectedUser";
import "./PeopleInvitation.scss";
import "./PeoplePage.scss";

export const PeoplePage = () => {
  const apiSettingsModal = useRef();
  const toast = useToast();
  const [selectedUser, setSelectedUser] = useState(null);
  const [defaultSelected, setDefaultSelected] = useState(() => localStorage.getItem("selectedUser"));
  const [invitationOpen, setInvitationOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const organizationId = useMemo(() => APP_SETTINGS.user?.active_organization ?? 1, []);

  useUpdatePageTitle("组织成员");

  const selectUser = useCallback((user) => {
    setSelectedUser(user);
    const nextSelected = user?.id ? String(user.id) : "";

    setDefaultSelected(nextSelected);
    localStorage.setItem("selectedUser", nextSelected);
  }, []);

  const apiTokensSettingsModalProps = useMemo(
    () => ({
      title: "API Token 设置",
      style: { width: 480 },
      body: () => (
        <TokenSettingsModal
          onSaved={() => {
            toast.show({ message: "API Token 已更新" });
            apiSettingsModal.current?.close();
          }}
        />
      ),
    }),
    [toast],
  );

  const showApiTokenSettingsModal = useCallback(() => {
    apiSettingsModal.current = modal(apiTokensSettingsModalProps);
    __lsa("organization.token_settings");
  }, [apiTokensSettingsModalProps]);

  return (
    <div className={cn("people").toClassName()}>
      <PageHeader
        title="组织成员"
        description="集中查看成员、角色和邀请状态，把高频协作入口放在页头，减少在列表和弹窗之间来回切换。"
        className="mb-6"
        actions={
          <Space>
            {isFF(FF_AUTH_TOKENS) && (
              <Button look="outlined" onClick={showApiTokenSettingsModal} aria-label="打开 API Token 设置">
                API Token 设置
              </Button>
            )}
            <Button leading={<IconPlus className="!h-4" />} onClick={() => setInvitationOpen(true)} aria-label="邀请成员">
              邀请成员
            </Button>
          </Space>
        }
      />
      <div className={cn("people").elem("content").toClassName()}>
        <PeopleList
          organizationId={organizationId}
          refreshKey={refreshKey}
          selectedUser={selectedUser}
          defaultSelected={defaultSelected}
          onSelect={selectUser}
        />

        {selectedUser ? (
          <SelectedUser
            user={selectedUser}
            organizationId={organizationId}
            onClose={() => selectUser(null)}
            onRoleChange={(user) => {
              selectUser(user);
              setRefreshKey((key) => key + 1);
            }}
          />
        ) : (
          isFF(FF_LSDV_E_297) && <HeidiTips collection="organizationPage" />
        )}
      </div>
      <InviteLink
        opened={invitationOpen}
        onClosed={() => {
          setInvitationOpen(false);
        }}
      />
    </div>
  );
};

PeoplePage.title = "组织成员";
PeoplePage.path = "/";
