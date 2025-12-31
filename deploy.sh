# DOCKER_BUILDKIT=1 docker build -t my-label-studio:custom .
# docker run -p 8080:8080 -v /data/ls:/label-studio/data my-label-studio:custom


docker pull crpi-hofueqocrqo2ysht.cn-heyuan.personal.cr.aliyuncs.com/liqiu19951112/label-studio:latest
docker rm -f ls-app
docker run -d -p 8080:8080 --name ls-app -v /data/ls:/label-studio/data registry.cn-hangzhou.aliyuncs.com/my-ls-project/label-studio:latest


# 监听程序
# docker run -d --name watchtower \
#   -v /var/run/docker.sock:/var/run/docker.sock \
#   containrrr/watchtower ls-app --interval 3600