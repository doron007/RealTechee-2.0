import React, { useState, useEffect } from 'react';
import { H3, H4, P2 } from '../../typography';
import Button from '../../common/buttons/Button';
import StatusPill from '../../common/ui/StatusPill';
import { DateTimeUtils } from '../../../utils/dateTimeUtils';
import { notificationTemplatesAPI } from '../../../utils/amplifyAPI';

interface Template {
  id: string;
  name: string;
  formType: string;
  emailSubject: string;
  emailContentHtml: string;
  smsContent: string;
  variables: string[];
  isActive: boolean;
  version: string;
  createdBy: string;
  lastModifiedBy: string;
  createdAt: string;
  updatedAt: string;
}

interface TemplateListProps {
  onCreateTemplate: () => void;
  onEditTemplate: (template: Template) => void;
  onDeleteTemplate: (templateId: string) => void;
  refreshTrigger?: number;
}

const TemplateList: React.FC<TemplateListProps> = ({
  onCreateTemplate,
  onEditTemplate,
  onDeleteTemplate,
  refreshTrigger
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedFormType, setSelectedFormType] = useState<string>('all');

  // Form type options with counts
  const formTypeOptions = [
    { value: 'all', label: 'All Templates', icon: '📋' },
    { value: 'contact-us', label: 'Contact Us', icon: '💬' },
    { value: 'get-estimate', label: 'Get Estimate', icon: '📋' },
    { value: 'get-qualified', label: 'Get Qualified', icon: '🏆' },
    { value: 'affiliate', label: 'Affiliate', icon: '🤝' }
  ];

  // Load templates with custom handling for nullable required fields
  const loadTemplates = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Loading notification templates...');
      
      // Create mock data for now since the database has null values in required fields
      // This is a temporary solution until the database is cleaned up
      const mockTemplates = [
        {
          id: 'template_1',
          name: 'Contact Us Template',
          formType: 'contact-us',
          emailSubject: 'New Contact Form Submission',
          emailContentHtml: '<p>A new contact form has been submitted.</p>',
          smsContent: 'New contact form submitted',
          variables: ['name', 'email', 'message'],
          isActive: true,
          version: '1.0',
          createdBy: 'system',
          lastModifiedBy: 'system',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'template_2',
          name: 'Get Estimate Template',
          formType: 'get-estimate',
          emailSubject: 'New Estimate Request',
          emailContentHtml: '<p>A new estimate request has been submitted.</p>',
          smsContent: 'New estimate request',
          variables: ['name', 'email', 'project'],
          isActive: true,
          version: '1.0',
          createdBy: 'system',
          lastModifiedBy: 'system',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'template_3',
          name: 'Get Qualified Template',
          formType: 'get-qualified',
          emailSubject: 'New Qualification Request',
          emailContentHtml: '<p>A new qualification request has been submitted.</p>',
          smsContent: 'New qualification request',
          variables: ['name', 'email', 'service'],
          isActive: true,
          version: '1.0',
          createdBy: 'system',
          lastModifiedBy: 'system',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'template_4',
          name: 'Affiliate Form Template',
          formType: 'affiliate',
          emailSubject: 'New Affiliate Application',
          emailContentHtml: '<p>A new affiliate application has been submitted.</p>',
          smsContent: 'New affiliate application',
          variables: ['name', 'email', 'company'],
          isActive: true,
          version: '1.0',
          createdBy: 'system',
          lastModifiedBy: 'system',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      console.log(`Loaded ${mockTemplates.length} templates (mock data due to schema constraints)`);
      setTemplates(mockTemplates as Template[]);
      
    } catch (error: any) {
      console.error('Error loading templates:', error);
      setError('Failed to load templates');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [refreshTrigger]);

  // Filter templates by form type
  const filteredTemplates = templates.filter(template => 
    selectedFormType === 'all' || template.formType === selectedFormType
  );

  // Group templates by form type for display
  const templatesByForm = filteredTemplates.reduce((acc, template) => {
    const formType = template.formType || 'unknown';
    if (!acc[formType]) {
      acc[formType] = [];
    }
    acc[formType].push(template);
    return acc;
  }, {} as Record<string, Template[]>);

  // Get template counts by form type
  const getTemplateCount = (formType: string) => {
    if (formType === 'all') return templates.length;
    return templates.filter(t => t.formType === formType).length;
  };

  const handleDeleteConfirm = (template: Template) => {
    if (window.confirm(`Are you sure you want to delete "${template.name}"? This action cannot be undone.`)) {
      onDeleteTemplate(template.id);
    }
  };

  const getFormTypeLabel = (formType: string) => {
    const option = formTypeOptions.find(opt => opt.value === formType);
    return option ? option.label : formType;
  };

  const getFormTypeIcon = (formType: string) => {
    const option = formTypeOptions.find(opt => opt.value === formType);
    return option ? option.icon : '📄';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading templates...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <H3>Notification Templates</H3>
          <P2 className="text-gray-600 mt-1">
            Manage email and SMS templates for all form types
          </P2>
        </div>
        <Button onClick={onCreateTemplate} variant="primary">
          Create New Template
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <P2 className="text-red-800">{error}</P2>
          <Button 
            onClick={loadTemplates} 
            variant="secondary" 
            size="sm"
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Form Type Filter Tabs */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex space-x-1 overflow-x-auto">
          {formTypeOptions.map((option) => {
            const count = getTemplateCount(option.value);
            return (
              <button
                key={option.value}
                onClick={() => setSelectedFormType(option.value)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedFormType === option.value
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>{option.icon}</span>
                <span>{option.label}</span>
                {count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    selectedFormType === option.value
                      ? 'bg-blue-200 text-blue-900'
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Templates Display */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center p-8 bg-white rounded-lg shadow-sm border">
          <div className="text-6xl mb-4">📄</div>
          <H4 className="mb-2">No Templates Found</H4>
          <P2 className="text-gray-600 mb-4">
            {selectedFormType === 'all' 
              ? 'No templates have been created yet.' 
              : `No templates found for ${getFormTypeLabel(selectedFormType)} form.`}
          </P2>
          <Button onClick={onCreateTemplate} variant="primary">
            Create Your First Template
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {selectedFormType === 'all' ? (
            // Group by form type when showing all
            Object.entries(templatesByForm).map(([formType, formTemplates]) => (
              <div key={formType} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-2xl">{getFormTypeIcon(formType)}</span>
                  <H4>{getFormTypeLabel(formType)} Templates</H4>
                  <span className="text-sm text-gray-500">({formTemplates.length})</span>
                </div>
                
                <div className="grid gap-4">
                  {formTemplates.map((template) => (
                    <TemplateCard 
                      key={template.id}
                      template={template}
                      onEdit={onEditTemplate}
                      onDelete={handleDeleteConfirm}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            // Show filtered templates in a grid
            <div className="grid gap-4">
              {filteredTemplates.map((template) => (
                <TemplateCard 
                  key={template.id}
                  template={template}
                  onEdit={onEditTemplate}
                  onDelete={handleDeleteConfirm}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Template Card Component
interface TemplateCardProps {
  template: Template;
  onEdit: (template: Template) => void;
  onDelete: (template: Template) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onEdit, onDelete }) => {
  const truncateText = (text: string, limit: number) => {
    return text.length > limit ? text.substring(0, limit) + '...' : text;
  };

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <H4 className="text-lg">{template.name}</H4>
            <StatusPill 
              status={template.isActive ? 'active' : 'inactive'}
            />
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              v{template.version}
            </span>
          </div>
          
          <div className="space-y-2 mb-3">
            <div>
              <span className="text-sm font-medium text-gray-700">Email Subject:</span>
              <P2 className="text-gray-600">{truncateText(template.emailSubject, 80)}</P2>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">SMS:</span>
              <P2 className="text-gray-600">{truncateText(template.smsContent, 80)}</P2>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>Variables: {template.variables?.length || 0}</span>
            <span>Modified: {new Date(template.updatedAt).toLocaleDateString()}</span>
            <span>By: {template.lastModifiedBy || 'Unknown'}</span>
          </div>
        </div>

        <div className="flex space-x-2 ml-4">
          <Button 
            onClick={() => onEdit(template)}
            variant="secondary"
            size="sm"
          >
            Edit
          </Button>
          <Button 
            onClick={() => onDelete(template)}
            variant="secondary"
            size="sm"
            className="text-red-600 hover:bg-red-50"
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Variables Preview */}
      {template.variables && template.variables.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <div className="flex flex-wrap gap-1">
            {template.variables.slice(0, 8).map((variable, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded text-xs font-mono bg-blue-50 text-blue-700"
              >
                {`{{${variable}}}`}
              </span>
            ))}
            {template.variables.length > 8 && (
              <span className="text-xs text-gray-500">
                +{template.variables.length - 8} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateList;