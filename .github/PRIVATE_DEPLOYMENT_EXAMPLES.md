# 私有化部署配置示例

本文档提供具体的配置修改示例。

## 1. Docker Build Workflow 修改示例

### 原始配置（`workflows/docker-build.yml`）

```yaml
env:
  IMAGE_NAME: "${{ vars.DOCKERHUB_ORG }}/label-studio"
```

### 私有化配置

```yaml
env:
  # 使用私有 Docker Registry
  IMAGE_NAME: "registry.your-company.com/label-studio"
  # 或者使用 Harbor
  # IMAGE_NAME: "harbor.your-company.com/project/label-studio"
```

### 修改登录步骤

```yaml
# 原始配置
- name: Login to DockerHub
  uses: docker/login-action@v3.5.0
  with:
    username: ${{ vars.DOCKERHUB_USERNAME }}
    password: ${{ secrets.DOCKERHUB_TOKEN }}

# 私有化配置
- name: Login to Private Registry
  uses: docker/login-action@v3.5.0
  with:
    registry: registry.your-company.com  # 私有仓库地址
    username: ${{ secrets.REGISTRY_USERNAME }}
    password: ${{ secrets.REGISTRY_PASSWORD }}
```

### 移除 LaunchDarkly 依赖

```yaml
# 注释掉或删除以下步骤（第 120-138 行）
# - name: Download LaunchDarkly Community config
#   env:
#     LAUNCHDARKLY_COMMUNITY_SDK_KEY: ${{ secrets.LAUNCHDARKLY_COMMUNITY_SDK_KEY }}
#     ...
```

**替代方案**：使用本地配置文件
```yaml
- name: Copy local feature flags
  run: |
    cp label_studio/feature_flags.local.json label_studio/feature_flags.json
```

## 2. PyPI Build Workflow 修改示例

### 修改上传步骤（`workflows/build_pypi.yml`）

```yaml
# 原始配置
- name: Upload to PYPI
  if: inputs.upload_to_pypi
  env:
    TWINE_USERNAME: __token__
    TWINE_PASSWORD: ${{ secrets.PYPI_APIKEY }}
    TWINE_REPOSITORY_URL: https://upload.pypi.org/legacy/

# 私有化配置 - 使用私有 PyPI
- name: Upload to Private PyPI
  if: inputs.upload_to_pypi
  env:
    TWINE_USERNAME: ${{ secrets.PYPI_USERNAME }}
    TWINE_PASSWORD: ${{ secrets.PYPI_PASSWORD }}
    TWINE_REPOSITORY_URL: https://pypi.your-company.com/simple/
```

### 修改包检查步骤

```yaml
# 原始配置（第 186 行）
const {data: pypiPackage} = await github.request('https://pypi.org/pypi/label-studio/json')

# 私有化配置
const {data: pypiPackage} = await github.request('https://pypi.your-company.com/pypi/label-studio/json')
```

## 3. CI/CD Pipeline 修改示例

### 移除企业版部署步骤

```yaml
# 删除或注释掉 deploy job（第 167-193 行）
# deploy:
#   name: "Deploy"
#   if: startsWith(github.ref_name, 'ls-release/')
#   ...
```

### 移除 Jira 集成

```yaml
# 删除或注释掉 Set Jira fix version 步骤（第 382-393 行）
# - name: Set Jira fix version
#   uses: ./.github/actions-hub/actions/jira-set-fix-version
#   ...
```

### 简化 Release 流程

如果不需要自动创建 release，可以移除 `draft-release` job（第 225-436 行）。

## 4. CODEOWNERS 修改示例

### 原始配置

```
.github/                                    @HumanSignal/devops
deploy/                                     @HumanSignal/devops
```

### 私有化配置

```
.github/                                    @your-org/devops-team
deploy/                                     @your-org/devops-team
web/libs/editor                             @your-org/frontend-team
label_studio/**/migrations/*.py             @your-org/backend-team
```

## 5. 禁用不需要的 Workflows

### 方法 1：重命名文件（推荐）

将不需要的 workflow 文件重命名，添加 `.disabled` 后缀：
```bash
mv .github/workflows/algolia-crawler-ls-docs.yml .github/workflows/algolia-crawler-ls-docs.yml.disabled
```

### 方法 2：在 workflow 中添加条件

```yaml
# 在 workflow 文件开头添加
on:
  workflow_dispatch:  # 只允许手动触发
  # 注释掉 push/pull_request 触发器
  # push:
  #   branches: ["develop"]
```

## 6. 简化版 cicd_pipeline.yml 示例

创建一个最小化的 CI/CD 配置：

```yaml
name: "Simplified CI/CD Pipeline"

on:
  pull_request:
    types:
      - opened
      - synchronize
      - reopened
      - ready_for_review
    branches:
      - develop
      - main

concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number }}
  cancel-in-progress: true

jobs:
  changed_files:
    name: "Changed files"
    runs-on: ubuntu-latest
    outputs:
      src: ${{ steps.changes.outputs.src }}
      frontend: ${{ steps.changes.outputs.frontend }}
    steps:
      - uses: dorny/paths-filter@v3
        id: changes
        with:
          filters: |
            src:
              - 'label_studio/**'
              - 'pyproject.toml'
            frontend:
              - 'web/**'

  # 代码检查
  ruff:
    name: "Linter"
    needs: [changed_files]
    if: needs.changed_files.outputs.src == 'true'
    uses: ./.github/workflows/ruff.yml
    with:
      head_sha: ${{ github.event.pull_request.head.sha }}

  # 测试
  pytest:
    name: "Tests"
    needs: [changed_files]
    if: needs.changed_files.outputs.src == 'true'
    uses: ./.github/workflows/tests.yml
    with:
      head_sha: ${{ github.event.pull_request.head.sha }}

  # 前端测试
  tests-yarn-unit:
    name: "Frontend Tests"
    needs: [changed_files]
    if: needs.changed_files.outputs.frontend == 'true'
    uses: ./.github/workflows/tests-yarn-unit.yml
    with:
      head_sha: ${{ github.event.pull_request.head.sha }}

  # 检查门禁
  check_gate:
    name: "Ready to merge"
    if: always()
    needs:
      - ruff
      - pytest
      - tests-yarn-unit
    runs-on: ubuntu-latest
    steps:
      - name: Check all jobs
        uses: re-actors/alls-green@release/v1
        with:
          jobs: ${{ toJSON(needs) }}
```

## 7. Secrets 配置清单

在私有仓库的 Settings > Secrets and variables > Actions 中配置：

### 必需的 Secrets

| Secret 名称 | 说明 | 示例值 |
|------------|------|--------|
| `REGISTRY_USERNAME` | Docker Registry 用户名 | `admin` |
| `REGISTRY_PASSWORD` | Docker Registry 密码/Token | `your-token` |
| `GIT_PAT` | Git 访问令牌 | `ghp_xxxxx` |

### 可选的 Secrets（根据需求）

| Secret 名称 | 说明 | 何时需要 |
|------------|------|---------|
| `PYPI_USERNAME` | PyPI 用户名 | 需要发布到 PyPI 时 |
| `PYPI_PASSWORD` | PyPI 密码/Token | 需要发布到 PyPI 时 |
| `SLACK_WEBHOOK_URL` | Slack Webhook URL | 需要通知时 |
| `JIRA_TOKEN` | Jira API Token | 需要 Jira 集成时 |

### Variables 配置

| Variable 名称 | 说明 | 示例值 |
|--------------|------|--------|
| `DOCKER_REGISTRY` | Docker Registry 地址 | `registry.your-company.com` |
| `PYPI_REPOSITORY_URL` | PyPI 仓库地址 | `https://pypi.your-company.com/simple/` |

## 8. 测试配置

创建测试 PR 验证配置：

1. **测试代码检查**
   ```bash
   # 创建测试分支
   git checkout -b test/ci-config
   # 做一个小改动
   echo "# test" >> README.md
   git commit -m "test: CI configuration"
   git push origin test/ci-config
   # 创建 PR
   ```

2. **验证 Workflow 运行**
   - 检查 Actions 标签页
   - 确认所有必需的 jobs 都运行
   - 检查是否有错误

3. **验证 Docker 构建**（如果启用）
   - 检查镜像是否推送到私有仓库
   - 验证镜像标签是否正确

## 9. 常见问题

### Q: 如何禁用某个 workflow？
A: 重命名文件添加 `.disabled` 后缀，或删除 `on:` 下的触发器。

### Q: 如何修改 Docker 镜像标签规则？
A: 修改 `workflows/docker-build.yml` 中的 `calculate_version` job。

### Q: 如何添加自定义通知？
A: 在 workflow 中添加通知步骤，例如使用企业微信 webhook：
```yaml
- name: Notify
  run: |
    curl -X POST "${{ secrets.WECHAT_WEBHOOK }}" \
      -H "Content-Type: application/json" \
      -d '{"msgtype": "text", "text": {"content": "Build completed"}}'
```

### Q: 如何配置自托管 Runner？
A: 在 workflow 中使用 `runs-on: self-hosted`，并在服务器上安装 GitHub Actions Runner。

