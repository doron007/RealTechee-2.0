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

  // Sample payload for preview
  const samplePayload = useMemo(() => ({
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
  }), []);

  useEffect(() => {
    if (template && mode === 'edit') {
      setEditedTemplate(template);
    } else if (mode === 'create') {
      setEditedTemplate({
        name: '',
        channel: NotificationTemplateChannel.EMAIL,
        subject: '',
        contentHtml: '',
        contentText: '',
        isActive: true,
        variables: JSON.stringify([]),
        owner: 'admin'
      });
    }
  }, [template, mode]);

  // Simple template variable replacement (for preview)
  const renderTemplate = (content: string, payload: any): string => {
    let rendered = content;
    
    // Replace variables like {{customer.name}}
    const replaceVariables = (text: string, obj: any, prefix = ''): string => {
      Object.keys(obj).forEach(key => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];
        
        if (typeof value === 'object' && value !== null) {
          text = replaceVariables(text, value, fullKey);
        } else {
          const regex = new RegExp(`{{\\s*${fullKey}\\s*}}`, 'g');
          text = text.replace(regex, String(value || ''));
        }
      });
      return text;
    };
    
    return replaceVariables(rendered, payload);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(editedTemplate);
      onClose();
    } catch (error) {
      console.error('Failed to save template:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePreview = useCallback(() => {
    if (!editedTemplate.contentHtml && !editedTemplate.contentText) return;
    
    if (editedTemplate.channel === NotificationTemplateChannel.EMAIL) {
      const htmlContent = renderTemplate(editedTemplate.contentHtml || '', samplePayload);
      const subject = renderTemplate(editedTemplate.subject || '', samplePayload);
      
      setPreviewData(`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px;">
          <div style="background: #f8f9fa; padding: 10px; margin-bottom: 20px; border-radius: 4px;">
            <strong>Subject:</strong> ${subject}
          </div>
          ${htmlContent}
        </div>
      `);
    } else {
      const textContent = renderTemplate(editedTemplate.contentText || '', samplePayload);
      const subject = renderTemplate(editedTemplate.subject || '', samplePayload);
      
      setPreviewData(`
        <div style="font-family: monospace; background: #f8f9fa; padding: 15px; border-radius: 4px; white-space: pre-wrap;">
<strong>SMS Message:</strong>
${subject ? `Subject: ${subject}\n\n` : ''}${textContent}
        </div>
      `);
    }
  }, [editedTemplate.contentHtml, editedTemplate.contentText, editedTemplate.subject, editedTemplate.channel, samplePayload]);

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
                  label="Subject"
                  value={editedTemplate.subject || ''}
                  onChange={(e) => setEditedTemplate(prev => ({ ...prev, subject: e.target.value }))}
                  fullWidth
                  variant="outlined"
                  size="small"
                  placeholder="e.g., New Request - {{customer.name}}"
                />

                {/* Content based on channel */}
                {editedTemplate.channel === NotificationTemplateChannel.EMAIL ? (
                  <>
                    <TextField
                      label="HTML Content"
                      multiline
                      rows={12}
                      value={editedTemplate.contentHtml || ''}
                      onChange={(e) => setEditedTemplate(prev => ({ ...prev, contentHtml: e.target.value }))}
                      fullWidth
                      variant="outlined"
                      placeholder="Enter HTML template..."
                      sx={{
                        '& .MuiInputBase-input': {
                          fontFamily: 'Monaco, Menlo, monospace',
                          fontSize: '12px'
                        }
                      }}
                    />
                    
                    <TextField
                      label="Text Content (Fallback)"
                      multiline
                      rows={8}
                      value={editedTemplate.contentText || ''}
                      onChange={(e) => setEditedTemplate(prev => ({ ...prev, contentText: e.target.value }))}
                      fullWidth
                      variant="outlined"
                      placeholder="Enter plain text version..."
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
                    value={editedTemplate.contentText || ''}
                    onChange={(e) => setEditedTemplate(prev => ({ ...prev, contentText: e.target.value }))}
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
                  <div style={{ fontFamily: 'Monaco, Menlo, monospace', fontSize: '12px' }}>
                    <H5 className="mb-2">Sample Payload Data:</H5>
                    <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto">
                      {JSON.stringify(samplePayload, null, 2)}
                    </pre>
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
            disabled={loading || !editedTemplate.name || (!editedTemplate.contentHtml && !editedTemplate.contentText)}
          >
            {loading ? 'Saving...' : mode === 'create' ? 'Create Template' : 'Save Changes'}
          </Button>
        </Box>
      </div>
    </BaseModal>
  );
};

export default TemplateEditorModal;