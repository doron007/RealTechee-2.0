import React, { useState, useEffect, useMemo } from 'react';
import { H3, H4, P2 } from '../../typography';
import Button from '../../common/buttons/Button';
// Simple form components for template editor
const SimpleInput = ({ label, value, onChange, placeholder, required }: any) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

const SimpleTextarea = ({ label, value, onChange, placeholder, required, rows, maxLength, helperText }: any) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      maxLength={maxLength}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    {helperText && <p className="text-sm text-gray-500 mt-1">{helperText}</p>}
  </div>
);

const SimpleDropdown = ({ label, value, onChange, options, required }: any) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {options.map((option: any) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);
import StatusPill from '../../common/ui/StatusPill';

// Handlebars for template preview
import Handlebars from 'handlebars';

// Helper functions for Handlebars
const registerHandlebarsHelpers = () => {
  // Date formatting helper
  Handlebars.registerHelper('formatDate', (date: string) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  });

  // Urgency color helper
  Handlebars.registerHelper('getUrgencyColor', (urgency: string) => {
    switch (urgency) {
      case 'high': return 'dc2626';
      case 'medium': return 'd97706'; 
      case 'low': return '16a34a';
      default: return '6b7280';
    }
  });

  // Phone formatting helper
  Handlebars.registerHelper('formatPhone', (phone: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    return match ? `(${match[1]}) ${match[2]}-${match[3]}` : phone;
  });

  // File links helper (for future file upload support)
  Handlebars.registerHelper('fileLinks', (jsonString: string, type?: string) => {
    try {
      const files = JSON.parse(jsonString || '[]');
      if (!Array.isArray(files) || files.length === 0) return 'No files uploaded';
      
      return files.map((file: any) => 
        `<a href="${file.url}" target="_blank">${file.name}</a>`
      ).join(', ');
    } catch {
      return 'No files uploaded';
    }
  });

  // Boolean helper
  Handlebars.registerHelper('yesNo', (value: boolean) => {
    return value ? 'Yes' : 'No';
  });
};

// Sample data for each form type
const SAMPLE_DATA = {
  'contact-us': {
    customerName: 'John Smith',
    customerEmail: 'john.smith@example.com',
    customerPhone: '555-123-4567',
    subject: 'Kitchen Renovation Inquiry',
    message: 'Hi, I am interested in getting a quote for a complete kitchen renovation.',
    dashboardUrl: 'http://localhost:3000/admin/contact-us/sample-id',
    timestamp: new Date().toISOString()
  },
  'get-estimate': {
    agentFullName: 'Sarah Johnson',
    agentEmail: 'sarah.johnson@realestate.com',
    agentPhone: '555-987-6543',
    agentBrokerage: 'Premium Realty',
    propertyAddress: '123 Oak Street, Beverly Hills, CA 90210',
    propertyStreetAddress: '123 Oak Street',
    propertyCity: 'Beverly Hills',
    relationToProperty: 'Real Estate Agent',
    projectMessage: 'Client needs complete bathroom renovation for luxury home sale.',
    needFinance: true,
    urgency: 'high',
    dashboardUrl: 'http://localhost:3000/admin/requests/sample-estimate-id',
    timestamp: new Date().toISOString()
  },
  'get-qualified': {
    agentName: 'Michael Davis',
    agentEmail: 'michael.davis@luxury.com',
    agentPhone: '555-456-7890',
    brokerage: 'Luxury Properties Inc',
    licenseNumber: 'CA-87654321',
    yearsExperience: '5-10',
    primaryMarkets: 'Beverly Hills, Malibu, Santa Monica',
    specialties: ['Luxury Properties', 'Investment Properties'],
    recentTransactionVolume: '15-20',
    whyDoYouWantToWorkWithRealTechee: 'I want to partner with RealTechee to provide the best renovation services to my high-end clients.',
    dashboardUrl: 'http://localhost:3000/admin/get-qualified/sample-qualified-id',
    timestamp: new Date().toISOString()
  },
  'affiliate': {
    companyName: 'Elite Construction Services',
    serviceType: 'General Contractor',
    contactName: 'Robert Wilson',
    contactEmail: 'robert@eliteconstruction.com',
    contactPhone: '555-321-0987',
    numberOfEmployees: '25-50',
    serviceDescription: 'Full-service general contracting with 20+ years experience in luxury home renovations.',
    contractorLicense: 'CA-54321987',
    oshaCompliance: true,
    workersCompensationInsurance: true,
    safetyPlanInPlace: true,
    environmentalFactorCompliance: true,
    signedNDA: true,
    dashboardUrl: 'http://localhost:3000/admin/affiliates/sample-affiliate-id',
    timestamp: new Date().toISOString()
  }
};

interface TemplateEditorProps {
  template?: any;
  onSave: (template: any) => void;
  onCancel: () => void;
  mode: 'create' | 'edit';
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  onSave,
  onCancel,
  mode
}) => {
  // Initialize Handlebars helpers
  useEffect(() => {
    registerHandlebarsHelpers();
  }, []);

  // Form state
  const [formData, setFormData] = useState({
    name: template?.name || '',
    formType: template?.formType || 'contact-us',
    emailSubject: template?.emailSubject || '',
    emailContentHtml: template?.emailContentHtml || '',
    smsContent: template?.smsContent || '',
    variables: template?.variables || [],
    isActive: template?.isActive ?? true,
    version: template?.version || '1.0'
  });

  // Preview state
  const [previewMode, setPreviewMode] = useState<'email' | 'sms'>('email');
  const [previewError, setPreviewError] = useState<string>('');

  // Form options
  const formTypeOptions = [
    { value: 'contact-us', label: 'Contact Us Form' },
    { value: 'get-estimate', label: 'Get Estimate Form' },
    { value: 'get-qualified', label: 'Get Qualified Form' },
    { value: 'affiliate', label: 'Affiliate Form' }
  ];

  // Get sample data for current form type
  const sampleData = SAMPLE_DATA[formData.formType as keyof typeof SAMPLE_DATA];

  // Generate preview content
  const previewContent = useMemo(() => {
    try {
      setPreviewError('');
      
      if (previewMode === 'email') {
        // Email preview
        const subjectTemplate = Handlebars.compile(formData.emailSubject || '');
        const contentTemplate = Handlebars.compile(formData.emailContentHtml || '');
        
        return {
          subject: subjectTemplate(sampleData),
          content: contentTemplate(sampleData)
        };
      } else {
        // SMS preview
        const smsTemplate = Handlebars.compile(formData.smsContent || '');
        const content = smsTemplate(sampleData);
        
        return {
          content,
          characterCount: content.length,
          isOverLimit: content.length > 160
        };
      }
    } catch (error: any) {
      setPreviewError(`Template compilation error: ${error.message}`);
      return null;
    }
  }, [formData, previewMode, sampleData]);

  // Extract variables from template content
  const extractVariables = (content: string): string[] => {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const variables = new Set<string>();
    let match;
    
    while ((match = variableRegex.exec(content)) !== null) {
      // Clean the variable name (remove helpers, spaces, etc.)
      const variable = match[1].trim().split(' ')[0].replace('#', '').replace('/', '');
      variables.add(variable);
    }
    
    return Array.from(variables);
  };

  // Auto-extract variables when content changes
  useEffect(() => {
    const emailVars = extractVariables(formData.emailSubject + ' ' + formData.emailContentHtml);
    const smsVars = extractVariables(formData.smsContent);
    const allVars = Array.from(new Set([...emailVars, ...smsVars]));
    
    setFormData(prev => ({
      ...prev,
      variables: allVars
    }));
  }, [formData.emailSubject, formData.emailContentHtml, formData.smsContent]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // Validation
    if (!formData.name.trim()) {
      alert('Template name is required');
      return;
    }
    if (!formData.emailSubject.trim()) {
      alert('Email subject is required');
      return;
    }
    if (!formData.emailContentHtml.trim()) {
      alert('Email content is required');
      return;
    }
    if (!formData.smsContent.trim()) {
      alert('SMS content is required');
      return;
    }

    // Add metadata
    const templateData: any = {
      ...formData,
      previewData: sampleData,
      lastModifiedBy: 'admin', // TODO: Get from auth context
      updatedAt: new Date().toISOString()
    };

    if (mode === 'create') {
      templateData.createdBy = 'admin'; // TODO: Get from auth context
    }

    onSave(templateData);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <H3>{mode === 'create' ? 'Create New Template' : 'Edit Template'}</H3>
        <P2 className="text-gray-600 mt-2">
          Design email and SMS templates with live preview using Handlebars variables
        </P2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Template Editor */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <H4 className="mb-4">Template Configuration</H4>
            
            <div className="space-y-4">
              <SimpleInput
                label="Template Name"
                value={formData.name}
                onChange={(value: any) => handleInputChange('name', value)}
                placeholder="e.g., Contact Us Form Notifications"
                required
              />

              <SimpleDropdown
                label="Form Type"
                value={formData.formType}
                onChange={(value: any) => handleInputChange('formType', value)}
                options={formTypeOptions}
                required
              />

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm">Active Template</span>
                </label>
                <StatusPill 
                  status={formData.isActive ? 'active' : 'inactive'}
                />
              </div>
            </div>
          </div>

          {/* Email Template Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <H4 className="mb-4">Email Template</H4>
            
            <div className="space-y-4">
              <SimpleInput
                label="Email Subject"
                value={formData.emailSubject}
                onChange={(value: any) => handleInputChange('emailSubject', value)}
                placeholder="New inquiry from {{customerName}}"
                required
              />

              <SimpleTextarea
                label="Email Content (HTML)"
                value={formData.emailContentHtml}
                onChange={(value: any) => handleInputChange('emailContentHtml', value)}
                placeholder="<h1>Hello {{customerName}}</h1>..."
                rows={12}
                required
              />
            </div>
          </div>

          {/* SMS Template Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <H4 className="mb-4">SMS Template</H4>
            
            <SimpleTextarea
              label="SMS Content (Plain Text)"
              value={formData.smsContent}
              onChange={(value: any) => handleInputChange('smsContent', value)}
              placeholder="New contact: {{customerName}} - {{subject}}"
              rows={3}
              required
              maxLength={160}
              helperText={`${formData.smsContent.length}/160 characters`}
            />
          </div>

          {/* Variables Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <H4 className="mb-4">Template Variables</H4>
            <P2 className="text-gray-600 mb-4">
              Variables automatically detected from your templates:
            </P2>
            
            <div className="flex flex-wrap gap-2">
              {formData.variables.map((variable: any, index: number) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {`{{${variable}}}`}
                </span>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <Button 
              onClick={handleSave}
              variant="primary"
              size="lg"
            >
              {mode === 'create' ? 'Create Template' : 'Save Changes'}
            </Button>
            <Button 
              onClick={onCancel}
              variant="secondary"
              size="lg"
            >
              Cancel
            </Button>
          </div>
        </div>

        {/* Right Column: Live Preview */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <H4>Live Preview</H4>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPreviewMode('email')}
                  className={`px-3 py-1 rounded text-sm ${
                    previewMode === 'email' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Email
                </button>
                <button
                  onClick={() => setPreviewMode('sms')}
                  className={`px-3 py-1 rounded text-sm ${
                    previewMode === 'sms' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  SMS
                </button>
              </div>
            </div>

            {previewError ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <P2 className="text-red-800">{previewError}</P2>
              </div>
            ) : (
              <div>
                {previewMode === 'email' && previewContent && (
                  <div>
                    <div className="mb-4">
                      <P2 className="font-semibold text-gray-700 mb-2">Subject:</P2>
                      <div className="p-3 bg-gray-50 rounded border">
                        {previewContent.subject}
                      </div>
                    </div>
                    
                    <div>
                      <P2 className="font-semibold text-gray-700 mb-2">Content:</P2>
                      <div 
                        className="p-4 bg-gray-50 rounded border max-h-96 overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: previewContent.content }}
                      />
                    </div>
                  </div>
                )}

                {previewMode === 'sms' && previewContent && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <P2 className="font-semibold text-gray-700">SMS Message:</P2>
                      <span className={`text-sm ${
                        previewContent.isOverLimit ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {previewContent.characterCount}/160 chars
                      </span>
                    </div>
                    <div className={`p-4 rounded border ${
                      previewContent.isOverLimit 
                        ? 'bg-red-50 border-red-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      {previewContent.content}
                    </div>
                    {previewContent.isOverLimit && (
                      <P2 className="text-red-600 text-sm mt-2">
                        ⚠️ SMS content exceeds 160 character limit and may be split into multiple messages
                      </P2>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sample Data Display */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <H4 className="mb-4">Sample Data</H4>
            <P2 className="text-gray-600 mb-4">
              Preview uses this sample data for {formTypeOptions.find(opt => opt.value === formData.formType)?.label}:
            </P2>
            
            <div className="bg-gray-50 p-4 rounded border max-h-64 overflow-y-auto">
              <pre className="text-xs text-gray-700">
                {JSON.stringify(sampleData, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor;