import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  Collapse,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Autocomplete,
  TextField,
} from '@mui/material';
import {
  FilterList,
  ExpandMore,
  ExpandLess,
  Clear,
  Save,
  Restore,
  DateRange,
  Assessment,
  TrendingUp,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';

export interface AnalyticsFilters {
  dateRange: {
    startDate: Dayjs | null;
    endDate: Dayjs | null;
    preset: string;
  };
  metrics: {
    revenue: boolean;
    projects: boolean;
    conversion: boolean;
    growth: boolean;
  };
  dataFilters: {
    statuses: string[];
    agents: string[];
    products: string[];
    brokerages: string[];
  };
  groupBy: 'month' | 'quarter' | 'year';
  compareMode: boolean;
  showProjections: boolean;
}

interface AdvancedFiltersProps {
  filters: AnalyticsFilters;
  onFiltersChange: (filters: AnalyticsFilters) => void;
  availableOptions: {
    statuses: string[];
    agents: string[];
    products: string[];
    brokerages: string[];
  };
  onReset: () => void;
  onSave?: (name: string) => void;
  savedFilters?: { name: string; filters: AnalyticsFilters }[];
}

const DATE_PRESETS = [
  { value: 'custom', label: 'Custom Range' },
  { value: 'last7days', label: 'Last 7 Days' },
  { value: 'last30days', label: 'Last 30 Days' },
  { value: 'last90days', label: 'Last 90 Days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'thisQuarter', label: 'This Quarter' },
  { value: 'lastQuarter', label: 'Last Quarter' },
  { value: 'thisYear', label: 'This Year' },
  { value: 'lastYear', label: 'Last Year' },
];

export default function AdvancedFilters({
  filters,
  onFiltersChange,
  availableOptions,
  onReset,
  onSave,
  savedFilters = [],
}: AdvancedFiltersProps) {
  const [expanded, setExpanded] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [filterName, setFilterName] = useState('');

  const handleDatePresetChange = useCallback((preset: string) => {
    const now = dayjs();
    let startDate: Dayjs | null = null;
    let endDate: Dayjs | null = null;

    switch (preset) {
      case 'last7days':
        startDate = now.subtract(7, 'day');
        endDate = now;
        break;
      case 'last30days':
        startDate = now.subtract(30, 'day');
        endDate = now;
        break;
      case 'last90days':
        startDate = now.subtract(90, 'day');
        endDate = now;
        break;
      case 'thisMonth':
        startDate = now.startOf('month');
        endDate = now;
        break;
      case 'lastMonth':
        startDate = now.subtract(1, 'month').startOf('month');
        endDate = now.subtract(1, 'month').endOf('month');
        break;
      case 'thisQuarter':
        startDate = now.startOf('Q' as any);
        endDate = now;
        break;
      case 'lastQuarter':
        startDate = now.subtract(1, 'Q' as any).startOf('Q' as any);
        endDate = now.subtract(1, 'Q' as any).endOf('Q' as any);
        break;
      case 'thisYear':
        startDate = now.startOf('year');
        endDate = now;
        break;
      case 'lastYear':
        startDate = now.subtract(1, 'year').startOf('year');
        endDate = now.subtract(1, 'year').endOf('year');
        break;
      default:
        // Custom - don't change dates
        break;
    }

    onFiltersChange({
      ...filters,
      dateRange: {
        startDate,
        endDate,
        preset,
      },
    });
  }, [filters, onFiltersChange]);

  const handleMetricToggle = useCallback((metric: keyof AnalyticsFilters['metrics']) => {
    onFiltersChange({
      ...filters,
      metrics: {
        ...filters.metrics,
        [metric]: !filters.metrics[metric],
      },
    });
  }, [filters, onFiltersChange]);

  const handleDataFilterChange = useCallback((
    filterType: keyof AnalyticsFilters['dataFilters'],
    values: string[]
  ) => {
    onFiltersChange({
      ...filters,
      dataFilters: {
        ...filters.dataFilters,
        [filterType]: values,
      },
    });
  }, [filters, onFiltersChange]);

  const handleSaveFilter = useCallback(() => {
    if (onSave && filterName.trim()) {
      onSave(filterName.trim());
      setFilterName('');
      setSaveDialogOpen(false);
    }
  }, [onSave, filterName]);

  const activeFiltersCount = Object.values(filters.metrics).filter(Boolean).length +
    Object.values(filters.dataFilters).reduce((count, arr) => count + arr.length, 0) +
    (filters.dateRange.preset !== 'custom' || filters.dateRange.startDate || filters.dateRange.endDate ? 1 : 0);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Paper elevation={2} sx={{ mb: 3 }}>
        {/* Filter Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FilterList color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Advanced Filters
            </Typography>
            {activeFiltersCount > 0 && (
              <Chip
                label={`${activeFiltersCount} active`}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {savedFilters.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Saved Filters</InputLabel>
                <Select
                  label="Saved Filters"
                  value=""
                  onChange={(e) => {
                    const saved = savedFilters.find(f => f.name === e.target.value);
                    if (saved) {
                      onFiltersChange(saved.filters);
                    }
                  }}
                >
                  {savedFilters.map((saved) => (
                    <MenuItem key={saved.name} value={saved.name}>
                      {saved.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            
            <Tooltip title="Reset Filters">
              <IconButton onClick={onReset} size="small">
                <Clear />
              </IconButton>
            </Tooltip>
            
            {onSave && (
              <Tooltip title="Save Current Filters">
                <IconButton onClick={() => setSaveDialogOpen(true)} size="small">
                  <Save />
                </IconButton>
              </Tooltip>
            )}
            
            <IconButton onClick={() => setExpanded(!expanded)} size="small">
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        </Box>

        {/* Filter Content */}
        <Collapse in={expanded}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* Date Range Section */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DateRange color="primary" />
                  Date Range
                </Typography>
                
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>Date Preset</InputLabel>
                  <Select
                    value={filters.dateRange.preset}
                    label="Date Preset"
                    onChange={(e) => handleDatePresetChange(e.target.value)}
                  >
                    {DATE_PRESETS.map((preset) => (
                      <MenuItem key={preset.value} value={preset.value}>
                        {preset.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {filters.dateRange.preset === 'custom' && (
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <DatePicker
                        label="Start Date"
                        value={filters.dateRange.startDate}
                        onChange={(date) => onFiltersChange({
                          ...filters,
                          dateRange: { ...filters.dateRange, startDate: date }
                        })}
                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <DatePicker
                        label="End Date"
                        value={filters.dateRange.endDate}
                        onChange={(date) => onFiltersChange({
                          ...filters,
                          dateRange: { ...filters.dateRange, endDate: date }
                        })}
                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                      />
                    </Grid>
                  </Grid>
                )}
              </Grid>

              {/* Metrics Section */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Assessment color="primary" />
                  Metrics to Display
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {Object.entries(filters.metrics).map(([metric, enabled]) => (
                    <FormControlLabel
                      key={metric}
                      control={
                        <Switch
                          checked={enabled}
                          onChange={() => handleMetricToggle(metric as keyof AnalyticsFilters['metrics'])}
                          size="small"
                        />
                      }
                      label={metric.charAt(0).toUpperCase() + metric.slice(1)}
                    />
                  ))}
                </Box>
              </Grid>

              {/* Data Filters Section */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUp color="primary" />
                  Data Filters
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Autocomplete
                      multiple
                      options={availableOptions.statuses}
                      value={filters.dataFilters.statuses}
                      onChange={(_, values) => handleDataFilterChange('statuses', values)}
                      renderInput={(params) => (
                        <TextField {...params} label="Project Status" size="small" />
                      )}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => {
                          const { key, ...tagProps } = getTagProps({ index });
                          return (
                            <Chip
                              key={option}
                              variant="outlined"
                              label={option}
                              size="small"
                              {...tagProps}
                            />
                          );
                        })
                      }
                    />
                  </Grid>
                  
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Autocomplete
                      multiple
                      options={availableOptions.agents}
                      value={filters.dataFilters.agents}
                      onChange={(_, values) => handleDataFilterChange('agents', values)}
                      renderInput={(params) => (
                        <TextField {...params} label="Agents" size="small" />
                      )}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => {
                          const { key, ...tagProps } = getTagProps({ index });
                          return (
                            <Chip
                              key={option}
                              variant="outlined"
                              label={option}
                              size="small"
                              {...tagProps}
                            />
                          );
                        })
                      }
                    />
                  </Grid>
                  
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Autocomplete
                      multiple
                      options={availableOptions.products}
                      value={filters.dataFilters.products}
                      onChange={(_, values) => handleDataFilterChange('products', values)}
                      renderInput={(params) => (
                        <TextField {...params} label="Products" size="small" />
                      )}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => {
                          const { key, ...tagProps } = getTagProps({ index });
                          return (
                            <Chip
                              key={option}
                              variant="outlined"
                              label={option}
                              size="small"
                              {...tagProps}
                            />
                          );
                        })
                      }
                    />
                  </Grid>
                  
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Autocomplete
                      multiple
                      options={availableOptions.brokerages}
                      value={filters.dataFilters.brokerages}
                      onChange={(_, values) => handleDataFilterChange('brokerages', values)}
                      renderInput={(params) => (
                        <TextField {...params} label="Brokerages" size="small" />
                      )}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => {
                          const { key, ...tagProps } = getTagProps({ index });
                          return (
                            <Chip
                              key={option}
                              variant="outlined"
                              label={option}
                              size="small"
                              {...tagProps}
                            />
                          );
                        })
                      }
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Advanced Options */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Advanced Options
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Group By</InputLabel>
                    <Select
                      value={filters.groupBy}
                      label="Group By"
                      onChange={(e) => onFiltersChange({
                        ...filters,
                        groupBy: e.target.value as AnalyticsFilters['groupBy']
                      })}
                    >
                      <MenuItem value="month">Month</MenuItem>
                      <MenuItem value="quarter">Quarter</MenuItem>
                      <MenuItem value="year">Year</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={filters.compareMode}
                        onChange={(e) => onFiltersChange({
                          ...filters,
                          compareMode: e.target.checked
                        })}
                      />
                    }
                    label="Compare with Previous Period"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={filters.showProjections}
                        onChange={(e) => onFiltersChange({
                          ...filters,
                          showProjections: e.target.checked
                        })}
                      />
                    }
                    label="Show Projections"
                  />
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Collapse>

        {/* Save Filter Dialog */}
        <Collapse in={saveDialogOpen}>
          <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                size="small"
                label="Filter Name"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="Enter a name for this filter set"
                sx={{ flex: 1 }}
              />
              <Button variant="contained" onClick={handleSaveFilter} disabled={!filterName.trim()}>
                Save
              </Button>
              <Button variant="outlined" onClick={() => setSaveDialogOpen(false)}>
                Cancel
              </Button>
            </Box>
          </Box>
        </Collapse>
      </Paper>
    </LocalizationProvider>
  );
}