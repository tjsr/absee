#!/usr/bin/env bash
set -euo pipefail

# This account and database are disposable test fixtures, never real credentials.
[[ "${GITHUB_ACTIONS:-}" == "true" ]]
[[ "${MYSQL_DATABASE:-}" == "testdb" ]]
[[ "${MYSQL_USER:-}" == "testuser" ]]
[[ "${MYSQL_HOST:-}" == "127.0.0.1" ]]
: "${CI_MYSQL_CONTAINER:?GitHub Actions MySQL service container is required}"

mysql_as_root() {
  docker exec --env MYSQL_PWD=ci-only-root-password --interactive     "$CI_MYSQL_CONTAINER" mysql --user=root --database=testdb "$@"
}

# GitHub waits for service health before steps run; authenticate before applying DDL.
mysql_as_root --execute="SELECT 1"
mysql_as_root --execute="SET GLOBAL sql_mode = 'NO_ENGINE_SUBSTITUTION,ALLOW_INVALID_DATES'"
for migration in prisma/migrations/*/migration.sql; do
  mysql_as_root < "$migration"
done

# Match scripts/privs.api.template: only the session table permits DELETE.
mysql_as_root <<'SQL'
CREATE USER 'testuser'@'%' IDENTIFIED BY 'testpassword';
GRANT SELECT, INSERT, UPDATE ON testdb.* TO 'testuser'@'%';
GRANT DELETE ON testdb.session TO 'testuser'@'%';
SQL
