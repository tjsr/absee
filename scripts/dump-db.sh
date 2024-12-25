#!/bin/bash
#
if [ -z "$1" ]; then
  MISSING_PARAM=true
else
  ENV_FILE=$1
fi

if [ -z "$2" ]; then
  MISSING_PARAM=true
else
  OUTPUT_DIR=$2
fi

if [ ! -z "$MISSING_PARAM" ]; then
  echo "Usage: db-dump.sh <env-file> <output-dir>"
  exit 1
fi

# Load environment variables from .env file
set -a
source $ENV_FILE
set +a

#OUTPUT_DIR=~/absee/db
mkdir -p $OUTPUT_DIR
MYSQL_VERSION=5.7.44

DATABASE_DATE=${MYSQL_DATABASE}-$(date --utc +"%Y%m%d%H%M%ST0000")

OUTPUT_SCHEMA_FILE=$OUTPUT_DIR/${DATABASE_DATE}_schema.sql
OUTPUT_DATA_FILE=$OUTPUT_DIR/${DATABASE_DATE}_data.sql
CONTAINER_NAME=${MYSQL_DATABASE}_export
CONTAINER_IMAGE="mysql:$MYSQL_VERSION"

# Execute mysqldump command
docker pull $CONTAINER_IMAGE
# echo docker run --rm --name $CONTAINER_NAME -it $CONTAINER_IMAGE mysqldump --single-transaction -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"
docker run --rm --name $CONTAINER_NAME -it $CONTAINER_IMAGE mysqldump --single-transaction --no-data -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" >$OUTPUT_SCHEMA_FILE
docker run --rm --name $CONTAINER_NAME -it $CONTAINER_IMAGE mysqldump --single-transaction --no-create-info -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" >$OUTPUT_DATA_FILE

# Check if the command was successful
if [ $? -eq 0 ]; then
  echo "Database dump successful."
else
  echo "Database dump failed."
fi
