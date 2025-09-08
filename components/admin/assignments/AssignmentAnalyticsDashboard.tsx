'use client';

import React, { useState, useEffect } from 'react';
import CardWrapper from '../common/CardWrapper';
import Button from '../../common/buttons/Button';
import { H2, H3 } from '../../typography';
import P2 from '../../typography/P2';
import { 
  workloadBalancingService,
  WorkloadMetrics,
  Territory,
  WorkloadRebalanceRequest,
  TerritoryAssignmentRequest
} from '../../../services/admin/workloadBalancingService';
import { assignmentService, AssignmentMetrics } from '../../../services/admin/assignmentService';
import {
  Grid,
  Box,
  Paper,
  LinearProgress,
  Chip,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar
} from 'recharts';
import {
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  Business as TerritoryIcon,
  Assignment as AssignmentIcon,
  Refresh as RefreshIcon,
  Balance as BalanceIcon,
  Speed as SpeedIcon,
  Star as StarIcon
} from '@mui/icons-material';

interface AssignmentAnalyticsDashboardProps {
  onRebalanceRequest?: (request: WorkloadRebalanceRequest) => void;
}

export default function AssignmentAnalyticsDashboard({ 
  onRebalanceRequest 
}: AssignmentAnalyticsDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  
  // Analytics data
  const [workloadMetrics, setWorkloadMetrics] = useState<WorkloadMetrics[]>([]);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [assignmentMetrics, setAssignmentMetrics] = useState<AssignmentMetrics | null>(null);
  const [overloadedAssignees, setOverloadedAssignees] = useState<WorkloadMetrics[]>([]);
  const [underutilizedAssignees, setUnderutilizedAssignees] = useState<WorkloadMetrics[]>([]);
  
  // UI states
  const [rebalanceDialogOpen, setRebalanceDialogOpen] = useState(false);
  const [rebalanceReason, setRebalanceReason] = useState<string>('manual');
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadAnalyticsData();
    
    if (autoRefresh) {
      const interval = setInterval(loadAnalyticsData, 30000); // Refresh every 30 seconds
      setRefreshInterval(interval);
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }

    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [autoRefresh, refreshInterval]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [
        workloadData,
        territoriesData,
        assignmentData,
        overloadedData,
        underutilizedData
      ] = await Promise.all([
        workloadBalancingService.getWorkloadMetrics(),
        workloadBalancingService.getTerritories(),
        assignmentService.getAssignmentMetrics(),
        workloadBalancingService.getOverloadedAssignees(),
        workloadBalancingService.getUnderutilizedAssignees()
      ]);
      
      setWorkloadMetrics(workloadData);
      setTerritories(territoriesData);
      setAssignmentMetrics(assignmentData);
      setOverloadedAssignees(overloadedData);
      setUnderutilizedAssignees(underutilizedData);
      
    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Analytics load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRebalanceWorkload = async () => {
    try {
      const request: WorkloadRebalanceRequest = {
        reason: rebalanceReason as any,
        preserveTerritories: true,
        forceRebalance: false
      };

      if (onRebalanceRequest) {
        onRebalanceRequest(request);
      }

      setRebalanceDialogOpen(false);
      
      // Refresh data after rebalancing
      setTimeout(loadAnalyticsData, 2000);
      
    } catch (err) {
      setError('Failed to initiate workload rebalancing');
      console.error('Rebalance error:', err);
    }
  };

  // Prepare chart data
  const workloadChartData = workloadMetrics.map(m => ({
    name: m.assigneeName.split(' ')[0], // First name only
    utilization: Math.round(m.utilizationRate * 100),
    assignments: m.currentAssignments,
    capacity: m.maxCapacity,
    responseTime: m.averageResponseTime,
    completionRate: Math.round(m.completionRate * 100)
  }));

  const riskDistributionData = [
    { name: 'Low Risk', value: workloadMetrics.filter(m => m.overloadRisk === 'low').length, color: '#4CAF50' },
    { name: 'Medium Risk', value: workloadMetrics.filter(m => m.overloadRisk === 'medium').length, color: '#FF9800' },
    { name: 'High Risk', value: workloadMetrics.filter(m => m.overloadRisk === 'high').length, color: '#F44336' },
    { name: 'Critical', value: workloadMetrics.filter(m => m.overloadRisk === 'critical').length, color: '#9C27B0' }
  ];

  const territoryPerformanceData = territories.map(t => ({
    name: t.name.length > 15 ? t.name.substring(0, 15) + '...' : t.name,
    completionRate: Math.round(t.performance.completionRate * 100),
    satisfaction: t.performance.customerSatisfaction,
    responseTime: t.performance.averageResponseTime,
    requests: t.performance.totalRequests
  }));

  // Calculate summary metrics
  const avgUtilization = workloadMetrics.length > 0 
    ? workloadMetrics.reduce((sum, m) => sum + m.utilizationRate, 0) / workloadMetrics.length 
    : 0;
  
  const totalAssignments = workloadMetrics.reduce((sum, m) => sum + m.currentAssignments, 0);
  const totalCapacity = workloadMetrics.reduce((sum, m) => sum + m.maxCapacity, 0);
  const avgResponseTime = workloadMetrics.length > 0
    ? workloadMetrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / workloadMetrics.length
    : 0;

  if (loading) {
    return (
      <CardWrapper title="Assignment Analytics Dashboard" className="p-6">
        <LinearProgress />
        <P2 className="mt-2 text-center">Loading analytics data...</P2>
      </CardWrapper>
    );
  }

  return (
    <div className="space-y-6">
      <CardWrapper className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <H2 className="flex items-center gap-2">
              <AnalyticsIcon />
              Assignment Analytics & Optimization
            </H2>
            <P2 className="text-gray-600 mt-1">
              Real-time insights into assignment performance and workload distribution
            </P2>
          </div>
          
          <div className="flex items-center gap-2">
            <FormControlLabel
              control={
                <Switch 
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
              }
              label="Auto-refresh"
            />
            <Button 
              onClick={loadAnalyticsData} 
              disabled={loading}
              startIcon={<RefreshIcon />}
            >
              Refresh
            </Button>
            <Button 
              onClick={() => setRebalanceDialogOpen(true)}
              disabled={overloadedAssignees.length === 0}
              startIcon={<BalanceIcon />}
              color={overloadedAssignees.length > 0 ? 'warning' : 'primary'}
            >
              Rebalance Workload
            </Button>
          </div>
        </div>

        {error && (
          <Alert severity="error" className="mb-4" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Key Metrics Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <Paper className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <SpeedIcon className="text-blue-600 mr-2" />
                <H3 className="text-lg">{(avgUtilization * 100).toFixed(1)}%</H3>
              </div>
              <P2 className="text-gray-600">Average Utilization</P2>
              <LinearProgress 
                variant="determinate" 
                value={avgUtilization * 100}
                className="mt-2"
                color={avgUtilization > 0.85 ? 'error' : avgUtilization > 0.7 ? 'warning' : 'success'}
              />
            </Paper>
          </div>
          
          <div>
            <Paper className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <AssignmentIcon className="text-green-600 mr-2" />
                <H3 className="text-lg">{totalAssignments}/{totalCapacity}</H3>
              </div>
              <P2 className="text-gray-600">Total Assignments</P2>
              <LinearProgress 
                variant="determinate" 
                value={(totalAssignments / totalCapacity) * 100}
                className="mt-2"
                color="primary"
              />
            </Paper>
          </div>
          
          <div>
            <Paper className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <WarningIcon 
                  className={`mr-2 ${overloadedAssignees.length > 0 ? 'text-red-600' : 'text-gray-400'}`} 
                />
                <H3 className="text-lg">{overloadedAssignees.length}</H3>
              </div>
              <P2 className="text-gray-600">Overloaded</P2>
              {overloadedAssignees.length > 0 && (
                <Chip 
                  label="Action Required"
                  color="error"
                  size="small"
                  className="mt-2"
                />
              )}
            </Paper>
          </div>
          
          <div>
            <Paper className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <SpeedIcon className="text-purple-600 mr-2" />
                <H3 className="text-lg">{avgResponseTime.toFixed(0)}m</H3>
              </div>
              <P2 className="text-gray-600">Avg Response Time</P2>
              <div className="flex items-center justify-center mt-2">
                {avgResponseTime < 30 ? (
                  <CheckCircleIcon className="text-green-600" fontSize="small" />
                ) : (
                  <WarningIcon className="text-orange-600" fontSize="small" />
                )}
              </div>
            </Paper>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Workload Distribution Chart */}
          <div className="lg:col-span-2">
            <Paper className="p-4">
              <H3 className="mb-4">Workload Distribution</H3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={workloadChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="assignments" fill="#2196F3" name="Current Assignments" />
                  <Bar dataKey="capacity" fill="#E3F2FD" name="Max Capacity" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </div>

          {/* Risk Distribution Pie Chart */}
          <div>
            <Paper className="p-4">
              <H3 className="mb-4">Overload Risk Distribution</H3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={riskDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {riskDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </div>

          {/* Utilization Rate Chart */}
          <div>
            <Paper className="p-4">
              <H3 className="mb-4">Individual Utilization Rates</H3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={workloadChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <RechartsTooltip formatter={(value: any) => [`${value}%`, 'Utilization']} />
                  <Bar 
                    dataKey="utilization" 
                    fill="#4CAF50"
                    name="Utilization %"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </div>

          {/* Territory Performance Chart */}
          <div>
            <Paper className="p-4">
              <H3 className="mb-4">Territory Performance</H3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={territoryPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="completionRate" fill="#4CAF50" name="Completion Rate %" />
                  <Bar dataKey="satisfaction" fill="#2196F3" name="Satisfaction (1-5)" transform="scale(0, 20)" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </div>
        </div>

        {/* Detailed Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Workload Details Table */}
          <div className="lg:col-span-2">
            <Paper className="p-4">
              <H3 className="mb-4">Assignee Workload Details</H3>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Assignee</TableCell>
                      <TableCell align="center">Assignments</TableCell>
                      <TableCell align="center">Utilization</TableCell>
                      <TableCell align="center">Response Time</TableCell>
                      <TableCell align="center">Risk Level</TableCell>
                      <TableCell align="center">Trend</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {workloadMetrics.map((metric) => (
                      <TableRow key={metric.assigneeId}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <PersonIcon fontSize="small" />
                            {metric.assigneeName}
                          </div>
                        </TableCell>
                        <TableCell align="center">
                          {metric.currentAssignments}/{metric.maxCapacity}
                        </TableCell>
                        <TableCell align="center">
                          <div className="flex items-center gap-2">
                            <LinearProgress 
                              variant="determinate" 
                              value={metric.utilizationRate * 100}
                              className="w-16"
                              color={
                                metric.utilizationRate > 0.85 ? 'error' :
                                metric.utilizationRate > 0.7 ? 'warning' : 'success'
                              }
                            />
                            <span className="text-sm">
                              {(metric.utilizationRate * 100).toFixed(0)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell align="center">
                          {metric.averageResponseTime}m
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={metric.overloadRisk}
                            color={
                              metric.overloadRisk === 'critical' ? 'error' :
                              metric.overloadRisk === 'high' ? 'error' :
                              metric.overloadRisk === 'medium' ? 'warning' : 'success'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          {metric.trendDirection === 'improving' ? (
                            <TrendingUpIcon className="text-green-600" fontSize="small" />
                          ) : metric.trendDirection === 'declining' ? (
                            <TrendingDownIcon className="text-red-600" fontSize="small" />
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </div>

          {/* Territory Overview */}
          <div>
            <Paper className="p-4">
              <H3 className="mb-4">Territory Overview</H3>
              <div className="space-y-3">
                {territories.map((territory) => (
                  <div key={territory.id} className="border rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <TerritoryIcon fontSize="small" />
                        <strong className="text-sm">{territory.name}</strong>
                      </div>
                      <Chip 
                        label={territory.type}
                        size="small"
                        variant="outlined"
                      />
                    </div>
                    
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Completion Rate:</span>
                        <span>{(territory.performance.completionRate * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Satisfaction:</span>
                        <div className="flex items-center gap-1">
                          <StarIcon fontSize="small" className="text-yellow-500" />
                          <span>{territory.performance.customerSatisfaction.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Response:</span>
                        <span>{territory.performance.averageResponseTime}m</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Paper>
          </div>
        </div>
      </CardWrapper>

      {/* Workload Rebalancing Dialog */}
      <Dialog open={rebalanceDialogOpen} onClose={() => setRebalanceDialogOpen(false)}>
        <DialogTitle>Workload Rebalancing</DialogTitle>
        <DialogContent>
          <div className="space-y-4 pt-2">
            <P2>
              Initiate workload rebalancing to optimize assignment distribution and reduce overload.
            </P2>
            
            <FormControl fullWidth>
              <InputLabel>Rebalancing Reason</InputLabel>
              <Select
                value={rebalanceReason}
                onChange={(e) => setRebalanceReason(e.target.value)}
              >
                <MenuItem value="overload">Address Overload</MenuItem>
                <MenuItem value="underutilization">Optimize Utilization</MenuItem>
                <MenuItem value="manual">Manual Optimization</MenuItem>
                <MenuItem value="emergency">Emergency Rebalancing</MenuItem>
              </Select>
            </FormControl>
            
            {overloadedAssignees.length > 0 && (
              <Alert severity="warning">
                Found {overloadedAssignees.length} overloaded assignee(s): {' '}
                {overloadedAssignees.map(a => a.assigneeName).join(', ')}
              </Alert>
            )}
            
            {underutilizedAssignees.length > 0 && (
              <Alert severity="info">
                Found {underutilizedAssignees.length} underutilized assignee(s) available for additional work.
              </Alert>
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRebalanceDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRebalanceWorkload} color="primary">
            Start Rebalancing
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}