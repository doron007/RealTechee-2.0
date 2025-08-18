import React, { useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import TemplateList from './TemplateList';
import TemplateEditor from './TemplateEditor';
import BaseModal from '../../common/modals/BaseModal';
import { H2, P2 } from '../../typography';

const client = generateClient();

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

const TemplateManagementPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list');
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Navigate to create template
  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setEditorMode('create');
    setViewMode('editor');
  };

  // Navigate to edit template
  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setEditorMode('edit');
    setViewMode('editor');
  };

  // Save template (create or update)
  const handleSaveTemplate = async (templateData: any) => {
    setLoading(true);
    setError('');

    try {
      if (editorMode === 'create') {
        await createTemplate(templateData);
      } else {
        await updateTemplate(templateData);
      }
      
      // Refresh the template list
      setRefreshTrigger(prev => prev + 1);
      setViewMode('list');
    } catch (error: any) {
      console.error('Error saving template:', error);
      setError(`Failed to save template: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Create new template
  const createTemplate = async (templateData: any) => {
    console.log('Creating template:', templateData);

    const mutation = `
      mutation CreateNotificationTemplate($input: CreateNotificationTemplateInput!) {
        createNotificationTemplate(input: $input) {
          id
          name
          formType
          emailSubject
          emailContentHtml
          smsContent
          variables
          isActive
          version
          createdBy
          lastModifiedBy
          createdAt
          updatedAt
        }
      }
    `;

    const input = {
      name: templateData.name,
      formType: templateData.formType,
      emailSubject: templateData.emailSubject,
      emailContentHtml: templateData.emailContentHtml,
      smsContent: templateData.smsContent,
      variables: templateData.variables,
      previewData: templateData.previewData,
      isActive: templateData.isActive,
      version: templateData.version,
      createdBy: templateData.createdBy,
      lastModifiedBy: templateData.lastModifiedBy
    };

    const result = await client.graphql({
      query: mutation,
      variables: { input },
      authMode: 'apiKey'
    }) as any;

    console.log('Template created:', result.data?.createNotificationTemplate);
    return result.data?.createNotificationTemplate;
  };

  // Update existing template
  const updateTemplate = async (templateData: any) => {
    console.log('Updating template:', templateData);

    const mutation = `
      mutation UpdateNotificationTemplate($input: UpdateNotificationTemplateInput!) {
        updateNotificationTemplate(input: $input) {
          id
          name
          formType
          emailSubject
          emailContentHtml
          smsContent
          variables
          isActive
          version
          lastModifiedBy
          updatedAt
        }
      }
    `;

    const input = {
      id: editingTemplate?.id,
      name: templateData.name,
      formType: templateData.formType,
      emailSubject: templateData.emailSubject,
      emailContentHtml: templateData.emailContentHtml,
      smsContent: templateData.smsContent,
      variables: templateData.variables,
      previewData: templateData.previewData,
      isActive: templateData.isActive,
      version: templateData.version,
      lastModifiedBy: templateData.lastModifiedBy
    };

    const result = await client.graphql({
      query: mutation,
      variables: { input },
      authMode: 'apiKey'
    }) as any;

    console.log('Template updated:', result.data?.updateNotificationTemplate);
    return result.data?.updateNotificationTemplate;
  };

  // Delete template
  const handleDeleteTemplate = async (templateId: string) => {
    setLoading(true);
    setError('');

    try {
      console.log('Deleting template:', templateId);

      const mutation = `
        mutation DeleteNotificationTemplate($input: DeleteNotificationTemplateInput!) {
          deleteNotificationTemplate(input: $input) {
            id
          }
        }
      `;

      await client.graphql({
        query: mutation,
        variables: { input: { id: templateId } },
        authMode: 'apiKey'
      });

      console.log('Template deleted successfully');
      
      // Refresh the template list
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      console.error('Error deleting template:', error);
      setError(`Failed to delete template: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingTemplate(null);
    setViewMode('list');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <H2>Template Management</H2>
              <P2 className="text-gray-600 mt-1">
                Create and manage notification templates with live preview
              </P2>
            </div>
            
            {viewMode === 'editor' && (
              <button
                onClick={handleCancelEdit}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Back to Templates
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Global Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <P2 className="text-red-800">{error}</P2>
            <button
              onClick={() => setError('')}
              className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <BaseModal open={true} title="Processing" onClose={() => {}}>
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-700">Processing...</span>
            </div>
          </BaseModal>
        )}

        {/* Content Based on View Mode */}
        {viewMode === 'list' ? (
          <TemplateList
            onCreateTemplate={handleCreateTemplate}
            onEditTemplate={handleEditTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            refreshTrigger={refreshTrigger}
          />
        ) : (
          <TemplateEditor
            template={editingTemplate}
            onSave={handleSaveTemplate}
            onCancel={handleCancelEdit}
            mode={editorMode}
          />
        )}
      </div>

      {/* Quick Stats Footer */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
            <span>🚀 Powered by Handlebars templating</span>
            <span>📧 Email + SMS support</span>
            <span>🔄 Live preview</span>
            <span>📊 Auto variable detection</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateManagementPage;