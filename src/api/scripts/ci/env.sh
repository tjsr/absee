#!/bin/sh

set -e

if test -f ".env"; then
  export $(grep -v '^#' .env | xargs)
fi

require_env() {
  if [ -z "${$0}"];
  then
    echo $1
    exit $2
  fi
}

#declare -pf require_env
