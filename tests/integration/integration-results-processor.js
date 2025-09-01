/**
 * Integration Test Results Processor
 * 
 * Processes and reports integration test results:
 * - Performance metrics collection
 * - Integration coverage analysis
 * - Backend layer validation reporting
 */

const fs = require('fs');
const path = require('path');
const { createLogger } = require('../../utils/logger');

const logger = createLogger('IntegrationResultsProcessor');

module.exports = (results) => {
  logger.info('📈 Processing Integration Test Results');

  const summary = {
    timestamp: new Date().toISOString(),
    totalTests: results.numTotalTests,
    passedTests: results.numPassedTests,
    failedTests: results.numFailedTests,
    testSuites: results.numTotalTestSuites,
    coverage: results.coverageMap ? {
      statements: results.coverageMap.getCoverageSummary().statements.pct,
      branches: results.coverageMap.getCoverageSummary().branches.pct,
      functions: results.coverageMap.getCoverageSummary().functions.pct,
      lines: results.coverageMap.getCoverageSummary().lines.pct
    } : null,
    duration: results.testResults.reduce((total, suite) => {
      return total + (suite.perfStats?.end - suite.perfStats?.start || 0);
    }, 0),
    integrationValidations: {}
  };

  // Analyze integration test results by category
  results.testResults.forEach(suiteResult => {
    const suiteName = path.basename(suiteResult.testFilePath, '.test.js');
    
    summary.integrationValidations[suiteName] = {
      tests: suiteResult.testResults.length,
      passed: suiteResult.testResults.filter(test => test.status === 'passed').length,
      failed: suiteResult.testResults.filter(test => test.status === 'failed').length,
      duration: suiteResult.perfStats?.end - suiteResult.perfStats?.start || 0,
      failureMessages: suiteResult.testResults
        .filter(test => test.status === 'failed')
        .map(test => ({
          testName: test.title,
          message: test.failureMessages[0]
        }))
    };
  });

  // Generate integration confidence score
  const integrationConfidenceScore = calculateIntegrationConfidence(summary);
  summary.integrationConfidenceScore = integrationConfidenceScore;

  // Save detailed results
  const reportsDir = path.join(__dirname, '../../test-reports/integration');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const reportPath = path.join(reportsDir, 'integration-summary.json');
  fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));

  // Generate integration validation report
  generateIntegrationReport(summary, reportsDir);

  logger.info('✅ Integration Test Results Processed', {
    totalTests: summary.totalTests,
    passedTests: summary.passedTests,
    failedTests: summary.failedTests,
    integrationConfidence: `${integrationConfidenceScore}%`,
    reportSaved: reportPath
  });

  return results;
};

function calculateIntegrationConfidence(summary) {
  let score = 0;
  let maxScore = 0;

  // Test success rate (40% of total score)
  const testSuccessRate = summary.totalTests > 0 ? 
    (summary.passedTests / summary.totalTests) * 100 : 0;
  score += (testSuccessRate / 100) * 40;
  maxScore += 40;

  // Coverage metrics (30% of total score)
  if (summary.coverage) {
    const avgCoverage = (
      summary.coverage.statements +
      summary.coverage.branches +
      summary.coverage.functions +
      summary.coverage.lines
    ) / 4;
    score += (avgCoverage / 100) * 30;
  }
  maxScore += 30;

  // Integration layer validation (30% of total score)
  const layerValidations = Object.keys(summary.integrationValidations);
  const requiredLayers = [
    'service-to-hook-integration',
    'end-to-end-data-flow', 
    'error-boundary-resilience',
    'repository-service-integration'
  ];

  const layerScore = requiredLayers.reduce((acc, layer) => {
    const validation = layerValidations.find(v => v.includes(layer.split('-')[0]));
    if (validation && summary.integrationValidations[validation]) {
      const layerSummary = summary.integrationValidations[validation];
      const layerSuccessRate = layerSummary.tests > 0 ? 
        (layerSummary.passed / layerSummary.tests) : 0;
      return acc + layerSuccessRate;
    }
    return acc;
  }, 0);

  score += (layerScore / requiredLayers.length) * 30;
  maxScore += 30;

  return Math.round((score / maxScore) * 100);
}

function generateIntegrationReport(summary, reportsDir) {
  const report = `
# Backend Integration Test Report

**Generated:** ${summary.timestamp}

## 🎯 Integration Confidence Score: ${summary.integrationConfidenceScore}%

## 📊 Test Summary
- **Total Tests:** ${summary.totalTests}
- **Passed:** ${summary.passedTests}
- **Failed:** ${summary.failedTests}
- **Success Rate:** ${Math.round((summary.passedTests / summary.totalTests) * 100)}%
- **Duration:** ${summary.duration}ms

${summary.coverage ? `## 📈 Coverage Metrics
- **Statements:** ${summary.coverage.statements}%
- **Branches:** ${summary.coverage.branches}%
- **Functions:** ${summary.coverage.functions}%
- **Lines:** ${summary.coverage.lines}%` : ''}

## 🔗 Integration Layer Validation

${Object.entries(summary.integrationValidations).map(([layer, validation]) => `
### ${layer.replace(/-/g, ' ').toUpperCase()}
- **Tests:** ${validation.tests}
- **Passed:** ${validation.passed}
- **Failed:** ${validation.failed}
- **Duration:** ${validation.duration}ms
- **Success Rate:** ${Math.round((validation.passed / validation.tests) * 100)}%

${validation.failureMessages.length > 0 ? `**Failures:**
${validation.failureMessages.map(failure => `- ${failure.testName}: ${failure.message}`).join('\n')}` : '✅ All tests passed'}
`).join('\n')}

## 🎉 Backend Integration Status

${summary.integrationConfidenceScore >= 90 ? 
  '✅ **EXCELLENT** - Backend layers are fully integrated and production-ready' :
  summary.integrationConfidenceScore >= 80 ? 
    '✅ **GOOD** - Backend integration is solid with minor issues to address' :
    summary.integrationConfidenceScore >= 70 ?
      '⚠️ **NEEDS IMPROVEMENT** - Some integration issues need to be resolved' :
      '❌ **CRITICAL** - Major integration problems require immediate attention'
}

---
*This report validates that all backend layers (Repository ↔ Service ↔ Hooks) work together correctly.*
`;

  fs.writeFileSync(path.join(reportsDir, 'integration-report.md'), report);
};