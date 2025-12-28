# Label Studio 私有化部署配置指南

本文档说明如何将 Label Studio 的 `.github` 配置适配到私有化部署环境。

## 📋 目录结构分析

`.github` 文件夹包含以下主要组件：

### 1. **Workflows** (`workflows/`)
- CI/CD 流水线配置
- 自动化测试、构建、部署流程
- 代码质量检查

### 2. **配置文件**
- `dependabot.yml` - 依赖更新自动化
- `autolabeler.yml` - PR 自动标签
- `CODEOWNERS` - 代码审查责任人
- `pr-title-checker-config.json` - PR 标题格式检查

### 3. **其他**
- `ISSUE_TEMPLATE/` - Issue 模板
- `codeql/` - 代码安全扫描配置
- `actions/` - 自定义 GitHub Actions

## 🔧 私有化部署配置要点

### 1. **外部服务依赖**

#### 需要移除或替换的服务：

**a) Docker Hub**
- 文件：`workflows/docker-build.yml`
- 当前配置：推送到 `${{ vars.DOCKERHUB_ORG }}/label-studio`
- **私有化方案**：
  - 替换为私有 Docker Registry（如 Harbor、Nexus、GitLab Container Registry）
  - 修改 `DOCKERHUB_ORG` 变量为私有仓库地址
  - 更新 `DOCKERHUB_USERNAME` 和 `DOCKERHUB_TOKEN` secrets

**b) PyPI**
- 文件：`workflows/build_pypi.yml`
- 当前配置：上传到 PyPI 或 Test PyPI
- **私有化方案**：
  - 使用私有 PyPI 服务器（如 DevPI、Nexus PyPI）
  - 修改 `TWINE_REPOSITORY_URL` 为私有仓库地址
  - 更新 `PYPI_APIKEY` secret

**c) Algolia**
- 文件：`workflows/algolia-crawler-ls-docs.yml`
- 当前配置：索引文档到 Algolia
- **私有化方案**：
  - 如果不需要文档搜索，可以禁用此 workflow
  - 或使用私有搜索服务（如 Elasticsearch）

**d) LaunchDarkly**
- 文件：`workflows/docker-build.yml` (第 120-138 行)
- 当前配置：下载功能标志配置
- **私有化方案**：
  - 移除 LaunchDarkly 依赖，使用本地配置文件
  - 或使用私有功能标志服务

**e) Jira**
- 文件：`workflows/cicd_pipeline.yml` (第 382-393 行)
- 当前配置：自动设置 Jira fix version
- **私有化方案**：
  - 如果不需要 Jira 集成，可以移除相关步骤
  - 或替换为私有 Jira 实例配置

**f) Slack**
- 文件：`workflows/docker-build.yml` (第 256-275 行)
- 当前配置：构建失败通知到 Slack
- **私有化方案**：
  - 移除 Slack 通知
  - 或替换为私有 Slack 实例或企业微信/钉钉

**g) GitHub Enterprise**
- 文件：`workflows/cicd_pipeline.yml` (第 183-193 行)
- 当前配置：触发 `label-studio-enterprise` 仓库部署
- **私有化方案**：
  - 移除或修改为私有仓库地址
  - 更新 `GIT_PAT` secret

### 2. **CI/CD 流程调整**

#### 关键 Workflow 文件需要修改：

**a) `workflows/cicd_pipeline.yml`**
```yaml
# 需要修改的部分：
- 第 184-185 行：企业版仓库地址
- 第 179 行：GIT_PAT secret（需要私有仓库 token）
- 第 382-393 行：Jira 集成（可选移除）
- 第 395-410 行：Changelog 生成（可能需要调整）
```

**b) `workflows/docker-build.yml`**
```yaml
# 需要修改的部分：
- 第 32 行：DOCKERHUB_ORG 变量
- 第 117-118 行：Docker Hub 登录凭据
- 第 120-138 行：LaunchDarkly 配置下载
- 第 256-275 行：Slack 通知（可选移除）
```

**c) `workflows/build_pypi.yml`**
```yaml
# 需要修改的部分：
- 第 167-168 行：PyPI 上传配置
- 第 186 行：PyPI 包检查 URL
```

### 3. **代码审查配置**

**`CODEOWNERS` 文件**
- 当前配置：指向 `@HumanSignal/*` 团队
- **私有化方案**：
  - 替换为私有仓库的实际团队/用户
  - 例如：`@your-org/devops`, `@your-org/backend-team`

### 4. **自动化工具配置**

**a) Dependabot (`dependabot.yml`)**
- 功能：自动更新依赖
- **私有化方案**：
  - 如果使用 GitHub，Dependabot 可以直接使用
  - 如果使用 GitLab，需要配置 GitLab Dependency Scanning
  - 如果使用其他平台，可能需要手动维护或使用其他工具

**b) CodeQL (`codeql.yml`)**
- 功能：代码安全扫描
- **私有化方案**：
  - GitHub Enterprise 支持 CodeQL
  - 其他平台可以使用 SonarQube、Snyk 等替代方案

### 5. **Secrets 和 Variables 配置**

需要在私有仓库中配置以下 Secrets：

**必需的 Secrets：**
- `GIT_PAT` - Git 访问令牌
- `DOCKERHUB_TOKEN` - Docker 仓库访问令牌（如果使用私有仓库）
- `PYPI_APIKEY` - PyPI 访问令牌（如果使用私有 PyPI）

**可选的 Secrets（如果保留相应功能）：**
- `JIRA_USERNAME` / `JIRA_TOKEN` - Jira 集成
- `SLACK_LSE_BOT_TOKEN` - Slack 通知
- `LAUNCHDARKLY_COMMUNITY_SDK_KEY` - LaunchDarkly 功能标志

**Variables：**
- `DOCKERHUB_ORG` - Docker 组织/命名空间
- `DOCKERHUB_USERNAME` - Docker 用户名
- `JIRA_SERVER` - Jira 服务器地址
- `SLACK_GR_DEVOPS` - Slack 团队 ID

## 🚀 私有化部署步骤

### 步骤 1：评估需求
1. 确定需要保留哪些功能
2. 确定可用的私有服务（Docker Registry、PyPI 等）
3. 确定通知渠道（Slack/企业微信/钉钉等）

### 步骤 2：配置私有服务
1. 搭建或配置私有 Docker Registry
2. 搭建或配置私有 PyPI 服务器（如需要）
3. 配置代码仓库访问权限

### 步骤 3：修改 Workflows
1. 更新 Docker 镜像推送地址
2. 更新 PyPI 上传地址（如需要）
3. 移除或替换外部服务依赖
4. 更新仓库地址和团队引用

### 步骤 4：配置 Secrets 和 Variables
1. 在私有仓库设置中配置所有必需的 secrets
2. 配置所有必需的 variables

### 步骤 5：更新 CODEOWNERS
1. 替换为实际的团队/用户名称

### 步骤 6：测试
1. 创建测试 PR，验证 CI/CD 流程
2. 验证 Docker 镜像构建和推送
3. 验证所有检查是否正常工作

## 📝 最小化配置示例

如果只需要基本的 CI/CD 功能，可以：

1. **保留的 Workflows：**
   - `tests.yml` - 单元测试
   - `tests-yarn-unit.yml` - 前端单元测试
   - `bandit.yml`, `ruff.yml`, `blue.yml` - 代码检查
   - `biome.yml`, `stylelint.yml` - 前端代码检查

2. **可以禁用的 Workflows：**
   - `algolia-crawler-*.yml` - 文档索引
   - `docker-build.yml` - 如果不需要自动构建镜像
   - `build_pypi.yml` - 如果不需要发布到 PyPI
   - `codeql.yml` - 如果使用其他安全扫描工具

3. **简化 `cicd_pipeline.yml`：**
   - 移除 `deploy` job（第 167-193 行）
   - 移除 `draft-release` job（第 225-436 行）
   - 移除 `build-pypi` job（第 438-452 行）
   - 移除 Jira 相关步骤

## ⚠️ 注意事项

1. **分支保护规则**：确保在私有仓库中配置适当的分支保护规则
2. **Runner 配置**：确保有足够的 GitHub Actions runners（或自托管 runners）
3. **网络访问**：确保 runners 可以访问私有服务（Docker Registry、PyPI 等）
4. **权限管理**：合理配置 secrets 和 variables 的访问权限
5. **备份策略**：定期备份工作流配置和 secrets

## 🔗 相关资源

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Docker Registry 文档](https://docs.docker.com/registry/)
- [PyPI 私有仓库方案](https://pypi.org/project/devpi-server/)

