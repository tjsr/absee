#!/bin/sh

envsubst </docker-entrypoint-initdb.d/privs.api.template >/var/run/020-privs.api.sql
