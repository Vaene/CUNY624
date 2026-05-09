#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

SRC_PRESENTATION="${ROOT_DIR}/presentation"
SRC_DATA="${ROOT_DIR}/../Data/TS3_Raw_tree_data.csv"
PUBLIC_DIR="${ROOT_DIR}/public"

if [[ ! -d "${SRC_PRESENTATION}" ]]; then
  echo "Missing presentation source: ${SRC_PRESENTATION}" >&2
  exit 1
fi

if [[ ! -f "${SRC_DATA}" ]]; then
  echo "Missing data source: ${SRC_DATA}" >&2
  exit 1
fi

mkdir -p "${PUBLIC_DIR}"
rm -rf "${PUBLIC_DIR}/presentation" "${PUBLIC_DIR}/Data"
mkdir -p "${PUBLIC_DIR}/presentation" "${PUBLIC_DIR}/Data"

rsync -a --delete \
  --exclude '.DS_Store' \
  --exclude 'export/' \
  "${SRC_PRESENTATION}/" "${PUBLIC_DIR}/presentation/"
cp "${SRC_DATA}" "${PUBLIC_DIR}/Data/TS3_Raw_tree_data.csv"

echo "Synced presentation into public/"
