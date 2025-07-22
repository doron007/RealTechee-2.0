import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Grid,
  Button,
  Typography,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Autocomplete
} from '@mui/material';
import { ExpandMore, Search, Clear, Save } from '@mui/icons-material';
import { H3, H4, P2, P3 } from '../../typography';

export interface AdvancedSearchField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'date' | 'daterange' | 'number' | 'boolean';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface AdvancedSearchCriteria {
  [key: string]: any;
}

export interface SavedSearch {
  id: string;
  name: string;
  criteria: AdvancedSearchCriteria;
  entityType: string;
  createdAt: string;
}

interface AdvancedSearchDialogProps {
  open: boolean;
  onClose: () => void;
  onSearch: (criteria: AdvancedSearchCriteria) => void;
  fields: AdvancedSearchField[];
  entityType: string; // 'projects', 'quotes', 'requests'
  initialCriteria?: AdvancedSearchCriteria;
  data?: any[]; // For generating dynamic filter options
}

const AdvancedSearchDialog: React.FC<AdvancedSearchDialogProps> = ({
  open,
  onClose,
  onSearch,
  fields,
  entityType,
  initialCriteria = {},
  data = []
}) => {
  const [criteria, setCriteria] = useState<AdvancedSearchCriteria>(initialCriteria);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [searchName, setSearchName] = useState('');

  // Load saved searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`advanced-searches-${entityType}`);
    if (saved) {
      try {
        setSavedSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading saved searches:', error);
      }
    }
  }, [entityType]);

  // Save searches to localStorage
  const saveSavedSearches = (searches: SavedSearch[]) => {
    localStorage.setItem(`advanced-searches-${entityType}`, JSON.stringify(searches));
    setSavedSearches(searches);
  };

  const handleFieldChange = (fieldKey: string, value: any) => {
    setCriteria(prev => ({
      ...prev,
      [fieldKey]: value
    }));
  };

  const handleClear = () => {
    setCriteria({});
  };

  const handleSearch = () => {
    onSearch(criteria);
    onClose();
  };

  const handleSaveSearch = () => {
    if (!searchName.trim()) return;

    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name: searchName.trim(),
      criteria,
      entityType,
      createdAt: new Date().toISOString()
    };

    const updatedSearches = [...savedSearches, newSearch];
    saveSavedSearches(updatedSearches);
    setSearchName('');
    setShowSaveDialog(false);
  };

  const handleLoadSearch = (search: SavedSearch) => {
    setCriteria(search.criteria);
  };

  const handleDeleteSearch = (searchId: string) => {
    const updatedSearches = savedSearches.filter(s => s.id !== searchId);
    saveSavedSearches(updatedSearches);
  };

  const getFieldOptions = (field: AdvancedSearchField) => {
    if (field.options) {
      return field.options;
    }

    // Generate options dynamically from data
    if (data.length > 0) {
      const values = Array.from(new Set(
        data.map(item => item[field.key]).filter(Boolean)
      )).sort();

      return values.map(value => ({
        value: String(value),
        label: String(value)
      }));
    }

    return [];
  };

  const renderField = (field: AdvancedSearchField) => {
    const value = criteria[field.key] || '';

    switch (field.type) {
      case 'text':
        return (
          <TextField
            fullWidth
            label={field.label}
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            size="small"
          />
        );

      case 'select':
        return (
          <FormControl fullWidth size="small">
            <InputLabel>{field.label}</InputLabel>
            <Select
              value={value}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              label={field.label}
            >
              <MenuItem value="">
                <em>Any</em>
              </MenuItem>
              {getFieldOptions(field).map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'multiselect':
        const options = getFieldOptions(field);
        return (
          <Autocomplete
            multiple
            size="small"
            options={options}
            getOptionLabel={(option) => option.label}
            value={options.filter(opt => (value as string[])?.includes(opt.value)) || []}
            onChange={(_, newValue) => {
              handleFieldChange(field.key, newValue.map(opt => opt.value));
            }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...chipProps } = getTagProps({ index });
                return (
                  <Chip
                    key={option.value}
                    variant="outlined"
                    label={option.label}
                    size="small"
                    {...chipProps}
                  />
                );
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label={field.label}
                placeholder={field.placeholder}
              />
            )}
          />
        );

      case 'date':
        return (
          <TextField
            fullWidth
            type="date"
            label={field.label}
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
        );

      case 'daterange':
        return (
          <Box display="flex" gap={2}>
            <TextField
              fullWidth
              type="date"
              label={`${field.label} From`}
              value={value?.from || ''}
              onChange={(e) => handleFieldChange(field.key, { ...value, from: e.target.value })}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
            <TextField
              fullWidth
              type="date"
              label={`${field.label} To`}
              value={value?.to || ''}
              onChange={(e) => handleFieldChange(field.key, { ...value, to: e.target.value })}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Box>
        );

      case 'number':
        return (
          <Box display="flex" gap={2}>
            <TextField
              fullWidth
              type="number"
              label={`${field.label} Min`}
              value={value?.min || ''}
              onChange={(e) => handleFieldChange(field.key, { ...value, min: e.target.value })}
              size="small"
            />
            <TextField
              fullWidth
              type="number"
              label={`${field.label} Max`}
              value={value?.max || ''}
              onChange={(e) => handleFieldChange(field.key, { ...value, max: e.target.value })}
              size="small"
            />
          </Box>
        );

      case 'boolean':
        return (
          <FormControl fullWidth size="small">
            <InputLabel>{field.label}</InputLabel>
            <Select
              value={value}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              label={field.label}
            >
              <MenuItem value="">
                <em>Any</em>
              </MenuItem>
              <MenuItem value="true">Yes</MenuItem>
              <MenuItem value="false">No</MenuItem>
            </Select>
          </FormControl>
        );

      default:
        return null;
    }
  };

  const hasActiveCriteria = Object.values(criteria).some(value => {
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(v => v !== '' && v !== null && v !== undefined);
    }
    return value !== '' && value !== null && value !== undefined;
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Search />
          <H3>Advanced Search - {entityType.charAt(0).toUpperCase() + entityType.slice(1)}</H3>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ minHeight: 400 }}>
          {/* Saved Searches */}
          {savedSearches.length > 0 && (
            <Accordion defaultExpanded={false}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <H4>Saved Searches ({savedSearches.length})</H4>
              </AccordionSummary>
              <AccordionDetails>
                <Box display="flex" flexWrap="wrap" gap={2}>
                  {savedSearches.map((search) => (
                    <Box
                      key={search.id}
                      sx={{
                        p: 2,
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'grey.50' },
                        minWidth: 200,
                        flex: '1 1 calc(33.333% - 16px)'
                      }}
                      onClick={() => handleLoadSearch(search)}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>{search.name}</Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                        {new Date(search.createdAt).toLocaleDateString()}
                      </Typography>
                      <Button
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSearch(search.id);
                        }}
                        sx={{ mt: 1 }}
                      >
                        Delete
                      </Button>
                    </Box>
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Search Fields */}
          <Box sx={{ mt: savedSearches.length > 0 ? 3 : 0 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>Search Criteria</Typography>
            <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={3}>
              {fields.map((field) => (
                <Box key={field.key} sx={{ gridColumn: field.type === 'daterange' || field.type === 'number' ? 'span 2' : 'span 1' }}>
                  {renderField(field)}
                </Box>
              ))}
            </Box>
          </Box>

          {/* Save Search */}
          {hasActiveCriteria && (
            <Box sx={{ mt: 4 }}>
              <Divider sx={{ mb: 2 }} />
              {!showSaveDialog ? (
                <Button
                  startIcon={<Save />}
                  onClick={() => setShowSaveDialog(true)}
                  variant="outlined"
                  size="small"
                >
                  Save This Search
                </Button>
              ) : (
                <Box display="flex" gap={2} alignItems="center">
                  <TextField
                    size="small"
                    label="Search Name"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    placeholder="e.g., Active Projects in SF"
                  />
                  <Button
                    size="small"
                    variant="contained"
                    onClick={handleSaveSearch}
                    disabled={!searchName.trim()}
                  >
                    Save
                  </Button>
                  <Button
                    size="small"
                    onClick={() => {
                      setShowSaveDialog(false);
                      setSearchName('');
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Box display="flex" justifyContent="space-between" width="100%">
          <Button
            onClick={handleClear}
            startIcon={<Clear />}
            disabled={!hasActiveCriteria}
          >
            Clear All
          </Button>
          <Box display="flex" gap={1}>
            <Button onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSearch}
              variant="contained"
              startIcon={<Search />}
            >
              Search
            </Button>
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default AdvancedSearchDialog;