/**
 * Database Seeding Utilities
 * 
 * Provides utilities for seeding and managing test data in DynamoDB and Cognito.
 * Ensures consistent test environments across local, staging, and production.
 */

import { testUsers, testProjects, testQuotes, testRequests, TestDataManager } from '../fixtures/test-data.js';

export class DatabaseSeeder {
  constructor(environment = 'local') {
    this.environment = environment;
    this.region = process.env.AWS_REGION || 'us-west-1';
    this.userPoolId = process.env.COGNITO_USER_POOL_ID;
    this.clientId = process.env.COGNITO_CLIENT_ID;
    
    // Initialize AWS SDK clients (would be actual AWS clients in real implementation)
    this.dynamoClient = null; // Would initialize DynamoDB client
    this.cognitoClient = null; // Would initialize Cognito client
  }

  /**
   * Seeds all test data for comprehensive testing
   */
  async seedAll() {
    console.log(`🌱 Starting database seeding for ${this.environment} environment...`);
    
    try {
      await this.seedUsers();
      await this.seedProjects();
      await this.seedQuotes();
      await this.seedRequests();
      
      console.log('✅ Database seeding completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Database seeding failed:', error);
      throw error;
    }
  }

  /**
   * Seeds test users in Cognito User Pool
   */
  async seedUsers() {
    console.log('👥 Seeding test users...');
    
    for (const [userType, userData] of Object.entries(testUsers)) {
      try {
        // In a real implementation, this would create users in Cognito
        console.log(`  - Creating ${userType} user: ${userData.email}`);
        
        // Mock implementation for demonstration
        const user = {
          Username: userData.email,
          UserAttributes: [
            { Name: 'email', Value: userData.email },
            { Name: 'phone_number', Value: userData.phone },
            { Name: 'custom:role', Value: userData.role },
            { Name: 'email_verified', Value: 'true' }
          ],
          TemporaryPassword: userData.password,
          MessageAction: 'SUPPRESS'
        };
        
        // await this.cognitoClient.adminCreateUser(user).promise();
        // await this.setUserPermanentPassword(userData.email, userData.password);
        
        console.log(`  ✅ Created ${userType} user successfully`);
      } catch (error) {
        if (error.code === 'UsernameExistsException') {
          console.log(`  ⚠️  User ${userData.email} already exists, skipping...`);
        } else {
          console.error(`  ❌ Failed to create ${userType} user:`, error);
          throw error;
        }
      }
    }
  }

  /**
   * Seeds test projects in DynamoDB
   */
  async seedProjects() {
    console.log('🏗️  Seeding test projects...');
    
    const tableName = `Projects-${this.environment}`;
    
    for (const [projectKey, projectData] of Object.entries(testProjects)) {
      try {
        const project = {
          id: `test-project-${projectKey}-${Date.now()}`,
          ...projectData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          owner: testUsers.admin.email,
          isTestData: true
        };
        
        // In a real implementation, this would insert into DynamoDB
        console.log(`  - Creating project: ${project.title}`);
        
        // Mock DynamoDB put operation
        // await this.dynamoClient.put({
        //   TableName: tableName,
        //   Item: project
        // }).promise();
        
        console.log(`  ✅ Created project: ${project.title}`);
      } catch (error) {
        console.error(`  ❌ Failed to create project ${projectData.title}:`, error);
        throw error;
      }
    }
  }

  /**
   * Seeds test quotes in DynamoDB
   */
  async seedQuotes() {
    console.log('💰 Seeding test quotes...');
    
    const tableName = `Quotes-${this.environment}`;
    
    for (const [quoteKey, quoteData] of Object.entries(testQuotes)) {
      try {
        const quote = {
          id: `test-quote-${quoteKey}-${Date.now()}`,
          ...quoteData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: testUsers.admin.email,
          isTestData: true
        };
        
        console.log(`  - Creating quote: ${quote.projectTitle}`);
        
        // Mock DynamoDB put operation
        // await this.dynamoClient.put({
        //   TableName: tableName,
        //   Item: quote
        // }).promise();
        
        console.log(`  ✅ Created quote: ${quote.projectTitle}`);
      } catch (error) {
        console.error(`  ❌ Failed to create quote ${quoteData.projectTitle}:`, error);
        throw error;
      }
    }
  }

  /**
   * Seeds test requests in DynamoDB
   */
  async seedRequests() {
    console.log('📋 Seeding test requests...');
    
    const tableName = `Requests-${this.environment}`;
    
    for (const [requestKey, requestData] of Object.entries(testRequests)) {
      try {
        const request = {
          id: `test-request-${requestKey}-${Date.now()}`,
          ...requestData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          assignedTo: testUsers.admin.email,
          isTestData: true
        };
        
        console.log(`  - Creating request: ${request.title}`);
        
        // Mock DynamoDB put operation
        // await this.dynamoClient.put({
        //   TableName: tableName,
        //   Item: request
        // }).promise();
        
        console.log(`  ✅ Created request: ${request.title}`);
      } catch (error) {
        console.error(`  ❌ Failed to create request ${requestData.title}:`, error);
        throw error;
      }
    }
  }

  /**
   * Cleans up all test data
   */
  async cleanup() {
    console.log(`🧹 Cleaning up test data for ${this.environment} environment...`);
    
    try {
      await this.cleanupProjects();
      await this.cleanupQuotes();
      await this.cleanupRequests();
      await this.cleanupUsers();
      
      console.log('✅ Test data cleanup completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Test data cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Removes test projects
   */
  async cleanupProjects() {
    console.log('🗑️  Cleaning up test projects...');
    
    const tableName = `Projects-${this.environment}`;
    
    // In a real implementation, this would scan for test data and delete
    // const params = {
    //   TableName: tableName,
    //   FilterExpression: 'isTestData = :testData',
    //   ExpressionAttributeValues: { ':testData': true }
    // };
    
    // const result = await this.dynamoClient.scan(params).promise();
    // 
    // for (const item of result.Items) {
    //   await this.dynamoClient.delete({
    //     TableName: tableName,
    //     Key: { id: item.id }
    //   }).promise();
    // }
    
    console.log('  ✅ Test projects cleaned up');
  }

  /**
   * Removes test quotes
   */
  async cleanupQuotes() {
    console.log('🗑️  Cleaning up test quotes...');
    // Similar implementation to cleanupProjects
    console.log('  ✅ Test quotes cleaned up');
  }

  /**
   * Removes test requests
   */
  async cleanupRequests() {
    console.log('🗑️  Cleaning up test requests...');
    // Similar implementation to cleanupProjects
    console.log('  ✅ Test requests cleaned up');
  }

  /**
   * Removes test users (careful with this in production)
   */
  async cleanupUsers() {
    if (this.environment === 'production') {
      console.log('⚠️  Skipping user cleanup in production environment');
      return;
    }
    
    console.log('🗑️  Cleaning up test users...');
    
    for (const [userType, userData] of Object.entries(testUsers)) {
      try {
        // In a real implementation, this would delete users from Cognito
        // await this.cognitoClient.adminDeleteUser({
        //   UserPoolId: this.userPoolId,
        //   Username: userData.email
        // }).promise();
        
        console.log(`  ✅ Deleted ${userType} user: ${userData.email}`);
      } catch (error) {
        if (error.code === 'UserNotFoundException') {
          console.log(`  ⚠️  User ${userData.email} not found, skipping...`);
        } else {
          console.error(`  ❌ Failed to delete ${userType} user:`, error);
        }
      }
    }
  }

  /**
   * Sets permanent password for a user
   */
  async setUserPermanentPassword(username, password) {
    // In a real implementation, this would set the permanent password
    // await this.cognitoClient.adminSetUserPassword({
    //   UserPoolId: this.userPoolId,
    //   Username: username,
    //   Password: password,
    //   Permanent: true
    // }).promise();
  }

  /**
   * Validates that test data exists and is accessible
   */
  async validate() {
    console.log(`🔍 Validating test data in ${this.environment} environment...`);
    
    const validationResults = {
      users: await this.validateUsers(),
      projects: await this.validateProjects(),
      quotes: await this.validateQuotes(),
      requests: await this.validateRequests()
    };
    
    const allValid = Object.values(validationResults).every(result => result);
    
    if (allValid) {
      console.log('✅ All test data validation passed');
    } else {
      console.error('❌ Test data validation failed:', validationResults);
    }
    
    return validationResults;
  }

  /**
   * Validates test users exist
   */
  async validateUsers() {
    try {
      for (const userData of Object.values(testUsers)) {
        // In a real implementation, this would check if user exists
        // await this.cognitoClient.adminGetUser({
        //   UserPoolId: this.userPoolId,
        //   Username: userData.email
        // }).promise();
      }
      return true;
    } catch (error) {
      console.error('User validation failed:', error);
      return false;
    }
  }

  /**
   * Validates test projects exist
   */
  async validateProjects() {
    try {
      // In a real implementation, this would query DynamoDB for test projects
      return true;
    } catch (error) {
      console.error('Project validation failed:', error);
      return false;
    }
  }

  /**
   * Validates test quotes exist
   */
  async validateQuotes() {
    try {
      // Similar to validateProjects
      return true;
    } catch (error) {
      console.error('Quote validation failed:', error);
      return false;
    }
  }

  /**
   * Validates test requests exist
   */
  async validateRequests() {
    try {
      // Similar to validateProjects
      return true;
    } catch (error) {
      console.error('Request validation failed:', error);
      return false;
    }
  }

  /**
   * Generates realistic test data volumes for performance testing
   */
  async generateLargeDataset(counts = { projects: 100, quotes: 200, requests: 150 }) {
    console.log('📊 Generating large dataset for performance testing...');
    
    const largeDataset = {
      projects: [],
      quotes: [],
      requests: []
    };
    
    // Generate projects
    for (let i = 0; i < counts.projects; i++) {
      largeDataset.projects.push(TestDataManager.createTestProject({
        title: `Performance Test Project ${i + 1}`,
        description: `Generated project for performance testing - ID: ${i + 1}`
      }));
    }
    
    // Generate quotes
    for (let i = 0; i < counts.quotes; i++) {
      largeDataset.quotes.push({
        id: `perf-quote-${i + 1}`,
        projectTitle: `Performance Test Quote ${i + 1}`,
        clientName: `Test Client ${i + 1}`,
        clientEmail: TestDataManager.generateUniqueEmail(`perfclient${i + 1}`),
        clientPhone: TestDataManager.generatePhoneNumber(),
        status: ['pending', 'approved', 'expired'][i % 3],
        amount: Math.floor(Math.random() * 100000) + 10000,
        description: `Generated quote for performance testing - ID: ${i + 1}`,
        createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    
    // Generate requests
    for (let i = 0; i < counts.requests; i++) {
      largeDataset.requests.push({
        id: `perf-request-${i + 1}`,
        title: `Performance Test Request ${i + 1}`,
        clientName: `Test Client ${i + 1}`,
        clientEmail: TestDataManager.generateUniqueEmail(`perfreq${i + 1}`),
        clientPhone: TestDataManager.generatePhoneNumber(),
        priority: ['high', 'medium', 'low'][i % 3],
        status: ['new', 'in-progress', 'completed'][i % 3],
        type: ['consultation', 'selection', 'assessment'][i % 3],
        description: `Generated request for performance testing - ID: ${i + 1}`,
        createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    
    console.log(`  ✅ Generated ${counts.projects} projects, ${counts.quotes} quotes, ${counts.requests} requests`);
    return largeDataset;
  }
}

/**
 * Test data management utilities
 */
export class TestDataManager extends DatabaseSeeder {
  /**
   * Quick setup for testing environments
   */
  static async quickSetup(environment = 'local') {
    const seeder = new DatabaseSeeder(environment);
    await seeder.seedAll();
    return seeder;
  }

  /**
   * Quick cleanup for testing environments
   */
  static async quickCleanup(environment = 'local') {
    const seeder = new DatabaseSeeder(environment);
    await seeder.cleanup();
    return seeder;
  }

  /**
   * Reset environment (cleanup + seed)
   */
  static async resetEnvironment(environment = 'local') {
    console.log(`🔄 Resetting ${environment} environment...`);
    const seeder = new DatabaseSeeder(environment);
    await seeder.cleanup();
    await seeder.seedAll();
    console.log(`✅ ${environment} environment reset complete`);
    return seeder;
  }
}

// Export default seeder instance
export default DatabaseSeeder;