#!/usr/bin/env bash
# Seed өгөгдөл оруулах
# Хэрэглээ:
#   ./scripts/seed.sh        → production DB-д seed
#   ./scripts/seed.sh dev    → dev DB-д seed
set -euo pipefail

cd "$(dirname "$0")/.."

MODE="${1:-prod}"

if [ "$MODE" = "dev" ]; then
  echo "▶ Dev DB-д seed өгөгдөл оруулж байна..."
  docker compose -f docker-compose.dev.yml --profile tools run --rm seed
else
  echo "▶ Production DB-д seed өгөгдөл оруулж байна..."
  docker compose --profile tools run --rm seed
fi

echo ""
echo "✓ Seed амжилттай дууслаа."
echo ""
echo "  Нэвтрэх бүртгэлүүд:"
echo "  ┌──────────────────────────┬───────────────────────┬─────────────────┐"
echo "  │ Дүр                      │ И-мэйл                │ Нууц үг         │"
echo "  ├──────────────────────────┼───────────────────────┼─────────────────┤"
echo "  │ Admin                    │ admin@btec.edu        │ Admin@1234      │"
echo "  │ Lead Internal Verifier   │ leadiv@btec.edu       │ LeadIV@1234     │"
echo "  │ Internal Verifier        │ iv@btec.edu           │ IV@1234         │"
echo "  │ Teacher (Dugersuren)     │ dugersuren@gmail.com  │ Bd80102679@#\$   │"
echo "  │ Student                  │ student@btec.edu      │ Exe@1234        │"
echo "  └──────────────────────────┴───────────────────────┴─────────────────┘"
