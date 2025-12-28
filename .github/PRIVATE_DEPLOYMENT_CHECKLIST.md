# 私有化部署检查清单

## ✅ 配置前准备

- [ ] 确定需要保留的功能（CI/CD、测试、构建、部署等）
- [ ] 准备私有 Docker Registry（Harbor/Nexus/GitLab Registry）
- [ ] 准备私有 PyPI 服务器（如需要）
- [ ] 确定通知渠道（Slack/企业微信/钉钉/邮件）
- [ ] 准备 Git 访问令牌

## 🔧 必须修改的配置

### 1. Docker 相关
- [ ] 修改 `workflows/docker-build.yml` 中的 `IMAGE_NAME`（第 32 行）
- [ ] 更新 Docker 登录配置（第 114-118 行）
- [ ] 移除或替换 LaunchDarkly 配置下载（第 120-138 行）
- [ ] 移除或替换 Slack 通知（第 256-275 行）

### 2. PyPI 相关（如需要）
- [ ] 修改 `workflows/build_pypi.yml` 中的 PyPI 上传地址（第 167-168 行）
- [ ] 更新 PyPI 包检查 URL（第 186 行）

### 3. CI/CD 流程
- [ ] 移除或修改企业版部署步骤（`workflows/cicd_pipeline.yml` 第 167-193 行）
- [ ] 移除或修改 Jira 集成（第 382-393 行）
- [ ] 评估是否需要 Release 自动创建（第 225-436 行）

### 4. 代码审查
- [ ] 更新 `CODEOWNERS` 文件中的团队/用户名称

## 🚫 可以禁用的功能

- [ ] 禁用 Algolia 文档索引（`workflows/algolia-crawler-*.yml`）
- [ ] 禁用 CodeQL（如使用其他安全扫描工具）
- [ ] 禁用 Dependabot（如使用其他依赖管理工具）

## 🔐 Secrets 配置

### 必需的 Secrets
- [ ] `REGISTRY_USERNAME` - Docker Registry 用户名
- [ ] `REGISTRY_PASSWORD` - Docker Registry 密码/Token
- [ ] `GIT_PAT` - Git 访问令牌

### 可选的 Secrets（根据需求）
- [ ] `PYPI_USERNAME` - PyPI 用户名（如需要）
- [ ] `PYPI_PASSWORD` - PyPI 密码（如需要）
- [ ] `SLACK_WEBHOOK_URL` - Slack Webhook（如需要）
- [ ] `JIRA_TOKEN` - Jira Token（如需要）

## 📝 Variables 配置

- [ ] `DOCKER_REGISTRY` - Docker Registry 地址
- [ ] `PYPI_REPOSITORY_URL` - PyPI 仓库地址（如需要）

## 🧪 测试验证

- [ ] 创建测试 PR，验证代码检查工作正常
- [ ] 验证 Docker 镜像构建和推送（如启用）
- [ ] 验证测试流程运行正常
- [ ] 验证所有必需的 jobs 都能成功完成
- [ ] 检查错误日志，确保没有外部服务依赖错误

## 📚 文档参考

- 详细指南：`PRIVATE_DEPLOYMENT_GUIDE.md`
- 配置示例：`PRIVATE_DEPLOYMENT_EXAMPLES.md`

## 🔍 快速检查命令

```bash
# 检查所有 workflow 文件
find .github/workflows -name "*.yml" -type f

# 检查外部服务引用
grep -r "dockerhub\|pypi.org\|launchdarkly\|algolia" .github/workflows/

# 检查 secrets 引用
grep -r "secrets\." .github/workflows/ | grep -v "GIT_PAT\|REGISTRY"

# 检查变量引用
grep -r "vars\." .github/workflows/
```

## ⚠️ 常见问题检查

- [ ] 确认所有外部 URL 都已替换为私有服务地址
- [ ] 确认所有硬编码的组织名称都已更新
- [ ] 确认 Runner 有权限访问私有服务
- [ ] 确认网络连接正常（私有 Registry、PyPI 等）
- [ ] 确认分支保护规则已配置

