#!/bin/sh

set -e

. $(dirname "$0")/../ci/env.sh

if [ -z "$REGISTRY_HOST" ]; then
  echo 'REGISTRY_HOST must specify the location of a docker registry to store temp images.'
  exit 1
fi

if [ -z "$BITBUCKET_REPO_SLUG" ]; then
  echo 'BITBUCKET_REPO_SLUG must be set - usually comes from CI process'
  exit 3
fi

IMAGE_NAME=$BITBUCKET_REPO_SLUG:$BITBUCKET_COMMIT
REGISTRY_COMMIT=$REGISTRY_HOST/$BITBUCKET_REPO_SLUG/$IMAGE_NAME

docker tag $IMAGE_NAME $REGISTRY_COMMIT
docker push $REGISTRY_COMMIT
