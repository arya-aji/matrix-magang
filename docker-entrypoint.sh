#!/bin/sh
# Container entrypoint: apply migrations, optionally seed, then start the server.
set -e

if [ -n "$DATABASE_URL" ]; then
  if [ "$RUN_MIGRATE_ON_START" = "false" ] || [ "$RUN_MIGRATE_ON_START" = "0" ]; then
    echo "[entrypoint] skipping migrations (RUN_MIGRATE_ON_START=$RUN_MIGRATE_ON_START)"
  else
    echo "[entrypoint] applying database migrations..."
    if ! node ./db/migrate.mjs; then
      echo "[entrypoint] migrations failed — refusing to start with an unmigrated schema"
      exit 1
    fi
  fi

  if [ "$RUN_SEED_ON_START" = "true" ] || [ "$RUN_SEED_ON_START" = "1" ]; then
    echo "[entrypoint] running bootstrap seed (idempotent)..."
    # Non-fatal: a seed problem must not take the whole app offline.
    node ./db/seed.mjs || echo "[entrypoint] seed failed — continuing anyway"
  fi
else
  echo "[entrypoint] DATABASE_URL is not set — skipping migrations"
fi

exec "$@"
