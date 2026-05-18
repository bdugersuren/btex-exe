#!/usr/bin/env bash
# Production build & эхлүүлэх
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "✗ .env файл олдсонгүй. .env.example-аас хуулна уу:"
  echo "  cp .env.example .env"
  exit 1
fi

echo "▶ Production build эхэлж байна..."
docker compose up -d --build

echo ""
echo "✓ Контейнерууд ажиллаж байна:"
docker compose ps

echo ""
echo "  Апп   → http://localhost:88"
echo ""
echo "  Лог харах : ./scripts/logs.sh"
echo "  Nginx лог : ./scripts/logs.sh prod nginx"
echo "  Зогсоох   : ./scripts/stop.sh"
