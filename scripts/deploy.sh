#!/usr/bin/env bash
set -euo pipefail

ENV=${1:-staging}
DRY_RUN=${2:-false}

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILL_CFG_FILE="$ROOT_DIR/deploy_skill/skill-config.json"

echo "[deploy] Starting deploy (env=$ENV, dry_run=$DRY_RUN)"

if [ ! -f "$SKILL_CFG_FILE" ]; then
  echo "[deploy] Missing skill config: $SKILL_CFG_FILE"
  exit 1
fi

AUTO_CONFIRM=$(jq -r '.auto_confirm_production' "$SKILL_CFG_FILE")

if [ "$ENV" = "production" ] && [ "$AUTO_CONFIRM" != "true" ]; then
  echo "[deploy] Production deploy requires confirmation in skill-config.json"
  exit 1
fi

echo "[deploy] Running prechecks"
bash "$ROOT_DIR/scripts/prechecks.sh"

if [ "$DRY_RUN" = "true" ]; then
  echo "[deploy] Dry run - skipping build and transfer"
  exit 0
fi

echo "[deploy] Building project"
npm run build

# Prefer rsync/ssh deploy if SSH vars provided, otherwise print next steps
if [ -n "${SSH_USER-}" ] && [ -n "${SSH_HOST-}" ] && [ -n "${SSH_PATH-}" ]; then
  echo "[deploy] Deploying via rsync to $SSH_USER@$SSH_HOST:$SSH_PATH"
  rsync -avz --delete ./dist/ "$SSH_USER@$SSH_HOST:$SSH_PATH"
  echo "[deploy] Restart services on remote (if needed)"
  if [ -n "${SSH_RESTART_CMD-}" ]; then
    ssh "$SSH_USER@$SSH_HOST" "$SSH_RESTART_CMD"
  fi
else
  echo "[deploy] No SSH config found. Provide SSH_USER/SSH_HOST/SSH_PATH to enable rsync deploy."
  echo "[deploy] Alternatively, run Vercel/Other CLI to publish the project."
fi

if [ -n "${SMOKE_URL-}" ]; then
  echo "[deploy] Running smoke tests"
  bash "$ROOT_DIR/scripts/smoke_tests.sh" "$SMOKE_URL"
else
  echo "[deploy] Skipping smoke tests (SMOKE_URL not set)"
fi

echo "[deploy] Deploy finished"
