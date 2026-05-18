# BTEC IT Evaluator

## Development Database

The Prisma schema has been upgraded to the BTEC domain model: programs, cohorts, units, learning aims, assignment criteria, submission attempts, AI runs, evaluation criteria, resubmission requests, verification reviews and private file assets.

For a fresh local development database:

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
```

If your local database was created from the old MVP schema, reset it first:

```bash
npm run db:push:reset
npm run db:seed
```

After the model stabilises, generate a normal migration with `npx prisma migrate dev --name btec_domain_model` and commit `prisma/migrations`.

Uploaded submissions are stored under `storage/` and served through `/api/files/:id` with session-based access checks.
