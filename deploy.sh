DOCKER_BUILDKIT=1 docker build -t my-label-studio:custom .
docker run -p 8080:8080 -v /data/ls:/label-studio/data my-label-studio:custom
