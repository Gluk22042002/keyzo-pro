#!/bin/bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
LOG_FILE="${BACKUP_DIR}/backup.log"
KEEP_COUNT=7

log() { echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"; }
success() { log "${GREEN}[OK]${NC} $1"; }
warn() { log "${YELLOW}[WARN]${NC} $1"; }
error() { log "${RED}[ERROR]${NC} $1"; exit 1; }

mkdir -p "$BACKUP_DIR"

# Database config
DB_NAME="${POSTGRES_DB:-keyzo_pro}"
DB_USER="${POSTGRES_USER:-keyzo}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
export PGPASSWORD="${POSTGRES_PASSWORD:-keyzo2026}"

if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  source "$PROJECT_DIR/.env" 2>/dev/null || true
  set +a
fi

TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
BACKUP_FILE="$BACKUP_DIR/keyzo_${TIMESTAMP}.sql"
BACKUP_GZ="${BACKUP_FILE}.gz"

log "Starting backup..."

if ! command -v pg_dump &>/dev/null; then
  error "pg_dump not found. Install PostgreSQL client tools."
fi

log "Dumping database..."
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -F p -f "$BACKUP_FILE" 2>>"$LOG_FILE"
success "Database dumped to $BACKUP_FILE"

log "Compressing..."
gzip "$BACKUP_FILE"
success "Compressed: $BACKUP_GZ ( $(du -h "$BACKUP_GZ" | cut -f1) )"

log "Cleaning old backups (keeping last $KEEP_COUNT)..."
cd "$BACKUP_DIR"
ls -1t keyzo_*.sql.gz 2>/dev/null | tail -n +$((KEEP_COUNT + 1)) | xargs -r rm -f
REMAINING=$(ls -1 keyzo_*.sql.gz 2>/dev/null | wc -l | tr -d ' ')
success "Kept $REMAINING backup(s)"

echo ""
success "Backup complete: $BACKUP_GZ"
