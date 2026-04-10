import chr from "chroma-js";
import { format } from "date-fns";
import { useMemo } from "react";
import { Link, NavLink } from "react-router-dom";
import { IconCheck, IconEllipsis, IconMinus, IconSparks } from "@humansignal/icons";
import { Userpic, Button, Dropdown, EmptyState, Tooltip, Typography, buttonVariant } from "@humansignal/ui";
import { Menu, Pagination } from "../../components";
import { cn } from "../../utils/bem";
import { ProjectStateChip } from "@humansignal/app-common";

const DEFAULT_CARD_COLORS = ["#FFFFFF", "#FDFDFC"];

export const ProjectsList = ({
  projects,
  currentPage,
  totalItems,
  loadNextPage,
  pageSize,
  viewMode,
  searchValue,
  stateFilter,
  onCreateProject,
  onResetFilters,
}) => {
  return (
    <>
      {projects.length ? (
        viewMode === "cards" ? (
          <div className={cn("projects-page").elem("list").toClassName()}>
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <ProjectTable projects={projects} />
        )
      ) : (
        <div className="rounded-large border border-neutral-border bg-neutral-background p-4">
          <EmptyState
            size="medium"
            variant="neutral"
            icon={<IconSparks />}
            title="当前筛选条件下没有项目"
            description={
              searchValue || stateFilter !== "all"
                ? "可以清空搜索词或切换状态筛选后再试。"
                : "创建项目后就可以在这里查看进度、状态和负责人。"
            }
            actions={
              <>
                {(searchValue || stateFilter !== "all") && (
                  <button
                    type="button"
                    className={buttonVariant({ look: "outlined", size: "small" })}
                    onClick={onResetFilters}
                  >
                    清空筛选
                  </button>
                )}
                <Button onClick={onCreateProject} aria-label="创建项目">
                  创建项目
                </Button>
              </>
            }
          />
        </div>
      )}
      <div className={cn("projects-page").elem("pages").toClassName()}>
        <Pagination
          name="projects-list"
          label="项目"
          page={currentPage}
          totalItems={totalItems}
          urlParamName="page"
          pageSize={pageSize}
          pageSizeOptions={[10, 30, 50, 100]}
          onPageLoad={(page, pageSize) => loadNextPage(page, pageSize)}
        />
      </div>
    </>
  );
};

export const EmptyProjectsList = ({ openModal }) => {
  return (
    <div className="rounded-large border border-neutral-border bg-neutral-background p-6">
      <EmptyState
        size="medium"
        variant="primary"
        icon={<IconSparks />}
        title="这里还没有项目"
        description="创建项目后即可导入数据、配置标注模板并开始处理任务。"
        actions={
          <Button onClick={openModal} aria-label="创建项目">
            创建项目
          </Button>
        }
      />
    </div>
  );
};

const ProjectTable = ({ projects }) => {
  return (
    <div className="overflow-hidden rounded-large border border-neutral-border bg-neutral-background">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-neutral-surface">
            <tr className="text-left">
              {["项目名称", "状态", "任务进度", "负责人", "创建时间", "操作"].map((title) => (
                <th key={title} className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-neutral-content-subtler">
                  {title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <ProjectTableRow key={project.id} project={project} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ProjectTableRow = ({ project }) => {
  const finished = project.finished_task_number ?? 0;
  const total = project.task_number ?? 0;
  const progress = total > 0 ? Math.round((finished / total) * 100) : 0;

  return (
    <tr className="border-t border-neutral-border align-top hover:bg-neutral-surface/60">
      <td className="px-4 py-4">
        <Link to={`/projects/${project.id}/data`} data-external className="block min-w-[220px]">
          <Typography variant="title" size="small" className="text-neutral-content hover:text-primary-content">
            {project.title ?? "新项目"}
          </Typography>
          <Typography variant="body" size="small" className="mt-1 max-w-[320px] text-neutral-content-subtler" truncateLines={2}>
            {project.description || "暂无项目描述"}
          </Typography>
        </Link>
      </td>
      <td className="px-4 py-4">
        {project.state ? (
          <ProjectStateChip state={project.state} projectId={project.id} interactive={false} />
        ) : (
          <span className="text-sm text-neutral-content-subtler">未设置</span>
        )}
      </td>
      <td className="px-4 py-4">
        <div className="min-w-[180px]">
          <Typography variant="label" size="small" className="text-neutral-content">
            {finished} / {total}
          </Typography>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-surface">
            <div className="h-full bg-positive-surface-hover" style={{ width: `${progress}%` }} />
          </div>
          <Typography variant="body" size="small" className="mt-2 text-neutral-content-subtler">
            完成度 {progress}%
          </Typography>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <Userpic src="#" user={project.created_by} showUsernameTooltip />
          <span className="text-sm text-neutral-content">{project.created_by?.email ?? project.created_by?.firstName ?? "--"}</span>
        </div>
      </td>
      <td className="px-4 py-4 text-sm text-neutral-content-subtler">{format(new Date(project.created_at), "yyyy-MM-dd HH:mm")}</td>
      <td className="px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/projects/${project.id}/data`} className={buttonVariant({ size: "small" })} data-external>
            进入任务
          </Link>
          <Link
            to={`/projects/${project.id}/settings`}
            className={buttonVariant({ size: "small", look: "outlined", variant: "neutral" })}
            data-external
          >
            设置
          </Link>
          <Dropdown.Trigger
            content={
              <Menu contextual>
                <Menu.Item href={`/projects/${project.id}/data?labeling=1`}>开始标注</Menu.Item>
                <Menu.Item href={`/projects/${project.id}/settings`}>项目设置</Menu.Item>
              </Menu>
            }
          >
            <Button size="small" look="outlined" variant="neutral" aria-label="项目更多操作">
              更多
            </Button>
          </Dropdown.Trigger>
        </div>
      </td>
    </tr>
  );
};

const ProjectCard = ({ project }) => {
  const color = useMemo(() => {
    return DEFAULT_CARD_COLORS.includes(project.color) ? null : project.color;
  }, [project]);

  const projectColors = useMemo(() => {
    const textColor =
      color && chr(color).luminance() > 0.3
        ? "var(--color-neutral-inverted-content)"
        : "var(--color-neutral-inverted-content)"; // Determine text color based on luminance
    return color
      ? {
          "--header-color": color,
          "--background-color": chr(color).alpha(0.2).css(),
          "--text-color": textColor,
          "--border-color": chr(color).alpha(0.5).css(),
        }
      : {};
  }, [color]);

  return (
    <NavLink
      className={cn("projects-page").elem("link").toClassName()}
      to={`/projects/${project.id}/data`}
      data-external
    >
      <div className={cn("project-card").mod({ colored: !!color }).toClassName()} style={projectColors}>
        <div className={cn("project-card").elem("header").toClassName()}>
          <div className={cn("project-card").elem("title").toClassName()}>
            <div className={cn("project-card").elem("title-text-wrapper").toClassName()}>
              <Tooltip title={project.title ?? "新项目"}>
                <div className={cn("project-card").elem("title-text").toClassName()}>
                  {project.title ?? "新项目"}
                </div>
              </Tooltip>
            </div>

            <div
              className={cn("project-card").elem("menu").toClassName()}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              <Dropdown.Trigger
                content={
                  <Menu contextual>
                    <Menu.Item href={`/projects/${project.id}/settings`}>设置</Menu.Item>
                    <Menu.Item href={`/projects/${project.id}/data?labeling=1`}>标注</Menu.Item>
                  </Menu>
                }
              >
                <Button size="smaller" look="string" aria-label="项目选项">
                  <IconEllipsis />
                </Button>
              </Dropdown.Trigger>
            </div>

            {project.state && (
              <div className={cn("project-card").elem("state-chip").toClassName()}>
                <ProjectStateChip state={project.state} projectId={project.id} interactive={false} />
              </div>
            )}
          </div>
          <div className={cn("project-card").elem("summary").toClassName()}>
            <div className={cn("project-card").elem("annotation").toClassName()}>
              <div className={cn("project-card").elem("total").toClassName()}>
                {project.finished_task_number} / {project.task_number}
              </div>
              <div className={cn("project-card").elem("detail").toClassName()}>
                <div className={cn("project-card").elem("detail-item").mod({ type: "completed" }).toClassName()}>
                  <IconCheck className={cn("project-card").elem("icon").toClassName()} />
                  {project.total_annotations_number}
                </div>
                <div className={cn("project-card").elem("detail-item").mod({ type: "rejected" }).toClassName()}>
                  <IconMinus className={cn("project-card").elem("icon").toClassName()} />
                  {project.skipped_annotations_number}
                </div>
                <div className={cn("project-card").elem("detail-item").mod({ type: "predictions" }).toClassName()}>
                  <IconSparks className={cn("project-card").elem("icon").toClassName()} />
                  {project.total_predictions_number}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={cn("project-card").elem("description").toClassName()}>{project.description}</div>
        <div className={cn("project-card").elem("info").toClassName()}>
          <div className={cn("project-card").elem("created-date").toClassName()}>
            {format(new Date(project.created_at), "yyyy-MM-dd HH:mm")}
          </div>
          <div className={cn("project-card").elem("created-by").toClassName()}>
            <Userpic src="#" user={project.created_by} showUsernameTooltip />
          </div>
        </div>
      </div>
    </NavLink>
  );
};
