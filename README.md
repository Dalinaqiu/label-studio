<img src="https://user-images.githubusercontent.com/12534576/192582340-4c9e4401-1fe6-4dbb-95bb-fdbba5493f61.png"/>

![GitHub](https://img.shields.io/github/license/heartexlabs/label-studio?logo=heartex) ![label-studio:build](https://github.com/HumanSignal/label-studio/workflows/label-studio:build/badge.svg) ![GitHub release](https://img.shields.io/github/v/release/heartexlabs/label-studio?include_prereleases)

[Website](https://labelstud.io/) • [Docs](https://labelstud.io/guide/) • [Join Slack Community <img src="https://app.heartex.ai/docs/images/slack-mini.png" width="18px"/>](https://slack.labelstud.io/?source=github-1)


## Label Studio 是什么？

<!-- <a href="https://labelstud.io/blog/release-130.html"><img src="https://github.com/HumanSignal/label-studio/raw/master/docs/themes/htx/source/images/release-130/LS-Hits-v1.3.png" align="right" /></a> -->

Label Studio 是一个开源数据标注工具。它可以通过简洁直观的 UI 对 audio、text、image、video 和 time series 等数据类型进行标注，并导出为多种 model 格式。你可以用它准备原始数据，或改进现有训练数据，从而得到更准确的 ML model。

- [Try out Label Studio](#体验-label-studio)
- [What you get from Label Studio](#label-studio-能提供什么)
- [Included templates for labeling data in Label Studio](#label-studio-内置的数据标注模板)
- [Set up machine learning models with Label Studio](#使用-label-studio-配置-machine-learning-model)
- [Integrate Label Studio with your existing tools](#将-label-studio-集成到你现有的工具中)

![Gif of Label Studio annotating different types of data](/images/annotation_examples.gif)

如果你有自定义数据集，也可以按自己的需求定制 Label Studio。想了解更多，可以阅读这篇[入门 blog post](https://towardsdatascience.com/introducing-label-studio-a-swiss-army-knife-of-data-labeling-140c1be92881)。

## 体验 Label Studio

你可以在本地安装 Label Studio，或将其部署到 cloud 实例中。[也可以注册试用我们的 Starter Cloud edition！](https://humansignal.com/platform/starter-cloud/) 你可以在[这里](https://labelstud.io/guide/label_studio_compare)了解各个 edition 的能力差异。

- [Install locally with Docker](#使用-docker-本地安装)
- [Run with Docker Compose (Label Studio + Nginx + PostgreSQL)](#使用-docker-compose-运行)
- [Install locally with pip](#使用-pip-本地安装)
- [Install locally with poetry](#使用-poetry-本地安装)
- [Install locally with Anaconda](#使用-anaconda-本地安装)
- [Install for local development](#用于本地开发的安装方式)
- [Deploy in a cloud instance](#部署到-cloud-实例)

### 使用 Docker 本地安装
官方 Label Studio docker image 在[这里](https://hub.docker.com/r/heartexlabs/label-studio)，可以通过 `docker pull` 下载。  
在 Docker container 中运行 Label Studio 后，可通过 `http://localhost:8080` 访问。


```bash
docker pull heartexlabs/label-studio:latest
docker run -it -p 8080:8080 -v $(pwd)/mydata:/label-studio/data heartexlabs/label-studio:latest
```
所有生成的资源，包括 SQLite3 数据库存储 `label_studio.sqlite3` 和上传文件，都可以在 `./mydata` 目录中找到。

#### 覆盖默认 Docker 安装配置
你可以在默认启动命令后追加参数来覆盖默认行为：
```bash
docker run -it -p 8080:8080 -v $(pwd)/mydata:/label-studio/data heartexlabs/label-studio:latest label-studio --log-level DEBUG
```

#### 使用 Docker 构建本地 image
如果你想构建本地 image，执行：
```bash
docker build -t heartexlabs/label-studio:latest .
```

### 使用 Docker Compose 运行
Docker Compose 脚本会提供一个可用于生产的 stack，包含以下组件：

- Label Studio
- [Nginx](https://www.nginx.com/) - 用作 proxy web server，用于加载各种静态数据，包括上传的 audio、image 等。
- [PostgreSQL](https://www.postgresql.org/) - 一个适用于生产环境的数据库，用来替代性能较弱的 SQLite3。

通过以下命令启动后，即可从 `http://localhost` 开始使用应用：
```bash
docker-compose up
```

### 使用 Docker Compose + MinIO 运行
你也可以额外搭配一个 MinIO server 来提供本地 S3 storage。  
如果你想在本机测试 S3 storage 的相关行为，这会特别有用。要以这种方式启动 Label Studio，需要执行以下命令：
````bash
# Add sudo on Linux if you are not a member of the docker group
docker compose -f docker-compose.yml -f docker-compose.minio.yml up -d
````
如果你没有静态 IP 地址，则必须在 hosts 文件中添加一条记录，这样 Label Studio 和浏览器才能同时访问 MinIO server。更详细的说明请参考[我们的数据存储指南](docs/source/guide/storedata.md)。


### 使用 pip 本地安装

```bash
# Requires Python >=3.10
pip install label-studio

# Start the server at http://localhost:8080
label-studio
```

### 使用 poetry 本地安装

```bash
### install poetry
pip install poetry

### set poetry environment
poetry new my-label-studio
cd my-label-studio
poetry add label-studio

### activate poetry environment
poetry shell

### Start the server at http://localhost:8080
label-studio
```

### 使用 Anaconda 本地安装

```bash
conda create --name label-studio
conda activate label-studio
conda install psycopg2
pip install label-studio
```

### 用于本地开发的安装方式

你可以直接在本地运行最新的 Label Studio 版本，而不需要从 pypi 安装 package。

```bash
# Install all package dependencies
pip install poetry
poetry install
# Run database migrations
python label_studio/manage.py migrate
python label_studio/manage.py collectstatic
# Start the server in development mode at http://localhost:8080
python label_studio/manage.py runserver
```

### 部署到 cloud 实例

你可以一键将 Label Studio 部署到 Heroku、Microsoft Azure 或 Google Cloud Platform：

<a href="https://www.heroku.com/deploy?template=https://github.com/HumanSignal/label-studio/tree/heroku-persistent-pg"><img src="https://www.herokucdn.com/deploy/button.svg" alt="Deploy" height="30px"></a>
[<img src="https://aka.ms/deploytoazurebutton" height="30px">](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fhumansignal%2Flabel-studio%2Fdevelop%2Fazuredeploy.json)
[<img src="https://deploy.cloud.run/button.svg" height="30px">](https://deploy.cloud.run)


#### 应用 frontend 变更

关于如何更新 frontend，请参见 [label-studio/web/README.md](https://github.com/HumanSignal/label-studio/blob/develop/web/README.md#installation-instructions)。


#### 在 Windows 上安装依赖
要在 Windows 上运行 Label Studio，请先从 [Gohlke builds](https://www.lfd.uci.edu/~gohlke/pythonlibs) 下载并安装以下 wheel package，以确保你使用的是正确版本的 Python：
- [lxml](https://www.lfd.uci.edu/~gohlke/pythonlibs/#lxml)

```bash
# Upgrade pip
pip install -U pip

# If you're running Win64 with Python 3.8, install the packages downloaded from Gohlke:
pip install lxml‑4.5.0‑cp38‑cp38‑win_amd64.whl

# Install label studio
pip install label-studio
```

### 运行 test suite
如果你想把 tests 依赖安装到本地环境中，可执行：

```bash
poetry install --with test
```

或者，也可以在已安装 test 依赖的 Docker container 中运行 unit tests：


```bash
make build-testing-image
make docker-testing-shell
```

无论哪种方式，运行 unit tests 时都可以使用：

```bash
cd label_studio

# sqlite3
DJANGO_DB=sqlite DJANGO_SETTINGS_MODULE=core.settings.label_studio pytest -vv

# postgres (assumes default postgres user,db,pass. Will not work in Docker
# testing container without additional configuration)
DJANGO_DB=default DJANGO_SETTINGS_MODULE=core.settings.label_studio pytest -vv
```
 
## Label Studio 能提供什么

https://github.com/user-attachments/assets/525ad5ff-6904-4398-b507-7e8954268d69

- **Multi-user labeling** 支持 sign up 和 login；你创建的 annotation 会与当前账号绑定。
- **Multiple projects** 在同一个实例中管理你的所有数据集。
- **Streamlined design** 帮助你把注意力放在任务本身，而不是软件怎么使用。
- **Configurable label formats** 允许你根据具体标注需求自定义可视化界面。
- **Support for multiple data types** 包括 image、audio、text、HTML、time-series 和 video。
- **Import from files or from cloud storage** 支持从 Amazon AWS S3、Google Cloud Storage，或 JSON、CSV、TSV、RAR、ZIP archive 中导入。
- **Integration with machine learning models** 方便你可视化并比较不同 model 的 prediction，并执行 pre-labeling。
- **Embed it in your data pipeline** 借助 REST API，可以很容易把它集成进你的 pipeline

## Label Studio 内置的数据标注模板

Label Studio 内置了多种 template 来帮助你标注数据，你也可以使用专门设计的配置语言自行创建。最常见的 template 和使用场景包括以下几类：

<img src="/images/template-types.png" />

## 使用 Label Studio 配置 Machine Learning Model

通过 Label Studio Machine Learning SDK 连接你喜欢的 machine learning model。步骤如下：

1. 启动你自己的 machine learning backend server。更多细节请参见[更详细的说明](https://github.com/HumanSignal/label-studio-ml-backend)。
2. 在 project settings 中的 model 页面，把 Label Studio 连接到该 server。

这样你就可以：

- 使用 model prediction 进行 **Pre-label**。
- 进行 **online learning**，在产生新 annotation 的同时持续重新训练 model。
- 进行 **active learning**，只标注数据中最复杂的样本。

## 将 Label Studio 集成到你现有的工具中

你可以把 Label Studio 作为 machine learning workflow 中的独立组件使用，也可以将 frontend 或 backend 集成到你现有的工具中。

## Ecosystem

| Project | Description |
|-|-|
| label-studio | Server，以 pip package 形式分发 |
| [Frontend library](web/libs/editor/) | Label Studio 的 frontend library。它使用 React 构建 UI，并使用 mobx-state-tree 进行 state management。 |
| [Data Manager library](web/libs/datamanager/) | Data Manager 的 library，也就是我们的数据探索工具。 |
| [label-studio-converter](https://github.com/HumanSignal/label-studio-sdk/tree/master/src/label_studio_sdk/converter) | 将标签编码为你喜欢的 machine learning library 所使用的格式 |
| [label-studio-transformers](https://github.com/HumanSignal/label-studio-transformers) | 已连接并配置好、可与 Label Studio 配合使用的 Transformers library |

## Citation

请在你的文章 **References** 部分中加入对 Label Studio 的引用：

```tex
@misc{Label Studio,
  title={{Label Studio}: Data labeling software},
  url={https://github.com/HumanSignal/label-studio},
  note={Open source software available from https://github.com/HumanSignal/label-studio},
  author={
    Maxim Tkachenko and
    Mikhail Malyuk and
    Andrey Holmanyuk and
    Nikolai Liubimov},
  year={2020-2025},
}
```

## License

本软件基于 [Apache 2.0 LICENSE](/LICENSE) 授权 © [Heartex](https://www.heartex.com/)。2020-2025

<img src="https://user-images.githubusercontent.com/12534576/192582529-cf628f58-abc5-479b-a0d4-8a3542a4b35e.png" title="Hey everyone!" width="180" />
