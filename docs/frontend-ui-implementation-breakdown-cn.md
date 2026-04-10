# Label Studio 前端 UI 改造实施任务拆解表

## 文档说明

本文档基于 [frontend-ui-redesign-plan-cn.md](/Users/nengli/projects/py_projects/label-studio/docs/frontend-ui-redesign-plan-cn.md) 拆解为可执行实施任务，目标是让前端改版可以按阶段排期、按模块落地、按仓库结构分工。

拆解原则：

- 优先做能统一全局体验的骨架能力
- 优先处理高频页面
- 先建立 `web/libs/ui` 通用能力，再改造 `web/apps/labelstudio` 页面
- 复杂业务模块先改外壳，再改内部交互

建议任务状态字段：

- `未开始`
- `进行中`
- `已完成`
- `阻塞`

建议优先级字段：

- `P0`：必须优先启动，直接影响整体改版基线
- `P1`：高价值改造，依赖 P0 能力
- `P2`：补充优化与深度统一

---

## 1. 总体实施阶段

### 阶段一：统一骨架与高频入口

目标：

- 建立统一页面骨架
- 首页工作台落地
- 项目列表管理中心落地

建议周期：

- 2 周

核心产出：

- `PageHeader`
- `StatCard`
- `FilterBar`
- `EmptyState`
- 首页工作台
- 项目列表表格视图

### 阶段二：核心流程重构

目标：

- 创建项目向导落地
- 设置页和组织页统一
- 表单和布局规范收敛

建议周期：

- 2 到 4 周

核心产出：

- `WizardLayout`
- `SettingsLayout`
- `FormSection`
- 创建项目 4 步向导
- 设置页统一结构

### 阶段三：深度业务工作台化

目标：

- 数据管理页壳层升级
- 状态反馈和 token 全站收敛
- 替换旧样式残留

建议周期：

- 4 周以上，按业务窗口穿插推进

核心产出：

- 数据管理任务处理台外层
- `ResultState`
- `ActionBar`
- 状态与文案系统统一

---

## 2. 实施任务总表

| 编号 | 任务名称 | 优先级 | 阶段 | 主要目录 | 前置依赖 | 预计工作量 | 备注 |
|---|---|---|---|---|---|---|---|
| T01 | 建立页面骨架组件规范 | P0 | 阶段一 | `web/libs/ui` | 无 | 2d | 改版基线 |
| T02 | 统一全局页面标题区 | P0 | 阶段一 | `web/libs/ui`, `web/apps/labelstudio` | T01 | 1d | 优先用于首页和项目页 |
| T03 | 建立统计卡组件 `StatCard` | P0 | 阶段一 | `web/libs/ui` | T01 | 1d | 首页依赖 |
| T04 | 建立筛选栏组件 `FilterBar` | P0 | 阶段一 | `web/libs/ui` | T01 | 2d | 项目列表依赖 |
| T05 | 建立空状态组件 `EmptyState` | P0 | 阶段一 | `web/libs/ui` | T01 | 1d | 首页、列表、设置页依赖 |
| T06 | 首页改造成工作台 | P0 | 阶段一 | `web/apps/labelstudio/src/pages/Home` | T02, T03, T05 | 3d | 中国大陆用户导向 |
| T07 | 项目列表页改为表格优先 | P0 | 阶段一 | `web/apps/labelstudio/src/pages/Projects` | T02, T04, T05 | 4d | 高优先级页面 |
| T08 | 建立列表壳组件 `DataTableShell` | P1 | 阶段二 | `web/libs/ui` | T04 | 2d | 项目页、设置列表复用 |
| T09 | 建立向导布局 `WizardLayout` | P1 | 阶段二 | `web/libs/ui` | T01 | 2d | 创建项目依赖 |
| T10 | 建立表单分组组件 `FormSection` | P1 | 阶段二 | `web/libs/ui` | T01 | 1d | 设置页和向导页依赖 |
| T11 | 创建项目流程改为 4 步向导 | P1 | 阶段二 | `web/apps/labelstudio/src/pages/CreateProject` | T09, T10 | 5d | 核心流程改造 |
| T12 | 建立设置页布局 `SettingsLayout` | P1 | 阶段二 | `web/libs/ui` | T01 | 2d | 设置页和组织页依赖 |
| T13 | 统一设置页结构 | P1 | 阶段二 | `web/apps/labelstudio/src/pages/Settings` | T02, T10, T12 | 4d | 存储、模型、标注设置 |
| T14 | 统一组织页结构 | P1 | 阶段二 | `web/apps/labelstudio/src/pages/Organization` | T02, T12 | 3d | 成员管理、邀请流程 |
| T15 | 建立操作条组件 `ActionBar` | P1 | 阶段三 | `web/libs/ui` | T01 | 1d | 页面主操作和批量操作共用 |
| T16 | 建立结果反馈组件 `ResultState` | P1 | 阶段三 | `web/libs/ui` | T05 | 1d | 错误、成功、无数据统一 |
| T17 | 数据管理页外层改造成任务处理台 | P1 | 阶段三 | `web/apps/labelstudio/src/pages/DataManager` | T02, T04, T15 | 5d | 先改壳层，不先动内核 |
| T18 | 统一状态标签与中文文案规范 | P2 | 阶段三 | `web/libs/ui`, `web/apps/labelstudio` | T16 | 2d | 需要全局收敛 |
| T19 | 统一主题 token 与中文字体栈 | P2 | 阶段三 | `web/apps/labelstudio/src/themes/default`, `web/libs/ui/src/tokens` | T01 | 2d | 全局视觉收敛 |
| T20 | 清理旧页面 BEM 样式残留 | P2 | 阶段三 | `web/apps/labelstudio` | T06, T07, T11, T13, T14, T17 | 5d+ | 随页面迁移逐步做 |

---

## 3. 按模块拆解的详细任务

## 3.1 基础骨架层任务

### T01 建立页面骨架组件规范

目标：

- 先定义未来页面统一长什么样，再开始改页面

涉及目录：

- `web/libs/ui/src/components/layout`
- `web/libs/ui/src/components/navigation`
- `web/libs/ui/src/components/feedback`

子任务：

- 新建布局组件目录
- 定义统一 props 风格
- 定义标题区、内容区、操作区、分页区的命名约定
- 为新组件补最小 story

验收标准：

- 新组件目录结构稳定
- 可以支撑首页、项目页、设置页三种页面骨架
- 不依赖 Label Studio 具体业务接口

---

### T02 统一全局页面标题区

目标：

- 所有页面页头结构统一

涉及目录：

- `web/libs/ui/src/components/layout/PageHeader`
- `web/apps/labelstudio/src/pages/Home`
- `web/apps/labelstudio/src/pages/Projects`
- `web/apps/labelstudio/src/pages/Settings`
- `web/apps/labelstudio/src/pages/Organization`

子任务：

- 实现 `PageHeader`
- 支持 title、description、breadcrumb、extra、tabs
- 替换首页旧标题区
- 替换项目页旧标题区

验收标准：

- 首页、项目页、设置页的标题区结构一致
- 主操作统一出现在右侧

---

### T03 建立统计卡组件 `StatCard`

目标：

- 用于首页工作台概览区

涉及目录：

- `web/libs/ui/src/components/data-display/StatCard`

子任务：

- 支持标题、数值、说明、趋势标记
- 预留紧凑模式样式
- 补充 story

验收标准：

- 可被首页概览区域直接复用
- 中英文数字混排清晰

---

### T04 建立筛选栏组件 `FilterBar`

目标：

- 统一项目页、数据页、设置列表页顶部筛选区

涉及目录：

- `web/libs/ui/src/components/data-entry/FilterBar`

子任务：

- 支持搜索框
- 支持 Select 和多筛选项
- 支持视图切换按钮
- 支持右侧主操作按钮槽位

验收标准：

- 项目页可直接落地
- 后续设置页列表也可复用

---

### T05 建立空状态组件 `EmptyState`

目标：

- 统一空页面、空列表、首次引导状态

涉及目录：

- `web/libs/ui/src/components/feedback/EmptyState`

子任务：

- 支持图标、标题、说明、主次按钮
- 支持插画可选，但默认不依赖插画
- 提供适合中国大陆后台产品的紧凑布局

验收标准：

- 首页空项目状态、项目列表空状态、设置页空状态可统一使用

---

## 3.2 首页工作台任务

### T06 首页改造成工作台

目标：

- 将首页从欢迎页升级为默认工作入口

涉及目录：

- `web/apps/labelstudio/src/pages/Home/HomePage.tsx`
- `web/apps/labelstudio/src/pages/Home/atoms.ts`

子任务：

- 将欢迎区改成 `PageHeader`
- 新增概览卡区域
- 新增快捷操作区
- 重构最近项目区
- 恢复并重构右侧系统通知与帮助区
- 调整空状态逻辑

建议拆分子组件：

- `WorkspaceOverviewPanel`
- `QuickActionsPanel`
- `RecentProjectsPanel`
- `SystemNoticePanel`

验收标准：

- 首页可直接作为默认起点页
- 用户进入后 5 秒内能看到项目、待办和快捷操作
- 页面不再出现右侧空置的问题

---

## 3.3 项目管理页任务

### T07 项目列表页改为表格优先

目标：

- 将当前卡片页升级为项目管理中心

涉及目录：

- `web/apps/labelstudio/src/pages/Projects/Projects.jsx`
- `web/apps/labelstudio/src/pages/Projects/ProjectsList.jsx`
- `web/apps/labelstudio/src/pages/Projects/Projects.scss`

子任务：

- 顶部切换到 `PageHeader`
- 增加 `FilterBar`
- 新增表格视图
- 保留卡片视图作为备选
- 增加批量选择与批量操作
- 增加排序和筛选
- 调整分页区样式

建议拆分子组件：

- `ProjectFilters`
- `ProjectTable`
- `ProjectTableRow`
- `ProjectCardGrid`
- `ProjectBulkActions`

验收标准：

- 默认进入表格视图
- 搜索、筛选、排序完整可用
- 批量操作入口可见

---

### T08 建立列表壳组件 `DataTableShell`

目标：

- 为表格类页面提供统一骨架

涉及目录：

- `web/libs/ui/src/components/data-display/DataTableShell`

子任务：

- 统一表头、工具栏、表体、分页区布局
- 支持批量操作条插槽
- 支持空状态嵌入

验收标准：

- 项目页可迁移使用
- 后续成员列表、存储列表、模型列表也可复用

---

## 3.4 创建项目流程任务

### T09 建立向导布局 `WizardLayout`

目标：

- 为多步骤流程页提供统一容器

涉及目录：

- `web/libs/ui/src/components/layout/WizardLayout`

子任务：

- 支持步骤条
- 支持左右分栏或单栏模式
- 支持底部操作条
- 支持步骤状态展示

验收标准：

- 可直接支撑创建项目四步流程

---

### T10 建立表单分组组件 `FormSection`

目标：

- 统一复杂表单的标题、说明、内容结构

涉及目录：

- `web/libs/ui/src/components/forms/FormSection`

子任务：

- 支持分组标题
- 支持分组说明
- 支持字段提示和错误槽位

验收标准：

- 创建项目和设置页都可复用

---

### T11 创建项目流程改为 4 步向导

目标：

- 提升创建项目流程的明确性和成功率

涉及目录：

- `web/apps/labelstudio/src/pages/CreateProject/CreateProject.jsx`
- `web/apps/labelstudio/src/pages/CreateProject/Import/*`
- `web/apps/labelstudio/src/pages/CreateProject/Config/*`
- `web/apps/labelstudio/src/pages/CreateProject/utils/*`

子任务：

- 重构整体流程为 4 步
- 拆分步骤级组件
- 重写顶部切换逻辑，取消旧 tab 心智
- 新增确认创建步骤
- 导入结果补充成功数和失败数展示
- 模板配置区增加推荐模板和预览强化

建议拆分子组件：

- `ProjectBasicInfoStep`
- `ProjectImportStep`
- `ProjectTemplateStep`
- `ProjectReviewStep`

验收标准：

- 创建流程步骤清晰
- 用户知道当前在第几步、下一步是什么
- 导入与模板配置反馈明确

---

## 3.5 设置页与组织页任务

### T12 建立设置页布局 `SettingsLayout`

目标：

- 统一二级导航 + 内容区布局

涉及目录：

- `web/libs/ui/src/components/layout/SettingsLayout`

子任务：

- 支持左侧导航
- 支持顶部摘要区
- 支持内容滚动区
- 支持右侧操作区可选

验收标准：

- 设置页和组织页均能使用

---

### T13 统一设置页结构

目标：

- 统一存储、标注、模型、危险区的视觉与交互结构

涉及目录：

- `web/apps/labelstudio/src/pages/Settings/*`

子任务：

- 引入 `PageHeader`
- 接入 `SettingsLayout`
- 列表页切换到统一表格/卡片壳
- 表单页切换到 `FormSection`
- 危险区单独分段

建议优先处理顺序：

1. `StorageSettings`
2. `MachineLearningSettings`
3. `AnnotationSettings`
4. `DangerZone`

验收标准：

- 设置页内部结构统一
- 危险操作区明显独立
- 说明文案和字段提示风格一致

---

### T14 统一组织页结构

目标：

- 统一成员、邀请、组织模型页面的后台布局

涉及目录：

- `web/apps/labelstudio/src/pages/Organization/*`

子任务：

- 接入 `PageHeader`
- 接入 `SettingsLayout` 或其组织场景变体
- 重构成员列表顶部操作区
- 统一邀请入口和状态反馈

验收标准：

- 组织页与设置页具有一致的布局感知

---

## 3.6 数据管理页任务

### T15 建立操作条组件 `ActionBar`

目标：

- 统一页面主操作和批量操作条

涉及目录：

- `web/libs/ui/src/components/navigation/ActionBar`

子任务：

- 支持主按钮
- 支持次按钮
- 支持批量模式
- 支持固定定位样式

验收标准：

- 数据管理页和项目列表页都可复用

---

### T16 建立结果反馈组件 `ResultState`

目标：

- 统一成功、错误、无权限、无数据等结果页

涉及目录：

- `web/libs/ui/src/components/feedback/ResultState`

子任务：

- 支持状态图标
- 支持标题和说明
- 支持主次按钮

验收标准：

- 可替换部分旧错误页和失败页

---

### T17 数据管理页外层改造成任务处理台

目标：

- 先统一外壳与操作节奏，不直接重构 DataManager 内核

涉及目录：

- `web/apps/labelstudio/src/pages/DataManager/DataManager.jsx`
- `web/apps/labelstudio/src/pages/DataManager/DataManager.scss`

子任务：

- 增加统一 `PageHeader`
- 增加顶部任务信息区
- 增加固定主操作区
- 增加筛选条件展示区
- 优化错误态和崩溃态

建议拆分子组件：

- `TaskWorkbenchHeader`
- `TaskFilterSummary`
- `TaskMainActions`

验收标准：

- 用户进入后能快速理解当前项目、筛选条件、主操作
- 保存、提交、跳过等高频能力位置稳定

---

## 3.7 视觉系统与规范任务

### T18 统一状态标签与中文文案规范

目标：

- 解决全站状态命名和提示文案不一致问题

涉及目录：

- `web/libs/ui`
- `web/apps/labelstudio`

子任务：

- 整理状态标签词表
- 整理按钮文案词表
- 整理错误反馈模板
- 统一日期时间显示格式

验收标准：

- 相同业务状态不再出现多种中文表达
- 高优先级页面文案统一完成

---

### T19 统一主题 token 与中文字体栈

目标：

- 为视觉统一提供底层支撑

涉及目录：

- `web/apps/labelstudio/src/themes/default/*`
- `web/libs/ui/src/tokens/*`

子任务：

- 增补中文优先字体栈
- 新增页面容器、区块、工具栏、表格相关 token
- 收敛主色、状态色、边框色使用规则

验收标准：

- 新旧页面基础排版观感统一
- 表格、表单、页头间距一致性提升

---

### T20 清理旧页面 BEM 样式残留

目标：

- 在页面迁移后逐步清理旧样式包袱

涉及目录：

- `web/apps/labelstudio/src/pages/**`
- `web/apps/labelstudio/src/components/**`

子任务：

- 删除已被新组件替代的 SCSS
- 收敛过度页面级样式
- 清理重复的 spacing、标题、按钮样式

验收标准：

- 页面样式来源更清晰
- 新旧混用样式显著减少

---

## 4. 推荐排期顺序

### 第一批必须先做

1. T01 建立页面骨架组件规范
2. T02 统一全局页面标题区
3. T03 建立统计卡组件 `StatCard`
4. T04 建立筛选栏组件 `FilterBar`
5. T05 建立空状态组件 `EmptyState`
6. T06 首页改造成工作台
7. T07 项目列表页改为表格优先

### 第二批建议紧接着做

1. T08 建立列表壳组件 `DataTableShell`
2. T09 建立向导布局 `WizardLayout`
3. T10 建立表单分组组件 `FormSection`
4. T11 创建项目流程改为 4 步向导
5. T12 建立设置页布局 `SettingsLayout`
6. T13 统一设置页结构
7. T14 统一组织页结构

### 第三批逐步推进

1. T15 建立操作条组件 `ActionBar`
2. T16 建立结果反馈组件 `ResultState`
3. T17 数据管理页外层改造成任务处理台
4. T18 统一状态标签与中文文案规范
5. T19 统一主题 token 与中文字体栈
6. T20 清理旧页面 BEM 样式残留

---

## 5. 建议的人员分工方式

### 方案 A：双人并行

- 负责人 1：`web/libs/ui` 基础组件与 token
- 负责人 2：`web/apps/labelstudio` 页面接入与业务整合

适合场景：

- 改版初期，需要快速建立通用能力并同步改页面

### 方案 B：三人并行

- 负责人 1：设计系统与 UI 组件
- 负责人 2：首页、项目页、创建项目页
- 负责人 3：设置页、组织页、数据管理页

适合场景：

- 有明确页面 owner，希望缩短交付周期

---

## 6. 每个任务的验收建议

所有任务建议统一按以下维度验收：

- 视觉一致性
- 中文文案是否符合中国大陆用户习惯
- 主操作是否显性
- 信息层级是否清晰
- 是否复用了 `web/libs/ui` 的通用能力
- 是否减少了页面级重复样式

对于页面类任务，额外建议检查：

- 首屏 5 秒是否能理解页面用途
- 是否支持高频操作路径
- 是否减少不必要跳转
- 列表、表单、状态、空态是否统一

---

## 7. 推荐后续补充文档

在本任务拆解表之后，建议继续补以下文档：

- 前端 UI 改版里程碑排期表
- 组件迁移映射表
- 中文文案词表
- 状态标签词表
- 页面验收 checklist
