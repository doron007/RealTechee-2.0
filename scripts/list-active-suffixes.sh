#!/bin/bash

# Enumerate active backend suffixes by inspecting DynamoDB table names (*-<suffix>-NONE).
# Usage: ./scripts/list-active-suffixes.sh
# Optional env: AWS_REGION (default us-west-1)

set -euo pipefail

AWS_REGION="${AWS_REGION:-us-west-1}"

if ! command -v aws >/dev/null 2>&1; then
  echo "aws CLI not installed" >&2
  exit 1
fi

tables_json=$(aws dynamodb list-tables --region "$AWS_REGION" --output json 2>/dev/null || echo '{"TableNames":[]}')

tables=()
if command -v jq >/dev/null 2>&1; then
  while IFS= read -r line; do
    tables+=("$line")
  done < <(echo "$tables_json" | jq -r '.TableNames[]')
else
  # Fallback: parse with node (jq not installed)
  while IFS= read -r line; do
    tables+=("$line")
  done < <(echo "$tables_json" | node -e 'let d="";process.stdin.on("data",c=>d+=c);process.stdin.on("end",()=>{try{let j=JSON.parse(d);(j.TableNames||[]).forEach(t=>console.log(t));}catch(e){}});')
fi

suffix_keys=()
suffix_counts=()
suffix_samples=()

add_or_increment() {
  local key="$1" table="$2"
  local idx=-1
  local i=0
  for existing in "${suffix_keys[@]}"; do
    if [[ "$existing" == "$key" ]]; then idx=$i; break; fi
    i=$((i+1))
  done
  if [[ $idx -ge 0 ]]; then
    suffix_counts[$idx]=$(( ${suffix_counts[$idx]} + 1 ))
  else
    suffix_keys+=("$key")
    suffix_counts+=(1)
    suffix_samples+=("$table")
  fi
}

for t in "${tables[@]}"; do
  if [[ $t =~ -([a-z0-9]{24})-NONE$ ]]; then
    add_or_increment "${BASH_REMATCH[1]}" "$t"
  fi
done

echo "Active backend suffixes (region: $AWS_REGION)"
echo "Suffix,TableCount,SampleTable"
for i in "${!suffix_keys[@]}"; do
  echo "${suffix_keys[$i]},${suffix_counts[$i]},${suffix_samples[$i]}"
done | sort -t, -k2 -nr

exit 0
