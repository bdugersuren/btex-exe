#!/usr/bin/env bash
# Prisma Studio нээх — мэдээллийн санг браузерт харах (port 5555)
# Хэрэглээ:
#   ./scripts/studio.sh        → production DB
#   ./scripts/studio.sh dev    → dev DB
set -euo pipefail

cd "$(dirname "$0")/.."

MODE="${1:-prod}"

echo "▶ Prisma Studio эхлүүлж байна..."
echo "   http://localhost:5555"
echo "   Зогсоох: Ctrl+C"
echo ""

if [ "$MODE" = "dev" ]; then
  docker compose -f docker-compose.dev.yml --profile tools run --rm \
    -p 5555:5555 \
    migrate \
    sh -c "npx prisma studio --port 5555 --browser none"
else
  docker compose --profile tools run --rm \
    -p 5555:5555 \
    migrate \
    sh -c "npx prisma studio --port 5555 --browser none"
fi
