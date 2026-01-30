#!/bin/sh

echo "⏳ Waiting for database to be ready..."

until pg_isready -h postgres -U postgres -d primentoring 2>/dev/null; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done

echo "✅ Database ready!"

SEED_FLAG="/app/.seed-completed"

if [ ! -f "$SEED_FLAG" ]; then
  echo "🌱 Running seed for the first time..."
  pnpm seed || echo "⚠️  Warning: Seed may have failed, but continuing..."
  touch "$SEED_FLAG"
  echo "✅ Seed completed!"
else
  echo "ℹ️  Seed already executed previously. Skipping..."
fi

echo "🚀 Starting application..."

exec node dist/main.js
