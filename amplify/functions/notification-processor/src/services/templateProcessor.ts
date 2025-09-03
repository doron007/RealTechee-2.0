import Handlebars from 'handlebars';
import { NotificationTemplate } from '../types';
const { registerHelpers } = require('../utils/handlebarsHelpers');

export interface ProcessedTemplate {
  subject: string;
  htmlContent: string;
  textContent: string;
}

export class TemplateProcessor {
  constructor() {
    this.initializeHelpers();
  }

  private initializeHelpers(): void {
    // Use shared helpers for consistent rendering with Live Preview
    registerHelpers(Handlebars);
    
    // Lambda-specific helpers (more advanced versions)
    
    // Uppercase helper (Lambda-specific)
    Handlebars.registerHelper('uppercase', (str: string) => {
      return str ? str.toUpperCase() : '';
    });

    // Override fileLinks with advanced Lambda version
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
        }).join('\n      ');
      } catch (error) {
        console.error('Error parsing file links:', error);
        return '';
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

    console.log('✅ Handlebars helpers registered');
  }

  async processTemplate(template: NotificationTemplate, data: any, channel?: string): Promise<ProcessedTemplate> {
    try {
      console.log(`🎨 Processing unified template: ${template.name} for channel: ${channel || 'both'}`);

      // Validate required variables
      await this.validateTemplateData(template, data);

      // Process email content (new unified structure)
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

      console.log(`✅ Unified template processed successfully: ${template.name}`);

      return {
        subject: this.sanitizeSubject(subject),
        htmlContent: this.sanitizeHtml(htmlContent),
        textContent: this.sanitizeText(textContent)
      };

    } catch (error) {
      console.error(`❌ Template processing failed for ${template.name}:`, error);
      throw new Error(`Template processing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async validateTemplateData(template: NotificationTemplate, data: any): Promise<void> {
    if (!template.variables) {
      return; // No validation required
    }

    let requiredVariables: string[] = [];
    
    try {
      requiredVariables = JSON.parse(template.variables as string);
    } catch (error) {
      console.warn('Invalid template variables JSON, skipping validation');
      return;
    }

    const missingVariables: string[] = [];

    for (const variable of requiredVariables) {
      if (!this.hasNestedProperty(data, variable)) {
        missingVariables.push(variable);
      }
    }

    if (missingVariables.length > 0) {
      throw new Error(`Missing required template variables: ${missingVariables.join(', ')}`);
    }
  }

  private hasNestedProperty(obj: any, path: string): boolean {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined;
    }, obj) !== undefined;
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

  // Method to precompile templates for better performance
  precompileTemplate(templateContent: string): HandlebarsTemplateDelegate {
    return Handlebars.compile(templateContent);
  }
}