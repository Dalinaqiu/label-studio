import {
  IconClock,
  IconExternal,
  IconFolderAdd,
  IconFolderOpen,
  IconList,
  IconSparks,
  IconUserAdd,
} from "@humansignal/icons";
import { Button, EmptyState, PageHeader, SimpleCard, Spinner, StatCard, Tooltip, Typography } from "@humansignal/ui";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useUpdatePageTitle } from "@humansignal/core";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useAPI } from "../../providers/ApiProvider";
import { CreateProject } from "../CreateProject/CreateProject";
import { InviteLink } from "../Organization/PeoplePage/InviteLink";
import type { Page } from "../types/Page";
import {
  creationDialogOpen,
  invitationOpen,
  locationKeyAtom,
  PROJECTS_TO_SHOW,
  projectsDataAtom,
  sortedProjectsAtom,
  visitedIdsAtom,
} from "./atoms";

const resources = [
  {
    title: "产品文档",
    url: "https://labelstud.io/guide/",
  },
  {
    title: "API 文档",
    url: "https://api.labelstud.io/api-reference/introduction/getting-started",
  },
  {
    title: "版本说明",
    url: "https://labelstud.io/learn/categories/release-notes/",
  },
  {
    title: "Label Studio 博客",
    url: "https://labelstud.io/blog/",
  },
  {
    title: "Slack 社区",
    url: "https://slack.labelstud.io",
  },
];

const actions = [
  {
    title: "创建项目",
    icon: IconFolderAdd,
    type: "createProject",
  },
  {
    title: "邀请成员",
    icon: IconUserAdd,
    type: "inviteMembers",
  },
] as const;

const quickLinks = [
  { title: "项目管理", description: "查看全部项目、筛选状态并进入任务处理。", href: "/projects" },
  { title: "产品文档", description: "快速查找配置说明、导入方式和标注能力。", href: "https://labelstud.io/guide/" },
  { title: "API 文档", description: "查看接口说明，便于和现有平台打通。", href: "https://api.labelstud.io/api-reference/introduction/getting-started" },
] as const;

type Action = (typeof actions)[number]["type"];

export const HomePage: Page = () => {
  const api = useAPI();
  const location = useLocation();
  const [modalIsOpen, setModalIsOpen] = useAtom(creationDialogOpen);
  const [invitationIsOpen, setInvitationIsOpen] = useAtom(invitationOpen);
  const setLocationKey = useSetAtom(locationKeyAtom);
  const setProjectsData = useSetAtom(projectsDataAtom);
  const sortedProjects = useAtomValue(sortedProjectsAtom);
  const visitedIds = useAtomValue(visitedIdsAtom);

  useUpdatePageTitle("首页");

  // Fetch regular projects
  const { data, isFetching, isSuccess, isError } = useQuery({
    queryKey: ["projects", { page_size: PROJECTS_TO_SHOW }],
    async queryFn() {
      return api.callApi<{ results: APIProject[]; count: number }>("projects", {
        params: { page_size: PROJECTS_TO_SHOW },
      });
    },
  });

  // Fetch visited projects specifically by their IDs
  const { data: visitedProjectsData } = useQuery({
    queryKey: ["visited-projects", { ids: visitedIds }],
    async queryFn() {
      if (visitedIds.length === 0) return { results: [], count: 0 };

      return api.callApi<{ results: APIProject[]; count: number }>("projects", {
        params: {
          ids: visitedIds.join(","),
          page_size: visitedIds.length,
        },
      });
    },
    enabled: visitedIds.length > 0,
  });

  // Update location key atom when navigating to/returning to this page
  // This triggers visitedIdsAtom to re-read from localStorage
  // We use a timestamp to ensure the atom always updates, forcing a re-read
  useEffect(() => {
    setLocationKey(Date.now().toString());
  }, [location.pathname, setLocationKey]);

  // Merge visited and regular projects, removing duplicates
  useEffect(() => {
    const visitedProjects = visitedProjectsData?.results ?? [];
    const regularProjects = data?.results ?? [];

    // Merge and deduplicate
    const allProjects = [...visitedProjects, ...regularProjects];
    const uniqueProjects = Array.from(new Map(allProjects.map((p) => [p.id, p])).values());

    if (uniqueProjects.length > 0) {
      setProjectsData(uniqueProjects);
    }
  }, [data?.results, visitedProjectsData?.results, setProjectsData]);

  const handleActions = (action: Action) => {
    return () => {
      switch (action) {
        case "createProject":
          setModalIsOpen(true);
          break;
        case "inviteMembers":
          setInvitationIsOpen(true);
          break;
      }
    };
  };

  const projectCount = data?.count ?? 0;
  const recentTaskCount = sortedProjects.reduce((sum, project) => sum + (project.task_number ?? 0), 0);
  const finishedTaskCount = sortedProjects.reduce((sum, project) => sum + (project.finished_task_number ?? 0), 0);

  const summaryStats = [
    {
      title: "项目总数",
      value: projectCount,
      description: projectCount > 0 ? "当前账号可访问的项目数量" : "创建第一个项目后会在这里显示",
      icon: <IconFolderOpen />,
    },
    {
      title: "最近访问",
      value: visitedIds.length,
      description: visitedIds.length > 0 ? "最近打开过的项目数量" : "开始浏览项目后会自动记录",
      icon: <IconClock />,
    },
    {
      title: "任务总数",
      value: recentTaskCount,
      description: "最近项目中汇总的任务量",
      icon: <IconList />,
    },
    {
      title: "已完成任务",
      value: finishedTaskCount,
      description: "最近项目中的已完成任务数",
      icon: <IconSparks />,
    },
  ];

  return (
    <main className="p-6">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
        <PageHeader
          title="工作台"
          description="优先查看项目进度、近期任务和常用入口。页面信息保持偏高密度，适合日常连续操作。"
          meta="首页 / 工作台"
          actions={
            <>
              <Button look="outlined" onClick={() => setInvitationIsOpen(true)} aria-label="邀请成员">
                邀请成员
              </Button>
              <Button onClick={() => setModalIsOpen(true)} aria-label="创建项目">
                新建项目
              </Button>
            </>
          }
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryStats.map((stat) => (
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              description={stat.description}
              icon={stat.icon}
            />
          ))}
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
          <section className="flex flex-col gap-6">
            <SimpleCard
              title="快捷操作"
              description="将高频动作放在首屏，减少在导航和二级菜单之间来回切换。"
            >
              <div className="grid gap-3 md:grid-cols-2">
                {actions.map((action) => {
                  return (
                    <Button
                      key={action.title}
                      look="outlined"
                      align="left"
                      className="h-auto min-h-[56px] justify-start gap-3 px-4 py-3 text-left [&_svg]:h-5 [&_svg]:w-5"
                      onClick={handleActions(action.type)}
                      leading={<action.icon />}
                    >
                      {action.title}
                    </Button>
                  );
                })}
                {quickLinks.map((item) => {
                  const isExternal = item.href.startsWith("http");
                  const body = (
                    <div className="rounded-large border border-neutral-border bg-neutral-surface px-4 py-3 transition-colors hover:border-primary-border-subtle hover:bg-primary-emphasis-subtle">
                      <div className="flex items-center justify-between gap-4">
                        <Typography variant="title" size="small" className="text-neutral-content">
                          {item.title}
                        </Typography>
                        {isExternal ? <IconExternal className="text-primary-icon" /> : <IconFolderOpen className="text-primary-icon" />}
                      </div>
                      <Typography variant="body" size="small" className="mt-2 text-neutral-content-subtler">
                        {item.description}
                      </Typography>
                    </div>
                  );

                  return isExternal ? (
                    <a key={item.title} href={item.href} target="_blank" rel="noreferrer">
                      {body}
                    </a>
                  ) : (
                    <Link key={item.title} to={item.href} data-external>
                      {body}
                    </Link>
                  );
                })}
              </div>
            </SimpleCard>

            <SimpleCard
              title={
                <div className="flex items-center justify-between gap-4">
                  <span>最近项目</span>
                  <Link to="/projects" className="text-sm font-medium text-primary-content hover:underline" data-external>
                    查看全部
                  </Link>
                </div>
              }
              description="优先展示最近访问和近期加载的项目，方便继续处理任务。"
              contentClassName="px-0 pb-0"
            >
              {isFetching ? (
                <div className="flex h-64 items-center justify-center">
                  <Spinner />
                </div>
              ) : isError ? (
                <div className="p-4">
                  <EmptyState
                    size="medium"
                    variant="negative"
                    icon={<IconFolderOpen />}
                    title="项目加载失败"
                    description="暂时无法获取项目列表，请刷新页面后重试。"
                    actions={
                      <Button look="outlined" onClick={() => window.location.reload()} aria-label="刷新页面">
                        刷新页面
                      </Button>
                    }
                  />
                </div>
              ) : isSuccess && data && sortedProjects.length === 0 ? (
                <div className="p-4">
                  <EmptyState
                    size="medium"
                    variant="primary"
                    icon={<IconFolderAdd />}
                    title="创建第一个项目"
                    description="导入数据并配置标注界面后，就可以开始标注和质检。"
                    actions={
                      <Button onClick={() => setModalIsOpen(true)} aria-label="创建项目">
                        创建项目
                      </Button>
                    }
                  />
                </div>
              ) : isSuccess && data && sortedProjects.length > 0 ? (
                <div className="flex flex-col">
                  {sortedProjects.map((project) => {
                    return <ProjectSimpleCard key={project.id} project={project} />;
                  })}
                </div>
              ) : null}
            </SimpleCard>
          </section>

          <section className="flex flex-col gap-6">
            <SimpleCard title="帮助与通知" description="保留常用文档和产品更新入口，减少查找成本。">
              <ul className="flex flex-col divide-y divide-neutral-border">
                {resources.map((link) => {
                  return (
                    <li key={link.title}>
                      <a
                        href={link.url}
                        className="flex items-center justify-between gap-4 py-3 text-neutral-content"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <div>
                          <Typography variant="title" size="small" className="text-neutral-content">
                            {link.title}
                          </Typography>
                          <Typography variant="body" size="small" className="mt-1 text-neutral-content-subtler">
                            {link.title === "版本说明"
                              ? "查看最近版本更新和功能变更。"
                              : link.title === "Slack 社区"
                                ? "遇到问题时可查找社区经验和官方答复。"
                                : "补充配置说明、最佳实践和接口说明。"}
                          </Typography>
                        </div>
                        <IconExternal className="shrink-0 text-primary-icon" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </SimpleCard>
          </section>
        </div>
      </div>
      {modalIsOpen && <CreateProject onClose={() => setModalIsOpen(false)} />}
      <InviteLink opened={invitationIsOpen} onClosed={() => setInvitationIsOpen(false)} />
    </main>
  );
};

HomePage.title = "首页";
HomePage.path = "/";
HomePage.exact = true;

function ProjectSimpleCard({
  project,
}: {
  project: APIProject;
}) {
  const finished = project.finished_task_number ?? 0;
  const total = project.task_number ?? 0;
  const progress = (total > 0 ? finished / total : 0) * 100;
  const white = "#FFFFFF";
  const color = project.color && project.color !== white ? project.color : "#E1DED5";

  return (
    <Link
      to={`/projects/${project.id}/data`}
      className="block border-b border-neutral-border last:border-b-0 even:bg-neutral-surface/40"
      data-external
    >
      <div
        className="grid grid-cols-[minmax(0,1fr)_160px] items-center gap-4 p-4"
        style={{ borderLeftColor: color }}
      >
        <div className="flex min-w-0 flex-col gap-1 border-l-[3px] pl-3" style={{ borderLeftColor: color }}>
          <Tooltip title={project.title}>
            <span className="truncate text-neutral-content">{project.title}</span>
          </Tooltip>
          <div className="text-sm text-neutral-content-subtler">
            已完成 {finished} / {total} 个任务（{total > 0 ? Math.round((finished / total) * 100) : 0}%）
          </div>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-surface shadow-border-1 shadow-neutral-border-subtle">
          <div className="bg-positive-surface-hover h-full" style={{ maxWidth: `${progress}%` }} />
        </div>
      </div>
    </Link>
  );
}
