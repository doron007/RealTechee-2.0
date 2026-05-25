#!/usr/bin/env python3
"""
Restore DynamoDB tables from local backups in ./backups/migrations/
to the new Amplify sandbox stack.

Usage:
    python3 .planning/phases/07-restore/import-data.py [--dry-run]

Reads:
    - amplify_outputs.json (for the new table-name suffix)
    - backups/migrations/fullchain_export_<TableName>_20250811_184652.json

Writes via aws dynamodb batch-write-item (25 items per call).
"""
import json
import sys
import time
import boto3
from pathlib import Path
from botocore.exceptions import ClientError

DRY = "--dry-run" in sys.argv
REPO = Path(__file__).resolve().parents[3]
OUTPUTS = REPO / "amplify_outputs.json"
BACKUPS = REPO / "backups" / "migrations"

if not OUTPUTS.exists():
    sys.exit(f"FATAL: {OUTPUTS} not found — has the sandbox finished deploying?")

with OUTPUTS.open() as f:
    cfg = json.load(f)

# Find the new table suffix by listing all DDB tables and finding the most common suffix
ddb = boto3.client("dynamodb", region_name=cfg["data"]["aws_region"])
all_tables = []
paginator = ddb.get_paginator("list_tables")
for page in paginator.paginate():
    all_tables.extend(page["TableNames"])

# Match tables like 'Requests-XXXXX-NONE' — extract suffix and find the dominant one
from collections import Counter
suffixes = Counter()
for t in all_tables:
    parts = t.split("-")
    if len(parts) == 3 and parts[-1] == "NONE":
        suffixes[parts[1]] += 1
api_id, _count = suffixes.most_common(1)[0]
print(f"DDB suffix (auto-detected from current tables): {api_id} ({_count} tables)")

# List of base table names from backup files
backup_files = sorted(BACKUPS.glob("fullchain_export_*_20250811_184652.json"))
print(f"Found {len(backup_files)} backup files\n")

# Verify each target table exists
existing = set()
paginator = ddb.get_paginator("list_tables")
for page in paginator.paginate():
    existing.update(page["TableNames"])

summary = []
for bf in backup_files:
    base = bf.stem.replace("fullchain_export_", "").rsplit("_2025", 1)[0]
    target = f"{base}-{api_id}-NONE"

    with bf.open() as f:
        items = json.load(f).get("Items", [])

    if target not in existing:
        summary.append((base, target, len(items), "TABLE_MISSING"))
        continue

    if DRY:
        summary.append((base, target, len(items), "DRY"))
        continue

    written = 0
    failed = 0
    # Batch-write 25 at a time
    for i in range(0, len(items), 25):
        chunk = items[i:i+25]
        request_items = {target: [{"PutRequest": {"Item": item}} for item in chunk]}
        retries = 0
        while request_items.get(target):
            try:
                resp = ddb.batch_write_item(RequestItems=request_items)
                unprocessed = resp.get("UnprocessedItems", {})
                request_items = unprocessed if unprocessed else {}
                written += len(chunk) - len(unprocessed.get(target, []))
                if unprocessed:
                    retries += 1
                    if retries > 5:
                        failed += len(unprocessed.get(target, []))
                        break
                    time.sleep(0.5 * retries)
                else:
                    break
            except ClientError as e:
                failed += len(chunk)
                print(f"  {base} chunk {i}: ERROR {e.response['Error']['Code']}: {e.response['Error']['Message']}")
                break

    summary.append((base, target, len(items), f"wrote={written} failed={failed}"))
    print(f"  {base}: {len(items)} -> wrote={written} failed={failed}")

print("\n=== SUMMARY ===")
print(f"{'Table':<35} {'Items':>6}  Status")
print("-" * 80)
for base, _target, count, status in summary:
    print(f"{base:<35} {count:>6}  {status}")
total_items = sum(c for _, _, c, _ in summary)
total_written = sum(int(s.split("wrote=")[1].split()[0]) for _, _, _, s in summary if "wrote=" in s)
print(f"\nTotal items in backups: {total_items}")
print(f"Total written to AWS:   {total_written}")
