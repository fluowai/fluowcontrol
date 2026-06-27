#!/bin/sh
set -e

echo "=== Fluow Control Center - Entrypoint ==="
echo ""

# Aguarda o PostgreSQL ficar pronto
if [ -n "$DATABASE_URL" ]; then
  echo "[1/3] Aguardando PostgreSQL ficar disponível..."
  DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\).*/\1/p')
  DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  DB_PORT=${DB_PORT:-5432}
  DB_HOST=${DB_HOST:-postgres}

  for i in $(seq 1 30); do
    if nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; then
      echo "  PostgreSQL pronto!"
      break
    fi
    echo "  Tentativa $i/30..."
    sleep 2
  done
fi

# Roda Prisma db push para criar as tabelas
echo "[2/3] Executando prisma db push..."
npx prisma db push --skip-generate --accept-data-loss 2>&1 | grep -v "Prisma schema loaded"
echo "  Tabelas sincronizadas!"

# Seed com dados iniciais (upsert, seguro rodar múltiplas vezes)
echo "[3/3] Populando dados iniciais (seed)..."
npx tsx server/seed.ts 2>&1 | grep -v "^$"
echo "  Seed concluído!"

echo ""
echo "=== Iniciando servidor ==="
echo ""

exec "$@"
