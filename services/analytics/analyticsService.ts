import { enhancedProjectsService } from '../business/enhancedProjectsService';
import type { AnalyticsFilters } from '../../components/admin/analytics/AdvancedFilters';

export interface AnalyticsOverview {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalRevenue: number;
  averageProjectValue: number;
  conversionRate: number;
  monthlyGrowth: number;
  topStatuses: { status: string; count: number; percentage: number }[];
  recentActivity: {
    projects: number;
    quotes: number;
    requests: number;
  };
}

export interface ProjectAnalytics {
  projectsByStatus: { status: string; count: number; value: number }[];
  projectsByProduct: { product: string; count: number; value: number }[];
  projectsByMonth: { month: string; count: number; value: number }[];
  averageProjectDuration: number;
  topAgents: { agent: string; count: number; value: number }[];
  topBrokerages: { brokerage: string; count: number; value: number }[];
}

export interface RevenueAnalytics {
  totalRevenue: number;
  monthlyRevenue: { month: string; revenue: number; profit: number }[];
  revenueByProduct: { product: string; revenue: number; percentage: number }[];
  revenueByAgent: { agent: string; revenue: number; count: number }[];
  averageProjectValue: number;
  projectedRevenue: number;
}

export interface TimeRangeData {
  range: 'week' | 'month' | 'quarter' | 'year';
  projects: number;
  revenue: number;
  growth: number;
  conversion: number;
}

class AnalyticsService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private setCachedData<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async getOverviewMetrics(): Promise<AnalyticsOverview> {
    const cacheKey = 'overview-metrics';
    const cached = this.getCachedData<AnalyticsOverview>(cacheKey);
    if (cached) return cached;

    try {
      const projectsResult = await enhancedProjectsService.getFullyEnhancedProjects();
      
      if (!projectsResult.success || !projectsResult.data) {
        throw new Error('Failed to fetch projects data');
      }

      const projects = projectsResult.data;
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

      // Calculate metrics
      const totalProjects = projects.length;
      const activeProjects = projects.filter(p => p.status !== 'completed' && p.status !== 'archived').length;
      const completedProjects = projects.filter(p => p.status === 'completed').length;
      
      // Revenue calculations
      const totalRevenue = projects.reduce((sum, p) => {
        return sum + (p.addedValue || p.boostPrice || 0);
      }, 0);
      
      const averageProjectValue = totalRevenue / Math.max(totalProjects, 1);
      
      // Conversion rate (completed / total)
      const conversionRate = (completedProjects / Math.max(totalProjects, 1)) * 100;
      
      // Monthly growth calculation
      const recentProjects = projects.filter(p => {
        const createdDate = new Date(p.createdDate || p.createdAt || Date.now());
        return createdDate >= lastMonth;
      });
      const monthlyGrowth = (recentProjects.length / Math.max(totalProjects - recentProjects.length, 1)) * 100;

      // Status distribution
      const statusCounts = projects.reduce((acc, p) => {
        const status = p.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topStatuses = Object.entries(statusCounts)
        .map(([status, count]) => ({
          status,
          count: count as number,
          percentage: ((count as number) / totalProjects) * 100
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const overview: AnalyticsOverview = {
        totalProjects,
        activeProjects,
        completedProjects,
        totalRevenue,
        averageProjectValue,
        conversionRate,
        monthlyGrowth,
        topStatuses,
        recentActivity: {
          projects: recentProjects.length,
          quotes: 0, // TODO: Add quotes data when available
          requests: 0, // TODO: Add requests data when available
        }
      };

      this.setCachedData(cacheKey, overview);
      return overview;
    } catch (error) {
      console.error('Error calculating overview metrics:', error);
      throw error;
    }
  }

  async getProjectAnalytics(): Promise<ProjectAnalytics> {
    const cacheKey = 'project-analytics';
    const cached = this.getCachedData<ProjectAnalytics>(cacheKey);
    if (cached) return cached;

    try {
      const projectsResult = await enhancedProjectsService.getFullyEnhancedProjects();
      
      if (!projectsResult.success || !projectsResult.data) {
        throw new Error('Failed to fetch projects data');
      }

      const projects = projectsResult.data;

      // Projects by status
      const projectsByStatus = Object.entries(
        projects.reduce((acc, p) => {
          const status = p.status || 'unknown';
          if (!acc[status]) {
            acc[status] = { count: 0, value: 0 };
          }
          acc[status].count += 1;
          acc[status].value += p.addedValue || p.boostPrice || 0;
          return acc;
        }, {} as Record<string, { count: number; value: number }>)
      ).map(([status, data]) => ({ status, count: (data as any).count, value: (data as any).value }));

      // Projects by product
      const projectsByProduct = Object.entries(
        projects.reduce((acc, p) => {
          const products = Array.isArray(p.selectedProducts) ? p.selectedProducts : [p.selectedProducts || 'unknown'];
          products.forEach((product: string) => {
            if (!acc[product]) {
              acc[product] = { count: 0, value: 0 };
            }
            acc[product].count += 1;
            acc[product].value += (p.addedValue || p.boostPrice || 0) / products.length;
          });
          return acc;
        }, {} as Record<string, { count: number; value: number }>)
      ).map(([product, data]) => ({ product, count: (data as any).count, value: (data as any).value }));

      // Projects by month (last 12 months)
      const monthlyData = new Map<string, { count: number; value: number }>();
      projects.forEach(p => {
        const date = new Date(p.createdDate || p.createdAt || Date.now());
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, { count: 0, value: 0 });
        }
        
        const data = monthlyData.get(monthKey)!;
        data.count += 1;
        data.value += p.addedValue || p.boostPrice || 0;
      });

      const projectsByMonth = Array.from(monthlyData.entries())
        .map(([month, data]) => ({ month, count: (data as any).count, value: (data as any).value }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-12); // Last 12 months

      // Average project duration (placeholder - would need completion dates)
      const averageProjectDuration = 30; // Days - placeholder

      // Top agents
      const topAgents = Object.entries(
        projects.reduce((acc, p) => {
          const agent = p.agentName || 'Unknown';
          if (!acc[agent]) {
            acc[agent] = { count: 0, value: 0 };
          }
          acc[agent].count += 1;
          acc[agent].value += p.addedValue || p.boostPrice || 0;
          return acc;
        }, {} as Record<string, { count: number; value: number }>)
      )
        .map(([agent, data]) => ({ agent, count: (data as any).count, value: (data as any).value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      // Top brokerages
      const topBrokerages = Object.entries(
        projects.reduce((acc, p) => {
          const brokerage = p.brokerage || 'Unknown';
          if (!acc[brokerage]) {
            acc[brokerage] = { count: 0, value: 0 };
          }
          acc[brokerage].count += 1;
          acc[brokerage].value += p.addedValue || p.boostPrice || 0;
          return acc;
        }, {} as Record<string, { count: number; value: number }>)
      )
        .map(([brokerage, data]) => ({ brokerage, count: (data as any).count, value: (data as any).value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      const analytics: ProjectAnalytics = {
        projectsByStatus,
        projectsByProduct,
        projectsByMonth,
        averageProjectDuration,
        topAgents,
        topBrokerages
      };

      this.setCachedData(cacheKey, analytics);
      return analytics;
    } catch (error) {
      console.error('Error calculating project analytics:', error);
      throw error;
    }
  }

  async getRevenueAnalytics(): Promise<RevenueAnalytics> {
    const cacheKey = 'revenue-analytics';
    const cached = this.getCachedData<RevenueAnalytics>(cacheKey);
    if (cached) return cached;

    try {
      const projectsResult = await enhancedProjectsService.getFullyEnhancedProjects();
      
      if (!projectsResult.success || !projectsResult.data) {
        throw new Error('Failed to fetch projects data');
      }

      const projects = projectsResult.data;

      // Total revenue
      const totalRevenue = projects.reduce((sum, p) => {
        return sum + (p.addedValue || p.boostPrice || 0);
      }, 0);

      // Monthly revenue (last 12 months)
      const monthlyRevenueMap = new Map<string, { revenue: number; profit: number }>();
      projects.forEach(p => {
        const date = new Date(p.createdDate || p.createdAt || Date.now());
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyRevenueMap.has(monthKey)) {
          monthlyRevenueMap.set(monthKey, { revenue: 0, profit: 0 });
        }
        
        const data = monthlyRevenueMap.get(monthKey)!;
        const revenue = p.addedValue || p.boostPrice || 0;
        data.revenue += revenue;
        data.profit += revenue * 0.7; // Assume 70% profit margin
      });

      const monthlyRevenue = Array.from(monthlyRevenueMap.entries())
        .map(([month, data]) => ({ month, revenue: (data as any).revenue, profit: (data as any).profit }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-12);

      // Revenue by product
      const productRevenue = projects.reduce((acc, p) => {
        const products = Array.isArray(p.selectedProducts) ? p.selectedProducts : [p.selectedProducts || 'unknown'];
        const projectRevenue = p.addedValue || p.boostPrice || 0;
        
        products.forEach((product: string) => {
          acc[product] = (acc[product] || 0) + (projectRevenue / products.length);
        });
        
        return acc;
      }, {} as Record<string, number>);

      const revenueByProduct = Object.entries(productRevenue)
        .map(([product, revenue]) => ({
          product,
          revenue: revenue as number,
          percentage: ((revenue as number) / totalRevenue) * 100
        }))
        .sort((a, b) => b.revenue - a.revenue);

      // Revenue by agent
      const agentRevenue = projects.reduce((acc, p) => {
        const agent = p.agentName || 'Unknown';
        const revenue = p.addedValue || p.boostPrice || 0;
        
        if (!acc[agent]) {
          acc[agent] = { revenue: 0, count: 0 };
        }
        
        acc[agent].revenue += revenue;
        acc[agent].count += 1;
        
        return acc;
      }, {} as Record<string, { revenue: number; count: number }>);

      const revenueByAgent = Object.entries(agentRevenue)
        .map(([agent, data]) => ({ agent, revenue: (data as any).revenue, count: (data as any).count }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Average project value
      const averageProjectValue = totalRevenue / Math.max(projects.length, 1);

      // Projected revenue (simple growth projection)
      const recentMonthsRevenue = monthlyRevenue.slice(-3).reduce((sum, m) => sum + m.revenue, 0);
      const averageMonthlyRevenue = recentMonthsRevenue / 3;
      const projectedRevenue = averageMonthlyRevenue * 12; // Annualized

      const analytics: RevenueAnalytics = {
        totalRevenue,
        monthlyRevenue,
        revenueByProduct,
        revenueByAgent,
        averageProjectValue,
        projectedRevenue
      };

      this.setCachedData(cacheKey, analytics);
      return analytics;
    } catch (error) {
      console.error('Error calculating revenue analytics:', error);
      throw error;
    }
  }

  async getTimeRangeData(range: 'week' | 'month' | 'quarter' | 'year'): Promise<TimeRangeData> {
    const cacheKey = `time-range-${range}`;
    const cached = this.getCachedData<TimeRangeData>(cacheKey);
    if (cached) return cached;

    try {
      const projectsResult = await enhancedProjectsService.getFullyEnhancedProjects();
      
      if (!projectsResult.success || !projectsResult.data) {
        throw new Error('Failed to fetch projects data');
      }

      const projects = projectsResult.data;
      const now = new Date();
      let startDate: Date;

      switch (range) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          break;
        case 'quarter':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          break;
        case 'year':
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          break;
      }

      const rangeProjects = projects.filter(p => {
        const createdDate = new Date(p.createdDate || p.createdAt || Date.now());
        return createdDate >= startDate;
      });

      const previousRangeProjects = projects.filter(p => {
        const createdDate = new Date(p.createdDate || p.createdAt || Date.now());
        const previousStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));
        return createdDate >= previousStart && createdDate < startDate;
      });

      const projectsCount = rangeProjects.length;
      const revenue = rangeProjects.reduce((sum, p) => sum + (p.addedValue || p.boostPrice || 0), 0);
      const completedProjects = rangeProjects.filter(p => p.status === 'completed').length;
      const conversion = (completedProjects / Math.max(projectsCount, 1)) * 100;
      
      const previousProjectsCount = previousRangeProjects.length;
      const growth = previousProjectsCount > 0 
        ? ((projectsCount - previousProjectsCount) / previousProjectsCount) * 100 
        : 0;

      const data: TimeRangeData = {
        range,
        projects: projectsCount,
        revenue,
        growth,
        conversion
      };

      this.setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`Error calculating ${range} data:`, error);
      throw error;
    }
  }

  // Apply filters to projects data
  private applyFiltersToProjects(projects: any[], filters: AnalyticsFilters): any[] {
    let filteredProjects = [...projects];

    // Apply date range filter
    if (filters.dateRange.startDate || filters.dateRange.endDate) {
      filteredProjects = filteredProjects.filter(project => {
        const projectDate = new Date(project.createdDate || project.createdAt || Date.now());
        const start = filters.dateRange.startDate?.toDate();
        const end = filters.dateRange.endDate?.toDate();
        
        if (start && projectDate < start) return false;
        if (end && projectDate > end) return false;
        return true;
      });
    }

    // Apply data filters
    if (filters.dataFilters.statuses.length > 0) {
      filteredProjects = filteredProjects.filter(project => 
        filters.dataFilters.statuses.includes(project.status)
      );
    }

    if (filters.dataFilters.agents.length > 0) {
      filteredProjects = filteredProjects.filter(project => 
        filters.dataFilters.agents.includes(project.agentName || 'Unknown')
      );
    }

    if (filters.dataFilters.products.length > 0) {
      filteredProjects = filteredProjects.filter(project => {
        const projectProducts = Array.isArray(project.selectedProducts) 
          ? project.selectedProducts 
          : [project.selectedProducts || 'unknown'];
        return projectProducts.some((product: string) => filters.dataFilters.products.includes(product));
      });
    }

    if (filters.dataFilters.brokerages.length > 0) {
      filteredProjects = filteredProjects.filter(project => 
        filters.dataFilters.brokerages.includes(project.brokerage || 'Unknown')
      );
    }

    return filteredProjects;
  }

  // Get filtered overview metrics
  async getFilteredOverviewMetrics(filters: AnalyticsFilters): Promise<AnalyticsOverview> {
    try {
      const projectsResult = await enhancedProjectsService.getFullyEnhancedProjects();
      
      if (!projectsResult.success || !projectsResult.data) {
        throw new Error('Failed to fetch projects data');
      }

      const allProjects = projectsResult.data;
      const filteredProjects = this.applyFiltersToProjects(allProjects, filters);

      // Calculate metrics on filtered data
      const totalProjects = filteredProjects.length;
      const activeProjects = filteredProjects.filter(p => p.status !== 'completed' && p.status !== 'archived').length;
      const completedProjects = filteredProjects.filter(p => p.status === 'completed').length;
      
      // Revenue calculations
      const totalRevenue = filteredProjects.reduce((sum, p) => {
        return sum + (p.addedValue || p.boostPrice || 0);
      }, 0);
      
      const averageProjectValue = totalRevenue / Math.max(totalProjects, 1);
      const conversionRate = (completedProjects / Math.max(totalProjects, 1)) * 100;
      
      // Calculate growth based on filtered date range
      const midpoint = filters.dateRange.startDate && filters.dateRange.endDate
        ? new Date((filters.dateRange.startDate.toDate().getTime() + filters.dateRange.endDate.toDate().getTime()) / 2)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to 30 days ago

      const recentProjects = filteredProjects.filter(p => {
        const createdDate = new Date(p.createdDate || p.createdAt || Date.now());
        return createdDate >= midpoint;
      });
      
      const olderProjects = filteredProjects.filter(p => {
        const createdDate = new Date(p.createdDate || p.createdAt || Date.now());
        return createdDate < midpoint;
      });

      const monthlyGrowth = olderProjects.length > 0 
        ? ((recentProjects.length - olderProjects.length) / olderProjects.length) * 100 
        : 0;

      // Status distribution
      const statusCounts = filteredProjects.reduce((acc, p) => {
        const status = p.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topStatuses = Object.entries(statusCounts)
        .map(([status, count]) => ({
          status,
          count: count as number,
          percentage: ((count as number) / totalProjects) * 100
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalProjects,
        activeProjects,
        completedProjects,
        totalRevenue,
        averageProjectValue,
        conversionRate,
        monthlyGrowth,
        topStatuses,
        recentActivity: {
          projects: recentProjects.length,
          quotes: 0,
          requests: 0,
        }
      };
    } catch (error) {
      console.error('Error calculating filtered overview metrics:', error);
      throw error;
    }
  }

  // Get filtered project analytics
  async getFilteredProjectAnalytics(filters: AnalyticsFilters): Promise<ProjectAnalytics> {
    try {
      const projectsResult = await enhancedProjectsService.getFullyEnhancedProjects();
      
      if (!projectsResult.success || !projectsResult.data) {
        throw new Error('Failed to fetch projects data');
      }

      const allProjects = projectsResult.data;
      const filteredProjects = this.applyFiltersToProjects(allProjects, filters);

      // Use the existing analytics logic but on filtered data
      return this.calculateProjectAnalyticsFromData(filteredProjects, filters.groupBy);
    } catch (error) {
      console.error('Error calculating filtered project analytics:', error);
      throw error;
    }
  }

  // Get filtered revenue analytics
  async getFilteredRevenueAnalytics(filters: AnalyticsFilters): Promise<RevenueAnalytics> {
    try {
      const projectsResult = await enhancedProjectsService.getFullyEnhancedProjects();
      
      if (!projectsResult.success || !projectsResult.data) {
        throw new Error('Failed to fetch projects data');
      }

      const allProjects = projectsResult.data;
      const filteredProjects = this.applyFiltersToProjects(allProjects, filters);

      return this.calculateRevenueAnalyticsFromData(filteredProjects, filters.groupBy);
    } catch (error) {
      console.error('Error calculating filtered revenue analytics:', error);
      throw error;
    }
  }

  // Extract analytics calculation to reusable methods
  private calculateProjectAnalyticsFromData(projects: any[], groupBy: 'month' | 'quarter' | 'year'): ProjectAnalytics {
    // Projects by status
    const projectsByStatus = Object.entries(
      projects.reduce((acc, p) => {
        const status = p.status || 'unknown';
        if (!acc[status]) {
          acc[status] = { count: 0, value: 0 };
        }
        acc[status].count += 1;
        acc[status].value += p.addedValue || p.boostPrice || 0;
        return acc;
      }, {} as Record<string, { count: number; value: number }>)
    ).map(([status, data]) => ({ status, count: (data as any).count, value: (data as any).value }));

    // Projects by product
    const projectsByProduct = Object.entries(
      projects.reduce((acc, p) => {
        const products = Array.isArray(p.selectedProducts) ? p.selectedProducts : [p.selectedProducts || 'unknown'];
        products.forEach((product: string) => {
          if (!acc[product]) {
            acc[product] = { count: 0, value: 0 };
          }
          acc[product].count += 1;
          acc[product].value += (p.addedValue || p.boostPrice || 0) / products.length;
        });
        return acc;
      }, {} as Record<string, { count: number; value: number }>)
    ).map(([product, data]) => ({ product, count: (data as any).count, value: (data as any).value }));

    // Projects by time period based on groupBy
    const timeData = new Map<string, { count: number; value: number }>();
    projects.forEach(p => {
      const date = new Date(p.createdDate || p.createdAt || Date.now());
      let periodKey: string;
      
      switch (groupBy) {
        case 'quarter':
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          periodKey = `${date.getFullYear()}-Q${quarter}`;
          break;
        case 'year':
          periodKey = date.getFullYear().toString();
          break;
        default: // month
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      if (!timeData.has(periodKey)) {
        timeData.set(periodKey, { count: 0, value: 0 });
      }
      
      const data = timeData.get(periodKey)!;
      data.count += 1;
      data.value += p.addedValue || p.boostPrice || 0;
    });

    const projectsByMonth = Array.from(timeData.entries())
      .map(([period, data]) => ({ month: period, count: (data as any).count, value: (data as any).value }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Rest of analytics calculations...
    const averageProjectDuration = 30;

    const topAgents = Object.entries(
      projects.reduce((acc, p) => {
        const agent = p.agentName || 'Unknown';
        if (!acc[agent]) {
          acc[agent] = { count: 0, value: 0 };
        }
        acc[agent].count += 1;
        acc[agent].value += p.addedValue || p.boostPrice || 0;
        return acc;
      }, {} as Record<string, { count: number; value: number }>)
    )
      .map(([agent, data]) => ({ agent, count: (data as any).count, value: (data as any).value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const topBrokerages = Object.entries(
      projects.reduce((acc, p) => {
        const brokerage = p.brokerage || 'Unknown';
        if (!acc[brokerage]) {
          acc[brokerage] = { count: 0, value: 0 };
        }
        acc[brokerage].count += 1;
        acc[brokerage].value += p.addedValue || p.boostPrice || 0;
        return acc;
      }, {} as Record<string, { count: number; value: number }>)
    )
      .map(([brokerage, data]) => ({ brokerage, count: (data as any).count, value: (data as any).value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    return {
      projectsByStatus,
      projectsByProduct,
      projectsByMonth,
      averageProjectDuration,
      topAgents,
      topBrokerages
    };
  }

  private calculateRevenueAnalyticsFromData(projects: any[], groupBy: 'month' | 'quarter' | 'year'): RevenueAnalytics {
    const totalRevenue = projects.reduce((sum, p) => sum + (p.addedValue || p.boostPrice || 0), 0);

    // Monthly revenue based on groupBy
    const revenueData = new Map<string, { revenue: number; profit: number }>();
    projects.forEach(p => {
      const date = new Date(p.createdDate || p.createdAt || Date.now());
      let periodKey: string;
      
      switch (groupBy) {
        case 'quarter':
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          periodKey = `${date.getFullYear()}-Q${quarter}`;
          break;
        case 'year':
          periodKey = date.getFullYear().toString();
          break;
        default:
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      if (!revenueData.has(periodKey)) {
        revenueData.set(periodKey, { revenue: 0, profit: 0 });
      }
      
      const data = revenueData.get(periodKey)!;
      const revenue = p.addedValue || p.boostPrice || 0;
      data.revenue += revenue;
      data.profit += revenue * 0.7;
    });

    const monthlyRevenue = Array.from(revenueData.entries())
      .map(([period, data]) => ({ month: period, revenue: (data as any).revenue, profit: (data as any).profit }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Revenue by product
    const productRevenue = projects.reduce((acc, p) => {
      const products = Array.isArray(p.selectedProducts) ? p.selectedProducts : [p.selectedProducts || 'unknown'];
      const projectRevenue = p.addedValue || p.boostPrice || 0;
      
      products.forEach((product: string) => {
        acc[product] = (acc[product] || 0) + (projectRevenue / products.length);
      });
      
      return acc;
    }, {} as Record<string, number>);

    const revenueByProduct = Object.entries(productRevenue)
      .map(([product, revenue]) => ({
        product,
        revenue: revenue as number,
        percentage: ((revenue as number) / totalRevenue) * 100
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Revenue by agent
    const agentRevenue = projects.reduce((acc, p) => {
      const agent = p.agentName || 'Unknown';
      const revenue = p.addedValue || p.boostPrice || 0;
      
      if (!acc[agent]) {
        acc[agent] = { revenue: 0, count: 0 };
      }
      
      acc[agent].revenue += revenue;
      acc[agent].count += 1;
      
      return acc;
    }, {} as Record<string, { revenue: number; count: number }>);

    const revenueByAgent = Object.entries(agentRevenue)
      .map(([agent, data]) => ({ agent, revenue: (data as any).revenue, count: (data as any).count }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const averageProjectValue = totalRevenue / Math.max(projects.length, 1);
    const recentRevenue = monthlyRevenue.slice(-3).reduce((sum, m) => sum + m.revenue, 0);
    const averageMonthlyRevenue = recentRevenue / 3;
    const projectedRevenue = averageMonthlyRevenue * 12;

    return {
      totalRevenue,
      monthlyRevenue,
      revenueByProduct,
      revenueByAgent,
      averageProjectValue,
      projectedRevenue
    };
  }

  // Get available filter options
  async getFilterOptions(): Promise<{
    statuses: string[];
    agents: string[];
    products: string[];
    brokerages: string[];
  }> {
    try {
      const projectsResult = await enhancedProjectsService.getFullyEnhancedProjects();
      
      if (!projectsResult.success || !projectsResult.data) {
        return { statuses: [], agents: [], products: [], brokerages: [] };
      }

      const projects = projectsResult.data;

      const statuses = Array.from(new Set(projects.map(p => p.status).filter(Boolean))).sort() as string[];
      const agents = Array.from(new Set(projects.map(p => p.agentName).filter(Boolean))).sort() as string[];
      const brokerages = Array.from(new Set(projects.map(p => p.brokerage).filter(Boolean))).sort() as string[];
      
      const allProducts = new Set<string>();
      projects.forEach(p => {
        const products = Array.isArray(p.selectedProducts) ? p.selectedProducts : [p.selectedProducts || 'unknown'];
        products.forEach((product: string) => allProducts.add(product));
      });
      const products = Array.from(allProducts).filter(Boolean).sort() as string[];

      return { statuses, agents, products, brokerages };
    } catch (error) {
      console.error('Error getting filter options:', error);
      return { statuses: [], agents: [], products: [], brokerages: [] };
    }
  }

  // Clear cache when data is updated
  clearCache(): void {
    this.cache.clear();
  }

  // Export functionality
  async exportAnalyticsData(format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const [overview, projects, revenue] = await Promise.all([
        this.getOverviewMetrics(),
        this.getProjectAnalytics(),
        this.getRevenueAnalytics()
      ]);

      const data = {
        overview,
        projects,
        revenue,
        exportedAt: new Date().toISOString()
      };

      if (format === 'json') {
        return JSON.stringify(data, null, 2);
      } else {
        // Convert to CSV format
        return this.convertToCSV(data);
      }
    } catch (error) {
      console.error('Error exporting analytics data:', error);
      throw error;
    }
  }

  private convertToCSV(data: any): string {
    // Simple CSV conversion for overview metrics
    const lines: string[] = [];
    lines.push('Metric,Value');
    lines.push(`Total Projects,${data.overview.totalProjects}`);
    lines.push(`Active Projects,${data.overview.activeProjects}`);
    lines.push(`Completed Projects,${data.overview.completedProjects}`);
    lines.push(`Total Revenue,${data.overview.totalRevenue}`);
    lines.push(`Average Project Value,${data.overview.averageProjectValue}`);
    lines.push(`Conversion Rate,${data.overview.conversionRate}%`);
    lines.push(`Monthly Growth,${data.overview.monthlyGrowth}%`);
    
    return lines.join('\n');
  }
}

export const analyticsService = new AnalyticsService();