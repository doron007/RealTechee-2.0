# Image Migration Guide: Wix to S3

## Overview

This document provides a comprehensive guide for migrating images from Wix CDN to AWS S3, resolving CORS issues and improving performance for the RealTechee platform.

## Quick Start

### Prerequisites
- AWS credentials configured with S3 and DynamoDB access
- Node.js 18+ installed
- Amplify Gen2 environment set up

### Running the Migration

```bash
# Install required dependencies
npm install @aws-sdk/client-s3 @aws-sdk/client-dynamodb tsx

# Run the complete migration (dry run first)
tsx scripts/run-image-migration.ts --dry-run

# Execute the actual migration
tsx scripts/run-image-migration.ts

# Run individual steps if needed
tsx scripts/run-image-migration.ts --step=scan-images
```

## Architecture

### S3 Folder Structure
```
s3://amplify-realtecheeclone-d-realtecheeuseruploadsbuc-hrccg1lkyuvu/
├── assets/
│   ├── projects/
│   │   ├── {normalized-address}-{project-id}/
│   │   │   ├── main-image.jpg
│   │   │   ├── gallery/
│   │   │   │   ├── {hash}-001.jpg
│   │   │   │   └── {hash}-002.jpg
│   │   │   └── documents/
│   │   │       ├── {hash}-contract.pdf
│   │   │       └── {hash}-invoice.pdf
│   │   ├── requests/
│   │   │   └── {request-id}/
│   │   ├── contacts/
│   │   │   └── {contact-id}/
│   │   └── milestones/
│   │       └── {milestone-id}/
└── public/
    └── uploads/
```

### Database Models Scanned
- **Projects**: `image`, `gallery`, `documents`
- **Requests**: `uploadedFiles`, `documents`, `gallery`
- **Contacts**: `profileImage`, `avatar`
- **Milestones**: `media`, `images`
- **Comments**: `attachments`, `media`
- **Quotes**: `documents`, `attachments`

## Migration Process

### Phase 1: Discovery (`image-scanner.ts`)
- Scans all DynamoDB tables for Wix URLs
- Identifies image fields across all models
- Generates `migration-manifest.json` with complete inventory
- Validates URL accessibility

### Phase 2: S3 Configuration (`configure-s3-permissions.ts`)
- Sets up bucket policy for public read access on `assets/*`
- Configures CORS for web access
- Creates folder structure
- Tests permissions

### Phase 3: Image Migration (`s3-migration-service.ts`)
- Downloads images from Wix CDN with retry logic
- Organizes files in S3 with deterministic naming
- Updates database records with new S3 URLs
- Handles gallery and document arrays
- Generates migration results

### Phase 4: Component Updates
- Updates `ProjectCard.tsx` to use both `image` and `imageUrl` fields
- Removes cache busting from Wix URLs to fix CORS issues
- Enhances fallback logic in `OptimizedImage.tsx`

### Phase 5: Validation
- Tests migrated URL accessibility
- Validates S3 permissions
- Checks image loading in components

## Key Files Created

### Scripts
- `scripts/image-scanner.ts` - Database scanner utility
- `scripts/s3-migration-service.ts` - Image migration service
- `scripts/configure-s3-permissions.ts` - S3 setup utility
- `scripts/run-image-migration.ts` - Master orchestration script
- `scripts/image-migration-plan.md` - Architecture documentation

### Configuration Files
- `migration-manifest.json` - Generated scan results
- `migration-results.json` - Migration execution results

### Updated Components
- `components/projects/ProjectCard.tsx` - Fixed image field mapping
- `utils/clientWixMediaUtils.ts` - Removed cache busting for Wix URLs
- `utils/serverWixMediaUtils.ts` - Removed cache busting for Wix URLs

## URL Format Changes

### Before Migration
```javascript
// Wix CDN URLs with cache busting (causing CORS issues)
"https://static.wixstatic.com/media/03839c_e52275d260244cbf9020f74628e69c22~mv2.jpeg?cb=1640995200000"
```

### After Migration
```javascript
// Clean S3 URLs with proper folder organization
"https://amplify-realtecheeclone-d-realtecheeuseruploadsbuc-hrccg1lkyuvu.s3.us-west-1.amazonaws.com/assets/projects/27543-berkshire-hills-pl-valencia-ca-91354-usa-bb20fd61/main-image.jpg"
```

## Performance Improvements

### Before
- CORS errors blocking image loads
- Cache busting preventing browser caching
- Dependency on external Wix CDN
- Inconsistent image loading

### After
- Direct S3 access with proper CORS
- Browser caching enabled (1 year cache)
- Self-hosted on AWS infrastructure
- Organized folder structure for better management
- Fallback images for missing assets

## Troubleshooting

### Common Issues

1. **S3 Permissions Error**
   ```bash
   # Check bucket policy
   aws s3api get-bucket-policy --bucket your-bucket-name
   
   # Verify CORS configuration
   aws s3api get-bucket-cors --bucket your-bucket-name
   ```

2. **DynamoDB Access Issues**
   ```bash
   # Verify table names and permissions
   aws dynamodb list-tables --region us-west-1
   ```

3. **Image Download Failures**
   - Wix URLs may have temporary blocks
   - Retry logic handles most failures
   - Check `migration-results.json` for failed URLs

4. **Component Not Loading Images**
   - Verify both `image` and `imageUrl` fields are checked
   - Ensure fallback images exist in `/assets/images/`
   - Check browser console for CORS errors

### Migration Verification

```bash
# Test a sample of migrated URLs
tsx scripts/validate-migration.ts

# Check S3 bucket contents
aws s3 ls s3://your-bucket-name/assets/ --recursive --human-readable

# Verify database updates
tsx scripts/verify-database-updates.ts
```

## Security Considerations

### S3 Bucket Policy
- Public read access limited to `assets/*` and `public/*` paths
- No write permissions for public users
- CORS configured for specific domains only

### Image Processing
- File type validation during upload
- Size limits enforced
- Malicious file detection

## Performance Metrics

### Expected Improvements
- **Image Load Time**: 30-50% faster (no Wix CDN latency)
- **CORS Errors**: 100% elimination
- **Cache Hit Rate**: 90%+ with 1-year cache headers
- **CDN Distribution**: Optional CloudFront integration

### Monitoring
- CloudWatch metrics for S3 access
- Application logs for image loading errors
- Regular validation of migrated URLs

## Migration Rollback

### Emergency Rollback
```bash
# Revert component changes
git checkout HEAD~1 components/projects/ProjectCard.tsx
git checkout HEAD~1 utils/clientWixMediaUtils.ts

# Database rollback (if needed)
tsx scripts/rollback-database-urls.ts
```

### Partial Rollback
- Individual URLs can be reverted in database
- Original Wix URLs preserved in migration manifest
- Gradual rollback possible by table/model

## Next Steps

### Post-Migration Tasks
1. **CloudFront Setup** (Optional)
   - Create CloudFront distribution for S3 bucket
   - Configure custom domain
   - Enable compression and caching

2. **Image Optimization** (Future Enhancement)
   - Implement WebP conversion
   - Multiple size generation for responsive images
   - Lazy loading optimization

3. **Monitoring & Alerts**
   - Set up CloudWatch alarms for S3 errors
   - Monitor image loading performance
   - Track migration success metrics

### Maintenance
- Regular validation of image URLs
- Cleanup of unused images
- Performance monitoring and optimization

## Support & Contact

For issues with the migration process:
1. Check logs in `migration-results.json`
2. Verify AWS credentials and permissions
3. Review CLAUDE.md for project context
4. Test individual components in development mode

## Changelog

### Version 1.0 (Initial Implementation)
- Complete Wix to S3 migration system
- Automated scanning and migration
- Component updates for seamless integration
- Comprehensive documentation and validation