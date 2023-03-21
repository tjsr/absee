#!/bin/sh

set -e

. $(dirname "$0")/../ci/env.sh

#require_env 'REGISTRY_HOST', 'REGISTRY_HOST must specify the location of a docker registry to store temp images.', 1
if [ -z "$REGISTRY_HOST" ]; then
  echo 'REGISTRY_HOST must specify the location of a docker registry to store temp images.'
  exit 1
fi

if [ -z "$BITBUCKET_COMMIT" ]; then
  echo 'BITBUCKT_COMMIT must be set - usually comes from CI process'
  exit 2
fi

if [ -z "$BITBUCKET_REPO_SLUG" ]; then
  echo 'BITBUCKET_REPO_SLUG must be set - usually comes from CI process'
  exit 3
fi

IMAGE_NAME=$BITBUCKET_REPO_SLUG:$BITBUCKET_COMMIT
DB_IMAGE_NAME=$BITBUCKET_REPO_SLUG-dbmigrate:$BITBUCKET_COMMIT

echo Output image will be $IMAGE_NAME

DOCKER_BUILDKIT=1 BUILDKIT_PROGRESS=plain docker build -f Dockerfile.dbmigrate -t $DB_IMAGE_NAME .
docker tag $DB_IMAGE_NAME absee-dbmigrate
DOCKER_BUILDKIT=1 BUILDKIT_PROGRESS=plain docker build -f Dockerfile -t $IMAGE_NAME .
