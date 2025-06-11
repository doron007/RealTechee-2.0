#!/usr/bin/env node
/**
 * Full-Stack Debug Coordinator
 * Manages Amplify sandbox and Next.js debug server coordination
 */

const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const AMPLIFY_PORT = 3001; // Default Amplify sandbox port
const NEXTJS_PORT = 3000;  // We'll run Next.js on a different port when Amplify is running

class FullStackDebugger {
  constructor() {
    this.amplifyProcess = null;
    this.nextjsProcess = null;
    this.isShuttingDown = false;
  }

  async log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${type}]`;
    console.log(`${prefix} ${message}`);
  }

  async checkAmplifyRunning() {
    try {
      // Check if any process is using the Amplify sandbox port
      const { stdout } = await execAsync(`lsof -ti:${AMPLIFY_PORT} 2>/dev/null || echo ""`);
      if (stdout.trim()) {
        await this.log('Amplify sandbox appears to be running on port 3001');
        return true;
      }

      // Check for ampx sandbox process specifically
      const { stdout: psOut } = await execAsync(`ps aux | grep "ampx sandbox" | grep -v grep || echo ""`);
      if (psOut.trim()) {
        await this.log('Found running ampx sandbox process');
        return true;
      }

      return false;
    } catch (error) {
      await this.log(`Error checking Amplify status: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async startAmplifyIfNeeded() {
    const isRunning = await this.checkAmplifyRunning();
    
    if (isRunning) {
      await this.log('Amplify sandbox is already running');
      return true;
    }

    await this.log('Starting Amplify sandbox...');
    
    return new Promise((resolve, reject) => {
      this.amplifyProcess = spawn('npx', ['ampx', 'sandbox'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd: process.cwd()
      });

      let started = false;
      const timeout = setTimeout(() => {
        if (!started) {
          reject(new Error('Amplify sandbox startup timeout'));
        }
      }, 60000); // 60 second timeout

      this.amplifyProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`[AMPLIFY] ${output}`);
        
        // Look for indicators that Amplify is ready
        if (output.includes('Watching for file changes') || 
            output.includes('Sandbox is running') ||
            output.includes('Started backend')) {
          if (!started) {
            started = true;
            clearTimeout(timeout);
            this.log('Amplify sandbox is ready!');
            resolve(true);
          }
        }
      });

      this.amplifyProcess.stderr.on('data', (data) => {
        console.error(`[AMPLIFY ERROR] ${data}`);
      });

      this.amplifyProcess.on('error', (error) => {
        clearTimeout(timeout);
        this.log(`Failed to start Amplify sandbox: ${error.message}`, 'ERROR');
        reject(error);
      });

      this.amplifyProcess.on('exit', (code) => {
        if (!started) {
          clearTimeout(timeout);
          reject(new Error(`Amplify sandbox exited with code ${code}`));
        }
      });
    });
  }

  async startNextJsDebug() {
    await this.log('Starting Next.js debug server...');
    
    // Determine which port to use for Next.js
    const isAmplifyOn3001 = await this.checkAmplifyRunning();
    const nextjsPort = isAmplifyOn3001 ? NEXTJS_PORT : AMPLIFY_PORT;
    
    const env = {
      ...process.env,
      NODE_OPTIONS: '--inspect',
      PORT: nextjsPort.toString()
    };

    return new Promise((resolve, reject) => {
      this.nextjsProcess = spawn('npm', ['run', 'dev:debug'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd: process.cwd(),
        env
      });

      let started = false;
      const timeout = setTimeout(() => {
        if (!started) {
          reject(new Error('Next.js debug server startup timeout'));
        }
      }, 30000); // 30 second timeout

      this.nextjsProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`[NEXT.JS] ${output}`);
        
        // Look for Next.js ready indicators
        if (output.includes('Ready in') || 
            output.includes('started server on') ||
            output.includes('Local:')) {
          if (!started) {
            started = true;
            clearTimeout(timeout);
            this.log(`Next.js debug server is ready on port ${nextjsPort}!`);
            this.log(`🚀 Full-stack debugging environment is ready!`);
            this.log(`   Backend (Amplify): http://localhost:3001`);
            this.log(`   Frontend (Next.js): http://localhost:${nextjsPort}`);
            resolve(true);
          }
        }
      });

      this.nextjsProcess.stderr.on('data', (data) => {
        const output = data.toString();
        console.error(`[NEXT.JS ERROR] ${output}`);
        
        // Next.js sometimes logs important info to stderr
        if (output.includes('Ready in') || output.includes('started server on')) {
          if (!started) {
            started = true;
            clearTimeout(timeout);
            this.log(`Next.js debug server is ready on port ${nextjsPort}!`);
            resolve(true);
          }
        }
      });

      this.nextjsProcess.on('error', (error) => {
        clearTimeout(timeout);
        this.log(`Failed to start Next.js debug server: ${error.message}`, 'ERROR');
        reject(error);
      });

      this.nextjsProcess.on('exit', (code) => {
        if (!started) {
          clearTimeout(timeout);
          reject(new Error(`Next.js debug server exited with code ${code}`));
        }
      });
    });
  }

  async shutdown() {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    await this.log('Shutting down debug environment...');

    const promises = [];

    if (this.nextjsProcess && !this.nextjsProcess.killed) {
      promises.push(new Promise((resolve) => {
        this.nextjsProcess.kill('SIGTERM');
        this.nextjsProcess.on('exit', () => {
          this.log('Next.js debug server stopped');
          resolve();
        });
        // Force kill after 5 seconds
        setTimeout(() => {
          if (!this.nextjsProcess.killed) {
            this.nextjsProcess.kill('SIGKILL');
            resolve();
          }
        }, 5000);
      }));
    }

    // Note: We don't kill Amplify sandbox here as it might be used by other processes
    // Users can manually stop it if needed

    await Promise.all(promises);
    await this.log('Debug environment shutdown complete');
    process.exit(0);
  }

  async start() {
    try {
      await this.log('🚀 Starting Full-Stack Debug Environment...');
      
      // Setup graceful shutdown
      process.on('SIGINT', () => this.shutdown());
      process.on('SIGTERM', () => this.shutdown());
      process.on('exit', () => this.shutdown());

      // Step 1: Ensure Amplify sandbox is running
      await this.startAmplifyIfNeeded();
      
      // Small delay to ensure Amplify is fully ready
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 2: Start Next.js debug server
      await this.startNextJsDebug();
      
      // Keep the process alive
      await this.log('Press Ctrl+C to stop the debug environment');
      
      // Keep alive
      setInterval(() => {
        // Check if processes are still running
        if (this.nextjsProcess && this.nextjsProcess.killed) {
          this.log('Next.js process died, shutting down...', 'ERROR');
          this.shutdown();
        }
      }, 5000);

    } catch (error) {
      await this.log(`Failed to start debug environment: ${error.message}`, 'ERROR');
      await this.shutdown();
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const coordinator = new FullStackDebugger();
  coordinator.start();
}

module.exports = FullStackDebugger;
