import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { H2, H4, P2 } from '../../typography';
import StatusPill from '../../common/ui/StatusPill';
import { DateTimeUtils } from '../../../utils/dateTimeUtils';
import { getEnvironmentInfo } from '../../../utils/environmentTest';

const client = generateClient();

interface SystemConfig {
  id: string;
  category: string;
  key: string;
  value: string;
  description: string;
  isActive: boolean;
  updatedAt: string;
  updatedBy: string;
}

interface EnvironmentInfo {
  environment: string;
  backendSuffix: string;
  s3Bucket: string;
  region: string;
  logLevel: string;
  deploymentBranch: string;
  lastDeployment?: string;
  // Enhanced fields from environment test
  usingEnvironmentVariables: boolean;
  graphqlUrl: string;
  userPoolId: string;
  userPoolClientId: string;
  detectedEnvironment: string;
  buildTime: string;
  nodeEnv: string;
}

const SystemConfigPage: React.FC = () => {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [environmentInfo, setEnvironmentInfo] = useState<EnvironmentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'environment' | 'settings' | 'monitoring'>('environment');

  useEffect(() => {
    loadSystemData();
  }, []);

  const loadSystemData = async () => {
    try {
      setLoading(true);
      
      // Load comprehensive environment information using the environment test utility
      const envTestInfo = getEnvironmentInfo();
      console.log('SystemConfigPage: Environment test info:', envTestInfo);
      
      const envInfo: EnvironmentInfo = {
        environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
        backendSuffix: envTestInfo.effectiveConfig.backendSuffix || 'unknown',
        s3Bucket: process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL || 'not-configured',
        region: envTestInfo.effectiveConfig.region || 'us-west-1',
        logLevel: process.env.NEXT_PUBLIC_LOG_LEVEL || 'INFO',
        deploymentBranch: getCurrentBranch(),
        lastDeployment: envTestInfo.buildTime,
        // Enhanced fields from environment test
        usingEnvironmentVariables: envTestInfo.usingEnvironmentVariables,
        graphqlUrl: envTestInfo.effectiveConfig.graphqlUrl || 'not-configured',
        userPoolId: envTestInfo.effectiveConfig.userPoolId || 'not-configured',
        userPoolClientId: envTestInfo.effectiveConfig.userPoolClientId || 'not-configured',
        detectedEnvironment: envTestInfo.environment,
        buildTime: envTestInfo.buildTime,
        nodeEnv: envTestInfo.nodeEnv || 'unknown'
      };
      
      setEnvironmentInfo(envInfo);

      // Mock system configurations - in real implementation, these would come from a backend service
      const mockConfigs: SystemConfig[] = [
        {
          id: '1',
          category: 'Notifications',
          key: 'email_retry_attempts',
          value: '3',
          description: 'Number of retry attempts for failed email notifications',
          isActive: true,
          updatedAt: '2024-08-01T10:00:00Z',
          updatedBy: 'admin@realtechee.com'
        },
        {
          id: '2',
          category: 'Notifications',
          key: 'notification_timeout_seconds',
          value: '30',
          description: 'Timeout for notification processing in seconds',
          isActive: true,
          updatedAt: '2024-08-01T10:00:00Z',
          updatedBy: 'admin@realtechee.com'
        },
        {
          id: '3',
          category: 'Lead Management',
          key: 'lead_expiration_days',
          value: '14',
          description: 'Number of days before leads expire',
          isActive: true,
          updatedAt: '2024-07-25T15:30:00Z',
          updatedBy: 'admin@realtechee.com'
        },
        {
          id: '4',
          category: 'File Upload',
          key: 'max_file_size_mb',
          value: '10',
          description: 'Maximum file size for uploads in MB',
          isActive: true,
          updatedAt: '2024-07-20T09:15:00Z',
          updatedBy: 'admin@realtechee.com'
        },
        {
          id: '5',
          category: 'Performance',
          key: 'cache_ttl_seconds',
          value: '300',
          description: 'Cache time-to-live in seconds',
          isActive: true,
          updatedAt: '2024-08-01T12:00:00Z',
          updatedBy: 'system'
        }
      ];
      
      setConfigs(mockConfigs);
    } catch (err) {
      setError('Failed to load system configuration');
      console.error('Error loading system data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentBranch = (): string => {
    // In real implementation, this would be determined from build info or environment
    const env = process.env.NEXT_PUBLIC_ENVIRONMENT;
    switch (env) {
      case 'production': return 'production';
      case 'staging': return 'staging';
      default: return 'main';
    }
  };

  const getEnvironmentStatus = (): 'healthy' | 'warning' | 'error' => {
    if (!environmentInfo) return 'error';
    
    // Check if essential configuration is present
    if (environmentInfo.s3Bucket === 'not-configured' || 
        environmentInfo.backendSuffix === 'unknown' ||
        environmentInfo.graphqlUrl === 'not-configured' ||
        environmentInfo.userPoolId === 'not-configured') {
      return 'error';
    }
    
    // Warning if not using environment variables (means using fallback values)
    if (!environmentInfo.usingEnvironmentVariables) {
      return 'warning';
    }
    
    return 'healthy';
  };

  const categorizedConfigs = configs.reduce((acc, config) => {
    if (!acc[config.category]) {
      acc[config.category] = [];
    }
    acc[config.category].push(config);
    return acc;
  }, {} as Record<string, SystemConfig[]>);

  if (loading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <H2 className="mb-6">System Configuration</H2>
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading system configuration...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <H2 className="mb-2">System Configuration</H2>
          <P2 className="text-gray-600">Manage system settings and environment configuration</P2>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Tab Navigation - Mobile Responsive */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
          <div className="p-4">
            {/* Mobile: Dropdown */}
            <div className="lg:hidden">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Configuration Section
              </label>
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="environment">Environment Info</option>
                <option value="settings">System Settings</option>
                <option value="monitoring">Health Monitoring</option>
              </select>
            </div>

            {/* Desktop: Horizontal tabs */}
            <div className="hidden lg:flex space-x-1">
              {[
                { id: 'environment', name: 'Environment Info' },
                { id: 'settings', name: 'System Settings' },
                { id: 'monitoring', name: 'Health Monitoring' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Environment Info Tab */}
        {activeTab === 'environment' && environmentInfo && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <H4>AWS Amplify Gen 2 Environment</H4>
                  <StatusPill status={getEnvironmentStatus()} />
                </div>
                
                {/* Environment Variables Status Banner */}
                <div className={`mb-4 p-3 rounded-lg border ${
                  environmentInfo.usingEnvironmentVariables 
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                }`}>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      environmentInfo.usingEnvironmentVariables ? 'bg-green-500' : 'bg-yellow-500'
                    }`}></div>
                    <span className="text-sm font-medium">
                      {environmentInfo.usingEnvironmentVariables 
                        ? '✅ Using AWS Amplify Environment Variables'
                        : '⚠️ Using Fallback Configuration (amplify_outputs.json)'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Detected Environment
                      </label>
                      <div className={`text-lg font-mono p-2 rounded ${
                        environmentInfo.detectedEnvironment === 'production' 
                          ? 'bg-green-50 text-green-800 border border-green-200'
                          : environmentInfo.detectedEnvironment === 'development/staging'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-red-50 text-red-800 border border-red-200'
                      }`}>
                        {environmentInfo.detectedEnvironment}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Backend Suffix
                      </label>
                      <div className="text-sm font-mono bg-gray-50 p-2 rounded break-all">
                        {environmentInfo.backendSuffix}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        GraphQL Endpoint
                      </label>
                      <div className="text-xs font-mono bg-gray-50 p-2 rounded break-all">
                        {environmentInfo.graphqlUrl}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        AWS Region
                      </label>
                      <div className="text-lg font-mono bg-gray-50 p-2 rounded">
                        {environmentInfo.region}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        User Pool ID
                      </label>
                      <div className="text-sm font-mono bg-gray-50 p-2 rounded break-all">
                        {environmentInfo.userPoolId}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        User Pool Client ID
                      </label>
                      <div className="text-sm font-mono bg-gray-50 p-2 rounded break-all">
                        {environmentInfo.userPoolClientId}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Node Environment
                      </label>
                      <div className="text-lg font-mono bg-gray-50 p-2 rounded">
                        {environmentInfo.nodeEnv}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Log Level
                      </label>
                      <div className="text-lg font-mono bg-gray-50 p-2 rounded">
                        {environmentInfo.logLevel}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="p-6">
                <H4 className="mb-4">S3 Storage Configuration</H4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Public S3 Bucket URL
                  </label>
                  <div className="text-sm font-mono bg-gray-50 p-3 rounded break-all">
                    {environmentInfo.s3Bucket}
                  </div>
                  <P2 className="text-gray-500 text-sm mt-2">
                    This URL is used for file uploads and public asset access
                  </P2>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="p-6">
                <H4 className="mb-4">Database Tables</H4>
                <div className="space-y-2 text-sm">
                  <div className="font-medium text-gray-700">Table Suffix Pattern:</div>
                  <div className="font-mono bg-gray-50 p-2 rounded">
                    TableName-{environmentInfo.backendSuffix}-NONE
                  </div>
                  <P2 className="text-gray-500 text-sm">
                    All DynamoDB tables use this suffix pattern for environment isolation
                  </P2>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* System Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {Object.entries(categorizedConfigs).map(([category, categoryConfigs]) => (
              <div key={category} className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="p-6">
                  <H4 className="mb-4">{category} Settings</H4>
                  <div className="space-y-4">
                    {categoryConfigs.map((config) => (
                      <div key={config.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{config.key}</div>
                            <P2 className="text-gray-600 text-sm">{config.description}</P2>
                            <div className="mt-2 text-xs text-gray-500">
                              Updated {DateTimeUtils.timeAgo(config.updatedAt)} by {config.updatedBy}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <div className="font-mono bg-gray-50 px-3 py-1 rounded text-sm">
                              {config.value}
                            </div>
                            <StatusPill status={config.isActive ? 'Active' : 'Inactive'} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Health Monitoring Tab */}
        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="p-6">
                <H4 className="mb-4">System Health Overview</H4>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">99.9%</div>
                    <div className="text-sm text-gray-600">Uptime</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">1.2s</div>
                    <div className="text-sm text-gray-600">Avg Response Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">0</div>
                    <div className="text-sm text-gray-600">Active Alerts</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="p-6">
                <H4 className="mb-4">Service Status</H4>
                <div className="space-y-3">
                  {[
                    { name: 'API Gateway', status: 'healthy', uptime: '99.9%' },
                    { name: 'Lambda Functions', status: 'healthy', uptime: '99.8%' },
                    { name: 'DynamoDB', status: 'healthy', uptime: '100%' },
                    { name: 'S3 Storage', status: 'healthy', uptime: '100%' },
                    { name: 'CloudFront CDN', status: 'healthy', uptime: '99.9%' },
                    { name: 'Cognito Auth', status: 'healthy', uptime: '99.7%' }
                  ].map((service) => (
                    <div key={service.name} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        <span className="font-medium">{service.name}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-600">{service.uptime}</span>
                        <StatusPill status="Healthy" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="p-6">
                <H4 className="mb-4">Recent System Events</H4>
                <div className="space-y-3">
                  {[
                    { event: 'Deployment completed successfully', time: '2 hours ago', type: 'success' },
                    { event: 'Scheduled backup completed', time: '6 hours ago', type: 'info' },
                    { event: 'System maintenance completed', time: '1 day ago', type: 'info' },
                    { event: 'SSL certificate renewed', time: '3 days ago', type: 'success' }
                  ].map((event, index) => (
                    <div key={index} className="flex items-start space-x-3 py-2">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        event.type === 'success' ? 'bg-green-400' : 'bg-blue-400'
                      }`}></div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{event.event}</div>
                        <div className="text-sm text-gray-500">{event.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemConfigPage;