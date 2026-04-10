import React, { useMemo, useState } from "react";
import { useParams as useRouterParams } from "react-router";
import { Redirect } from "react-router-dom";
import { Button, FilterBar, PageHeader, Select } from "@humansignal/ui";
import { Oneof } from "../../components/Oneof/Oneof";
import { Spinner } from "../../components/Spinner/Spinner";
import { ApiContext } from "../../providers/ApiProvider";
import { useContextProps } from "../../providers/RoutesProvider";
import { cn } from "../../utils/bem";
import { CreateProject } from "../CreateProject/CreateProject";
import { DataManagerPage } from "../DataManager/DataManager";
import { SettingsPage } from "../Settings";
import { EmptyProjectsList, ProjectsList } from "./ProjectsList";
import { useAbortController, useUpdatePageTitle } from "@humansignal/core";
import "./Projects.scss";

const getCurrentPage = () => {
  const pageNumberFromURL = new URLSearchParams(location.search).get("page");

  return pageNumberFromURL ? Number.parseInt(pageNumberFromURL) : 1;
};

export const ProjectsPage = () => {
  const api = React.useContext(ApiContext);
  const abortController = useAbortController();
  const [projectsList, setProjectsList] = React.useState([]);
  const [networkState, setNetworkState] = React.useState(null);
  const [currentPage, setCurrentPage] = useState(getCurrentPage());
  const [totalItems, setTotalItems] = useState(1);
  const setContextProps = useContextProps();

  useUpdatePageTitle("项目");
  const defaultPageSize = Number.parseInt(localStorage.getItem("pages:projects-list") ?? 30);
  const [searchValue, setSearchValue] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [viewMode, setViewMode] = useState("table");

  const [modal, setModal] = React.useState(false);

  const openModal = () => setModal(true);

  const closeModal = () => setModal(false);

  const fetchProjects = async (page = currentPage, pageSize = defaultPageSize) => {
    setNetworkState("loading");
    abortController.renew(); // Cancel any in flight requests

    const requestParams = { page, page_size: pageSize };

    requestParams.include = [
      "id",
      "title",
      "created_by",
      "created_at",
      "color",
      "is_published",
      "assignment_settings",
      "state",
    ].join(",");

    const data = await api.callApi("projects", {
      params: requestParams,
      signal: abortController.controller.current.signal,
      errorFilter: (e) => e.error.includes("aborted"),
    });

    setTotalItems(data?.count ?? 1);
    setProjectsList(data.results ?? []);
    setNetworkState("loaded");

    if (data?.results?.length) {
      const additionalData = await api.callApi("projects", {
        params: {
          ids: data?.results?.map(({ id }) => id).join(","),
          include: [
            "id",
            "description",
            "num_tasks_with_annotations",
            "task_number",
            "skipped_annotations_number",
            "total_annotations_number",
            "total_predictions_number",
            "ground_truth_number",
            "finished_task_number",
          ].join(","),
          page_size: pageSize,
        },
        signal: abortController.controller.current.signal,
        errorFilter: (e) => e.error.includes("aborted"),
      });

      if (additionalData?.results?.length) {
        setProjectsList((prev) =>
          additionalData.results.map((project) => {
            const prevProject = prev.find(({ id }) => id === project.id);

            return {
              ...prevProject,
              ...project,
            };
          }),
        );
      }
    }
  };

  const loadNextPage = async (page, pageSize) => {
    setCurrentPage(page);
    await fetchProjects(page, pageSize);
  };

  React.useEffect(() => {
    fetchProjects();
  }, []);

  React.useEffect(() => {
    setContextProps({ openModal, showButton: false });
  }, []);

  const stateOptions = useMemo(() => {
    const states = Array.from(new Set(projectsList.map((project) => project.state).filter(Boolean)));

    return [
      { value: "all", label: "全部状态" },
      ...states.map((state) => ({ value: state, label: state })),
    ];
  }, [projectsList]);

  const filteredProjects = useMemo(() => {
    return projectsList.filter((project) => {
      const normalizedSearch = searchValue.trim().toLowerCase();
      const matchSearch =
        normalizedSearch.length === 0 ||
        project.title?.toLowerCase().includes(normalizedSearch) ||
        project.description?.toLowerCase().includes(normalizedSearch);
      const matchState = stateFilter === "all" || project.state === stateFilter;

      return matchSearch && matchState;
    });
  }, [projectsList, searchValue, stateFilter]);

  const resetFilters = () => {
    setSearchValue("");
    setStateFilter("all");
  };

  return (
    <div className={cn("projects-page").toClassName()}>
      <Oneof value={networkState}>
        <div className={cn("projects-page").elem("loading").toClassName()} case="loading">
          <Spinner size={64} />
        </div>
        <div className={cn("projects-page").elem("content").toClassName()} case="loaded">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-6 p-6">
            <PageHeader
              title="项目管理"
              description="用表格优先的方式查看、筛选和进入项目，适合高频管理和连续处理任务。"
              meta="项目 / 管理"
              actions={
                <Button onClick={openModal} aria-label="创建项目">
                  新建项目
                </Button>
              }
            />

            <FilterBar
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              searchPlaceholder="搜索项目名称或描述"
              viewOptions={[
                { value: "table", label: "表格视图" },
                { value: "cards", label: "卡片视图" },
              ]}
              viewValue={viewMode}
              onViewChange={setViewMode}
              filters={
                <Select
                  value={stateFilter}
                  options={stateOptions}
                  onChange={(value) => setStateFilter(value)}
                  placeholder="全部状态"
                  triggerClassName="min-w-[180px]"
                  aria-label="状态筛选"
                />
              }
            />

            {projectsList.length ? (
              <ProjectsList
                projects={filteredProjects}
                currentPage={currentPage}
                totalItems={totalItems}
                loadNextPage={loadNextPage}
                pageSize={defaultPageSize}
                viewMode={viewMode}
                searchValue={searchValue}
                stateFilter={stateFilter}
                onCreateProject={openModal}
                onResetFilters={resetFilters}
              />
            ) : (
              <EmptyProjectsList openModal={openModal} />
            )}
          </div>
          {modal && <CreateProject onClose={closeModal} />}
        </div>
      </Oneof>
    </div>
  );
};

ProjectsPage.title = "项目";
ProjectsPage.path = "/projects";
ProjectsPage.exact = true;
ProjectsPage.routes = ({ store }) => [
  {
    title: () => store.project?.title,
    path: "/:id(\\d+)",
    exact: true,
    component: () => {
      const params = useRouterParams();

      return <Redirect to={`/projects/${params.id}/data`} />;
    },
    pages: {
      DataManagerPage,
      SettingsPage,
    },
  },
];
ProjectsPage.context = ({ openModal, showButton }) => {
  if (!showButton) return null;
  return (
    <Button onClick={openModal} size="small" aria-label="创建项目">
      创建
    </Button>
  );
};
