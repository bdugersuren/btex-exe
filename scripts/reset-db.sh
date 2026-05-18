#!/usr/bin/env bash
# Мэдээллийн санг бүрэн устгаж дахин үүсгэх (АНХААРУУЛГА: бүх өгөгдөл устана)
# Хэрэглээ:
#   ./scripts/reset-db.sh        → production
#   ./scripts/reset-db.sh dev    → dev
set -euo pipefail

cd "$(dirname "$0")/.."

MODE="${1:-prod}"

echo "⚠️  АНХААРУУЛГА: Энэ үйлдэл мэдээллийн сангийн БҮХ өгөгдлийг устгана!"
echo "   Орчин: ${MODE}"
echo ""
read -r -p "  Үргэлжлүүлэх үү? (yes гэж бичнэ үү): " CONFIRM
[ "$CONFIRM" = "yes" ] || { echo "  Цуцлагдлаа."; exit 0; }

echo ""

if [ "$MODE" = "dev" ]; then
  COMPOSE_ARGS="-f docker-compose.dev.yml"
else
  COMPOSE_ARGS=""
fi

echo "▶ Migration reset + deploy хийж байна..."
docker compose $COMPOSE_ARGS --profile tools run --rm migrate \
  sh -c "npx prisma migrate reset --force --skip-seed && npx prisma migrate deploy"

echo ""
echo "▶ Seed өгөгдөл оруулж байна..."
docker compose $COMPOSE_ARGS --profile tools run --rm seed

echo ""
echo "✓ Мэдээллийн сан шинэчлэгдэж, seed дууслаа."
