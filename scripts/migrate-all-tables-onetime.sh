#!/bin/bash

# One-Time Full Table Copier
# Copies ALL DynamoDB tables that contain the SOURCE_BACKEND_SUFFIX to matching
# tables with TARGET_BACKEND_SUFFIX (replacing only the suffix segment in the name).
# Retains original item 'id' values (no FK rewrite performed).
# Use for: legacy bootstrap -> new staging, then staging -> production.

set -euo pipefail

SCRIPT_VERSION="0.1.0"
AWS_REGION="${AWS_REGION:-us-west-1}"
SOURCE_BACKEND_SUFFIX="${SOURCE_BACKEND_SUFFIX:-}"
TARGET_BACKEND_SUFFIX="${TARGET_BACKEND_SUFFIX:-}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_DIR="$(dirname "$0")/../logs"
BACKUP_DIR="$(dirname "$0")/../backups/migrations/onetime"
mkdir -p "$LOG_DIR" "$BACKUP_DIR"
LOG_FILE="$LOG_DIR/onetime_migration_${TIMESTAMP}.log"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'; BOLD='\033[1m'

log(){ local lvl="$1"; shift; echo -e "${lvl} $(date '+%H:%M:%S') $*" | tee -a "$LOG_FILE"; }
info(){ log "${BLUE}[INFO]${NC}" "$*"; }
success(){ log "${GREEN}[OK]${NC}" "$*"; }
warn(){ log "${YELLOW}[WARN]${NC}" "$*"; }
err(){ log "${RED}[ERR]${NC}" "$*" >&2; }

usage(){ cat <<EOF
One-Time Full Table Copier (v$SCRIPT_VERSION)

Environment (required):
  SOURCE_BACKEND_SUFFIX   e.g. fvn7t5hbobaxjklhrqzdl4ac34
  TARGET_BACKEND_SUFFIX   e.g. irgzgwsfnzba3fqtum5k2eyp4m
  AWS_REGION              defaults to us-west-1

Commands:
  list        List all source tables & item counts
  analyze     List source->target mapping & count diffs
  migrate     Copy all items (no destructive clears) to target
  verify      Re-count and show per-table source/target counts

Examples:
  SOURCE_BACKEND_SUFFIX=legacy TARGET_BACKEND_SUFFIX=staging ./migrate-all-tables-onetime.sh analyze
  SOURCE_BACKEND_SUFFIX=legacy TARGET_BACKEND_SUFFIX=staging ./migrate-all-tables-onetime.sh migrate
  SOURCE_BACKEND_SUFFIX=staging TARGET_BACKEND_SUFFIX=production ./migrate-all-tables-onetime.sh migrate

Notes:
  • IDs retained as-is; no FK rewrite attempted.
  • If attributes embed the old suffix string, they will remain unless you add --rewrite-suffix.
  • BatchWrite retries unprocessed items.
  • Script skips tables already having identical item count (source==target) unless --force specified.
EOF
}

require_env(){
  local missing=0
  for v in SOURCE_BACKEND_SUFFIX TARGET_BACKEND_SUFFIX; do
    [[ -z "${!v}" ]] && { err "Missing env var: $v"; missing=1; }
  done
  [[ $missing -eq 1 ]] && exit 1
}

list_source_tables(){
  aws dynamodb list-tables --region "$AWS_REGION" --output json \
    | jq -r '.TableNames[]' \
    | grep "$SOURCE_BACKEND_SUFFIX" || true
}

describe_count(){
  local table="$1"; aws dynamodb describe-table --table-name "$table" --region "$AWS_REGION" --query 'Table.ItemCount' --output text 2>/dev/null || echo 0
}

derive_target_name(){
  local src_table="$1"; echo "$src_table" | sed "s/${SOURCE_BACKEND_SUFFIX}/${TARGET_BACKEND_SUFFIX}/" 
}

retry_batch_write(){
  local payload="$1"; local attempts=0; local max_attempts=6
  while true; do
    local resp
    if resp=$(aws dynamodb batch-write-item --request-items "$payload" --region "$AWS_REGION" 2>/dev/null); then
      local unprocessed
      unprocessed=$(echo "$resp" | jq '.["UnprocessedItems"] | to_entries | map(.value|length) | add // 0')
      if [[ "$unprocessed" -eq 0 ]]; then
        return 0
      fi
      attempts=$((attempts+1))
      if [[ $attempts -ge $max_attempts ]]; then
        err "Exceeded retries with $unprocessed unprocessed items remaining"
        return 1
      fi
      warn "Retrying $unprocessed unprocessed items (attempt $attempts)"
      payload=$(echo "$resp" | jq '{RequestItems: .UnprocessedItems}' | jq -c '.RequestItems')
    else
      return 1
    fi
  done
}

analyze(){
  require_env
  info "Analyzing tables for suffix $SOURCE_BACKEND_SUFFIX -> $TARGET_BACKEND_SUFFIX"
  printf "%s\t%s\t%s\n" "TABLE" "SRC" "TGT" | tee -a "$LOG_FILE"
  local total_src=0 total_tgt=0 count=0
  list_source_tables | sort | while read -r t; do
    [[ -z "$t" ]] && continue
    local base="$t"; local tgt=$(derive_target_name "$t")
    local src_count=$(describe_count "$t")
    local tgt_count=$(describe_count "$tgt")
    echo -e "  ${BLUE}$base${NC} src=${src_count} tgt=${tgt_count:-0}" | tee -a "$LOG_FILE" >/dev/null
    total_src=$((total_src+src_count))
    total_tgt=$((total_tgt+(tgt_count=="-"?0:tgt_count)))
    count=$((count+1))
  done
  info "Tables discovered: $count | Total source items: $total_src"
}

migrate(){
  require_env
  local force=0 rewrite=0
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --force) force=1;;
      --rewrite-suffix) rewrite=1;;
      *) err "Unknown flag $1"; exit 1;;
    esac; shift
  done
  info "Starting migration (suffix $SOURCE_BACKEND_SUFFIX -> $TARGET_BACKEND_SUFFIX)"
  local tables=( $(list_source_tables | sort) )
  [[ ${#tables[@]} -eq 0 ]] && { err "No source tables found"; exit 1; }
  info "Found ${#tables[@]} tables"

  for src in "${tables[@]}"; do
    local tgt=$(derive_target_name "$src")
    local src_count=$(describe_count "$src")
    local tgt_count=$(describe_count "$tgt" || echo 0)
    if [[ "$src_count" -eq "$tgt_count" && $force -eq 0 && "$src_count" -ne 0 ]]; then
      info "Skipping $src (counts match $src_count)"
      continue
    fi
    info "Migrating $src -> $tgt (src_count=$src_count current_tgt=$tgt_count)"
    local processed=0 page=0
    local start_key=""
    while true; do
      # Use pagination token; DynamoDB CLI now uses --starting-token (NextToken)
      local scan_cmd=(aws dynamodb scan --table-name "$src" --region "$AWS_REGION" --output json --max-items 1000)
      [[ -n "$start_key" ]] && scan_cmd+=(--starting-token "$start_key")
      local scan
      if ! scan=$("${scan_cmd[@]}" 2>/dev/null); then
        err "Scan failed for $src"; break
      fi
      local items
      items=$(echo "$scan" | jq -c '.Items[]?' || true)
      local batch="" bcount=0
      while read -r item; do
        [[ -z "$item" ]] && continue
        if [[ $rewrite -eq 1 ]]; then
          item=$(echo "$item" | sed "s/${SOURCE_BACKEND_SUFFIX}/${TARGET_BACKEND_SUFFIX}/g")
        fi
        [[ -n "$batch" ]] && batch+=","; batch+="{\"PutRequest\":{\"Item\":$item}}"; bcount=$((bcount+1)); processed=$((processed+1))
        if [[ $bcount -eq 25 ]]; then
          local payload="{\"$tgt\":[${batch}]}"
          retry_batch_write "$payload" || err "Batch failed for $tgt"
          batch=""; bcount=0
        fi
      done <<< "$items"
      if [[ -n "$batch" ]]; then
        local payload="{\"$tgt\":[${batch}]}"
        retry_batch_write "$payload" || err "Final batch failed for $tgt"
      fi
      page=$((page+1))
      local next_token
      next_token=$(echo "$scan" | jq -r '.NextToken // empty')
      [[ -z "$next_token" ]] && break
      start_key="$next_token"
    done
    success "Completed $src -> $tgt items_processed=$processed"
  done
  success "Migration complete"
}

verify(){
  require_env
  info "Verifying counts"
  local mismatch=0
  list_source_tables | sort | while read -r src; do
    [[ -z "$src" ]] && continue
    local tgt=$(derive_target_name "$src")
    local sc=$(describe_count "$src")
    local tc=$(describe_count "$tgt")
    local mark="OK"
    [[ "$sc" -ne "$tc" ]] && { mark="DIFF"; mismatch=$((mismatch+1)); }
    echo -e "$src\t$sc\t$tc ($mark)" | tee -a "$LOG_FILE" >/dev/null
  done
  if [[ $mismatch -eq 0 ]]; then
    success "All table counts match"
  else
    warn "$mismatch table(s) differ"
  fi
}

cmd="${1:-}"; shift || true
case "$cmd" in
  list) list_source_tables;;
  analyze) analyze;;
  migrate) migrate "$@";;
  verify) verify;;
  help|--help|-h|"") usage;;
  *) err "Unknown command: $cmd"; usage; exit 1;;
esac
