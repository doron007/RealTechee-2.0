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
    // Lambda-specific helpers first
    
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

    // Use shared helpers for consistent rendering with Live Preview - REGISTER LAST
    registerHelpers(Handlebars);

    console.log('✅ Handlebars helpers registered with shared helpers last');
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
    // First convert CSS variables to inline styles for Gmail compatibility
    let sanitized = this.convertCssVariablesToInlineStyles(String(html));
    
    // Basic HTML sanitization - in production, consider using a proper HTML sanitizer
    // For now, just ensure it's a string and not too large
    return sanitized.substring(0, 100000); // Limit to 100KB
  }

  private convertCssVariablesToInlineStyles(html: string): string {
    // Extract CSS variables from :root declaration
    const cssVariables: { [key: string]: string } = {};
    
    // Parse :root CSS variables
    const rootMatch = html.match(/:root\s*\{([^}]+)\}/);
    if (rootMatch) {
      const rootCss = rootMatch[1];
      const variableMatches = rootCss.matchAll(/--([^:]+):\s*([^;]+);/g);
      for (const match of variableMatches) {
        const varName = match[1].trim();
        const varValue = match[2].trim();
        cssVariables[`--${varName}`] = varValue;
      }
    }

    // CSS class to inline styles mapping
    const cssClassStyles: { [key: string]: string } = {
      'container': 'max-width:680px;margin:0 auto;padding:24px;',
      'card': 'background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(2,6,23,.06);',
      'header': 'background:linear-gradient(135deg,#0b3a5d,#0e4977);color:#fff;padding:24px;',
      'brand': 'display:flex;align-items:center;gap:12px;',
      'brand__logo': 'width:28px;height:28px;border-radius:6px;background:#18b5a4;display:inline-block;',
      'brand__name': 'font-size:18px;font-weight:bold;',
      'title': 'margin:14px 0 4px 0;font-size:20px;line-height:1.35;',
      'subtitle': 'margin:0;color:#e6eef7;font-size:14px;',
      'pillrow': 'margin-top:14px;display:flex;gap:8px;flex-wrap:wrap;',
      'pill': 'font-size:12px;padding:6px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.35);color:#fff;opacity:.95',
      'content': 'padding:20px;',
      'section': 'border-top:1px solid #e2e8f0;padding:16px 0;',
      'h3': 'margin:0 0 10px 0;font-size:14px;letter-spacing:.4px;text-transform:uppercase;color:#475569;',
      'kv': 'display:grid;grid-template-columns:160px 1fr;gap:8px 12px;font-size:14px;',
      'msg': 'background:#fbfdff;border:1px solid #e2e8f0;border-radius:12px;padding:14px;font-size:14px;line-height:1.55;',
      'actions': 'display:flex;flex-wrap:wrap;gap:10px;margin-top:12px;',
      'btn': 'display:inline-block;padding:12px 14px;border-radius:12px;font-size:14px;font-weight:600;border:1px solid transparent;',
      'btn--primary': 'background:#18b5a4;color:#05313e;',
      'btn--ghost': 'background:#fff;border-color:#e2e8f0;color:#0b3a5d;',
      'media': 'display:flex;flex-wrap:wrap;gap:12px;margin-top:10px;',
      'footer': 'padding:16px 20px;color:#6b7280;font-size:12px;text-align:center;',
      'thumb': 'display:block;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;width:160px;',
      'thumb__cap': 'padding:8px 10px;font-size:12px;color:#475569;background:#fff;'
    };

    // Convert CSS variables in style attributes
    let converted = html.replace(/var\(([^)]+)\)/g, (match, varName) => {
      const trimmedVar = varName.trim();
      return cssVariables[trimmedVar] || match;
    });

    // Remove the :root style block entirely
    converted = converted.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

    // Convert CSS classes to inline styles
    converted = converted.replace(/class="([^"]*)"/g, (match, classNames) => {
      const classes = classNames.split(/\s+/);
      const inlineStyles: string[] = [];
      
      for (const className of classes) {
        if (cssClassStyles[className]) {
          inlineStyles.push(cssClassStyles[className]);
        }
      }
      
      if (inlineStyles.length > 0) {
        const combinedStyles = inlineStyles.join('');
        // Check if element already has style attribute
        return `style="${combinedStyles}"`;
      }
      
      return match;
    });

    // Handle elements that have both class and style attributes
    converted = converted.replace(/(<[^>]*)\s+style="([^"]*)"([^>]*)\s+class="([^"]*)"/g, 
      (match, beforeStyle, existingStyle, betweenAttrs, classNames) => {
        const classes = classNames.split(/\s+/);
        const inlineStyles: string[] = [];
        
        for (const className of classes) {
          if (cssClassStyles[className]) {
            inlineStyles.push(cssClassStyles[className]);
          }
        }
        
        if (inlineStyles.length > 0) {
          const combinedStyles = existingStyle + inlineStyles.join('');
          return `${beforeStyle} style="${combinedStyles}"${betweenAttrs}`;
        }
        
        return `${beforeStyle} style="${existingStyle}"${betweenAttrs}`;
      }
    );

    // Clean up any remaining class attributes that weren't handled
    converted = converted.replace(/\s+class="[^"]*"/g, '');

    console.log('🎨 Converted CSS variables and classes to inline styles for Gmail compatibility');
    
    return converted;
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