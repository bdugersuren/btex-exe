#!/usr/bin/env bash
# Prisma migration ажиллуулах
# Хэрэглээ:
#   ./scripts/migrate.sh          → production (migrate deploy)
#   ./scripts/migrate.sh dev      → dev (migrate dev — шинэ migration үүсгэж apply)
#   ./scripts/migrate.sh reset    → DB бүрэн reset + migrate deploy (АНХААРУУЛГА: өгөгдөл устана)
set -euo pipefail

cd "$(dirname "$0")/.."

MODE="${1:-prod}"

rebuild_if_needed() {
  echo "  Tools image шинэчилж байна..."
  docker compose --profile tools build migrate 2>/dev/null | tail -1
}

case "$MODE" in
  reset)
    echo "⚠️  DB бүрэн reset хийж migrate deploy ажиллуулна. Өгөгдөл устна!"
    read -r -p "  Үргэлжлүүлэх үү? (yes): " CONFIRM
    [ "$CONFIRM" = "yes" ] || { echo "Цуцлагдлаа."; exit 0; }
    rebuild_if_needed
    echo "▶ Reset + migrate deploy..."
    docker compose --profile tools run --rm migrate \
      sh -c "npx prisma migrate reset --force --skip-seed && npx prisma migrate deploy"
    ;;
  dev)
    echo "▶ Dev migration (migrate dev — шинэ migration файл үүсгэнэ)..."
    echo "   Migration нэр оруулахыг хүснэ (жишээ: add_notifications_table)"
    docker compose -f docker-compose.dev.yml --profile tools run --rm -it migrate \
      sh -c "npx prisma migrate dev"
    ;;
  *)
    rebuild_if_needed
    echo "▶ Production migration (migrate deploy)..."
    docker compose --profile tools run --rm migrate
    ;;
esac

echo ""
echo "✓ Migration дууслаа."
