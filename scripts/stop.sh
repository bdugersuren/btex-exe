#!/usr/bin/env bash
# Контейнеруудыг зогсоох
# Хэрэглээ:
#   ./scripts/stop.sh       → production зогсоох
#   ./scripts/stop.sh dev   → dev зогсоох
#   ./scripts/stop.sh all   → бүгдийг зогсоож volume устгах
set -euo pipefail

cd "$(dirname "$0")/.."

MODE="${1:-prod}"

case "$MODE" in
  dev)
    echo "▶ Dev контейнеруудыг зогсоож байна..."
    docker compose -f docker-compose.dev.yml down
    ;;
  all)
    echo "▶ Бүх контейнер болон volume устгаж байна..."
    docker compose down -v
    docker compose -f docker-compose.dev.yml down -v 2>/dev/null || true
    ;;
  *)
    echo "▶ Production контейнеруудыг зогсоож байна..."
    docker compose down
    ;;
esac

echo "✓ Зогсоолоо."
