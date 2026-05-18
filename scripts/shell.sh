#!/usr/bin/env bash
# Контейнерийн shell-д орох
# Хэрэглээ:
#   ./scripts/shell.sh        → production апп shell
#   ./scripts/shell.sh dev    → dev апп shell
#   ./scripts/shell.sh db     → production DB shell (psql)
set -euo pipefail

cd "$(dirname "$0")/.."

MODE="${1:-prod}"

case "$MODE" in
  db)
    CONTAINER="btec_db"
    echo "▶ PostgreSQL shell (${CONTAINER})..."
    docker exec -it "$CONTAINER" psql -U btec_user -d btec_evaluator
    ;;
  dev)
    CONTAINER="btec_app_dev"
    echo "▶ Dev апп shell (${CONTAINER})..."
    docker exec -it "$CONTAINER" sh
    ;;
  *)
    CONTAINER="btec_app"
    echo "▶ Production апп shell (${CONTAINER})..."
    docker exec -it "$CONTAINER" sh
    ;;
esac
