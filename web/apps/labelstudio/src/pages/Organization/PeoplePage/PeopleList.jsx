import { formatDistance } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useCallback, useEffect, useState } from "react";
import { Userpic } from "@humansignal/ui";
import { Pagination, Spinner } from "../../../components";
import { usePage, usePageSize } from "../../../components/Pagination/Pagination";
import { CopyableTooltip } from "../../../components/CopyableTooltip/CopyableTooltip";
import { useAPI } from "../../../providers/ApiProvider";
import { cn } from "../../../utils/bem";
import { isDefined } from "../../../utils/helpers";
import "./PeopleList.scss";

const enrichMember = (membership) => ({
  ...membership,
  user: {
    ...membership.user,
    role: membership.role,
    role_name: membership.role_name,
    is_owner: membership.is_owner,
  },
});

export const PeopleList = ({ organizationId, onSelect, selectedUser, defaultSelected, refreshKey }) => {
  const api = useAPI();
  const [usersList, setUsersList] = useState();
  const [currentPage] = usePage("page", 1);
  const [currentPageSize] = usePageSize("page_size", 30);
  const [totalItems, setTotalItems] = useState(0);

  const fetchUsers = useCallback(
    async (page, pageSize) => {
      const response = await api.callApi("memberships", {
        params: {
          pk: organizationId,
          contributed_to_projects: 1,
          page,
          page_size: pageSize,
        },
      });

      if (response.results) {
        setUsersList(response.results.map(enrichMember));
        setTotalItems(response.count);
      }
    },
    [api, organizationId],
  );

  const handleUserClick = useCallback(
    (user) => {
      if (selectedUser?.id === user.id) {
        onSelect?.(null);
      } else {
        onSelect?.(user);
      }
    },
    [onSelect, selectedUser],
  );

  useEffect(() => {
    fetchUsers(currentPage, currentPageSize);
  }, [fetchUsers, currentPage, currentPageSize, refreshKey]);

  useEffect(() => {
    if (isDefined(defaultSelected) && usersList) {
      const selected = usersList.find(({ user }) => user.id === Number(defaultSelected));

      if (selected && selectedUser?.id !== selected.user.id) {
        onSelect?.(selected.user);
      }
    }
  }, [usersList, defaultSelected, selectedUser?.id, onSelect]);

  return (
    <div className={cn("people-list").toClassName()}>
      <div className={cn("people-list").elem("wrapper").toClassName()}>
        {usersList ? (
          <div className={cn("people-list").elem("users").toClassName()}>
            <div className={cn("people-list").elem("header").toClassName()}>
              <div className={cn("people-list").elem("column").mix("avatar").toClassName()} />
              <div className={cn("people-list").elem("column").mix("email").toClassName()}>Email</div>
              <div className={cn("people-list").elem("column").mix("name").toClassName()}>Name</div>
              <div className={cn("people-list").elem("column").mix("role").toClassName()}>Role</div>
              <div className={cn("people-list").elem("column").mix("last-activity").toClassName()}>Last Active</div>
            </div>
            <div className={cn("people-list").elem("body").toClassName()}>
              {usersList.map(({ user }) => {
                const active = user.id === selectedUser?.id;

                return (
                  <div
                    key={`user-${user.id}`}
                    className={cn("people-list").elem("user").mod({ active }).toClassName()}
                    onClick={() => handleUserClick(user)}
                  >
                    <div className={cn("people-list").elem("field").mix("avatar").toClassName()}>
                      <CopyableTooltip title={`User ID: ${user.id}`} textForCopy={user.id}>
                        <Userpic user={user} style={{ width: 28, height: 28 }} />
                      </CopyableTooltip>
                    </div>
                    <div className={cn("people-list").elem("field").mix("email").toClassName()}>{user.email}</div>
                    <div className={cn("people-list").elem("field").mix("name").toClassName()}>
                      {user.first_name} {user.last_name}
                    </div>
                    <div className={cn("people-list").elem("field").mix("role").toClassName()}>{user.role_name}</div>
                    <div className={cn("people-list").elem("field").mix("last-activity").toClassName()}>
                      {formatDistance(new Date(user.last_activity), new Date(), { addSuffix: true, locale: zhCN })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className={cn("people-list").elem("loading").toClassName()}>
            <Spinner size={36} />
          </div>
        )}
      </div>
      <Pagination
        page={currentPage}
        urlParamName="page"
        totalItems={totalItems}
        pageSize={currentPageSize}
        pageSizeOptions={[30, 50, 100]}
        onPageLoad={fetchUsers}
        style={{ paddingTop: 16 }}
      />
    </div>
  );
};
