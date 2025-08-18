import React, { useState, useEffect } from 'react';
import { H2, H3, H4, P2 } from '../../typography';
import Button from '../../common/buttons/Button';
import RealTimeNotificationMonitor from './RealTimeNotificationMonitor';
import SignalDashboard from '../signals/SignalDashboard';
import SignalFlowMonitor from '../signals/SignalFlowMonitor';
import {
  Card,
  CardContent,
  Tabs,
  Tab,
  Box,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`notification-tabpanel-${index}`}
      aria-labelledby={`notification-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const NotificationManagementDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [systemStatus, setSystemStatus] = useState<'healthy' | 'warning' | 'error'>('healthy');
  const [refreshInterval, setRefreshInterval] = useState(10);
  
  // Mock system health check
  useEffect(() => {
    // In a real implementation, this would check:
    // - Lambda function health
    // - Database connectivity  
    // - AWS SES/Twilio API status
    // - EventBridge scheduling status
    const checkSystemHealth = () => {
      // For now, assume healthy
      setSystemStatus('healthy');
    };
    
    checkSystemHealth();
    const healthInterval = setInterval(checkSystemHealth, 30000); // Check every 30s
    
    return () => clearInterval(healthInterval);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getSystemStatusColor = () => {
    switch (systemStatus) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getSystemStatusText = () => {
    switch (systemStatus) {
      case 'healthy': return 'All Systems Operational';
      case 'warning': return 'Some Services Degraded';
      case 'error': return 'System Issues Detected';
      default: return 'Status Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <H2>Notification Management Dashboard</H2>
              <P2 className="text-gray-600 mt-1">
                Real-time monitoring and management of the signal-driven notification system
              </P2>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* System Status Indicator */}
              <div className="flex items-center space-x-2">
                <Chip
                  label={getSystemStatusText()}
                  color={getSystemStatusColor() as any}
                  size="small"
                />
                <span className="text-2xl">
                  {systemStatus === 'healthy' ? '🟢' : systemStatus === 'warning' ? '🟡' : '🔴'}
                </span>
              </div>
              
              {/* Refresh Interval Control */}
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Refresh Rate</InputLabel>
                <Select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                >
                  <MenuItem value={5}>5 seconds</MenuItem>
                  <MenuItem value={10}>10 seconds</MenuItem>
                  <MenuItem value={30}>30 seconds</MenuItem>
                  <MenuItem value={60}>1 minute</MenuItem>
                </Select>
              </FormControl>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* System Status Alert */}
        {systemStatus !== 'healthy' && (
          <Alert severity={systemStatus} sx={{ mb: 3 }}>
            <strong>System Status Update:</strong> {getSystemStatusText()}
            {systemStatus === 'warning' && (
              <div className="mt-2">
                Some notification deliveries may be delayed. Monitoring services are investigating.
              </div>
            )}
            {systemStatus === 'error' && (
              <div className="mt-2">
                Notification processing is currently impacted. Please check the Signal Processing tab for details.
              </div>
            )}
          </Alert>
        )}

        {/* Navigation Tabs */}
        <Card sx={{ mb: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab 
                label="Real-time Monitor" 
                id="notification-tab-0"
                aria-controls="notification-tabpanel-0"
              />
              <Tab 
                label="Signal Processing" 
                id="notification-tab-1"
                aria-controls="notification-tabpanel-1"
              />
              <Tab 
                label="Signal Flow Analysis" 
                id="notification-tab-2"
                aria-controls="notification-tabpanel-2"
              />
              <Tab 
                label="System Metrics" 
                id="notification-tab-3"
                aria-controls="notification-tabpanel-3"
              />
            </Tabs>
          </Box>

          {/* Tab Content */}
          <TabPanel value={activeTab} index={0}>
            <RealTimeNotificationMonitor 
              refreshInterval={refreshInterval}
              showAdvancedMetrics={true}
            />
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <SignalDashboard />
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <H3>Signal Flow Analysis</H3>
                <P2 className="text-gray-600">
                  Detailed analysis of signal processing flow for debugging
                </P2>
              </div>
              <SignalFlowMonitor showLatest={true} />
            </div>
          </TabPanel>

          <TabPanel value={activeTab} index={3}>
            <SystemMetrics />
          </TabPanel>
        </Card>
      </div>
    </div>
  );
};

// System Metrics Component
const SystemMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState({
    lambdaInvocations: 0,
    averageExecutionTime: 0,
    errorRate: 0,
    signalsProcessedToday: 0,
    notificationsSentToday: 0,
    systemUptime: '99.9%',
    lastProcessorRun: new Date().toISOString()
  });

  useEffect(() => {
    // In a real implementation, this would fetch from CloudWatch metrics
    const fetchMetrics = () => {
      setMetrics({
        lambdaInvocations: 1247,
        averageExecutionTime: 2.3,
        errorRate: 0.8,
        signalsProcessedToday: 34,
        notificationsSentToday: 68,
        systemUptime: '99.9%',
        lastProcessorRun: new Date(Date.now() - 2 * 60 * 1000).toISOString() // 2 minutes ago
      });
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <H3>System Performance Metrics</H3>
      
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <P2 className="text-gray-600">Lambda Invocations</P2>
                <H4>{metrics.lambdaInvocations.toLocaleString()}</H4>
                <P2 className="text-sm text-gray-500">Last 24 hours</P2>
              </div>
              <span className="text-2xl">🚀</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <P2 className="text-gray-600">Avg Execution Time</P2>
                <H4>{metrics.averageExecutionTime}s</H4>
                <P2 className="text-sm text-green-600">Within SLA</P2>
              </div>
              <span className="text-2xl">⏱️</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <P2 className="text-gray-600">Error Rate</P2>
                <H4 className={metrics.errorRate < 1 ? 'text-green-600' : 'text-red-600'}>
                  {metrics.errorRate}%
                </H4>
                <P2 className="text-sm text-gray-500">Last 24 hours</P2>
              </div>
              <span className="text-2xl">{metrics.errorRate < 1 ? '✅' : '⚠️'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <P2 className="text-gray-600">System Uptime</P2>
                <H4 className="text-green-600">{metrics.systemUptime}</H4>
                <P2 className="text-sm text-gray-500">Last 30 days</P2>
              </div>
              <span className="text-2xl">📊</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Activity */}
      <Card>
        <CardContent className="p-4">
          <H4 className="mb-4">Today's Activity</H4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <H3 className="text-blue-600">{metrics.signalsProcessedToday}</H3>
              <P2 className="text-gray-600">Signals Processed</P2>
            </div>
            <div className="text-center">
              <H3 className="text-green-600">{metrics.notificationsSentToday}</H3>
              <P2 className="text-gray-600">Notifications Sent</P2>
            </div>
            <div className="text-center">
              <H3 className="text-purple-600">
                {new Date(metrics.lastProcessorRun).toLocaleTimeString()}
              </H3>
              <P2 className="text-gray-600">Last Processor Run</P2>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Health Indicators */}
      <Card>
        <CardContent className="p-4">
          <H4 className="mb-4">System Health Indicators</H4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-green-600">✅</span>
                  <div>
                    <P2 className="font-medium">Lambda Function</P2>
                    <P2 className="text-sm text-gray-600">Operational</P2>
                  </div>
                </div>
                <Chip label="Healthy" color="success" size="small" />
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-green-600">✅</span>
                  <div>
                    <P2 className="font-medium">DynamoDB Tables</P2>
                    <P2 className="text-sm text-gray-600">All tables accessible</P2>
                  </div>
                </div>
                <Chip label="Healthy" color="success" size="small" />
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-green-600">✅</span>
                  <div>
                    <P2 className="font-medium">EventBridge</P2>
                    <P2 className="text-sm text-gray-600">Schedule active</P2>
                  </div>
                </div>
                <Chip label="Healthy" color="success" size="small" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-green-600">✅</span>
                  <div>
                    <P2 className="font-medium">AWS SES</P2>
                    <P2 className="text-sm text-gray-600">Email delivery operational</P2>
                  </div>
                </div>
                <Chip label="Healthy" color="success" size="small" />
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-green-600">✅</span>
                  <div>
                    <P2 className="font-medium">Twilio SMS</P2>
                    <P2 className="text-sm text-gray-600">SMS delivery operational</P2>
                  </div>
                </div>
                <Chip label="Healthy" color="success" size="small" />
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-blue-600">ℹ️</span>
                  <div>
                    <P2 className="font-medium">Template System</P2>
                    <P2 className="text-sm text-gray-600">8 templates active</P2>
                  </div>
                </div>
                <Chip label="Active" color="primary" size="small" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationManagementDashboard;