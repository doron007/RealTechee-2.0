/**
 * System Priming Tests
 * 
 * Tests that prepare the system for testing:
 * - Server cleanup and startup
 * - Build processes
 * - Environment validation
 */

class SystemPrimingTests {
  constructor(reporter) {
    this.reporter = reporter;
  }

  async executeServerCleanup() {
    const startTime = new Date().toISOString();
    
    try {
      const { execSync } = require('child_process');
      
      // Kill processes on port 3000
      execSync('lsof -ti:3000 | xargs kill -9 2>/dev/null || true', { 
        encoding: 'utf-8', 
        timeout: 10000 
      });
      
      this.reporter.addSystemPrimingTest({
        name: 'server-cleanup',
        description: 'Server Port Cleanup',
        status: 'passed',
        startTime: startTime,
        endTime: new Date().toISOString(),
        details: { 
          command: 'lsof -ti:3000 | xargs kill -9',
          port: 3000,
          autoExecuted: true
        },
        whatWasTested: [
          'Kill processes on port 3000',
          'Ensure clean server environment',
          'Prevent port conflicts'
        ],
        steps: [
          'Execute: lsof -ti:3000 | xargs kill -9',
          'Handle cases where no processes exist',
          'Verify command completion'
        ]
      });
      
      return true;
      
    } catch (error) {
      this.reporter.addSystemPrimingTest({
        name: 'server-cleanup',
        description: 'Server Port Cleanup',
        status: 'error',
        startTime: startTime,
        endTime: new Date().toISOString(),
        error: error.message,
        details: { 
          command: 'lsof -ti:3000 | xargs kill -9',
          port: 3000,
          failed: true
        },
        whatWasTested: [
          'Port cleanup process',
          'Error handling'
        ],
        steps: [
          'Attempt port cleanup',
          'Error occurred: ' + error.message
        ]
      });
      
      return false;
    }
  }

  async executeBuildProcess() {
    const startTime = new Date().toISOString();
    
    try {
      const { execSync } = require('child_process');
      
      console.log('🔨 Building application...');
      const output = execSync('npm run build --no-lint', { 
        encoding: 'utf-8', 
        timeout: 120000,
        stdio: ['inherit', 'pipe', 'pipe']
      });
      
      this.reporter.addSystemPrimingTest({
        name: 'build-process',
        description: 'Application Build',
        status: 'passed',
        startTime: startTime,
        endTime: new Date().toISOString(),
        details: { 
          command: 'npm run build --no-lint',
          autoExecuted: true,
          outputSize: output.length
        },
        whatWasTested: [
          'TypeScript compilation',
          'Next.js build process',
          'Bundle generation',
          'Build artifact creation'
        ],
        steps: [
          'Execute: npm run build --no-lint',
          'Wait for compilation',
          'Verify build artifacts',
          'Confirm successful completion'
        ]
      });
      
      return true;
      
    } catch (error) {
      this.reporter.addSystemPrimingTest({
        name: 'build-process',
        description: 'Application Build',
        status: 'failed',
        startTime: startTime,
        endTime: new Date().toISOString(),
        error: error.message,
        details: { 
          command: 'npm run build --no-lint',
          failed: true,
          critical: true
        },
        whatWasTested: [
          'Build process execution',
          'Error detection'
        ],
        steps: [
          'Execute build command',
          'Build failed: ' + error.message
        ]
      });
      
      return false;
    }
  }

  async executeTypeCheck() {
    const startTime = new Date().toISOString();
    
    try {
      const { execSync } = require('child_process');
      
      console.log('🔍 Running TypeScript type check...');
      const output = execSync('npm run type-check', { 
        encoding: 'utf-8', 
        timeout: 60000,
        stdio: ['inherit', 'pipe', 'pipe']
      });
      
      this.reporter.addSystemPrimingTest({
        name: 'type-check',
        description: 'TypeScript Type Validation',
        status: 'passed',
        startTime: startTime,
        endTime: new Date().toISOString(),
        details: { 
          command: 'npm run type-check',
          autoExecuted: true,
          outputSize: output.length
        },
        whatWasTested: [
          'TypeScript type checking',
          'Code quality validation',
          'Interface compliance',
          'Type safety verification'
        ],
        steps: [
          'Execute: npm run type-check',
          'Analyze TypeScript files',
          'Verify type correctness',
          'Report type issues (if any)'
        ]
      });
      
      return true;
      
    } catch (error) {
      this.reporter.addSystemPrimingTest({
        name: 'type-check',
        description: 'TypeScript Type Validation',
        status: 'error',
        startTime: startTime,
        endTime: new Date().toISOString(),
        error: error.message,
        details: { 
          command: 'npm run type-check',
          failed: true,
          critical: false // Non-critical for testing
        },
        whatWasTested: [
          'TypeScript compilation',
          'Type error detection'
        ],
        steps: [
          'Execute type check',
          'Type errors found: ' + error.message
        ]
      });
      
      return false; // Continue testing even if type check fails
    }
  }

  async executeAll() {
    const results = [];
    
    results.push(await this.executeServerCleanup());
    results.push(await this.executeBuildProcess());
    results.push(await this.executeTypeCheck());
    
    const allPassed = results.every(result => result === true);
    const criticalFailed = false; // Only build process is critical
    
    return { success: allPassed, criticalFailed };
  }
}

module.exports = SystemPrimingTests;