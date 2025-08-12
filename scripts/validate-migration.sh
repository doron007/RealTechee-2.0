#!/bin/bash

# Quick validation script for data migration
# Compares counts across legacy → staging → production

LEGACY_SUFFIX="${LEGACY_SUFFIX:?LEGACY_SUFFIX env required}"  # Phase5 hardened
STAGING_SUFFIX="${STAGING_SUFFIX:?STAGING_SUFFIX env required}"  # Phase5 hardened
PRODUCTION_SUFFIX="${PRODUCTION_SUFFIX:?PRODUCTION_SUFFIX env required}"  # Phase5 hardened
AWS_REGION="${AWS_REGION:-us-west-1}"

declare -a TABLES=(
    "Affiliates" "AppPreferences" "AuditLog" "Auth" "BackOfficeAssignTo"
    "BackOfficeBookingStatuses" "BackOfficeBrokerage" "BackOfficeNotifications"
    "BackOfficeProducts" "BackOfficeProjectStatuses" "BackOfficeQuoteStatuses"
    "BackOfficeRequestStatuses" "BackOfficeRoleTypes" "ContactAuditLog"
    "ContactUs" "Contacts" "EmailSuppressionList" "Legal" "MemberSignature"
    "NotificationEvents" "NotificationQueue" "NotificationTemplate"
    "PendingAppoitments" "ProjectComments" "ProjectMilestones"
    "ProjectPaymentTerms" "ProjectPermissions" "Projects" "Properties"
    "QuoteItems" "Quotes" "Requests" "SESReputationMetrics" "SecureConfig"
    "eSignatureDocuments"
)

get_scan_count() {
    local table_name="$1"
    aws dynamodb scan --table-name "$table_name" --region "$AWS_REGION" --select "COUNT" --query 'Count' --output text 2>/dev/null || echo "0"
}

echo "🔍 MIGRATION VALIDATION REPORT (suffixes: legacy=$LEGACY_SUFFIX staging=$STAGING_SUFFIX prod=$PRODUCTION_SUFFIX)"
echo "=============================="
echo "Timestamp: $(date)"
echo ""
echo "| Table | Legacy | Staging | Production | Status |"
echo "|-------|--------|---------|------------|--------|"

total_legacy=0
total_staging=0
total_production=0
success_count=0
error_count=0

for table in "${TABLES[@]}"; do
    legacy_table="${table}-${LEGACY_SUFFIX}-NONE"
    staging_table="${table}-${STAGING_SUFFIX}-NONE"
    production_table="${table}-${PRODUCTION_SUFFIX}-NONE"
    
    legacy_count=$(get_scan_count "$legacy_table")
    staging_count=$(get_scan_count "$staging_table")
    production_count=$(get_scan_count "$production_table")
    
    total_legacy=$((total_legacy + legacy_count))
    total_staging=$((total_staging + staging_count))
    total_production=$((total_production + production_count))
    
    if [[ "$legacy_count" == "$staging_count" && "$staging_count" == "$production_count" ]]; then
        status="✅ OK"
        ((success_count++))
    else
        status="❌ MISMATCH"
        ((error_count++))
    fi
    
    printf "| %-20s | %6s | %7s | %10s | %s |\n" "$table" "$legacy_count" "$staging_count" "$production_count" "$status"
done

echo "|-------|--------|---------|------------|--------|"
printf "| %-20s | %6s | %7s | %10s | |\n" "TOTALS" "$total_legacy" "$total_staging" "$total_production"
echo ""
echo "📊 SUMMARY:"
echo "  ✅ Successful tables: $success_count"
echo "  ❌ Mismatched tables: $error_count"
echo "  📦 Total records migrated: $total_legacy"
echo ""

if [[ $error_count -eq 0 ]]; then
    echo "🎉 MIGRATION SUCCESSFUL! All data integrity checks passed."
else
    echo "⚠️  Some tables have mismatched counts. Review the report above."
fi