#!/bin/bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

log() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

cd "$PROJECT_DIR"

# Check prerequisites
log "Checking prerequisites..."

if ! command -v node &>/dev/null; then
  error "Node.js is not installed. Install Node.js 20+ from https://nodejs.org"
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  error "Node.js 18+ required. Current: $(node -v)"
fi
success "Node.js $(node -v)"

if ! command -v psql &>/dev/null; then
  warn "PostgreSQL client (psql) not found. Make sure PostgreSQL is installed."
else
  success "PostgreSQL client found"
fi

# Database config
DB_NAME="${POSTGRES_DB:-keyzo_pro}"
DB_USER="${POSTGRES_USER:-keyzo}"
DB_PASS="${POSTGRES_PASSWORD:-keyzo2026}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"

if [ -f .env ]; then
  source .env 2>/dev/null || true
  if [ -n "$DATABASE_URL" ]; then
    log "Using DATABASE_URL from .env"
  fi
fi

# Create database
log "Setting up database..."
if command -v createdb &>/dev/null; then
  PGPASSWORD="$DB_PASS" createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" 2>/dev/null && success "Database created" || warn "Database may already exist"
else
  warn "createdb not found, skipping database creation"
fi

# Install dependencies
log "Installing dependencies..."
npm ci 2>/dev/null || npm install
success "Dependencies installed"

# Run migrations
log "Running migrations..."
node server/migrate.js
success "Migrations applied"

# Seed data
if [ "${1:-}" = "--large" ] || [ "${1:-}" = "-l" ]; then
  log "Seeding large dataset (1000+ products)..."
  node server/seed_large.js
elif [ "${1:-}" = "--demo" ] || [ "${1:-}" = "-d" ]; then
  log "Seeding demo data..."
  node server/seed_demo.js
else
  log "Seeding default data..."
  node server/seed.js
fi
success "Seed complete"

# Create log directories
mkdir -p logs
success "Log directories created"

echo ""
echo -e "${GREEN}==============================${NC}"
echo -e "${GREEN}  Setup complete!${NC}"
echo -e "${GREEN}==============================${NC}"
echo ""
echo "  Start server:  npm run server"
echo "  Start dev:     npm run dev"
echo ""
