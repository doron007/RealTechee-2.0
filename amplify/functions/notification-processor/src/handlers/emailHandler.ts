import sgMail from '@sendgrid/mail';

export interface EmailParams {
  to: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  from?: string;
}

export class EmailHandler {
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    const apiKey = process.env.SENDGRID_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ SENDGRID_API_KEY not found. Email sending will fail.');
      return;
    }

    sgMail.setApiKey(apiKey);
    this.initialized = true;
    console.log('✅ SendGrid email handler initialized');
  }

  async sendEmail(params: EmailParams): Promise<void> {
    if (!this.initialized) {
      throw new Error('SendGrid not initialized. Check SENDGRID_API_KEY environment variable.');
    }

    const { to, subject, htmlContent, textContent, from } = params;

    const msg = {
      to,
      from: from || process.env.FROM_EMAIL || 'notifications@realtechee.com',
      subject,
      text: textContent,
      html: htmlContent,
      // Add tracking and branding
      trackingSettings: {
        clickTracking: {
          enable: true,
          enableText: false
        },
        openTracking: {
          enable: true
        },
        subscriptionTracking: {
          enable: false
        }
      },
      // Custom headers for identification
      customArgs: {
        source: 'realtechee-notifications',
        version: '1.0.0'
      }
    };

    try {
      console.log(`📧 Sending email to ${to}: ${subject}`);
      
      const [response] = await sgMail.send(msg);
      
      console.log(`✅ Email sent successfully`, {
        to,
        statusCode: response.statusCode,
        messageId: response.headers['x-message-id']
      });

    } catch (error: any) {
      console.error('❌ SendGrid error:', {
        error: error.message,
        code: error.code,
        statusCode: error.statusCode,
        to,
        subject
      });

      // Log detailed error for debugging
      if (error.response?.body) {
        console.error('SendGrid error details:', error.response.body);
      }

      throw new Error(`Failed to send email to ${to}: ${error.message}`);
    }
  }

  async validateEmail(email: string): Promise<boolean> {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async testConnection(): Promise<boolean> {
    if (!this.initialized) {
      return false;
    }

    try {
      // SendGrid doesn't have a direct test endpoint, so we'll just verify the key format
      const apiKey = process.env.SENDGRID_API_KEY;
      return apiKey?.startsWith('SG.') || false;
    } catch (error) {
      console.error('SendGrid connection test failed:', error);
      return false;
    }
  }
}