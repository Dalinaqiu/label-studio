import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { NavLink } from "react-router-dom";
import { IconCross } from "@humansignal/icons";
import { Button, Userpic, useToast } from "@humansignal/ui";
import { useAuth } from "@humansignal/core/providers/AuthProvider";
import { cn } from "../../../utils/bem";
import { useAPI } from "../../../providers/ApiProvider";
import "./SelectedUser.scss";

const ROLE_OPTIONS = [
  { value: "OW", label: "所有者" },
  { value: "AD", label: "管理员" },
  { value: "MA", label: "经理" },
  { value: "RE", label: "审核员" },
  { value: "AN", label: "标注员" },
  { value: "VI", label: "查看者" },
];

const UserProjectsLinks = ({ projects }) => {
  return (
    <div className={cn("user-info").elem("links-list").toClassName()}>
      {projects.map((project) => (
        <NavLink
          className={cn("user-info").elem("project-link").toClassName()}
          key={`project-${project.id}`}
          to={`/projects/${project.id}`}
          data-external
        >
          {project.title}
        </NavLink>
      ))}
    </div>
  );
};

export const SelectedUser = ({ user, organizationId, onClose, onRoleChange }) => {
  const api = useAPI();
  const toast = useToast();
  const { permissions } = useAuth();
  const [role, setRole] = useState(user.role);
  const [saving, setSaving] = useState(false);
  const fullName = [user.first_name, user.last_name]
    .filter((n) => !!n)
    .join(" ")
    .trim();

  const canManageRoles = permissions.can("organizations.change");
  const canEditRole = canManageRoles && !user.is_owner;
  const selectedRoleLabel = useMemo(() => ROLE_OPTIONS.find((item) => item.value === role)?.label ?? user.role_name, [role, user.role_name]);

  useEffect(() => {
    setRole(user.role);
  }, [user.id, user.role]);

  const saveRole = async () => {
    setSaving(true);
    try {
      const response = await api.callApi("updateUserMembership", {
        params: {
          pk: organizationId,
          userPk: user.id,
        },
        body: {
          role,
        },
      });

      if (response?.role) {
        toast.show({ message: "成员角色已更新" });
        onRoleChange?.({
          ...user,
          role: response.role,
          role_name: response.role_name,
          is_owner: response.is_owner,
        });
      }
    } catch (error) {
      const message = error?.response?.data?.detail;

      toast.show({
        message: message || "更新成员角色失败",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cn("user-info").toClassName()}>
      <Button
        look="string"
        onClick={onClose}
        className={cn("user-info").elem("close").toClassName()}
        aria-label="关闭成员详情"
      >
        <IconCross />
      </Button>

      <div className={cn("user-info").elem("header").toClassName()}>
        <Userpic user={user} style={{ width: 64, height: 64, fontSize: 28 }} />
        <div className={cn("user-info").elem("info-wrapper").toClassName()}>
          {fullName && <div className={cn("user-info").elem("full-name").toClassName()}>{fullName}</div>}
          <p className={cn("user-info").elem("email").toClassName()}>{user.email}</p>
          <div className={cn("user-info").elem("meta").toClassName()}>
            <span className={cn("user-info").elem("role-badge").toClassName()}>{selectedRoleLabel}</span>
            <span className={cn("user-info").elem("meta-text").toClassName()}>
              最近活跃 {format(new Date(user.last_activity), "yyyy-MM-dd HH:mm")}
            </span>
          </div>
        </div>
      </div>

      <div className={cn("user-info").elem("section").toClassName()}>
        <div className={cn("user-info").elem("section-title").toClassName()}>角色权限</div>
        {canEditRole ? (
          <div className={cn("user-info").elem("role-editor").toClassName()}>
            <select
              className={cn("user-info").elem("role-select").toClassName()}
              value={role}
              onChange={(event) => setRole(event.target.value)}
              disabled={saving}
            >
              {ROLE_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <Button size="small" onClick={saveRole} disabled={saving || role === user.role}>
              保存
            </Button>
          </div>
        ) : (
          <div>{selectedRoleLabel}</div>
        )}
      </div>

      {user.phone && (
        <div className={cn("user-info").elem("section").toClassName()}>
          <a href={`tel:${user.phone}`}>{user.phone}</a>
        </div>
      )}

      {!!user.created_projects?.length && (
        <div className={cn("user-info").elem("section").toClassName()}>
          <div className={cn("user-info").elem("section-title").toClassName()}>创建的项目</div>
          <UserProjectsLinks projects={user.created_projects} />
        </div>
      )}

      {!!user.contributed_to_projects?.length && (
        <div className={cn("user-info").elem("section").toClassName()}>
          <div className={cn("user-info").elem("section-title").toClassName()}>参与的项目</div>
          <UserProjectsLinks projects={user.contributed_to_projects} />
        </div>
      )}

      <p className={cn("user-info").elem("last-active").toClassName()}>
        上次活跃时间 {format(new Date(user.last_activity), "yyyy-MM-dd HH:mm")}
      </p>
    </div>
  );
};
