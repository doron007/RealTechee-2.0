/**
 * Script to generate build information at deploy time
 * This creates a JSON file with version, build time and git information
 * that can be used for debugging and tracking deployments
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const package = require('../../package.json');

// Get git information
function getGitInfo() {
  try {
    const gitCommitId = execSync('git rev-parse HEAD').toString().trim();
    const gitBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    const gitTag = execSync('git describe --tags --abbrev=0 2>/dev/null || echo ""').toString().trim();
    
    return {
      commit: gitCommitId,
      branch: gitBranch,
      tag: gitTag || undefined
    };
  } catch (error) {
    console.warn('Unable to get git information:', error.message);
    return {
      commit: 'unknown',
      branch: 'unknown'
    };
  }
}

// Main function to generate build info
function generateBuildInfo() {
  const buildInfo = {
    name: package.name,
    version: package.version,
    buildTime: new Date().toISOString(),
    nodeVersion: process.version,
    git: getGitInfo()
  };

  // Check if we're running in AWS Amplify
  if (process.env.AWS_AMPLIFY) {
    buildInfo.amplify = {
      appId: process.env.AWS_APP_ID,
      branch: process.env.AWS_BRANCH,
      buildId: process.env.AWS_BUILD_ID
    };
  }

  const outputDir = path.resolve(__dirname, '../../public/meta');
  const outputFile = path.join(outputDir, 'build-info.json');

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write to file
  fs.writeFileSync(outputFile, JSON.stringify(buildInfo, null, 2));
  console.log(`Build info generated at ${outputFile}`);

  // Also write version to environment for Next.js
  fs.appendFileSync(path.resolve(__dirname, '../../.env.local'), 
    `\nNEXT_PUBLIC_APP_VERSION=${package.version}\n`);
  
  return buildInfo;
}

// Execute if run directly
if (require.main === module) {
  generateBuildInfo();
} else {
  module.exports = generateBuildInfo;
}