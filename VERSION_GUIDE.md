# RealTechee Versioning Guide

This document outlines the versioning strategy for the RealTechee 2.0 application to ensure consistent tracking between Git versions and deployed applications.

## Versioning Strategy

We follow [Semantic Versioning](https://semver.org/) (MAJOR.MINOR.PATCH):

- **MAJOR version**: Incompatible API changes
- **MINOR version**: Backwards-compatible functionality
- **PATCH version**: Backwards-compatible bug fixes

## Deployment Branches

- **main**: Development branch
- **prod**: Production branch connected to AWS Amplify deployment

## Version Management Workflow

### For Bug Fixes

1. Make your code changes in a feature branch or directly in `main`
2. When ready to deploy to production:

```bash
# Ensure you're on the main branch with latest changes
git checkout main
git pull

# Increment the patch version
npm run version:patch
# This will:
# - Update package.json version (e.g. 1.0.0 -> 1.0.1)
# - Create a git commit for the version bump
# - Create a git tag (v1.0.1)

# Push changes including the new tag
git push && git push --tags

# Merge to prod branch and deploy
git checkout prod
git merge main
git push origin prod
```

### For New Features

Follow the same workflow, but use `npm run version:minor` instead of `version:patch`.

### For Major Releases

Follow the same workflow, but use `npm run version:major` instead of `version:patch`.

## Version Tracking in Deployed Application

Each deployment includes:

1. Visible version number in the website footer
2. `/meta/build-info.json` endpoint with detailed build information
3. Environment variables with version information

## Debugging Using Version Information

When a bug is reported:

1. Ask users to provide the version number from the footer
2. Use this to identify the corresponding Git tag (`v1.0.1`)
3. Check out that specific version to debug:

```bash
git checkout v1.0.1
```

## AWS Amplify Setup

Our AWS Amplify configuration is connected to the `prod` branch and automatically:

1. Extracts version from package.json
2. Generates detailed build information
3. Includes version in the deployed application

## Additional Tools

- `npm run version:patch`: Bump patch version (bug fixes)
- `npm run version:minor`: Bump minor version (new features)
- `npm run version:major`: Bump major version (breaking changes)
- `npm run deploy:prod`: Push changes to production branch