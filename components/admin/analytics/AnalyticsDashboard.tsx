import React, { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Assessment,
  Download,
  Refresh,
  Timeline,
  PieChart,
  BarChart,
  AttachMoney,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import dayjs from 'dayjs';
import { H1, H2, H3, P1, P2 } from '../../typography';
import { analyticsService } from '../../../services/analytics/analyticsService';
import { queryKeys } from '../../../lib/queryClient';
import { formatCurrencyFull } from '../../../utils/formatUtils';
import AdvancedFilters, { type AnalyticsFilters } from './AdvancedFilters';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  icon?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

function KPICard({ title, value, subtitle, trend, icon, color = 'primary' }: KPICardProps) {
  const trendColor = trend && trend > 0 ? 'success.main' : trend && trend < 0 ? 'error.main' : 'text.secondary';
  const TrendIcon = trend && trend > 0 ? TrendingUp : TrendingDown;

  return (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {icon}
            <Typography variant="h6" color="text.secondary" fontWeight="medium">
              {title}
            </Typography>
          </Box>
        </Box>
        
        <Typography variant="h4" fontWeight="bold" color={`${color}.main`} gutterBottom>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Typography>
        
        {subtitle && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {subtitle}
          </Typography>
        )}
        
        {trend !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TrendIcon sx={{ fontSize: 16, color: trendColor }} />
            <Typography variant="caption" sx={{ color: trendColor, fontWeight: 'medium' }}>
              {Math.abs(trend).toFixed(1)}% {trend >= 0 ? 'increase' : 'decrease'}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

const COLORS = ['#1976d2', '#dc004e', '#ed6c02', '#2e7d32', '#9c27b0', '#d32f2f'];

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Advanced filters state
  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateRange: {
      startDate: null,
      endDate: null,
      preset: 'last30days',
    },
    metrics: {
      revenue: true,
      projects: true,
      conversion: true,
      growth: true,
    },
    dataFilters: {
      statuses: [],
      agents: [],
      products: [],
      brokerages: [],
    },
    groupBy: 'month',
    compareMode: false,
    showProjections: false,
  });
  
  // Check if any filters are applied
  const hasActiveFilters = useMemo(() => {
    return (
      filters.dateRange.preset !== 'custom' || 
      filters.dateRange.startDate || 
      filters.dateRange.endDate ||
      filters.dataFilters.statuses.length > 0 ||
      filters.dataFilters.agents.length > 0 ||
      filters.dataFilters.products.length > 0 ||
      filters.dataFilters.brokerages.length > 0
    );
  }, [filters]);

  // Fetch analytics data - use filtered methods when filters are active
  const { data: overview, isLoading: overviewLoading, error: overviewError } = useQuery({
    queryKey: [...queryKeys.analyticsOverview, refreshKey, filters],
    queryFn: () => hasActiveFilters 
      ? analyticsService.getFilteredOverviewMetrics(filters)
      : analyticsService.getOverviewMetrics(),
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  const { data: projectAnalytics, isLoading: projectsLoading } = useQuery({
    queryKey: [...queryKeys.analyticsProjects, refreshKey, filters],
    queryFn: () => hasActiveFilters
      ? analyticsService.getFilteredProjectAnalytics(filters)
      : analyticsService.getProjectAnalytics(),
  });

  const { data: revenueAnalytics, isLoading: revenueLoading } = useQuery({
    queryKey: [...queryKeys.analyticsRevenue, refreshKey, filters],
    queryFn: () => hasActiveFilters
      ? analyticsService.getFilteredRevenueAnalytics(filters)
      : analyticsService.getRevenueAnalytics(),
  });
  
  // Fetch available filter options
  const { data: filterOptions } = useQuery({
    queryKey: [...queryKeys.analyticsFilterOptions, refreshKey],
    queryFn: () => analyticsService.getFilterOptions(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: timeRangeData } = useQuery({
    queryKey: [...queryKeys.analyticsTimeRange(timeRange), refreshKey],
    queryFn: () => analyticsService.getTimeRangeData(timeRange),
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };
  
  const handleFiltersChange = useCallback((newFilters: AnalyticsFilters) => {
    setFilters(newFilters);
  }, []);
  
  const handleResetFilters = useCallback(() => {
    setFilters({
      dateRange: {
        startDate: null,
        endDate: null,
        preset: 'last30days',
      },
      metrics: {
        revenue: true,
        projects: true,
        conversion: true,
        growth: true,
      },
      dataFilters: {
        statuses: [],
        agents: [],
        products: [],
        brokerages: [],
      },
      groupBy: 'month',
      compareMode: false,
      showProjections: false,
    });
  }, []);

  const handleExport = async () => {
    try {
      const data = await analyticsService.exportAnalyticsData('json');
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const isLoading = overviewLoading || projectsLoading || revenueLoading;

  if (overviewError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load analytics data. Please try again.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Advanced Filters */}
      {filterOptions && (
        <AdvancedFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          availableOptions={filterOptions}
          onReset={handleResetFilters}
        />
      )}
      
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <H1>Analytics Dashboard</H1>
          <Typography variant="body2" color="text.secondary">
            Comprehensive insights into your business performance
            {hasActiveFilters && (
              <Typography component="span" variant="body2" color="primary.main" sx={{ ml: 1 }}>
                • Filtered View Active
              </Typography>
            )}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value as any)}
            >
              <MenuItem value="week">Last Week</MenuItem>
              <MenuItem value="month">Last Month</MenuItem>
              <MenuItem value="quarter">Last Quarter</MenuItem>
              <MenuItem value="year">Last Year</MenuItem>
            </Select>
          </FormControl>
          
          <Tooltip title="Refresh Data">
            <IconButton onClick={handleRefresh} disabled={isLoading}>
              <Refresh />
            </IconButton>
          </Tooltip>
          
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExport}
            disabled={isLoading}
          >
            Export
          </Button>
        </Box>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* KPI Cards */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box data-testid="kpi-total-projects">
              <KPICard
                title="Total Projects"
                value={overview?.totalProjects || 0}
                subtitle="All time projects"
                trend={overview?.monthlyGrowth}
                icon={<Assessment color="primary" />}
                color="primary"
              />
            </Box>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box data-testid="kpi-active-projects">
              <KPICard
                title="Active Projects"
                value={overview?.activeProjects || 0}
                subtitle="Currently in progress"
                icon={<Timeline color="success" />}
                color="success"
              />
            </Box>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box data-testid="kpi-total-revenue">
              <KPICard
                title="Total Revenue"
                value={formatCurrencyFull(overview?.totalRevenue || 0)}
                subtitle="All time revenue"
                icon={<AttachMoney color="secondary" />}
                color="secondary"
              />
            </Box>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box data-testid="kpi-conversion-rate">
              <KPICard
                title="Conversion Rate"
                value={`${(overview?.conversionRate || 0).toFixed(1)}%`}
                subtitle="Projects completed"
                icon={<TrendingUp color="warning" />}
                color="warning"
              />
            </Box>
          </Grid>

          {/* Revenue Chart */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <Paper sx={{ p: 3, height: 400 }} data-testid="revenue-chart">
              <Typography variant="h6" gutterBottom>Revenue Trends</Typography>
              {revenueAnalytics?.monthlyRevenue && (
                <ResponsiveContainer width="100%" height="85%">
                  <AreaChart data={revenueAnalytics.monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip 
                      formatter={(value: number) => [formatCurrencyFull(value), '']}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#1976d2"
                      fill="#1976d2"
                      fillOpacity={0.6}
                      name="Revenue"
                    />
                    <Area
                      type="monotone"
                      dataKey="profit"
                      stroke="#2e7d32"
                      fill="#2e7d32"
                      fillOpacity={0.6}
                      name="Profit"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Paper>
          </Grid>

          {/* Status Distribution */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Paper sx={{ p: 3, height: 400 }} data-testid="status-chart">
              <Typography variant="h6" gutterBottom>Project Status</Typography>
              {overview?.topStatuses && (
                <ResponsiveContainer width="100%" height="85%">
                  <RechartsPieChart>
                    <Pie
                      data={overview.topStatuses}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="status"
                    >
                      {overview.topStatuses.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              )}
            </Paper>
          </Grid>

          {/* Projects by Month */}
          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 3, height: 400 }} data-testid="projects-chart">
              <Typography variant="h6" gutterBottom>Projects Over Time</Typography>
              {projectAnalytics?.projectsByMonth && (
                <ResponsiveContainer width="100%" height="85%">
                  <LineChart data={projectAnalytics.projectsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#1976d2"
                      strokeWidth={3}
                      name="Projects"
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#dc004e"
                      strokeWidth={2}
                      name="Value"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Paper>
          </Grid>

          {/* Top Agents */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, height: 400 }} data-testid="agents-chart">
              <Typography variant="h6" gutterBottom>Top Performing Agents</Typography>
              {projectAnalytics?.topAgents && (
                <ResponsiveContainer width="100%" height="85%">
                  <RechartsBarChart data={projectAnalytics.topAgents.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="agent" />
                    <YAxis />
                    <RechartsTooltip 
                      formatter={(value: number, name: string) => [
                        name === 'value' ? formatCurrencyFull(value) : value,
                        name === 'value' ? 'Revenue' : 'Projects'
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="count" fill="#1976d2" name="Projects" />
                    <Bar dataKey="value" fill="#dc004e" name="Revenue" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              )}
            </Paper>
          </Grid>

          {/* Revenue by Product */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, height: 400 }} data-testid="products-chart">
              <Typography variant="h6" gutterBottom>Revenue by Product</Typography>
              {revenueAnalytics?.revenueByProduct && (
                <ResponsiveContainer width="100%" height="85%">
                  <RechartsBarChart data={revenueAnalytics.revenueByProduct.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="product" />
                    <YAxis />
                    <RechartsTooltip 
                      formatter={(value: number) => [formatCurrencyFull(value), 'Revenue']}
                    />
                    <Bar dataKey="revenue" fill="#2e7d32" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              )}
            </Paper>
          </Grid>

          {/* Recent Activity Summary */}
          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Quick Stats</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h5" color="primary" fontWeight="bold">
                      {overview?.averageProjectValue ? formatCurrencyFull(overview.averageProjectValue) : '$0'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Average Project Value
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h5" color="secondary" fontWeight="bold">
                      {timeRangeData?.projects || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Projects This {timeRange}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h5" color="success.main" fontWeight="bold">
                      {timeRangeData?.growth ? `${timeRangeData.growth.toFixed(1)}%` : '0%'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Growth Rate
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}