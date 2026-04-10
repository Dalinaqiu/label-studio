import React from "react";
import { Spinner } from "../../../components";
import { useAPI } from "../../../providers/ApiProvider";
import { cn } from "../../../utils/bem";
import "./Config.scss";
import { IconInfo } from "@humansignal/icons";
import { Button, EnterpriseBadge, Typography } from "@humansignal/ui";

const listClass = cn("templates-list");

const Arrow = () => (
  <svg width="8" height="12" viewBox="0 0 8 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <title>Arrow Icon</title>
    <path opacity="0.9" d="M2 10L6 6L2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
  </svg>
);

const TemplatesInGroup = ({ templates, group, onSelectRecipe, isEdition }) => {
  const picked = templates
    .filter((recipe) => recipe.group === group)
    // templates without `order` go to the end of the list
    .sort((a, b) => (a.order ?? Number.POSITIVE_INFINITY) - (b.order ?? Number.POSITIVE_INFINITY));

  const isCommunityEdition = isEdition === "Community";

  return (
    <ul>
      {picked.map((recipe) => {
        const isEnterpriseTemplate = recipe.type === "enterprise";
        const isDisabled = isCommunityEdition && isEnterpriseTemplate;

        return (
          <li
            key={recipe.title}
            onClick={() => !isDisabled && onSelectRecipe(recipe)}
            className={listClass.elem("template").mod({ disabled: isDisabled })}
            title={isDisabled ? "企业版功能 - 仅在 Label Studio Enterprise 可用" : ""}
          >
            <img src={recipe.image} alt={""} />
            <div className={listClass.elem("template-body")}>
              <div className={listClass.elem("template-meta")}>
                <span>{recipe.group}</span>
                <span>{isEnterpriseTemplate ? "企业版" : "可用"}</span>
              </div>
              <div className="flex w-full relative">
                <h3 className="flex flex-1 justify-center text-center">{recipe.title}</h3>
                {isEnterpriseTemplate && isCommunityEdition && (
                  <EnterpriseBadge className="absolute bottom-[-10px] left-1/2 translate-x-[-40px]" />
                )}
              </div>
              <p className={listClass.elem("template-caption")}>
                {recipe.description || `适合 ${recipe.group} 场景，可在下一步继续微调字段和标签。`}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export const TemplatesList = ({ selectedGroup, selectedRecipe, onCustomTemplate, onSelectGroup, onSelectRecipe }) => {
  const [groups, setGroups] = React.useState([]);
  const [templates, setTemplates] = React.useState();
  const api = useAPI();
  const isEdition = window?.APP_SETTINGS?.version_edition;

  React.useEffect(() => {
    const fetchData = async () => {
      const res = await api.callApi("configTemplates");

      if (!res) return;
      const { templates, groups } = res;

      setTemplates(templates);
      setGroups(groups);
    };
    fetchData();
  }, []);

  const selected = selectedGroup || groups[0];

  return (
    <div className={listClass}>
      <aside className={listClass.elem("sidebar")}>
        <div className={listClass.elem("sidebar-copy")}>
          <Typography variant="label" size="small" className="text-neutral-content-subtler">
            模板分组
          </Typography>
          <Typography variant="body" size="small" className="mt-2 text-neutral-content-subtler">
            先按数据类型选择，再从最接近业务场景的模板开始。
          </Typography>
        </div>
        <ul>
          {groups.map((group) => (
            <li
              key={group}
              onClick={() => onSelectGroup(group)}
              className={listClass.elem("group").mod({
                active: selected === group,
                selected: selectedRecipe?.group === group,
              })}
            >
              {group}
              <Arrow />
            </li>
          ))}
        </ul>
        <Button
          type="button"
          align="left"
          look="string"
          size="small"
          onClick={onCustomTemplate}
          className="w-full"
          aria-label="创建自定义模板"
        >
          自定义模板
        </Button>
      </aside>
      <main>
        <div className={listClass.elem("hero")}>
          <div>
            <Typography variant="title" size="medium" className="text-neutral-content">
              选择模板
            </Typography>
            <Typography variant="body" size="small" className="mt-2 text-neutral-content-subtler">
              先从和数据类型最接近的模板开始，后续再细调字段和标签。
            </Typography>
          </div>
          <span className={listClass.elem("hero-badge")}>{selected}</span>
        </div>
        {templates && (
          <div className={listClass.elem("hero-stats")}>
            <span>当前分组 {templates.filter((recipe) => recipe.group === selected).length} 个模板</span>
            <span>选择后可继续在下一页细化字段与标签</span>
          </div>
        )}
        {!templates && <Spinner style={{ width: "100%", height: 200 }} />}
        <TemplatesInGroup
          templates={templates || []}
          group={selected}
          onSelectRecipe={onSelectRecipe}
          isEdition={isEdition}
        />
      </main>
      <footer className="flex items-center justify-center gap-1">
        <IconInfo className={listClass.elem("info-icon")} width="20" height="20" />
        <span>
          查看文档以{" "}
          <a href="https://labelstud.io/guide" target="_blank" rel="noreferrer">
            贡献模板
          </a>
          .
        </span>
      </footer>
    </div>
  );
};
