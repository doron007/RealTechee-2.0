// Inline utility functions to avoid circular dependency
const formatPhoneForDisplay = (phone?: string): string => {
  if (!phone) return 'Not provided';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  } catch (error) {
    return timestamp;
  }
};

const getUrgencyColor = (urgency?: string): string => {
  switch (urgency) {
    case 'high': return '#D11919';
    case 'medium': return '#FFB900';
    case 'low': return '#3BE8B0';
    default: return '#17619C';
  }
};

const getUrgencyLabel = (urgency?: string): string => {
  switch (urgency) {
    case 'high': return '🔴 HIGH PRIORITY';
    case 'medium': return '🟡 MEDIUM PRIORITY';
    case 'low': return '🟢 LOW PRIORITY';
    default: return '🔵 STANDARD';
  }
};

// Type definition
interface ContactFormData {
  formType: string;
  submissionId: string;
  submittedAt: string;
  testData?: boolean;
  leadSource?: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  urgency?: 'low' | 'medium' | 'high';
  preferredContact?: 'email' | 'phone';
}

export const contactUsTemplate = {
  email: (data: ContactFormData) => {
    const urgencyColor = getUrgencyColor(data.urgency);
    const urgencyLabel = getUrgencyLabel(data.urgency);
    const testDataBadge = data.testData ? `
      <div style="background-color: #FFB900; color: #151515; padding: 8px 16px; border-radius: 6px; font-weight: 600; text-align: center; margin-bottom: 24px;">
        ⚠️ TEST DATA - E2E Testing Session
      </div>` : '';

    const subject = `${data.testData ? '[TEST] ' : ''}New Contact Inquiry${data.urgency === 'high' ? ' - HIGH PRIORITY' : ''} - ${data.name}`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Contact Inquiry - RealTechee</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #2A2B2E; background-color: #F9F4F3;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #F9F4F3; min-height: 100vh;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #FFFFFF; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); overflow: hidden;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #151515; padding: 32px 40px; text-align: center;">
                            <img src="https://d200k2wsaf8th3.amplifyapp.com/assets/logos/web_realtechee_horizontal_no_border.png" alt="RealTechee" style="height: 40px; width: auto;">
                        </td>
                    </tr>

                    <!-- Test Data Badge -->
                    ${testDataBadge ? `<tr><td style="padding: 24px 40px 0;">${testDataBadge}</td></tr>` : ''}

                    <!-- Alert Section -->
                    <tr>
                        <td style="padding: ${testDataBadge ? '24px' : '40px'} 40px 32px; background: linear-gradient(135deg, #F9F4F3 0%, #FFFFFF 100%);">
                            <div style="display: flex; align-items: center; margin-bottom: 16px;">
                                <div style="background-color: ${urgencyColor}; color: white; padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 600; margin-right: 12px;">
                                    ${urgencyLabel}
                                </div>
                                <div style="background-color: #E4E4E4; color: #6E6E73; padding: 8px 16px; border-radius: 6px; font-size: 12px; font-weight: 500;">
                                    ID: ${data.submissionId}
                                </div>
                            </div>
                            <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #151515; line-height: 1.2;">
                                📬 New Contact Inquiry Received
                            </h1>
                            <p style="margin: 12px 0 0; font-size: 16px; color: #6E6E73; line-height: 1.5;">
                                A customer has submitted a contact form inquiry requiring your attention.
                            </p>
                        </td>
                    </tr>

                    <!-- Summary Section -->
                    <tr>
                        <td style="padding: 0 40px 32px;">
                            <div style="background-color: #F9F4F3; border-radius: 8px; padding: 24px; border-left: 4px solid ${urgencyColor};">
                                <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #151515;">Contact Summary</h2>
                                <div style="display: flex; flex-wrap: wrap; gap: 16px;">
                                    <div style="flex: 1; min-width: 200px;">
                                        <div style="font-size: 12px; font-weight: 500; color: #6E6E73; text-transform: uppercase; margin-bottom: 4px;">Customer</div>
                                        <div style="font-size: 16px; font-weight: 600; color: #151515;">${data.name}</div>
                                    </div>
                                    <div style="flex: 1; min-width: 150px;">
                                        <div style="font-size: 12px; font-weight: 500; color: #6E6E73; text-transform: uppercase; margin-bottom: 4px;">Subject</div>
                                        <div style="font-size: 16px; font-weight: 600; color: #151515;">${data.subject}</div>
                                    </div>
                                    <div style="flex: 1; min-width: 150px;">
                                        <div style="font-size: 12px; font-weight: 500; color: #6E6E73; text-transform: uppercase; margin-bottom: 4px;">Submitted</div>
                                        <div style="font-size: 14px; font-weight: 500; color: #6E6E73;">${formatTimestamp(data.submittedAt)}</div>
                                    </div>
                                </div>
                            </div>
                        </td>
                    </tr>

                    <!-- Contact Details -->
                    <tr>
                        <td style="padding: 0 40px 32px;">
                            <h3 style="margin: 0 0 20px; font-size: 18px; font-weight: 600; color: #151515; border-bottom: 2px solid #E4E4E4; padding-bottom: 8px;">
                                Contact Information
                            </h3>
                            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                <tr>
                                    <td width="120" style="padding: 12px 0; vertical-align: top;">
                                        <strong style="color: #6E6E73; font-size: 14px;">Email:</strong>
                                    </td>
                                    <td style="padding: 12px 0;">
                                        <a href="mailto:${data.email}" style="color: #17619C; text-decoration: none; font-weight: 500;">${data.email}</a>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0; vertical-align: top;">
                                        <strong style="color: #6E6E73; font-size: 14px;">Phone:</strong>
                                    </td>
                                    <td style="padding: 12px 0;">
                                        <a href="tel:${data.phone}" style="color: #17619C; text-decoration: none; font-weight: 500;">${formatPhoneForDisplay(data.phone)}</a>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0; vertical-align: top;">
                                        <strong style="color: #6E6E73; font-size: 14px;">Preferred Contact:</strong>
                                    </td>
                                    <td style="padding: 12px 0;">
                                        <span style="background-color: #E9F7FE; color: #17619C; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 500; text-transform: capitalize;">
                                            ${data.preferredContact || 'No preference'}
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Message Content -->
                    <tr>
                        <td style="padding: 0 40px 32px;">
                            <h3 style="margin: 0 0 20px; font-size: 18px; font-weight: 600; color: #151515; border-bottom: 2px solid #E4E4E4; padding-bottom: 8px;">
                                Customer Message
                            </h3>
                            <div style="background-color: #FAFAFA; border-radius: 8px; padding: 24px; border-left: 4px solid #3BE8B0;">
                                <p style="margin: 0; font-size: 16px; color: #2A2B2E; line-height: 1.6; white-space: pre-wrap;">${data.message}</p>
                            </div>
                        </td>
                    </tr>

                    <!-- Action Buttons -->
                    <tr>
                        <td style="padding: 0 40px 40px;">
                            <h3 style="margin: 0 0 20px; font-size: 18px; font-weight: 600; color: #151515;">Recommended Actions</h3>
                            <div style="text-align: center;">
                                <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                                    <tr>
                                        <td style="padding: 0 8px 12px 0;">
                                            <a href="mailto:${data.email}?subject=Re: ${data.subject}" style="display: inline-block; background-color: #CE635E; color: white; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; transition: background-color 0.3s;">
                                                📧 Respond via Email
                                            </a>
                                        </td>
                                        <td style="padding: 0 8px 12px 0;">
                                            <a href="tel:${data.phone}" style="display: inline-block; background-color: #17619C; color: white; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                                                📞 Call Customer
                                            </a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colspan="2" style="padding-top: 12px;">
                                            <a href="https://d200k2wsaf8th3.amplifyapp.com/admin/requests/${data.submissionId}" style="display: inline-block; background-color: #2A2B2E; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                                                🔍 View in Admin Dashboard
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #151515; padding: 32px 40px; text-align: center;">
                            <p style="margin: 0; font-size: 14px; color: #FFFFFF; line-height: 1.5;">
                                <strong>RealTechee Internal Notification System</strong><br>
                                This is an automated notification for internal staff use only.<br>
                                <span style="color: #6E6E73;">Please respond to customer inquiries within 24 hours.</span>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

    const text = `
NEW CONTACT INQUIRY - REALTECHEE
${urgencyLabel}

Customer: ${data.name}
Email: ${data.email}
Phone: ${formatPhoneForDisplay(data.phone)}
Subject: ${data.subject}
Submitted: ${formatTimestamp(data.submittedAt)}
ID: ${data.submissionId}

MESSAGE:
${data.message}

ACTIONS:
- Email: ${data.email}
- Call: ${data.phone}
- Admin: https://d200k2wsaf8th3.amplifyapp.com/admin/requests/${data.submissionId}

RealTechee Internal Notification System
Respond within 24 hours.
    `;

    return { subject, html, text };
  },

  sms: (data: ContactFormData) => {
    const urgencyIndicator = data.urgency === 'high' ? '🔴' : data.urgency === 'medium' ? '🟡' : '';
    const testIndicator = data.testData ? '[TEST] ' : '';
    
    return `${testIndicator}${urgencyIndicator}RealTechee: New contact inquiry from ${data.name} - "${data.subject}". Email: ${data.email}, Phone: ${data.phone}. View: https://d200k2wsaf8th3.amplifyapp.com/admin/requests/${data.submissionId}`;
  }
};