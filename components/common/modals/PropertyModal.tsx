import React, { useState, useEffect } from 'react';
import { Button, TextField, MenuItem, Alert, CircularProgress, InputAdornment, Chip } from '@mui/material';
import BaseModal from './BaseModal';
import { H4, P3 } from '../../typography';
import { propertiesAPI } from '../../../utils/amplifyAPI';
import { dataValidationService, type PropertyDuplicateMatch } from '../../../services/dataValidationService';
import SearchIcon from '@mui/icons-material/Search';

interface Property {
  id?: string;
  propertyFullAddress?: string;
  houseAddress?: string;
  city?: string;
  state?: string;
  zip?: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  floors?: number;
  sizeSqft?: number;
  yearBuilt?: number;
  redfinLink?: string;
  zillowLink?: string;
  owner?: string;
}

interface PropertyModalProps {
  open: boolean;
  onClose: () => void;
  property?: Property | null;
  onSave: (property: Property) => void;
  mode?: 'create' | 'edit' | 'view';
  title?: string;
  subtitle?: string;
}

const PropertyModal: React.FC<PropertyModalProps> = ({
  open,
  onClose,
  property,
  onSave,
  mode = 'create',
  title,
  subtitle
}) => {
  const [formData, setFormData] = useState<Property>({
    propertyFullAddress: '',
    houseAddress: '',
    city: '',
    state: '',
    zip: '',
    propertyType: '',
    bedrooms: 0,
    bathrooms: 0,
    floors: 0,
    sizeSqft: 0,
    yearBuilt: 0,
    redfinLink: '',
    zillowLink: '',
    owner: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [addressSearchLoading, setAddressSearchLoading] = useState(false);
  const [duplicates, setDuplicates] = useState<PropertyDuplicateMatch[]>([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  // Default titles based on mode
  const defaultTitle = mode === 'create' ? 'Add New Property' : 
                      mode === 'edit' ? 'Edit Property' : 'Property Details';
  const defaultSubtitle = mode === 'create' ? 'Create a new property record' :
                         mode === 'edit' ? 'Update property information' : 'View property details';

  // Property types
  const propertyTypes = [
    'Single Family Home',
    'Townhouse',
    'Condo',
    'Apartment',
    'Duplex',
    'Triplex',
    'Fourplex',
    'Multi-Family',
    'Vacant Land',
    'Commercial',
    'Other'
  ];

  // US States
  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  useEffect(() => {
    if (property) {
      setFormData({
        ...property,
        propertyFullAddress: property.propertyFullAddress || '',
        houseAddress: property.houseAddress || '',
        city: property.city || '',
        state: property.state || '',
        zip: property.zip || '',
        propertyType: property.propertyType || '',
        bedrooms: property.bedrooms || 0,
        bathrooms: property.bathrooms || 0,
        floors: property.floors || 0,
        sizeSqft: property.sizeSqft || 0,
        yearBuilt: property.yearBuilt || 0,
        redfinLink: property.redfinLink || '',
        zillowLink: property.zillowLink || '',
        owner: property.owner || '',
      });
    } else {
      // Reset form for new property
      setFormData({
        propertyFullAddress: '',
        houseAddress: '',
        city: '',
        state: '',
        zip: '',
        propertyType: '',
        bedrooms: 0,
        bathrooms: 0,
        floors: 0,
        sizeSqft: 0,
        yearBuilt: 0,
        redfinLink: '',
        zillowLink: '',
        owner: '',
      });
    }
    setError('');
    setValidationErrors({});
    setDuplicates([]);
    setShowDuplicateWarning(false);
  }, [property, open]);

  // Auto-generate full address when address components change
  useEffect(() => {
    const fullAddress = [
      formData.houseAddress,
      formData.city,
      formData.state,
      formData.zip
    ].filter(Boolean).join(', ');
    setFormData(prev => ({ ...prev, propertyFullAddress: fullAddress }));
  }, [formData.houseAddress, formData.city, formData.state, formData.zip]);

  const handleInputChange = (field: keyof Property, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = async (): Promise<boolean> => {
    const errors: {[key: string]: string} = {};

    // Basic validation
    if (!formData.houseAddress?.trim()) {
      errors.houseAddress = 'House address is required';
    }
    if (!formData.city?.trim()) {
      errors.city = 'City is required';
    }
    if (!formData.state?.trim()) {
      errors.state = 'State is required';
    }
    if (!formData.zip?.trim()) {
      errors.zip = 'ZIP code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zip)) {
      errors.zip = 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)';
    }
    if (formData.yearBuilt && (formData.yearBuilt < 1800 || formData.yearBuilt > new Date().getFullYear())) {
      errors.yearBuilt = 'Please enter a valid year built';
    }
    if (formData.redfinLink && !/^https?:\/\//.test(formData.redfinLink)) {
      errors.redfinLink = 'Please enter a valid URL (starting with http:// or https://)';
    }
    if (formData.zillowLink && !/^https?:\/\//.test(formData.zillowLink)) {
      errors.zillowLink = 'Please enter a valid URL (starting with http:// or https://)';
    }

    setValidationErrors(errors);

    // If basic validation fails, don't proceed with duplicate checking
    if (Object.keys(errors).length > 0) {
      return false;
    }

    // Advanced validation using validation service
    try {
      const validationResult = await dataValidationService.validateProperty(formData, property?.id);
      
      if (validationResult.duplicates.length > 0) {
        setDuplicates(validationResult.duplicates as PropertyDuplicateMatch[]);
        setShowDuplicateWarning(true);
        
        // Block exact address duplicates
        const exactAddressDuplicates = validationResult.duplicates.filter(d => d.matchType === 'exact_address');
        if (exactAddressDuplicates.length > 0) {
          setError('A property with this address already exists');
          return false;
        }
        
        // Allow similar matches but show warning
        return true;
      }
      
      return validationResult.isValid;
    } catch (error) {
      console.error('Error validating property:', error);
      return true; // Allow save if validation service fails
    }
  };

  const handleAddressSearch = async () => {
    if (!formData.propertyFullAddress?.trim()) return;

    setAddressSearchLoading(true);
    // This is a placeholder for address validation/geocoding
    // In a real implementation, you might use Google Maps API or similar
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For now, we'll just validate the format
      const addressParts = formData.propertyFullAddress.split(',').map(part => part.trim());
      if (addressParts.length >= 3) {
        const [houseAddress, city, stateZip] = addressParts;
        const stateZipParts = stateZip.split(' ');
        const state = stateZipParts[0];
        const zip = stateZipParts[1];
        
        setFormData(prev => ({
          ...prev,
          houseAddress: houseAddress || prev.houseAddress,
          city: city || prev.city,
          state: state || prev.state,
          zip: zip || prev.zip,
        }));
      }
    } catch (error) {
      console.error('Address search failed:', error);
      setError('Address validation failed. Please enter address components manually.');
    } finally {
      setAddressSearchLoading(false);
    }
  };

  const handleSave = async () => {
    const isValid = await validateForm();
    if (!isValid) return;

    setLoading(true);
    setError('');

    try {

      const propertyData = {
        ...formData,
        owner: formData.owner || 'system',
      };

      if (mode === 'create') {
        const result = await propertiesAPI.create(propertyData);
        if (result.success) {
          onSave(result.data);
          onClose();
        } else {
          setError(typeof result.error === 'string' ? result.error : 'Failed to create property');
        }
      } else {
        const result = await propertiesAPI.update(property!.id!, propertyData);
        if (result.success) {
          onSave(result.data);
          onClose();
        } else {
          setError(typeof result.error === 'string' ? result.error : 'Failed to update property');
        }
      }
    } catch (error) {
      console.error('Error saving property:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setValidationErrors({});
    onClose();
  };

  const isReadOnly = mode === 'view';

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      title={title || defaultTitle}
      subtitle={subtitle || defaultSubtitle}
      maxWidth="lg"
      disableBackdropClick={loading}
    >
      <div className="space-y-6">
        {error && (
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {showDuplicateWarning && duplicates.length > 0 && (
          <Alert severity="warning" onClose={() => setShowDuplicateWarning(false)}>
            <div>
              <strong>Potential duplicate properties found:</strong>
              <div className="mt-2 space-y-2">
                {duplicates.map((duplicate, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Chip 
                      label={duplicate.matchType.replace('_', ' ')} 
                      size="small" 
                      color={duplicate.matchType === 'exact_address' ? 'error' : 'warning'}
                    />
                    <P3 className="text-sm">
                      {duplicate.reason} - {duplicate.property.propertyFullAddress}
                    </P3>
                  </div>
                ))}
              </div>
              <P3 className="text-sm mt-2">
                Please verify this is not a duplicate property before saving.
              </P3>
            </div>
          </Alert>
        )}

        {/* Address Search */}
        {!isReadOnly && (
          <div>
            <H4 className="mb-4">Address Search</H4>
            <div className="flex gap-2">
              <TextField
                label="Full Address"
                value={formData.propertyFullAddress}
                onChange={(e) => handleInputChange('propertyFullAddress', e.target.value)}
                placeholder="123 Main St, City, State ZIP"
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button
                        onClick={handleAddressSearch}
                        disabled={addressSearchLoading || !formData.propertyFullAddress?.trim()}
                        size="small"
                        startIcon={addressSearchLoading ? <CircularProgress size={16} /> : <SearchIcon />}
                      >
                        {addressSearchLoading ? 'Searching...' : 'Search'}
                      </Button>
                    </InputAdornment>
                  )
                }}
              />
            </div>
            <P3 className="text-gray-600 mt-2">
              Enter the full address and click search to auto-populate fields below
            </P3>
          </div>
        )}

        {/* Address Components */}
        <div>
          <H4 className="mb-4">Address Information</H4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="House Address"
              value={formData.houseAddress}
              onChange={(e) => handleInputChange('houseAddress', e.target.value)}
              disabled={isReadOnly}
              error={!!validationErrors.houseAddress}
              helperText={validationErrors.houseAddress}
              fullWidth
              required
            />
            <TextField
              label="City"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              disabled={isReadOnly}
              error={!!validationErrors.city}
              helperText={validationErrors.city}
              fullWidth
              required
            />
            <TextField
              label="State"
              value={formData.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
              disabled={isReadOnly}
              error={!!validationErrors.state}
              helperText={validationErrors.state}
              fullWidth
              required
              select
            >
              <MenuItem value="">Select State</MenuItem>
              {states.map((state) => (
                <MenuItem key={state} value={state}>{state}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="ZIP Code"
              value={formData.zip}
              onChange={(e) => handleInputChange('zip', e.target.value)}
              disabled={isReadOnly}
              error={!!validationErrors.zip}
              helperText={validationErrors.zip}
              fullWidth
              required
            />
          </div>
        </div>

        {/* Property Details */}
        <div>
          <H4 className="mb-4">Property Details</H4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <TextField
              label="Property Type"
              value={formData.propertyType}
              onChange={(e) => handleInputChange('propertyType', e.target.value)}
              disabled={isReadOnly}
              fullWidth
              select
            >
              <MenuItem value="">Select Type</MenuItem>
              {propertyTypes.map((type) => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Bedrooms"
              type="number"
              value={formData.bedrooms}
              onChange={(e) => handleInputChange('bedrooms', parseFloat(e.target.value) || 0)}
              disabled={isReadOnly}
              fullWidth
              inputProps={{ min: 0, step: 0.5 }}
            />
            <TextField
              label="Bathrooms"
              type="number"
              value={formData.bathrooms}
              onChange={(e) => handleInputChange('bathrooms', parseFloat(e.target.value) || 0)}
              disabled={isReadOnly}
              fullWidth
              inputProps={{ min: 0, step: 0.5 }}
            />
            <TextField
              label="Floors"
              type="number"
              value={formData.floors}
              onChange={(e) => handleInputChange('floors', parseInt(e.target.value) || 0)}
              disabled={isReadOnly}
              fullWidth
              inputProps={{ min: 0, step: 1 }}
            />
            <TextField
              label="Size (sq ft)"
              type="number"
              value={formData.sizeSqft}
              onChange={(e) => handleInputChange('sizeSqft', parseFloat(e.target.value) || 0)}
              disabled={isReadOnly}
              fullWidth
              inputProps={{ min: 0 }}
            />
            <TextField
              label="Year Built"
              type="number"
              value={formData.yearBuilt}
              onChange={(e) => handleInputChange('yearBuilt', parseInt(e.target.value) || 0)}
              disabled={isReadOnly}
              error={!!validationErrors.yearBuilt}
              helperText={validationErrors.yearBuilt}
              fullWidth
              inputProps={{ min: 1800, max: new Date().getFullYear() }}
            />
          </div>
        </div>

        {/* Property Links */}
        <div>
          <H4 className="mb-4">Property Links</H4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Redfin Link"
              value={formData.redfinLink}
              onChange={(e) => handleInputChange('redfinLink', e.target.value)}
              disabled={isReadOnly}
              error={!!validationErrors.redfinLink}
              helperText={validationErrors.redfinLink}
              fullWidth
              placeholder="https://www.redfin.com/..."
            />
            <TextField
              label="Zillow Link"
              value={formData.zillowLink}
              onChange={(e) => handleInputChange('zillowLink', e.target.value)}
              disabled={isReadOnly}
              error={!!validationErrors.zillowLink}
              helperText={validationErrors.zillowLink}
              fullWidth
              placeholder="https://www.zillow.com/..."
            />
          </div>
        </div>

        {/* Action Buttons */}
        {!isReadOnly && (
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              onClick={handleClose}
              variant="outlined"
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Saving...' : mode === 'create' ? 'Create Property' : 'Update Property'}
            </Button>
          </div>
        )}
      </div>
    </BaseModal>
  );
};

export default PropertyModal;