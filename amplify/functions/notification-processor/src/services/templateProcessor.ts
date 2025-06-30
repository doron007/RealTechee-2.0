import Handlebars from 'handlebars';
import { NotificationTemplate } from '../types';

export interface ProcessedTemplate {
  subject: string;
  htmlContent: string;
  textContent: string;
}

export class TemplateProcessor {
  constructor() {
    this.registerHelpers();
  }

  private registerHelpers(): void {
    // Register useful Handlebars helpers
    
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

    // Join array helper
    Handlebars.registerHelper('join', (array: any[], separator: string = ', ') => {
      return Array.isArray(array) ? array.join(separator) : '';
    });

    console.log('✅ Handlebars helpers registered');
  }

  async processTemplate(template: NotificationTemplate, data: any): Promise<ProcessedTemplate> {
    try {
      console.log(`🎨 Processing template: ${template.name}`);

      // Validate required variables
      await this.validateTemplateData(template, data);

      // Process subject
      const subjectTemplate = Handlebars.compile(template.subject || '');
      const subject = subjectTemplate(data);

      // Process HTML content
      const htmlTemplate = Handlebars.compile(template.contentHtml || '');
      const htmlContent = htmlTemplate(data);

      // Process text content
      const textTemplate = Handlebars.compile(template.contentText || '');
      const textContent = textTemplate(data);

      console.log(`✅ Template processed successfully: ${template.name}`);

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