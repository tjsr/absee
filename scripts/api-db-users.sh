#!/bin/sh

envsubst </docker-entrypoint-initdb.d/privs.api.template >020-privs.api.sql
