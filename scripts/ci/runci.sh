#!/bin/sh

set -e

docker build -t tmp . -f- <<EOF
FROM tjsrowe/bb-dind-aws:latest
COPY . build
WORKDIR build
EOF

CONTAINER_ID=$(docker run --privileged --rm --env-file=.env -d -t tmp)
echo Pausing 10 seconds to allow container to start
sleep 10

docker exec -e REGISTRY_HOST=$REGISTRY_HOST -e BITBUCKET_REPO_SLUG=$BITBUCKET_REPO_SLUG -e BITBUCKET_COMMIT=$BITBUCKET_COMMIT -t $CONTAINER_ID /bin/sh scripts/containers/build-containers.sh
docker exec -e REGISTRY_HOST=$REGISTRY_HOST -e BITBUCKET_REPO_SLUG=$BITBUCKET_REPO_SLUG -e BITBUCKET_COMMIT=$BITBUCKET_COMMIT -t $CONTAINER_ID /bin/sh scripts/containers/push-containers.sh
docker stop $CONTAINER_ID