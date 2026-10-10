#!/usr/bin/env bash
set -euo pipefail

echo "[deploy] Running prechecks..."

command -v node >/dev/null 2>&1 || { echo "node is not installed"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "npm is not installed"; exit 1; }

REQUIRED_ENVS=(VITE_SUPABASE_URL)
MISSING=()
for v in "${REQUIRED_ENVS[@]}"; do
  if [ -z "${!v-}" ]; then
    MISSING+=("$v")
  fi
done
if [ ${#MISSING[@]} -ne 0 ]; then
  echo "Missing required env vars: ${MISSING[*]}"
  exit 1
fi

if [ -z "${VITE_SUPABASE_PUBLISHABLE_KEY-}" ] && [ -z "${VITE_SUPABASE_ANON_KEY-}" ]; then
  echo "Missing required env vars: VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY"
  exit 1
fi

echo "[deploy] Prechecks passed"
