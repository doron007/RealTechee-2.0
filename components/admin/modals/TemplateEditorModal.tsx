import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Button, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Box, 
  Tabs, 
  Tab,
  Card,
  CardContent,
  Switch,
  FormControlLabel
} from '@mui/material';
import BaseModal from '../../common/modals/BaseModal';
import { H4, H5, P2 } from '../../typography';
import { TemplateItem, NotificationTemplateChannel } from '../../../types/notifications';
import { ClientTemplateProcessor } from '../../../services/clientTemplateProcessor';

interface TemplateEditorModalProps {
  open: boolean;
  onClose: () => void;
  template: TemplateItem | null;
  onSave: (template: Partial<TemplateItem>) => Promise<void>;
  mode: 'create' | 'edit';
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index} style={{ height: '100%' }}>
    {value === index && children}
  </div>
);

const TemplateEditorModal: React.FC<TemplateEditorModalProps> = ({
  open,
  onClose,
  template,
  onSave,
  mode
}) => {
  const [editedTemplate, setEditedTemplate] = useState<Partial<TemplateItem>>({});
  const [loading, setLoading] = useState(false);
  const [previewTab, setPreviewTab] = useState(0);
  const [previewData, setPreviewData] = useState('');
  const [previewError, setPreviewError] = useState('');
  const [editablePreviewData, setEditablePreviewData] = useState('');
  
  // Template processor instance
  const templateProcessor = useMemo(() => ClientTemplateProcessor.getInstance(), []);

  // Helper function to clean escaped JSON string from database
  const cleanJsonString = (jsonString: string): string => {
    return jsonString
      .replace(/\\n/g, '')           // Remove escaped newlines  
      .replace(/\\r/g, '')           // Remove escaped carriage returns
      .replace(/\\t/g, '')           // Remove escaped tabs
      .replace(/\\"/g, '"')          // Replace escaped quotes with actual quotes
      .replace(/\\'/g, "'")          // Replace escaped single quotes
      .replace(/\\\\/g, '\\')        // Replace double escapes with single backslash
      .replace(/\\b/g, '')           // Remove escaped backspace
      .replace(/\\f/g, '')           // Remove escaped form feed
      .trim();
  };

  // Use real preview data from the template or fallback to sample
  const samplePayload = useMemo(() => {
    console.log('🔍 DEBUG: template object:', template);
    console.log('🔍 DEBUG: template.previewData exists?', !!template?.previewData);
    console.log('🔍 DEBUG: template.previewData raw:', template?.previewData);
    
    // Try to use previewData from the template if available
    if (template?.previewData) {
      try {
        // Clean escape characters first
        const cleanedData = cleanJsonString(template.previewData);
        console.log('🧹 Cleaned JSON string:', cleanedData);
        
        const parsed = JSON.parse(cleanedData);
        console.log('✅ Using real previewData from database for template:', template.name);
        console.log('📋 Preview data keys:', Object.keys(parsed));
        console.log('📋 Full parsed data:', parsed);
        return parsed;
      } catch (error) {
        console.warn('❌ Failed to parse template previewData after cleaning, using fallback:', error);
        console.warn('Raw previewData:', template.previewData);
        console.warn('Cleaned data that failed:', cleanJsonString(template.previewData || ''));
      }
    } else {
      console.log('⚠️ No previewData found in template, using fallback sample data');
      console.log('⚠️ Template object keys:', template ? Object.keys(template) : 'template is null/undefined');
    }
    
    // Fallback to hardcoded sample data
    return {
      customer: {
        name: 'John Smith',
        email: 'john.smith@example.com',
        phone: '(555) 123-4567',
        company: 'Sample Real Estate Group'
      },
      property: {
        address: '123 Main Street, Beverly Hills, CA 90210'
      },
      project: {
        product: 'Kitchen & Bathroom Renovation',
        message: 'Looking for a complete renovation estimate for a luxury property.',
        relationToProperty: 'Property Owner',
        needFinance: true,
        consultationType: 'in-person'
      },
      submission: {
        id: 'SAMPLE-001',
        timestamp: new Date().toLocaleString(),
        leadSource: 'WEBSITE'
      },
      admin: {
        dashboardUrl: 'https://app.realtechee.com/admin/requests'
      }
    };
  }, [template]);

  useEffect(() => {
    if (template && mode === 'edit') {
      console.log('🔥 TEMPLATE MODAL DEBUG - Template received:', template);
      console.log('🔥 TEMPLATE MODAL DEBUG - previewData field:', template.previewData);
      console.log('🔥 TEMPLATE MODAL DEBUG - All template fields:', Object.keys(template));
      
      setEditedTemplate(template);
      // Initialize editable preview data from template, clean and format it
      let previewData = JSON.stringify(samplePayload, null, 2);
      if (template.previewData) {
        try {
          const cleanedData = cleanJsonString(template.previewData);
          console.log('🔥 CLEANED DATA:', cleanedData);
          const parsed = JSON.parse(cleanedData);
          console.log('🔥 PARSED DATA:', parsed);
          previewData = JSON.stringify(parsed, null, 2); // Format nicely
        } catch (error) {
          console.warn('Failed to clean and parse previewData for editing, using fallback');
        }
      } else {
        console.log('🔥 NO PREVIEW DATA FOUND IN TEMPLATE');
      }
      setEditablePreviewData(previewData);
    } else if (mode === 'create') {
      setEditedTemplate({
        name: '',
        formType: '',
        emailSubject: '',
        emailContentHtml: '',
        smsContent: '',
        // Legacy fallbacks
        channel: NotificationTemplateChannel.EMAIL,
        subject: '',
        contentHtml: '',
        contentText: '',
        // Common fields
        isActive: true,
        variables: JSON.stringify([]),
        owner: 'admin'
      });
      // Initialize with default sample data for new templates
      setEditablePreviewData(JSON.stringify(samplePayload, null, 2));
    }
  }, [template, mode, samplePayload]);

  // Process template using the real lambda processor
  const processTemplatePreview = useCallback(async (templateData: Partial<TemplateItem>, payload: any): Promise<void> => {
    try {
      setPreviewError('');
      
      // Only process if we have content
      if (!templateData.emailContentHtml && !templateData.contentHtml && !templateData.contentText) {
        setPreviewData('');
        return;
      }

      // Create a template object that matches the lambda processor expectations
      const templateForProcessing = {
        name: templateData.name || 'Preview Template',
        emailSubject: templateData.emailSubject || templateData.subject || '',
        emailContentHtml: templateData.emailContentHtml || templateData.contentHtml || '',
        smsContent: templateData.contentText || '',
        // Legacy fallbacks
        subject: templateData.subject || '',
        contentHtml: templateData.contentHtml || '',
        contentText: templateData.contentText || ''
      };

      console.log('Processing template preview with processor:', templateForProcessing);
      
      const result = await templateProcessor.processTemplate(templateForProcessing, payload);
      
      // Format the preview based on channel
      if (templateData.channel === NotificationTemplateChannel.EMAIL || !templateData.channel) {
        setPreviewData(`
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px;">
            <div style="background: #f8f9fa; padding: 10px; margin-bottom: 20px; border-radius: 4px;">
              <strong>Subject:</strong> ${result.subject}
            </div>
            ${result.htmlContent}
          </div>
        `);
      } else {
        setPreviewData(`
          <div style="font-family: monospace; background: #f8f9fa; padding: 15px; border-radius: 4px; white-space: pre-wrap;">
<strong>SMS Message:</strong>
${result.subject ? `Subject: ${result.subject}\n\n` : ''}${result.textContent}
          </div>
        `);
      }
      
    } catch (error) {
      console.error('Template processing error:', error);
      setPreviewError(error instanceof Error ? error.message : String(error));
      setPreviewData(`
        <div style="color: #dc2626; background: #fef2f2; padding: 15px; border-radius: 4px; border: 1px solid #fca5a5;">
          <strong>Template compilation error:</strong> ${error instanceof Error ? error.message : String(error)}
        </div>
      `);
    }
  }, [templateProcessor]);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Include the edited preview data in the template to save
      const templateToSave = {
        ...editedTemplate,
        previewData: editablePreviewData
      };
      await onSave(templateToSave);
      onClose();
    } catch (error) {
      console.error('Failed to save template:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePreview = useCallback(async () => {
    try {
      // Only try to parse if editablePreviewData is not empty
      if (!editablePreviewData || editablePreviewData.trim() === '') {
        console.log('No preview data available, using sample payload');
        await processTemplatePreview(editedTemplate, samplePayload);
        return;
      }
      
      // Parse the editable preview data
      const parsedPreviewData = JSON.parse(editablePreviewData);
      await processTemplatePreview(editedTemplate, parsedPreviewData);
    } catch (error) {
      console.error('Failed to parse preview data:', error);
      // Fall back to sample payload if preview data is invalid
      await processTemplatePreview(editedTemplate, samplePayload);
    }
  }, [editedTemplate, editablePreviewData, samplePayload, processTemplatePreview]);

  useEffect(() => {
    generatePreview();
  }, [generatePreview]);

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Create New Template' : 'Edit Template'}
      subtitle={template?.name || 'Design your notification template'}
      maxWidth="xl"
      disableBackdropClick
    >
      <div style={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: '24px', flex: 1, overflow: 'hidden' }}>
          {/* Editor Panel */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <H4 className="mb-3">Template Editor</H4>
            <div style={{ flex: 1, overflow: 'auto', paddingRight: '8px' }}>
              <div className="space-y-4">
                {/* Basic Information */}
                <TextField
                  label="Template Name"
                  value={editedTemplate.name || ''}
                  onChange={(e) => setEditedTemplate(prev => ({ ...prev, name: e.target.value }))}
                  fullWidth
                  variant="outlined"
                  size="small"
                  required
                />

                <FormControl fullWidth size="small">
                  <InputLabel>Channel</InputLabel>
                  <Select
                    value={editedTemplate.channel || NotificationTemplateChannel.EMAIL}
                    onChange={(e) => setEditedTemplate(prev => ({ 
                      ...prev, 
                      channel: e.target.value as NotificationTemplateChannel 
                    }))}
                    label="Channel"
                  >
                    <MenuItem value={NotificationTemplateChannel.EMAIL}>Email</MenuItem>
                    <MenuItem value={NotificationTemplateChannel.SMS}>SMS</MenuItem>
                    <MenuItem value={NotificationTemplateChannel.WHATSAPP}>WhatsApp</MenuItem>
                    <MenuItem value={NotificationTemplateChannel.TELEGRAM}>Telegram</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Email Subject"
                  value={editedTemplate.emailSubject || editedTemplate.subject || ''}
                  onChange={(e) => setEditedTemplate(prev => ({ 
                    ...prev, 
                    emailSubject: e.target.value,
                    subject: e.target.value // Keep legacy field in sync
                  }))}
                  fullWidth
                  variant="outlined"
                  size="small"
                  placeholder="e.g., Contact Us — {{subject}} ({{customerName}}) — {{formatDate submittedAt}}"
                />

                {/* Content based on channel */}
                {editedTemplate.channel === NotificationTemplateChannel.EMAIL ? (
                  <>
                    <TextField
                      label="Email HTML Content"
                      multiline
                      rows={12}
                      value={editedTemplate.emailContentHtml || editedTemplate.contentHtml || ''}
                      onChange={(e) => setEditedTemplate(prev => ({ 
                        ...prev, 
                        emailContentHtml: e.target.value,
                        contentHtml: e.target.value // Keep legacy field in sync
                      }))}
                      fullWidth
                      variant="outlined"
                      placeholder="Enter HTML email template..."
                      sx={{
                        '& .MuiInputBase-input': {
                          fontFamily: 'Monaco, Menlo, monospace',
                          fontSize: '12px'
                        }
                      }}
                    />
                    
                    <TextField
                      label="SMS Content"
                      multiline
                      rows={8}
                      value={editedTemplate.smsContent || editedTemplate.contentText || ''}
                      onChange={(e) => setEditedTemplate(prev => ({ 
                        ...prev, 
                        smsContent: e.target.value,
                        contentText: e.target.value // Keep legacy field in sync
                      }))}
                      fullWidth
                      variant="outlined"
                      placeholder="Enter SMS template..."
                      sx={{
                        '& .MuiInputBase-input': {
                          fontFamily: 'Monaco, Menlo, monospace',
                          fontSize: '12px'
                        }
                      }}
                    />
                  </>
                ) : (
                  <TextField
                    label="Message Content"
                    multiline
                    rows={10}
                    value={editedTemplate.smsContent || editedTemplate.contentText || ''}
                    onChange={(e) => setEditedTemplate(prev => ({ 
                      ...prev, 
                      smsContent: e.target.value,
                      contentText: e.target.value // Keep legacy field in sync
                    }))}
                    fullWidth
                    variant="outlined"
                    placeholder="Enter your message template..."
                    sx={{
                      '& .MuiInputBase-input': {
                        fontFamily: 'Monaco, Menlo, monospace',
                        fontSize: '12px'
                      }
                    }}
                  />
                )}

                <FormControlLabel
                  control={
                    <Switch
                      checked={editedTemplate.isActive !== false}
                      onChange={(e) => setEditedTemplate(prev => ({ ...prev, isActive: e.target.checked }))}
                    />
                  }
                  label="Active Template"
                />

                {/* Variable Helper */}
                <Card variant="outlined">
                  <CardContent>
                    <H5 className="mb-2">Available Variables</H5>
                    <P2 className="text-gray-600 mb-2">
                      Use these variables in your template content:
                    </P2>
                    <div className="text-xs font-mono space-y-1">
                      <div>• {'{{'} customer.name {'}}'}  - Customer name</div>
                      <div>• {'{{'} customer.email {'}}'}  - Customer email</div>
                      <div>• {'{{'} customer.phone {'}}'}  - Customer phone</div>
                      <div>• {'{{'} property.address {'}}'}  - Property address</div>
                      <div>• {'{{'} project.product {'}}'}  - Service type</div>
                      <div>• {'{{'} project.message {'}}'}  - Customer message</div>
                      <div>• {'{{'} submission.id {'}}'}  - Submission ID</div>
                      <div>• {'{{'} submission.timestamp {'}}'}  - Submission time</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="flex items-center justify-between mb-3">
              <H4>Live Preview</H4>
              <Button
                size="small"
                variant="outlined"
                onClick={generatePreview}
              >
                Refresh Preview
              </Button>
            </div>
            
            <Card variant="outlined" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <Tabs value={previewTab} onChange={(e, v) => setPreviewTab(v)}>
                <Tab label="Rendered View" />
                <Tab label="Sample Data" />
              </Tabs>
              
              <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
                <TabPanel value={previewTab} index={0}>
                  {previewData ? (
                    <div dangerouslySetInnerHTML={{ __html: previewData }} />
                  ) : (
                    <P2 className="text-gray-500">Enter template content to see preview</P2>
                  )}
                </TabPanel>
                
                <TabPanel value={previewTab} index={1}>
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div className="flex items-center justify-between mb-3">
                      <H5>Sample Data for Preview</H5>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          try {
                            if (!editablePreviewData || editablePreviewData.trim() === '') {
                              console.warn('No content to format');
                              return;
                            }
                            const parsed = JSON.parse(editablePreviewData);
                            setEditablePreviewData(JSON.stringify(parsed, null, 2));
                          } catch (error) {
                            console.warn('Invalid JSON, cannot format:', error);
                          }
                        }}
                      >
                        Format JSON
                      </Button>
                    </div>
                    <P2 className="text-gray-600 mb-3">
                      Edit this sample data to test your template with different values. Changes will be saved with the template.
                    </P2>
                    <TextField
                      multiline
                      rows={20}
                      value={editablePreviewData}
                      onChange={(e) => setEditablePreviewData(e.target.value)}
                      fullWidth
                      variant="outlined"
                      placeholder="Enter JSON sample data..."
                      sx={{
                        flex: 1,
                        '& .MuiInputBase-input': {
                          fontFamily: 'Monaco, Menlo, monospace',
                          fontSize: '12px'
                        }
                      }}
                      helperText="This data will be used to preview how your template renders with actual values"
                    />
                  </div>
                </TabPanel>
              </div>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <Box className="flex justify-end gap-3 pt-4 mt-4 border-t">
          <Button
            variant="outlined"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={loading || !editedTemplate.name || (!editedTemplate.emailContentHtml && !editedTemplate.contentHtml && !editedTemplate.smsContent && !editedTemplate.contentText)}
          >
            {loading ? 'Saving...' : mode === 'create' ? 'Create Template' : 'Save Changes'}
          </Button>
        </Box>
      </div>
    </BaseModal>
  );
};

export default TemplateEditorModal;