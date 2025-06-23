# File Upload System Fixes

## Issues Identified & Solutions

### 1. ✅ Session ID Consistency (FIXED)
**Problem**: Each file upload generated a different timestamp folder, causing files from the same request to be scattered.
**Solution**: Generate session ID once at form initialization and pass to FileUploadField.

**Changes Made:**
- `GetEstimateForm.tsx`: Generate single `sessionId` on form mount
- `FileUploadField.tsx`: Accept `sessionId` as prop instead of generating internally
- Result: All files from same form submission go to same folder (e.g., `/20250621_223917/`)

### 2. 🔄 S3 Access Denied (IN PROGRESS)
**Problem**: Direct S3 URLs return "Access Denied" instead of displaying files inline.
**Root Cause**: Bucket policy needs public read access for `/public/*` path

**Changes Made:**
1. **Storage Configuration Update** (`amplify/storage/resource.ts`):
```typescript
'public/*': [
  allow.authenticated.to(['read', 'write']),
  allow.guest.to(['read', 'write']) // Added write permission for guests
]
```

2. **Required Deployment**: 
```bash
npx ampx sandbox  # Deploy updated storage configuration
```

### 3. ✅ S3 Bucket Policy (FIXED - TESTED SUCCESS)

**Required Steps:**
1. **Disable Block Public Access**: Go to AWS S3 Console → Bucket → Permissions → Block public access → Edit → Uncheck "Block all public access"
2. **Update Bucket Policy**: Add public read access for `/public/*` path

**Working Bucket Policy:**
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Deny",
            "Principal": {
                "AWS": "*"
            },
            "Action": "s3:*",
            "Resource": [
                "arn:aws:s3:::amplify-realtecheeclone-d-realtecheeuseruploadsbuc-p7hml7cayg9g",
                "arn:aws:s3:::amplify-realtecheeclone-d-realtecheeuseruploadsbuc-p7hml7cayg9g/*"
            ],
            "Condition": {
                "Bool": {
                    "aws:SecureTransport": "false"
                }
            }
        },
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::403266990862:role/amplify-realtecheeclone-d-CustomS3AutoDeleteObjects-CClY1JdboAhi"
            },
            "Action": [
                "s3:PutBucketPolicy",
                "s3:GetBucket*",
                "s3:List*",
                "s3:DeleteObject*"
            ],
            "Resource": [
                "arn:aws:s3:::amplify-realtecheeclone-d-realtecheeuseruploadsbuc-p7hml7cayg9g",
                "arn:aws:s3:::amplify-realtecheeclone-d-realtecheeuseruploadsbuc-p7hml7cayg9g/*"
            ]
        },
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": "*"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::amplify-realtecheeclone-d-realtecheeuseruploadsbuc-p7hml7cayg9g/public/*"
        }
    ]
}
```

**✅ VERIFIED**: Direct S3 URLs now work for inline viewing

## Current File Structure
After fixes, files will be organized as:
```
public/
└── Requests/
    └── {clean_address}/
        └── {YYYYMMDD_HHMMSS}/
            ├── images/
            │   └── {timestamp}-{filename}
            ├── videos/
            │   └── {timestamp}-{filename}
            └── docs/
                └── {timestamp}-{filename}
```

## Testing Steps ✅ COMPLETED
1. ✅ Deploy storage configuration: `npx ampx sandbox`
2. ✅ Disable "Block public access" in S3 Console
3. ✅ Apply bucket policy for public read access
4. ✅ Test file upload through contact form
5. ✅ Verify direct S3 URLs work for inline viewing
6. ✅ Confirm files from same session go to same datetime folder

## Expected URLs
Working URLs should look like:
```
https://amplify-realtecheeclone-d-realtecheeuseruploadsbuc-p7hml7cayg9g.s3.us-west-1.amazonaws.com/public/Requests/29220_deep_shadow_dr_agoura_hills_ca_91301/20250621_223917/images/1750570757724-estimate.png
```

And should display inline in browser (not trigger download).