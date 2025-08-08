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

// Type definition
interface GetQualifiedFormData {
  formType: string;
  submissionId: string;
  submittedAt: string;
  testData?: boolean;
  leadSource?: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber?: string;
  brokerage?: string;
  yearsExperience?: string;
  specialties?: string[];
  marketAreas?: string[];
  currentVolume?: string;
  goals?: string;
}

export const getQualifiedTemplate = {
  email: (data: GetQualifiedFormData) => {
    const testDataBadge = data.testData ? `
      <div style="background-color: #FFB900; color: #151515; padding: 8px 16px; border-radius: 6px; font-weight: 600; text-align: center; margin-bottom: 24px;">
        ⚠️ TEST DATA - E2E Testing Session
      </div>` : '';

    const subject = `${data.testData ? '[TEST] ' : ''}New Agent Qualification Application - ${data.name}`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Agent Application - RealTechee</title>
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
                        <td style="padding: ${testDataBadge ? '24px' : '40px'} 40px 32px; background: linear-gradient(135deg, #E9F7FE 0%, #FFFFFF 100%);">
                            <div style="display: flex; align-items: center; margin-bottom: 16px;">
                                <div style="background-color: #17619C; color: white; padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 600; margin-right: 12px;">
                                    🏆 AGENT QUALIFICATION
                                </div>
                                <div style="background-color: #E4E4E4; color: #6E6E73; padding: 8px 16px; border-radius: 6px; font-size: 12px; font-weight: 500;">
                                    ID: ${data.submissionId}
                                </div>
                            </div>
                            <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #151515; line-height: 1.2;">
                                🎯 New Agent Qualification Application
                            </h1>
                            <p style="margin: 12px 0 0; font-size: 16px; color: #6E6E73; line-height: 1.5;">
                                A real estate professional has applied to join our qualified agent network.
                            </p>
                        </td>
                    </tr>

                    <!-- Summary Section -->
                    <tr>
                        <td style="padding: 0 40px 32px;">
                            <div style="background-color: #E9F7FE; border-radius: 8px; padding: 24px; border-left: 4px solid #17619C;">
                                <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #151515;">Applicant Profile</h2>
                                <div style="display: flex; flex-wrap: wrap; gap: 16px;">
                                    <div style="flex: 1; min-width: 200px;">
                                        <div style="font-size: 12px; font-weight: 500; color: #6E6E73; text-transform: uppercase; margin-bottom: 4px;">Agent Name</div>
                                        <div style="font-size: 16px; font-weight: 600; color: #151515;">${data.name}</div>
                                    </div>
                                    <div style="flex: 1; min-width: 150px;">
                                        <div style="font-size: 12px; font-weight: 500; color: #6E6E73; text-transform: uppercase; margin-bottom: 4px;">Experience</div>
                                        <div style="font-size: 16px; font-weight: 600; color: #151515;">${data.yearsExperience || 'Not specified'}</div>
                                    </div>
                                    <div style="flex: 1; min-width: 150px;">
                                        <div style="font-size: 12px; font-weight: 500; color: #6E6E73; text-transform: uppercase; margin-bottom: 4px;">Applied</div>
                                        <div style="font-size: 14px; font-weight: 500; color: #6E6E73;">${formatTimestamp(data.submittedAt)}</div>
                                    </div>
                                </div>
                            </div>
                        </td>
                    </tr>

                    <!-- Contact & License Details -->
                    <tr>
                        <td style="padding: 0 40px 32px;">
                            <div style="display: flex; gap: 24px; flex-wrap: wrap;">
                                <!-- Contact Information -->
                                <div style="flex: 1; min-width: 250px;">
                                    <h3 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #151515; border-bottom: 2px solid #E4E4E4; padding-bottom: 8px;">
                                        Contact Information
                                    </h3>
                                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                        <tr>
                                            <td width="80" style="padding: 8px 0; vertical-align: top;">
                                                <strong style="color: #6E6E73; font-size: 14px;">Email:</strong>
                                            </td>
                                            <td style="padding: 8px 0;">
                                                <a href="mailto:${data.email}" style="color: #17619C; text-decoration: none; font-weight: 500;">${data.email}</a>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px 0; vertical-align: top;">
                                                <strong style="color: #6E6E73; font-size: 14px;">Phone:</strong>
                                            </td>
                                            <td style="padding: 8px 0;">
                                                <a href="tel:${data.phone}" style="color: #17619C; text-decoration: none; font-weight: 500;">${formatPhoneForDisplay(data.phone)}</a>
                                            </td>
                                        </tr>
                                    </table>
                                </div>

                                <!-- Professional Details -->
                                <div style="flex: 1; min-width: 250px;">
                                    <h3 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #151515; border-bottom: 2px solid #E4E4E4; padding-bottom: 8px;">
                                        Professional Details
                                    </h3>
                                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                        <tr>
                                            <td width="80" style="padding: 8px 0; vertical-align: top;">
                                                <strong style="color: #6E6E73; font-size: 14px;">License:</strong>
                                            </td>
                                            <td style="padding: 8px 0;">
                                                <span style="color: #2A2B2E; font-weight: 500;">${data.licenseNumber || 'Not provided'}</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px 0; vertical-align: top;">
                                                <strong style="color: #6E6E73; font-size: 14px;">Brokerage:</strong>
                                            </td>
                                            <td style="padding: 8px 0;">
                                                <span style="color: #2A2B2E; font-weight: 500;">${data.brokerage || 'Not provided'}</span>
                                            </td>
                                        </tr>
                                    </table>
                                </div>
                            </div>
                        </td>
                    </tr>

                    <!-- Professional Profile -->
                    <tr>
                        <td style="padding: 0 40px 32px;">
                            <h3 style="margin: 0 0 20px; font-size: 18px; font-weight: 600; color: #151515; border-bottom: 2px solid #E4E4E4; padding-bottom: 8px;">
                                Professional Profile
                            </h3>
                            
                            ${data.specialties && data.specialties.length > 0 ? `
                            <div style="margin-bottom: 20px;">
                                <div style="font-size: 14px; font-weight: 600; color: #6E6E73; margin-bottom: 8px;">SPECIALTIES</div>
                                <div>
                                    ${data.specialties.map(specialty => `
                                        <span style="background-color: #E9F7FE; color: #17619C; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; margin-right: 8px; margin-bottom: 4px; display: inline-block;">
                                            ${specialty}
                                        </span>
                                    `).join('')}
                                </div>
                            </div>` : ''}

                            ${data.marketAreas && data.marketAreas.length > 0 ? `
                            <div style="margin-bottom: 20px;">
                                <div style="font-size: 14px; font-weight: 600; color: #6E6E73; margin-bottom: 8px;">MARKET AREAS</div>
                                <div>
                                    ${data.marketAreas.map(area => `
                                        <span style="background-color: #F0F9F5; color: #3BE8B0; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; margin-right: 8px; margin-bottom: 4px; display: inline-block;">
                                            📍 ${area}
                                        </span>
                                    `).join('')}
                                </div>
                            </div>` : ''}

                            <div style="display: flex; gap: 24px; flex-wrap: wrap;">
                                <div style="flex: 1; min-width: 200px;">
                                    <div style="font-size: 14px; font-weight: 600; color: #6E6E73; margin-bottom: 8px;">CURRENT VOLUME</div>
                                    <div style="background-color: #FFF4E6; color: #FFB900; padding: 12px; border-radius: 8px; font-weight: 600; text-align: center;">
                                        ${data.currentVolume || 'Not specified'}
                                    </div>
                                </div>
                            </div>

                            ${data.goals ? `
                            <div style="margin-top: 20px;">
                                <div style="font-size: 14px; font-weight: 600; color: #6E6E73; margin-bottom: 8px;">GOALS & OBJECTIVES</div>
                                <div style="background-color: #FAFAFA; border-radius: 8px; padding: 16px; border-left: 4px solid #3BE8B0;">
                                    <p style="margin: 0; font-size: 15px; color: #2A2B2E; line-height: 1.5; white-space: pre-wrap;">${data.goals}</p>
                                </div>
                            </div>` : ''}
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
                                            <a href="mailto:${data.email}?subject=RealTechee Agent Qualification - Next Steps" style="display: inline-block; background-color: #17619C; color: white; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                                                ✅ Approve Application
                                            </a>
                                        </td>
                                        <td style="padding: 0 8px 12px 0;">
                                            <a href="tel:${data.phone}" style="display: inline-block; background-color: #CE635E; color: white; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                                                📞 Schedule Interview
                                            </a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colspan="2" style="padding-top: 12px;">
                                            <a href="https://d200k2wsaf8th3.amplifyapp.com/admin/agents/${data.submissionId}" style="display: inline-block; background-color: #2A2B2E; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                                                🔍 Review Full Application
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
                                <strong>RealTechee Agent Qualification System</strong><br>
                                This is an automated notification for the recruitment team.<br>
                                <span style="color: #6E6E73;">Please review applications within 48 hours.</span>
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
NEW AGENT QUALIFICATION APPLICATION - REALTECHEE
🏆 AGENT QUALIFICATION

Applicant: ${data.name}
Email: ${data.email}
Phone: ${formatPhoneForDisplay(data.phone)}
Experience: ${data.yearsExperience || 'Not specified'}
License: ${data.licenseNumber || 'Not provided'}
Brokerage: ${data.brokerage || 'Not provided'}
Current Volume: ${data.currentVolume || 'Not specified'}
Submitted: ${formatTimestamp(data.submittedAt)}
ID: ${data.submissionId}

SPECIALTIES: ${data.specialties ? data.specialties.join(', ') : 'None listed'}
MARKET AREAS: ${data.marketAreas ? data.marketAreas.join(', ') : 'None listed'}

GOALS:
${data.goals || 'No goals specified'}

ACTIONS:
- Email: ${data.email}
- Call: ${data.phone}
- Review: https://d200k2wsaf8th3.amplifyapp.com/admin/agents/${data.submissionId}

RealTechee Agent Qualification System
Review within 48 hours.
    `;

    return { subject, html, text };
  },

  sms: (data: GetQualifiedFormData) => {
    const testIndicator = data.testData ? '[TEST] ' : '';
    
    return `${testIndicator}🏆 RealTechee: New agent qualification from ${data.name} (${data.yearsExperience || 'unspecified'} years exp). License: ${data.licenseNumber || 'N/A'}. Review: https://d200k2wsaf8th3.amplifyapp.com/admin/agents/${data.submissionId}`;
  }
};