import Handlebars from 'handlebars';

export interface ProcessedTemplate {
  subject: string;
  htmlContent: string;
  textContent: string;
}

export class ClientTemplateProcessor {
  private static instance: ClientTemplateProcessor;
  private initialized = false;

  static getInstance(): ClientTemplateProcessor {
    if (!ClientTemplateProcessor.instance) {
      ClientTemplateProcessor.instance = new ClientTemplateProcessor();
    }
    return ClientTemplateProcessor.instance;
  }

  private constructor() {
    this.registerHelpers();
  }

  private registerHelpers(): void {
    if (this.initialized) return;
    
    // Register all the same helpers as the lambda processor
    
    // Format date helper
    Handlebars.registerHelper('formatDate', (date: string | Date, format?: string) => {
      const d = new Date(date);
      if (format === 'short') {
        return d.toLocaleDateString();
      }
      if (format === 'time') {
        return d.toLocaleTimeString();
      }
      return d.toLocaleString(); // Default format
    });

    // Uppercase helper
    Handlebars.registerHelper('uppercase', (str: string) => {
      return str ? str.toUpperCase() : '';
    });

    // Conditional equal helper
    Handlebars.registerHelper('eq', (a: any, b: any) => {
      return a === b;
    });

    // Default value helper
    Handlebars.registerHelper('default', (value: any, defaultValue: any) => {
      return value || defaultValue;
    });

    // Urgency color helper
    Handlebars.registerHelper('getUrgencyColor', (urgency: string) => {
      switch (urgency?.toLowerCase()) {
        case 'high': return '#dc2626';
        case 'medium': return '#d97706';
        case 'low': return '#059669';
        default: return '#6b7280';
      }
    });

    // Urgency label helper
    Handlebars.registerHelper('getUrgencyLabel', (urgency: string) => {
      switch (urgency?.toLowerCase()) {
        case 'high': return '🔴 HIGH';
        case 'medium': return '🟡 MEDIUM';
        case 'low': return '🟢 LOW';
        default: return '⚪ STANDARD';
      }
    });

    // Phone number formatting helper
    Handlebars.registerHelper('formatPhone', (phone: string) => {
      if (!phone) return '';
      // Remove all non-digits
      const cleaned = phone.replace(/\D/g, '');
      // Format as (XXX) XXX-XXXX for US numbers
      if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
      }
      return phone; // Return original if not 10 digits
    });

    // Join array helper
    Handlebars.registerHelper('join', (array: any[], separator: string = ', ') => {
      return Array.isArray(array) ? array.join(separator) : '';
    });

    // Parse JSON array helper
    Handlebars.registerHelper('parseJson', (jsonString: string) => {
      try {
        return JSON.parse(jsonString || '[]');
      } catch (error) {
        return [];
      }
    });

    // URL encoding helper for email links
    Handlebars.registerHelper('encodeURI', (str: string) => {
      return str ? encodeURIComponent(str) : '';
    });

    // File links helper - creates HTML links for file arrays (supports new template format)
    Handlebars.registerHelper('fileLinks', (jsonString: string, type: string = 'file') => {
      try {
        const files = JSON.parse(jsonString || '[]');
        if (!Array.isArray(files) || files.length === 0) {
          return '';
        }

        return files.map((url: string) => {
          // Convert relative URLs to absolute URLs for email clients
          const absoluteUrl = url.startsWith('http') ? url : `https://d200k2wsaf8th3.amplifyapp.com${url}`;
          const filename = url.split('/').pop() || url;
          const cleanFilename = filename.replace(/^\d+-/, ''); // Remove timestamp prefix if present
          
          // Create thumbnail based on file type
          if (type === 'images' || /\.(jpg|jpeg|png|gif|webp)$/i.test(filename)) {
            return `<a class="thumb" href="${absoluteUrl}" target="_blank">
              <img src="${absoluteUrl}" alt="Uploaded Image" />
              <div class="thumb__cap">Photo</div>
            </a>`;
          } else if (type === 'videos' || /\.(mp4|mov|avi|wmv)$/i.test(filename)) {
            return `<a class="thumb" href="${absoluteUrl}" target="_blank">
              <img src="https://dummyimage.com/320x200/ffffff/e2e8f0.png&text=Video" alt="Uploaded Video" />
              <div class="thumb__cap">Video</div>
            </a>`;
          } else {
            return `<a class="thumb" href="${absoluteUrl}" target="_blank">
              <img src="https://dummyimage.com/320x200/ffffff/e2e8f0.png&text=Document" alt="Uploaded Document" />
              <div class="thumb__cap">Document</div>
            </a>`;
          }
        }).join('');
      } catch (error) {
        return '<p style="color: #ef4444;">Error loading files</p>';
      }
    });

    // File list helper for text emails
    Handlebars.registerHelper('fileList', (jsonString: string, type: string = 'file') => {
      try {
        const files = JSON.parse(jsonString || '[]');
        if (!Array.isArray(files) || files.length === 0) {
          return 'No files uploaded';
        }

        return files.map((url: string) => {
          const filename = url.split('/').pop() || url;
          const cleanFilename = filename.replace(/^\d+-/, '');
          return `• ${cleanFilename}: ${url}`;
        }).join('\n');
      } catch (error) {
        return 'Error loading files';
      }
    });

    this.initialized = true;
    console.log('✅ Client Handlebars helpers registered');
  }

  async processTemplate(template: any, data: any): Promise<ProcessedTemplate> {
    try {
      console.log(`🎨 Processing template: ${template.name || 'Unnamed'}`);

      // Process using the same logic as lambda processor
      let subject = '';
      let htmlContent = '';
      let textContent = '';

      if (template.emailSubject || template.emailContentHtml) {
        // New unified structure
        const subjectTemplate = Handlebars.compile(template.emailSubject || '');
        subject = subjectTemplate(data);

        const htmlTemplate = Handlebars.compile(template.emailContentHtml || '');
        htmlContent = htmlTemplate(data);

        // Use SMS content for text
        const smsTemplate = Handlebars.compile(template.smsContent || '');
        textContent = smsTemplate(data);
      } else {
        // Legacy structure fallback
        const subjectTemplate = Handlebars.compile(template.subject || '');
        subject = subjectTemplate(data);

        const htmlTemplate = Handlebars.compile(template.content || template.contentHtml || '');
        htmlContent = htmlTemplate(data);

        const textTemplate = Handlebars.compile(template.contentText || template.content || '');
        textContent = textTemplate(data);
      }

      console.log(`✅ Template processed successfully: ${template.name || 'Unnamed'}`);

      return {
        subject: this.sanitizeSubject(subject),
        htmlContent: this.sanitizeHtml(htmlContent),
        textContent: this.sanitizeText(textContent)
      };

    } catch (error) {
      console.error(`❌ Template processing failed for ${template.name || 'Unnamed'}:`, error);
      throw new Error(`Template compilation error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Utility method to test template compilation
  async testTemplate(templateContent: string, testData: any): Promise<{ success: boolean; error?: string; result?: string }> {
    try {
      const compiledTemplate = Handlebars.compile(templateContent);
      const result = compiledTemplate(testData);
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  private sanitizeSubject(subject: string): string {
    // Remove any newlines and excessive whitespace from subject
    return subject.replace(/\s+/g, ' ').trim().substring(0, 200);
  }

  private sanitizeHtml(html: string): string {
    // Basic HTML sanitization - in production, consider using a proper HTML sanitizer
    // For now, just ensure it's a string and not too large
    return String(html).substring(0, 100000); // Limit to 100KB
  }

  private sanitizeText(text: string): string {
    // Basic text sanitization with proper line break handling for SMS
    let sanitized = String(text);
    
    // Convert any HTML line breaks to actual line breaks
    sanitized = sanitized.replace(/<br\s*\/?>/gi, '\n');
    
    // Ensure \n sequences become actual line breaks (fix for SMS)
    sanitized = sanitized.replace(/\\n/g, '\n');
    
    // Limit to 50KB
    return sanitized.substring(0, 50000);
  }
}