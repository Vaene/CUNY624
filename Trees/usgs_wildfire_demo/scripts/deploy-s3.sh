#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

BASE_PATH="${NEXT_PUBLIC_BASE_PATH:-/624/Trees}"
S3_BUCKET="${S3_BUCKET:-}"
S3_PREFIX="${S3_PREFIX:-${BASE_PATH#/}}"
CLOUDFRONT_DISTRIBUTION_ID="${CLOUDFRONT_DISTRIBUTION_ID:-}"
ZIP_ARTIFACT_NAME="${ZIP_ARTIFACT_NAME:-usgs_wildfire_demo.zip}"
ZIP_ARTIFACT_PATH="${ROOT_DIR}/../${ZIP_ARTIFACT_NAME}"

if [[ -z "${S3_BUCKET}" ]]; then
  echo "Missing S3_BUCKET. Example: S3_BUCKET=cuny.drinkthesand.com" >&2
  exit 1
fi

if [[ "${BASE_PATH}" != /* ]]; then
  echo "NEXT_PUBLIC_BASE_PATH must start with /. Got: ${BASE_PATH}" >&2
  exit 1
fi

echo "Building static export for ${BASE_PATH}"
cd "${ROOT_DIR}"
NEXT_PUBLIC_BASE_PATH="${BASE_PATH}" npm run build

if [[ ! -d "${ROOT_DIR}/out" ]]; then
  echo "Expected static export at ${ROOT_DIR}/out" >&2
  exit 1
fi

echo "Creating source archive ${ZIP_ARTIFACT_NAME}"
rm -f "${ZIP_ARTIFACT_PATH}"
(
  cd "${ROOT_DIR}/.."
  zip -r "${ZIP_ARTIFACT_NAME}" "${ROOT_DIR##*/}" \
    -x "${ROOT_DIR##*/}/.git/*" \
    -x "${ROOT_DIR##*/}/node_modules/*" \
    -x "${ROOT_DIR##*/}/.next/*" \
    -x "${ROOT_DIR##*/}/out/*" \
    -x "${ROOT_DIR##*/}/presentation/export/node_modules/*" \
    -x "${ROOT_DIR##*/}/presentation/export/test-results/*" \
    -x "${ROOT_DIR##*/}/presentation/export/playwright-report/*" \
    -x "${ROOT_DIR##*/}/tree-shiny-build/*" \
    -x "${ROOT_DIR##*/}/tree-shiny-local-build/*" \
    -x "${ROOT_DIR##*/}/*.zip" \
    -x "${ROOT_DIR##*/}/**/.DS_Store" \
    -x "${ROOT_DIR##*/}/.DS_Store"
)

DEST="s3://${S3_BUCKET}/${S3_PREFIX}/"
echo "Uploading out/ to ${DEST}"
aws s3 sync "${ROOT_DIR}/out/" "${DEST}" --delete \
  --exclude ".DS_Store" \
  --exclude "**/.DS_Store"

echo "Uploading source archive to ${DEST}${ZIP_ARTIFACT_NAME}"
aws s3 cp "${ZIP_ARTIFACT_PATH}" "${DEST}${ZIP_ARTIFACT_NAME}"

if [[ -n "${CLOUDFRONT_DISTRIBUTION_ID}" ]]; then
  INVALIDATION_PATH="/${S3_PREFIX}/*"
  echo "Creating CloudFront invalidation for ${INVALIDATION_PATH}"
  aws cloudfront create-invalidation \
    --distribution-id "${CLOUDFRONT_DISTRIBUTION_ID}" \
    --paths "${INVALIDATION_PATH}"
fi

echo "Deployment complete."
