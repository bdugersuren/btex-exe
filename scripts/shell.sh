#!/usr/bin/env bash
# Контейнерийн shell-д орох
# Хэрэглээ:
#   ./scripts/shell.sh           → production апп shell
#   ./scripts/shell.sh dev       → dev апп shell
#   ./scripts/shell.sh db        → production DB shell (psql)
#   ./scripts/shell.sh db dev    → dev DB shell (psql)
#   ./scripts/shell.sh nginx     → production nginx shell
set -euo pipefail

cd "$(dirname "$0")/.."

MODE="${1:-prod}"
SUB="${2:-}"

case "$MODE" in
  db)
    if [ "$SUB" = "dev" ]; then
      echo "▶ Dev PostgreSQL shell (btec_db_dev)..."
      docker exec -it btec_db_dev psql -U btec_user -d btec_evaluator_dev
    else
      echo "▶ Production PostgreSQL shell (btec_db)..."
      DB_NAME="${POSTGRES_DB:-btec_evaluator}"
      DB_USER="${POSTGRES_USER:-btec_user}"
      [ -f .env ] && source .env 2>/dev/null || true
      docker exec -it btec_db psql -U "${POSTGRES_USER:-btec_user}" -d "${POSTGRES_DB:-btec_evaluator}"
    fi
    ;;
  nginx)
    echo "▶ Nginx shell (btec_nginx)..."
    docker exec -it btec_nginx sh
    ;;
  dev)
    echo "▶ Dev апп shell (btec_app_dev)..."
    docker exec -it btec_app_dev sh
    ;;
  *)
    echo "▶ Production апп shell (btec_app)..."
    docker exec -it btec_app sh
    ;;
esac
