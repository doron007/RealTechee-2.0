/**
 * Enterprise Test Utilities
 * 
 * Advanced testing utilities for enterprise-grade test suites including
 * load testing, stress testing, and complex scenario orchestration.
 */

export class LoadTestRunner {
  constructor(options = {}) {
    this.concurrency = options.concurrency || 5;
    this.duration = options.duration || 60000; // 1 minute
    this.rampUp = options.rampUp || 10000; // 10 seconds
    this.metrics = {
      requests: 0,
      failures: 0,
      responseTimes: [],
      errors: []
    };
  }

  /**
   * Run load test with specified scenario
   */
  async runLoadTest(scenario, context) {
    console.log(`🔥 Starting load test: ${this.concurrency} users over ${this.duration}ms`);
    
    const startTime = Date.now();
    const workers = [];
    
    // Ramp up users gradually
    for (let i = 0; i < this.concurrency; i++) {
      const delay = (this.rampUp / this.concurrency) * i;
      
      workers.push(
        new Promise(resolve => {
          setTimeout(async () => {
            await this.runWorker(scenario, context, startTime);
            resolve();
          }, delay);
        })
      );
    }
    
    // Wait for all workers to complete
    await Promise.all(workers);
    
    return this.generateLoadTestReport();
  }

  /**
   * Individual worker execution
   */
  async runWorker(scenario, context, startTime) {
    const page = await context.newPage();
    
    try {
      while (Date.now() - startTime < this.duration) {
        const requestStart = Date.now();
        
        try {
          await scenario(page);
          this.metrics.requests++;
          this.metrics.responseTimes.push(Date.now() - requestStart);
        } catch (error) {
          this.metrics.failures++;
          this.metrics.errors.push({
            timestamp: Date.now(),
            error: error.message
          });
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } finally {
      await page.close();
    }
  }

  /**
   * Generate load test report
   */
  generateLoadTestReport() {
    const totalRequests = this.metrics.requests + this.metrics.failures;
    const successRate = totalRequests > 0 ? (this.metrics.requests / totalRequests) * 100 : 0;
    const avgResponseTime = this.metrics.responseTimes.length > 0 
      ? this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length
      : 0;
    
    const report = {
      totalRequests,
      successfulRequests: this.metrics.requests,
      failedRequests: this.metrics.failures,
      successRate: successRate.toFixed(2),
      averageResponseTime: Math.round(avgResponseTime),
      minResponseTime: Math.min(...this.metrics.responseTimes) || 0,
      maxResponseTime: Math.max(...this.metrics.responseTimes) || 0,
      requestsPerSecond: ((totalRequests / this.duration) * 1000).toFixed(2),
      errors: this.metrics.errors.slice(0, 10) // Top 10 errors
    };
    
    console.log('📊 Load Test Results:');
    console.log(`  Total Requests: ${report.totalRequests}`);
    console.log(`  Success Rate: ${report.successRate}%`);
    console.log(`  Avg Response Time: ${report.averageResponseTime}ms`);
    console.log(`  Requests/Second: ${report.requestsPerSecond}`);
    
    return report;
  }
}

/**
 * Memory and Resource Monitoring
 */
export class ResourceMonitor {
  constructor() {
    this.samples = [];
    this.monitoring = false;
  }

  /**
   * Start monitoring resources
   */
  startMonitoring(interval = 5000) {
    if (this.monitoring) return;
    
    this.monitoring = true;
    this.monitoringInterval = setInterval(async () => {
      const sample = await this.takeSample();
      this.samples.push(sample);
      
      // Keep only last 100 samples
      if (this.samples.length > 100) {
        this.samples.shift();
      }
    }, interval);
    
    console.log('📊 Started resource monitoring');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.monitoring = false;
    console.log('📊 Stopped resource monitoring');
  }

  /**
   * Take resource sample
   */
  async takeSample() {
    const sample = {
      timestamp: Date.now(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    };
    
    return sample;
  }

  /**
   * Generate resource report
   */
  generateResourceReport() {
    if (this.samples.length === 0) {
      return { error: 'No samples collected' };
    }
    
    const memoryUsages = this.samples.map(s => s.memory.heapUsed);
    const maxMemory = Math.max(...memoryUsages);
    const avgMemory = memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length;
    
    return {
      samples: this.samples.length,
      duration: this.samples[this.samples.length - 1].timestamp - this.samples[0].timestamp,
      memory: {
        max: Math.round(maxMemory / 1024 / 1024), // MB
        average: Math.round(avgMemory / 1024 / 1024), // MB
        growth: Math.round((memoryUsages[memoryUsages.length - 1] - memoryUsages[0]) / 1024 / 1024) // MB
      }
    };
  }
}

/**
 * Test Orchestration for Complex Scenarios
 */
export class TestOrchestrator {
  constructor() {
    this.scenarios = [];
    this.globalState = new Map();
  }

  /**
   * Add scenario to orchestration
   */
  addScenario(name, scenario, dependencies = []) {
    this.scenarios.push({
      name,
      scenario,
      dependencies,
      completed: false,
      result: null
    });
  }

  /**
   * Execute all scenarios respecting dependencies
   */
  async executeScenarios(context) {
    console.log(`🎭 Orchestrating ${this.scenarios.length} scenarios`);
    
    const results = new Map();
    const executing = new Set();
    
    while (this.scenarios.some(s => !s.completed)) {
      const ready = this.scenarios.filter(s => 
        !s.completed && 
        !executing.has(s.name) &&
        s.dependencies.every(dep => this.scenarios.find(d => d.name === dep)?.completed)
      );
      
      if (ready.length === 0) {
        const remaining = this.scenarios.filter(s => !s.completed);
        throw new Error(`Deadlock detected. Remaining scenarios: ${remaining.map(s => s.name).join(', ')}`);
      }
      
      // Execute ready scenarios in parallel
      const promises = ready.map(async scenario => {
        executing.add(scenario.name);
        console.log(`▶️  Executing scenario: ${scenario.name}`);
        
        try {
          const result = await scenario.scenario(context, this.globalState);
          scenario.result = result;
          scenario.completed = true;
          results.set(scenario.name, result);
          console.log(`✅ Completed scenario: ${scenario.name}`);
        } catch (error) {
          scenario.result = { error: error.message };
          scenario.completed = true;
          results.set(scenario.name, { error: error.message });
          console.error(`❌ Failed scenario: ${scenario.name} - ${error.message}`);
        } finally {
          executing.delete(scenario.name);
        }
      });
      
      await Promise.all(promises);
    }
    
    return results;
  }

  /**
   * Set global state for sharing between scenarios
   */
  setGlobalState(key, value) {
    this.globalState.set(key, value);
  }

  /**
   * Get global state
   */
  getGlobalState(key) {
    return this.globalState.get(key);
  }
}

/**
 * Test Data Relationship Manager
 */
export class DataRelationshipManager {
  constructor() {
    this.entities = new Map();
    this.relationships = new Map();
  }

  /**
   * Register entity with its properties
   */
  registerEntity(type, data) {
    if (!this.entities.has(type)) {
      this.entities.set(type, []);
    }
    
    const entity = {
      id: data.id || `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      createdAt: Date.now()
    };
    
    this.entities.get(type).push(entity);
    return entity;
  }

  /**
   * Create relationship between entities
   */
  createRelationship(parentEntity, childEntity, relationshipType) {
    const relationshipId = `${parentEntity.id}-${childEntity.id}-${relationshipType}`;
    
    this.relationships.set(relationshipId, {
      id: relationshipId,
      parent: parentEntity,
      child: childEntity,
      type: relationshipType,
      createdAt: Date.now()
    });
    
    return relationshipId;
  }

  /**
   * Get all entities of a type
   */
  getEntities(type) {
    return this.entities.get(type) || [];
  }

  /**
   * Get related entities
   */
  getRelatedEntities(entity, relationshipType) {
    const related = [];
    
    for (const relationship of this.relationships.values()) {
      if (relationship.parent.id === entity.id && relationship.type === relationshipType) {
        related.push(relationship.child);
      }
    }
    
    return related;
  }

  /**
   * Cleanup all entities and relationships
   */
  cleanup() {
    this.entities.clear();
    this.relationships.clear();
  }
}

/**
 * Test Configuration Manager
 */
export class TestConfigManager {
  constructor() {
    this.configs = new Map();
    this.profiles = new Map();
  }

  /**
   * Load configuration profile
   */
  loadProfile(name, config) {
    this.profiles.set(name, config);
    console.log(`📋 Loaded test profile: ${name}`);
  }

  /**
   * Get configuration value
   */
  get(key, profile = 'default') {
    const profileConfig = this.profiles.get(profile) || {};
    return this.getNestedValue(profileConfig, key) || this.getNestedValue(this.configs.get('default') || {}, key);
  }

  /**
   * Set configuration value
   */
  set(key, value, profile = 'default') {
    if (!this.configs.has(profile)) {
      this.configs.set(profile, {});
    }
    
    this.setNestedValue(this.configs.get(profile), key, value);
  }

  /**
   * Get nested value using dot notation
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Set nested value using dot notation
   */
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }
}

export default {
  LoadTestRunner,
  ResourceMonitor,
  TestOrchestrator,
  DataRelationshipManager,
  TestConfigManager
};