#!/bin/sh

set -e

./scripts/ci/runci.sh
./scripts/ci/cideploy.sh
