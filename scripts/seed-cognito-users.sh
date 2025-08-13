#!/usr/bin/env bash
# Seed required Cognito users & groups into a target user pool.
# Usage:
#   ./scripts/seed-cognito-users.sh \
#     --region us-west-1 \
#     --user-pool-id <POOL_ID> \
#     --email info@realtechee.com:super_admin \
#     --email doron.hetz@gmail.com:guest \
#     --password 'Sababa123!'
# Repeat for staging and production pools.
# Idempotent: re-creates missing groups, sets temp password if user absent, adds to group if not present.
# Requires: aws cli v2 with cognito-idp permissions: ListUsers, AdminCreateUser, AdminSetUserPassword, CreateGroup, ListGroups, AdminAddUserToGroup

set -euo pipefail

COLOR_YELLOW="\033[33m"; COLOR_GREEN="\033[32m"; COLOR_RESET="\033[0m"; COLOR_RED="\033[31m";

echo_header() { echo -e "${COLOR_YELLOW}\n==> $1${COLOR_RESET}"; }
echo_success() { echo -e "${COLOR_GREEN}$1${COLOR_RESET}"; }
echo_error() { echo -e "${COLOR_RED}$1${COLOR_RESET}"; }

REGION=""; USER_POOL_ID=""; PASSWORD=""; declare -a EMAIL_ROLE_PAIRS; FORCE="false";

while [[ $# -gt 0 ]]; do
  case "$1" in
    --region) REGION="$2"; shift 2;;
    --user-pool-id) USER_POOL_ID="$2"; shift 2;;
    --password) PASSWORD="$2"; shift 2;;
    --email) EMAIL_ROLE_PAIRS+=("$2"); shift 2;;
    --force) FORCE="true"; shift; ;;
    -h|--help)
      grep '^#' "$0" | sed 's/^# //'; exit 0;;
    *) echo_error "Unknown arg: $1"; exit 1;;
  esac
done

if [[ -z "$REGION" || -z "$USER_POOL_ID" || -z "$PASSWORD" || ${#EMAIL_ROLE_PAIRS[@]} -eq 0 ]]; then
  echo_error "Missing required args. Use --help"; exit 1;
fi

# Basic password validation (Amplify / Cognito default: min 8 chars, needs complexity) – you provided one.
if [[ ${#PASSWORD} -lt 8 ]]; then
  echo_error "Password too short"; exit 1;
fi

# Ensure AWS CLI works
aws sts get-caller-identity >/dev/null || { echo_error "AWS CLI not authenticated"; exit 1; }

echo_header "Seeding users into pool $USER_POOL_ID ($REGION)"

# Collect unique groups (portable for older bash versions)
GROUP_LIST=""
for pair in "${EMAIL_ROLE_PAIRS[@]}"; do
  role="${pair#*:}"
  if ! echo "$GROUP_LIST" | tr ' ' '\n' | grep -qx "$role"; then
    GROUP_LIST="$GROUP_LIST $role"
  fi
done

# Create groups if missing
for group in $GROUP_LIST; do
  if ! aws cognito-idp get-group --group-name "$group" --user-pool-id "$USER_POOL_ID" --region "$REGION" >/dev/null 2>&1; then
    echo_header "Creating group: $group";
    aws cognito-idp create-group --group-name "$group" --user-pool-id "$USER_POOL_ID" --region "$REGION" >/dev/null
    echo_success "Group created: $group"
  else
    echo_success "Group exists: $group"
  fi
done

echo_header "Processing users"
for pair in "${EMAIL_ROLE_PAIRS[@]}"; do
  email="${pair%%:*}"; role="${pair#*:}";
  username="$email" # using email as username
  existing=$(aws cognito-idp list-users --user-pool-id "$USER_POOL_ID" --region "$REGION" --filter "username=\"$username\"" --query 'Users[0].Username' --output text)
  if [[ "$existing" == "None" ]]; then
    echo_header "Creating user: $email ($role)";
    aws cognito-idp admin-create-user \
      --user-pool-id "$USER_POOL_ID" \
      --region "$REGION" \
      --username "$username" \
      --user-attributes Name=email,Value="$email" Name=email_verified,Value=true Name=custom:role,Value="$role" \
      --message-action SUPPRESS >/dev/null
    # Set permanent password
    aws cognito-idp admin-set-user-password --user-pool-id "$USER_POOL_ID" --region "$REGION" --username "$username" --password "$PASSWORD" --permanent
    echo_success "User created: $email"
  else
    echo_success "User exists: $email"
    if [[ "$FORCE" == "true" ]]; then
      echo_header "Forcing password reset + role attribute update for $email";
      aws cognito-idp admin-update-user-attributes --user-pool-id "$USER_POOL_ID" --region "$REGION" --username "$username" --user-attributes Name=custom:role,Value="$role" >/dev/null
      aws cognito-idp admin-set-user-password --user-pool-id "$USER_POOL_ID" --region "$REGION" --username "$username" --password "$PASSWORD" --permanent
    fi
  fi
  # Add to group
  if aws cognito-idp admin-add-user-to-group --user-pool-id "$USER_POOL_ID" --region "$REGION" --username "$username" --group-name "$role" >/dev/null 2>&1; then
    echo_success "Added $email to $role group"
  else
    echo_error "Failed adding $email to $role group"
  fi
  # Ensure custom:role attribute present
  aws cognito-idp admin-update-user-attributes --user-pool-id "$USER_POOL_ID" --region "$REGION" --username "$username" --user-attributes Name=custom:role,Value="$role" >/dev/null

done

echo_header "Summary"
for pair in "${EMAIL_ROLE_PAIRS[@]}"; do echo " - ${pair%%:*} => ${pair#*:}"; done

echo_success "Seeding complete."
