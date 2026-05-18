# BTEC Evaluator — Ажиллуулах заавар

Энэ баримт бичигт системийг эхлүүлэх, migration хийх, seed оруулах болон удирдах бүх командуудыг дарааллаар нь тайлбарласан.

---

## Хурдан эхлэх (Quick Start)

```bash
# 1. .env файл бэлтгэх
cp .env.example .env
# .env-ийн утгуудыг засах (доорх "Environment Setup" хэсгийг үзнэ үү)

# 2. Production эхлүүлэх (DB + апп)
./scripts/prod.sh

# 3. Migration ажиллуулах (tools container-д prisma migrate deploy)
./scripts/migrate.sh

# 4. Seed өгөгдөл оруулах (tools container-д tsx prisma/seed.ts)
./scripts/seed.sh
```

> **Анхааруулга:** `migrate.sh` болон `seed.sh` нь production container (`btec_app`)-д биш,
> `tools` нэртэй тусдаа Docker stage дотор ажиллана. Production container-д `npx prisma`
> гэх мэт команд ажиллуулах оролдлого алдаа өгнө — scripts ашигла.

Апп: **http://localhost:88** (production), **http://localhost:3000** (dev)

---

## Environment Setup (.env)

`.env.example`-аас хуулж засна:

```bash
cp .env.example .env
```

| Хувьсагч | Тайлбар | Жишээ |
|---|---|---|
| `POSTGRES_DB` | DB нэр | `btec_evaluator` |
| `POSTGRES_USER` | DB хэрэглэгч | `btec_user` |
| `POSTGRES_PASSWORD` | DB нууц үг | `хүчтэй_нууц_үг` |
| `DATABASE_URL` | Prisma холболт | auto from above |
| `NEXTAUTH_SECRET` | NextAuth нууц (32+ тэмдэгт) | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Апп URL | `http://localhost:3000` |
| `GEMINI_API_KEY` | Gemini AI нэг key | `AIzaSy...` |
| `GEMINI_API_KEYS` | Олон key (таслалаар) | `key1,key2,...` |

`NEXTAUTH_SECRET` үүсгэх:
```bash
openssl rand -base64 32
```

---

## Орчнууд (Environments)

| Орчин | Compose файл | Dockerfile | Гадна порт |
|---|---|---|---|
| **Production** | `docker-compose.yml` | `docker/Dockerfile` | `88` (Nginx) |
| **Dev** | `docker-compose.dev.yml` | `docker/Dockerfile.dev` | `3000` (Next.js шууд) |

**Production контейнерууд:**
- `btec_nginx` — Nginx reverse proxy, гадна порт **88**
- `btec_app` — Next.js (internal, зөвхөн docker network)
- `btec_db` — PostgreSQL (internal, гадна порт байхгүй)
- `btec_redis` — Redis (internal, гадна порт байхгүй)

> Dev орчин нь hot reload, volume mount хийдэг тул кодын өөрчлөлт шууд хэрэгждэг.

---

## Scripts

Бүх script [`scripts/`](../scripts/) фолдерт байгаа бөгөөд `chmod +x` хийгдсэн.

### `./scripts/prod.sh` — Production эхлүүлэх

```bash
./scripts/prod.sh
```

- `.env` шаардана
- `docker-compose.yml`-ийг ашиглан build хийж эхлүүлнэ
- DB healthy болтол хүлээнэ, дараа нь апп эхэлнэ

---

### `./scripts/dev.sh` — Dev орчин эхлүүлэх

```bash
./scripts/dev.sh
```

- `docker-compose.dev.yml` ашиглана
- Кодын өөрчлөлтийг шууд тусгана (hot reload)
- `.env` шаардахгүй — dev утгууд compose файлд хатуу бичигдсэн

---

### `./scripts/migrate.sh` — Migration ажиллуулах

Migration командуудыг **`tools` Docker stage** дотор ажиллуулна.
Production container-д (`btec_app`) prisma CLI байхгүй — энэ нь зөв, standalone build хөнгөн байхын тулд.

```bash
# Production (migrate deploy — pending migration-уудыг apply хийнэ)
./scripts/migrate.sh

# Dev (migrate dev — шинэ migration файл үүсгэж apply хийнэ)
./scripts/migrate.sh dev

# DB бүрэн reset хийж migrate deploy (АНХААРУУЛГА: өгөгдөл устна)
./scripts/migrate.sh reset
```

**Migration файлын байршил:** `prisma/migrations/`

**Ялгаа:**
- `migrate deploy` — production-д аюулгүй, зөвхөн pending migration-уудыг apply хийнэ
- `migrate dev` — dev-д, schema өөрчлөлтийг шинэ `.sql` migration файл болгон хадгалж apply хийнэ
- `reset` — бүх хүснэгт устгаж, migration-уудыг дахин apply хийнэ (data loss!)

---

### `./scripts/seed.sh` — Seed өгөгдөл оруулах

```bash
# Production контейнерт
./scripts/seed.sh

# Dev контейнерт
./scripts/seed.sh dev
```

Seed дараах өгөгдлийг `upsert` (давхардуулахгүй) аргаар оруулна:

| Дүр | И-мэйл | Нууц үг |
|---|---|---|
| Admin | admin@btec.edu | `Admin@1234` |
| Lead IV | leadiv@btec.edu | `LeadIV@1234` |
| Internal Verifier | iv@btec.edu | `IV@1234` |
| Teacher | dugersuren@gmail.com | `Bd80102679@#$` |
| Student | student@btec.edu | `Exe@1234` |

Мөн дараах өгөгдлийг үүсгэнэ:
- **Program**: BTEC IT Level 3
- **Academic Year**: 2025-2026
- **Cohort**: IT 2025 Cohort
- **Unit 1**: Information Technology Systems (A.P1, A.P2, A.M1, A.D1 шалгуурууд)
- **Assignment**: Unit 1 Activity 01 — IT Infrastructure Proposal (PUBLISHED)

---

### `./scripts/reset-db.sh` — DB бүрэн устгаж дахин үүсгэх

```bash
# Production
./scripts/reset-db.sh

# Dev
./scripts/reset-db.sh dev
```

> ⚠️ **АНХААРУУЛГА**: Бүх өгөгдөл устна. "yes" гэж баталгаажуулах шаардлагатай.

Хийх зүйлс: `migrate reset --force` → `seed`

---

### `./scripts/logs.sh` — Лог харах

```bash
# Production апп лог
./scripts/logs.sh

# Dev апп лог
./scripts/logs.sh dev

# Production DB лог
./scripts/logs.sh prod db

# Dev DB лог
./scripts/logs.sh dev db
```

---

### `./scripts/stop.sh` — Зогсоох

```bash
# Production зогсоох
./scripts/stop.sh

# Dev зогсоох
./scripts/stop.sh dev

# Бүгдийг зогсоож volume устгах (бүх өгөгдөл устна)
./scripts/stop.sh all
```

---

### `./scripts/shell.sh` — Контейнерийн shell-д орох

```bash
# Production апп shell
./scripts/shell.sh

# Dev апп shell
./scripts/shell.sh dev

# PostgreSQL shell
./scripts/shell.sh db
```

---

### `./scripts/studio.sh` — Prisma Studio нээх

```bash
# Production DB харах
./scripts/studio.sh

# Dev DB харах
./scripts/studio.sh dev
```

Нээгдэх URL: **http://localhost:5555**

---

## Дэлгэрэнгүй команд жишээнүүд

### Docker Compose шууд команд

```bash
# Production
docker compose ps                          # Контейнер байдал
docker compose up -d --build               # Build хийж эхлүүлэх
docker compose down                        # Зогсоох
docker compose down -v                     # Зогсоож volume устгах
docker compose restart app                 # Апп дахин эхлүүлэх
docker compose logs -f app                 # Апп лог
docker compose logs -f nginx               # Nginx лог
docker compose logs -f db                  # DB лог
docker compose logs -f redis               # Redis лог

# Dev
docker compose -f docker-compose.dev.yml up -d --build
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml logs -f app
```

### Prisma команд (контейнер дотор)

```bash
# Production контейнерт орж Prisma команд ажиллуулах
docker exec btec_app npx prisma migrate deploy     # Migration apply
docker exec btec_app npx prisma migrate status     # Migration статус
docker exec btec_app npx prisma db seed            # (package.json-д seed тохиргоо байвал)
docker exec btec_app npm run db:seed               # Seed ажиллуулах
docker exec btec_app npx prisma generate           # Client дахин үүсгэх

# Dev
docker exec btec_app_dev npx prisma migrate dev    # Шинэ migration үүсгэх
docker exec btec_app_dev npx prisma migrate reset  # Reset
docker exec btec_app_dev npx prisma studio         # Studio (port 5555)
```

### package.json scripts (контейнер дотор)

```bash
docker exec btec_app npm run db:migrate     # prisma migrate dev
docker exec btec_app npm run db:push        # prisma db push
docker exec btec_app npm run db:push:reset  # prisma db push --force-reset
docker exec btec_app npm run db:seed        # tsx prisma/seed.ts
docker exec btec_app npm run db:generate    # prisma generate
docker exec btec_app npm run db:reset       # prisma migrate reset
```

---

## Ажиллуулах бүрэн дараалал

### Анхны суулгалт (шинэ машинд)

```bash
# 1. Repo clone
git clone <repo-url>
cd btec-exe

# 2. Environment тохиргоо
cp .env.example .env
# .env засах: POSTGRES_PASSWORD, NEXTAUTH_SECRET, GEMINI_API_KEY

# 3. Эхлүүлэх
./scripts/prod.sh           # Docker build + container эхлүүлэх

# 4. Migration
./scripts/migrate.sh        # DB schema үүсгэх

# 5. Seed
./scripts/seed.sh           # Demo өгөгдөл оруулах

# 6. Нэвтрэх
# → http://localhost:3000
# → dugersuren@gmail.com / Bd80102679@#$
```

### Dev орчинд ажиллах

```bash
# 1. Dev эхлүүлэх
./scripts/dev.sh

# 2. Migration (анх удаа)
./scripts/migrate.sh dev

# 3. Seed
./scripts/seed.sh dev

# 4. Код засаж ажиллах — hot reload автоматаар хэрэгждэг

# 5. Schema өөрчлөхөд
#    prisma/schema.prisma засаад:
./scripts/migrate.sh dev    # Шинэ migration file үүсгэнэ
```

### Schema өөрчлөх (Dev)

```bash
# 1. prisma/schema.prisma файлд өөрчлөлт хийх
# 2. Dev migration үүсгэх
./scripts/migrate.sh dev
# Migration нэр оруулахыг хүснэ: жишээ "add_unit_field"
# 3. Prisma Client дахин үүснэ (автомат)
```

### Production deploy шинэчлэх

```bash
# 1. Кодын өөрчлөлт татах
git pull

# 2. Дахин build
docker compose up -d --build

# 3. Шинэ migration-ууд байвал apply
./scripts/migrate.sh
```

---

## Алдаа засах (Troubleshooting)

### Контейнер эхлэхгүй байвал
```bash
docker compose logs app
docker compose logs db
```

### DB холболт алдаа
```bash
# DB ажиллаж байгаа эсэх
docker compose ps db
# DB healthy болтол хүлээх
docker inspect btec_db --format='{{.State.Health.Status}}'
```

### Migration алдаа
```bash
# Migration статус шалгах
docker exec btec_app npx prisma migrate status
# Dev-д бол reset хийж дахин оролдох
./scripts/reset-db.sh dev
```

### Port 88 эзэлсэн байвал (production)
```bash
lsof -i :88
kill -9 <PID>
```

### Port 3000 эзэлсэн байвал (dev)
```bash
lsof -i :3000
kill -9 <PID>
```

### Volume өгөгдөл устгах
```bash
./scripts/stop.sh all
# Дараа нь дахин эхлүүлэх + migrate + seed
```

---

## Системийн архитектур (товч)

```
Browser → Nginx (port 88, production)
            ↓ reverse proxy, gzip, rate limit
          Next.js (port 3000, internal)
            ↓ API Routes (/api/*)
          Service Layer
            ↓ Prisma ORM          ↓ Redis cache
          PostgreSQL             Redis (Gemini cache)

Storage: /app/storage (Docker volume)
```

**Production контейнерууд:**
- `btec_nginx` — Nginx (гадна порт 88)
- `btec_app` — Next.js апп (internal)
- `btec_db` — PostgreSQL 15 (internal)
- `btec_redis` — Redis 7 (internal)

**Dev контейнерууд:**
- `btec_app_dev` — Next.js апп (порт 3000)
- `btec_db_dev` — PostgreSQL 15 (порт 5433)
- `btec_redis_dev` — Redis 7 (порт 6380)

**Volumes:**
- `postgres_data` / `postgres_dev_data` — DB файлууд
- `storage_data` / `storage_dev_data` — Upload хийгдсэн файлууд
- `redis_data` / `redis_dev_data` — Redis өгөгдөл
