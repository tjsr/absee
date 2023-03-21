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
DBIMAGE_NAME=$BITBUCKET_REPO_SLUG-dbmigrate:$BITBUCKET_COMMIT
REGISTRY_COMMIT=$REGISTRY_HOST/$BITBUCKET_REPO_SLUG/$IMAGE_NAME
DBREGISTRY_COMMIT=$REGISTRY_HOST/$BITBUCKET_REPO_SLUG/$DBIMAGE_NAME

echo Tagging image $IMAGE_NAME as $REGISTRY_COMMIT
docker tag $IMAGE_NAME $REGISTRY_COMMIT

echo Tagging db migration image $DBIMAGE_NAME as $DBREGISTRY_COMMIT
docker tag $DBIMAGE_NAME $DBREGISTRY_COMMIT

echo Pushing image $REGISTRY_COMMIT
docker push $REGISTRY_COMMIT

echo Pushing db migration image $DBREGISTRY_COMMIT
docker push $DBREGISTRY_COMMIT
