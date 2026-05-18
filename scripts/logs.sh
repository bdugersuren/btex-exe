#!/usr/bin/env bash
# Контейнерийн лог харах
# Хэрэглээ:
#   ./scripts/logs.sh           → production апп лог
#   ./scripts/logs.sh dev       → dev апп лог
#   ./scripts/logs.sh db        → production DB лог
#   ./scripts/logs.sh dev db    → dev DB лог
set -euo pipefail

cd "$(dirname "$0")/.."

MODE="${1:-prod}"
SERVICE="${2:-app}"

if [ "$MODE" = "dev" ]; then
  docker compose -f docker-compose.dev.yml logs -f "$SERVICE"
else
  docker compose logs -f "$SERVICE"
fi
