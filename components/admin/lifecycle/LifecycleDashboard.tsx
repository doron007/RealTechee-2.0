'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  IconButton,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  LinearProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Schedule as ScheduleIcon,
  Archive as ArchiveIcon,
  RestoreFromTrash as RestoreIcon,
  Warning as WarningIcon,
  Assessment as AssessmentIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Speed as SpeedIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { leadLifecycleService, type LeadLifecycleMetrics, type LeadExpirationCheck } from '../../../services/business/leadLifecycleService';
import { leadScoringService } from '../../../services/analytics/leadScoringService';
import { analyticsService } from '../../../services/analytics/analyticsService';
import LeadReactivationWorkflow from './LeadReactivationWorkflow';
import { createLogger } from '../../../utils/logger';

const logger = createLogger('LifecycleDashboard');

interface LifecycleDashboardProps {
  refreshInterval?: number; // minutes
}

const LifecycleDashboard: React.FC<LifecycleDashboardProps> = ({
  refreshInterval = 5
}) => {
  const [metrics, setMetrics] = useState<LeadLifecycleMetrics | null>(null);
  const [expirationChecks, setExpirationChecks] = useState<LeadExpirationCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [reactivationDialogOpen, setReactivationDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    riskLevel: 'all',
    leadSource: 'all',
    assignee: 'all'
  });

  useEffect(() => {
    loadDashboardData();
    
    // Set up auto-refresh
    const interval = setInterval(() => {
      loadDashboardData();
    }, refreshInterval * 60 * 1000);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [metricsResult, expirationResult] = await Promise.all([
        leadLifecycleService.getLeadLifecycleMetrics(),
        leadLifecycleService.checkLeadExpirations()
      ]);

      setMetrics(metricsResult);
      setExpirationChecks(expirationResult);
      setLastRefresh(new Date());

      logger.info('Dashboard data loaded successfully', {
        totalLeads: metricsResult.totalLeads,
        expiringLeads: expirationResult.length
      });

    } catch (err) {
      logger.error('Error loading dashboard data', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessExpirations = async () => {
    try {
      setLoading(true);
      const result = await leadLifecycleService.processAutomaticExpirations();
      
      // Refresh data after processing
      await loadDashboardData();
      
      logger.info('Automatic expirations processed', result);
      
    } catch (err) {
      logger.error('Error processing expirations', err);
      setError('Failed to process expirations');
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateLead = (requestId: string) => {
    setSelectedRequest(requestId);
    setReactivationDialogOpen(true);
  };

  const filteredExpirationChecks = expirationChecks.filter(check => {
    if (filters.riskLevel !== 'all' && check.riskLevel !== filters.riskLevel) {
      return false;
    }
    // Additional filters would be applied here
    return true;
  });

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const formatDuration = (days: number): string => {
    if (days === 0) return 'Today';
    if (days === 1) return '1 day';
    return `${days} days`;
  };

  const exportData = async () => {
    try {
      // Export dashboard data
      const exportData = {
        metrics,
        expirationChecks: filteredExpirationChecks,
        exportedAt: new Date().toISOString(),
        filters
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `lead-lifecycle-dashboard-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
    } catch (err) {
      logger.error('Error exporting data', err);
    }
  };

  if (loading && !metrics) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>Lead Lifecycle Dashboard</Typography>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 1 }}>Loading dashboard data...</Typography>
      </Box>
    );
  }

  if (error && !metrics) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>Lead Lifecycle Dashboard</Typography>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Lead Lifecycle Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Filter Data">
            <IconButton onClick={() => setFilterDialogOpen(true)}>
              <FilterIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export Data">
            <IconButton onClick={exportData}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh">
            <IconButton onClick={loadDashboardData} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Key Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" color="primary">
                      {metrics.totalLeads}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Leads
                    </Typography>
                  </Box>
                  <AssessmentIcon color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" color="success.main">
                      {metrics.activeLeads}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Leads
                    </Typography>
                  </Box>
                  <SpeedIcon color="success" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" color="warning.main">
                      {metrics.expiredLeads}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Expired Leads
                    </Typography>
                  </Box>
                  <ScheduleIcon color="warning" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4">
                      {(metrics.conversionRate * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Conversion Rate
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {metrics.conversionRate > 0.25 ? (
                      <TrendingUpIcon color="success" sx={{ fontSize: 40 }} />
                    ) : (
                      <TrendingDownIcon color="error" sx={{ fontSize: 40 }} />
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Expiration Management */}
        <div className="lg:col-span-8">
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Lead Expiration Management
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<ScheduleIcon />}
                  onClick={handleProcessExpirations}
                  disabled={loading}
                  size="small"
                >
                  Process Expirations
                </Button>
              </Box>

              {filteredExpirationChecks.length === 0 ? (
                <Alert severity="success">
                  <Typography variant="body2">
                    No leads require immediate attention. All leads are within their expiration timelines.
                  </Typography>
                </Alert>
              ) : (
                <List>
                  {filteredExpirationChecks.slice(0, 10).map((check) => (
                    <React.Fragment key={check.requestId}>
                      <ListItem>
                        <ListItemIcon>
                          <WarningIcon color={getRiskLevelColor(check.riskLevel) as any} />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body1">
                                Request {check.requestId.slice(-8)}
                              </Typography>
                              <Chip
                                label={check.riskLevel.toUpperCase()}
                                size="small"
                                color={getRiskLevelColor(check.riskLevel) as any}
                              />
                              <Chip
                                label={check.currentStatus}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {check.isExpired 
                                  ? `Expired ${formatDuration(check.daysSinceCreated - 14)} ago`
                                  : `Expires in ${formatDuration(Math.ceil((check.expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}`
                                }
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Created {formatDuration(check.daysSinceCreated)} ago • 
                                Last activity {formatDuration(check.daysSinceLastActivity)} ago
                              </Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          {check.isExpired ? (
                            <Button
                              startIcon={<RestoreIcon />}
                              onClick={() => handleReactivateLead(check.requestId)}
                              size="small"
                              variant="outlined"
                            >
                              Reactivate
                            </Button>
                          ) : (
                            <Button
                              href={`/admin/requests/${check.requestId}`}
                              size="small"
                              variant="outlined"
                            >
                              View
                            </Button>
                          )}
                        </ListItemSecondaryAction>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              )}

              {filteredExpirationChecks.length > 10 && (
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Showing 10 of {filteredExpirationChecks.length} leads requiring attention
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="lg:col-span-4">
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Overview
              </Typography>
              
              {metrics && (
                <Box>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Avg Lifecycle</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {metrics.averageLifecycleDays.toFixed(1)} days
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min((metrics.averageLifecycleDays / 14) * 100, 100)}
                      color={metrics.averageLifecycleDays <= 14 ? 'success' : 'warning'}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Expiration Rate</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {(metrics.expirationRate * 100).toFixed(1)}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={metrics.expirationRate * 100}
                      color={metrics.expirationRate < 0.15 ? 'success' : 'error'}
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" gutterBottom>
                    Status Distribution
                  </Typography>
                  {Object.entries(metrics.statusDistribution)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([status, count]) => (
                      <Box key={status} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">{status}</Typography>
                        <Typography variant="body2" fontWeight="bold">{count}</Typography>
                      </Box>
                    ))}
                </Box>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Source Performance
              </Typography>
              
              {metrics && Object.keys(metrics.sourcePerformance).length > 0 ? (
                <List dense>
                  {Object.entries(metrics.sourcePerformance)
                    .sort(([,a], [,b]) => b.conversionRate - a.conversionRate)
                    .slice(0, 5)
                    .map(([source, perf]) => (
                      <ListItem key={source} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <StarIcon 
                            fontSize="small" 
                            color={perf.conversionRate > 0.3 ? 'primary' : 'action'}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={source}
                          secondary={`${perf.totalLeads} leads • ${(perf.conversionRate * 100).toFixed(1)}% conversion`}
                          primaryTypographyProps={{ variant: 'body2' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No source performance data available
                </Typography>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filter Dialog */}
      <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Filter Dashboard Data</DialogTitle>
        <DialogContent>
          <div className="grid grid-cols-1 gap-4 mt-2">
            <div>
              <FormControl fullWidth>
                <InputLabel>Risk Level</InputLabel>
                <Select
                  value={filters.riskLevel}
                  onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value })}
                >
                  <MenuItem value="all">All Risk Levels</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFilterDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              setFilterDialogOpen(false);
              loadDashboardData();
            }}
            variant="contained"
          >
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reactivation Workflow */}
      {selectedRequest && (
        <LeadReactivationWorkflow
          open={reactivationDialogOpen}
          onClose={() => {
            setReactivationDialogOpen(false);
            setSelectedRequest(null);
          }}
          requestId={selectedRequest}
          onSuccess={() => {
            loadDashboardData(); // Refresh data after successful reactivation
          }}
        />
      )}
    </Box>
  );
};

export default LifecycleDashboard;