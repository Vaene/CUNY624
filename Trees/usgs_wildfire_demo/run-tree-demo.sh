#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cat <<'EOF'
This demo now runs under Next.js.

Use:
  cd usgs_wildfire_demo
  npm install
  npm run dev

For a production build:
  npm run build
  npm run start
EOF

cd "${SCRIPT_DIR}"
npm run dev
