import React, { useState, useEffect } from 'react';
import { Button, TextField, Switch, FormControlLabel, Alert, CircularProgress, Chip } from '@mui/material';
import BaseModal from './BaseModal';
import { H4, P3 } from '../../typography';
import { contactsAPI } from '../../../utils/amplifyAPI';
// Dynamic import to avoid loading in main bundle
import type { ContactDuplicateMatch } from '../../../services/core/dataValidationService';

interface Contact {
  id?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  company?: string;
  brokerage?: string;
  owner?: string;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
}

interface ContactModalProps {
  open: boolean;
  onClose: () => void;
  contact?: Contact | null;
  onSave: (contact: Contact) => void;
  mode?: 'create' | 'edit' | 'view';
  title?: string;
  subtitle?: string;
}

const ContactModal: React.FC<ContactModalProps> = ({
  open,
  onClose,
  contact,
  onSave,
  mode = 'create',
  title,
  subtitle
}) => {
  const [formData, setFormData] = useState<Contact>({
    firstName: '',
    lastName: '',
    fullName: '',
    email: '',
    phone: '',
    mobile: '',
    company: '',
    brokerage: '',
    owner: '',
    emailNotifications: true,
    smsNotifications: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [duplicates, setDuplicates] = useState<ContactDuplicateMatch[]>([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  // Default titles based on mode
  const defaultTitle = mode === 'create' ? 'Add New Contact' : 
                      mode === 'edit' ? 'Edit Contact' : 'Contact Details';
  const defaultSubtitle = mode === 'create' ? 'Create a new contact record' :
                         mode === 'edit' ? 'Update contact information' : 'View contact details';

  useEffect(() => {
    if (contact) {
      setFormData({
        ...contact,
        firstName: contact.firstName || '',
        lastName: contact.lastName || '',
        fullName: contact.fullName || '',
        email: contact.email || '',
        phone: contact.phone || '',
        mobile: contact.mobile || '',
        company: contact.company || '',
        brokerage: contact.brokerage || '',
        owner: contact.owner || '',
        emailNotifications: contact.emailNotifications ?? true,
        smsNotifications: contact.smsNotifications ?? false,
      });
    } else {
      // Reset form for new contact
      setFormData({
        firstName: '',
        lastName: '',
        fullName: '',
        email: '',
        phone: '',
        mobile: '',
        company: '',
        brokerage: '',
        owner: '',
        emailNotifications: true,
        smsNotifications: false,
      });
    }
    setError('');
    setValidationErrors({});
    setDuplicates([]);
    setShowDuplicateWarning(false);
  }, [contact, open]);

  // Auto-generate fullName when firstName or lastName changes
  useEffect(() => {
    const fullName = [formData.firstName, formData.lastName].filter(Boolean).join(' ');
    setFormData(prev => ({ ...prev, fullName }));
  }, [formData.firstName, formData.lastName]);

  const handleInputChange = (field: keyof Contact, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = async (): Promise<boolean> => {
    const errors: {[key: string]: string} = {};

    // Basic validation
    if (!formData.firstName?.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!formData.lastName?.trim()) {
      errors.lastName = 'Last name is required';
    }
    if (!formData.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
    if (formData.mobile && !/^\+?[\d\s\-\(\)]+$/.test(formData.mobile)) {
      errors.mobile = 'Please enter a valid mobile number';
    }

    setValidationErrors(errors);

    // If basic validation fails, don't proceed with duplicate checking
    if (Object.keys(errors).length > 0) {
      return false;
    }

    // Advanced validation using validation service
    try {
      // Dynamic import to avoid loading in main bundle
      const { dataValidationService } = await import('../../../services/core/dataValidationService');
      const validationResult = await dataValidationService.validateContact(formData, contact?.id);
      
      if (validationResult.duplicates.length > 0) {
        setDuplicates(validationResult.duplicates as ContactDuplicateMatch[]);
        setShowDuplicateWarning(true);
        
        // Block exact email duplicates
        const exactEmailDuplicates = validationResult.duplicates.filter(d => d.matchType === 'exact_email');
        if (exactEmailDuplicates.length > 0) {
          setError('A contact with this email already exists');
          return false;
        }
        
        // Allow similar matches but show warning
        return true;
      }
      
      return validationResult.isValid;
    } catch (error) {
      console.error('Error validating contact:', error);
      return true; // Allow save if validation service fails
    }
  };

  const handleSave = async () => {
    const isValid = await validateForm();
    if (!isValid) return;

    setLoading(true);
    setError('');

    try {

      const contactData = {
        ...formData,
        owner: formData.owner || 'system',
      };

      if (mode === 'create') {
        const result = await contactsAPI.create(contactData);
        if (result.success) {
          onSave(result.data);
          onClose();
        } else {
          setError(typeof result.error === 'string' ? result.error : 'Failed to create contact');
        }
      } else {
        const result = await contactsAPI.update(contact!.id!, contactData);
        if (result.success) {
          onSave(result.data);
          onClose();
        } else {
          setError(typeof result.error === 'string' ? result.error : 'Failed to update contact');
        }
      }
    } catch (error) {
      console.error('Error saving contact:', error);
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
      maxWidth="md"
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
              <strong>Potential duplicate contacts found:</strong>
              <div className="mt-2 space-y-2">
                {duplicates.map((duplicate, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Chip 
                      label={duplicate.matchType.replace('_', ' ')} 
                      size="small" 
                      color={duplicate.matchType === 'exact_email' ? 'error' : 'warning'}
                    />
                    <P3 className="text-sm">
                      {duplicate.reason} - {duplicate.contact.fullName} ({duplicate.contact.email})
                    </P3>
                  </div>
                ))}
              </div>
              <P3 className="text-sm mt-2">
                Please verify this is not a duplicate before saving.
              </P3>
            </div>
          </Alert>
        )}

        {/* Basic Information */}
        <div>
          <H4 className="mb-4">Basic Information</H4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="First Name"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              disabled={isReadOnly}
              error={!!validationErrors.firstName}
              helperText={validationErrors.firstName}
              fullWidth
              required
            />
            <TextField
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              disabled={isReadOnly}
              error={!!validationErrors.lastName}
              helperText={validationErrors.lastName}
              fullWidth
              required
            />
            <TextField
              label="Full Name"
              value={formData.fullName}
              disabled={true}
              fullWidth
              helperText="Auto-generated from first and last name"
            />
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={isReadOnly}
              error={!!validationErrors.email}
              helperText={validationErrors.email}
              fullWidth
              required
            />
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <H4 className="mb-4">Contact Information</H4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              disabled={isReadOnly}
              error={!!validationErrors.phone}
              helperText={validationErrors.phone}
              fullWidth
            />
            <TextField
              label="Mobile"
              value={formData.mobile}
              onChange={(e) => handleInputChange('mobile', e.target.value)}
              disabled={isReadOnly}
              error={!!validationErrors.mobile}
              helperText={validationErrors.mobile}
              fullWidth
            />
            <TextField
              label="Company"
              value={formData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              disabled={isReadOnly}
              fullWidth
            />
            <TextField
              label="Brokerage"
              value={formData.brokerage}
              onChange={(e) => handleInputChange('brokerage', e.target.value)}
              disabled={isReadOnly}
              fullWidth
            />
          </div>
        </div>

        {/* Notification Preferences */}
        <div>
          <H4 className="mb-4">Notification Preferences</H4>
          <div className="space-y-3">
            <FormControlLabel
              control={
                <Switch
                  checked={formData.emailNotifications}
                  onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                  disabled={isReadOnly}
                />
              }
              label="Email Notifications"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.smsNotifications}
                  onChange={(e) => handleInputChange('smsNotifications', e.target.checked)}
                  disabled={isReadOnly}
                />
              }
              label="SMS Notifications"
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
              {loading ? 'Saving...' : mode === 'create' ? 'Create Contact' : 'Update Contact'}
            </Button>
          </div>
        )}
      </div>
    </BaseModal>
  );
};

export default ContactModal;