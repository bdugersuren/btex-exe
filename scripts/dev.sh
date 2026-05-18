#!/usr/bin/env bash
# Dev орчин эхлүүлэх — hot reload, local volume mount
set -euo pipefail

cd "$(dirname "$0")/.."

echo "▶ Dev орчин эхлүүлж байна..."
docker compose -f docker-compose.dev.yml up -d --build

echo ""
echo "✓ Контейнерууд ажиллаж байна:"
docker compose -f docker-compose.dev.yml ps

echo ""
echo "  Апп   → http://localhost:3000"
echo "  DB    → localhost:5432"
echo ""
echo "  Лог харах : ./scripts/logs.sh dev"
echo "  Зогсоох   : ./scripts/stop.sh dev"
