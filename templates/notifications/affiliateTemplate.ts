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
interface AffiliateFormData {
  formType: string;
  submissionId: string;
  submittedAt: string;
  testData?: boolean;
  leadSource?: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  serviceType: string;
  businessLicense?: string;
  insurance?: boolean;
  bonded?: boolean;
  yearsInBusiness?: string;
  serviceAreas?: string[];
  certifications?: string[];
  portfolio?: string;
}

export const affiliateTemplate = {
  email: (data: AffiliateFormData) => {
    const testDataBadge = data.testData ? `
      <div style="background-color: #FFB900; color: #151515; padding: 8px 16px; border-radius: 6px; font-weight: 600; text-align: center; margin-bottom: 24px;">
        ⚠️ TEST DATA - E2E Testing Session
      </div>` : '';

    const subject = `${data.testData ? '[TEST] ' : ''}New Service Provider Application - ${data.companyName}`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Service Provider Application - RealTechee</title>
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
                        <td style="padding: ${testDataBadge ? '24px' : '40px'} 40px 32px; background: linear-gradient(135deg, #F0F9F5 0%, #FFFFFF 100%);">
                            <div style="display: flex; align-items: center; margin-bottom: 16px;">
                                <div style="background-color: #3BE8B0; color: #151515; padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 600; margin-right: 12px;">
                                    🤝 SERVICE PROVIDER
                                </div>
                                <div style="background-color: #E4E4E4; color: #6E6E73; padding: 8px 16px; border-radius: 6px; font-size: 12px; font-weight: 500;">
                                    ID: ${data.submissionId}
                                </div>
                            </div>
                            <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #151515; line-height: 1.2;">
                                🔧 New Service Provider Application
                            </h1>
                            <p style="margin: 12px 0 0; font-size: 16px; color: #6E6E73; line-height: 1.5;">
                                A service provider has applied to join our affiliate network for partnership opportunities.
                            </p>
                        </td>
                    </tr>

                    <!-- Summary Section -->
                    <tr>
                        <td style="padding: 0 40px 32px;">
                            <div style="background-color: #F0F9F5; border-radius: 8px; padding: 24px; border-left: 4px solid #3BE8B0;">
                                <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #151515;">Company Profile</h2>
                                <div style="display: flex; flex-wrap: wrap; gap: 16px;">
                                    <div style="flex: 1; min-width: 200px;">
                                        <div style="font-size: 12px; font-weight: 500; color: #6E6E73; text-transform: uppercase; margin-bottom: 4px;">Company Name</div>
                                        <div style="font-size: 16px; font-weight: 600; color: #151515;">${data.companyName}</div>
                                    </div>
                                    <div style="flex: 1; min-width: 150px;">
                                        <div style="font-size: 12px; font-weight: 500; color: #6E6E73; text-transform: uppercase; margin-bottom: 4px;">Service Type</div>
                                        <div style="font-size: 16px; font-weight: 600; color: #151515;">${data.serviceType}</div>
                                    </div>
                                    <div style="flex: 1; min-width: 150px;">
                                        <div style="font-size: 12px; font-weight: 500; color: #6E6E73; text-transform: uppercase; margin-bottom: 4px;">Applied</div>
                                        <div style="font-size: 14px; font-weight: 500; color: #6E6E73;">${formatTimestamp(data.submittedAt)}</div>
                                    </div>
                                </div>
                            </div>
                        </td>
                    </tr>

                    <!-- Contact & Business Details -->
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
                                                <strong style="color: #6E6E73; font-size: 14px;">Contact:</strong>
                                            </td>
                                            <td style="padding: 8px 0;">
                                                <span style="color: #2A2B2E; font-weight: 500;">${data.contactName}</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px 0; vertical-align: top;">
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

                                <!-- Business Details -->
                                <div style="flex: 1; min-width: 250px;">
                                    <h3 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #151515; border-bottom: 2px solid #E4E4E4; padding-bottom: 8px;">
                                        Business Details
                                    </h3>
                                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                        <tr>
                                            <td width="80" style="padding: 8px 0; vertical-align: top;">
                                                <strong style="color: #6E6E73; font-size: 14px;">License:</strong>
                                            </td>
                                            <td style="padding: 8px 0;">
                                                <span style="color: #2A2B2E; font-weight: 500;">${data.businessLicense || 'Not provided'}</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px 0; vertical-align: top;">
                                                <strong style="color: #6E6E73; font-size: 14px;">Experience:</strong>
                                            </td>
                                            <td style="padding: 8px 0;">
                                                <span style="color: #2A2B2E; font-weight: 500;">${data.yearsInBusiness || 'Not provided'}</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px 0; vertical-align: top;">
                                                <strong style="color: #6E6E73; font-size: 14px;">Insured:</strong>
                                            </td>
                                            <td style="padding: 8px 0;">
                                                <span style="background-color: ${data.insurance ? '#E8F5E8' : '#FFF2F2'}; color: ${data.insurance ? '#2D5016' : '#D63384'}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
                                                    ${data.insurance ? '✅ YES' : '❌ NO'}
                                                </span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px 0; vertical-align: top;">
                                                <strong style="color: #6E6E73; font-size: 14px;">Bonded:</strong>
                                            </td>
                                            <td style="padding: 8px 0;">
                                                <span style="background-color: ${data.bonded ? '#E8F5E8' : '#FFF2F2'}; color: ${data.bonded ? '#2D5016' : '#D63384'}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
                                                    ${data.bonded ? '✅ YES' : '❌ NO'}
                                                </span>
                                            </td>
                                        </tr>
                                    </table>
                                </div>
                            </div>
                        </td>
                    </tr>

                    <!-- Service Profile -->
                    <tr>
                        <td style="padding: 0 40px 32px;">
                            <h3 style="margin: 0 0 20px; font-size: 18px; font-weight: 600; color: #151515; border-bottom: 2px solid #E4E4E4; padding-bottom: 8px;">
                                Service Profile
                            </h3>
                            
                            ${data.serviceAreas && data.serviceAreas.length > 0 ? `
                            <div style="margin-bottom: 20px;">
                                <div style="font-size: 14px; font-weight: 600; color: #6E6E73; margin-bottom: 8px;">SERVICE AREAS</div>
                                <div>
                                    ${data.serviceAreas.map(area => `
                                        <span style="background-color: #F0F9F5; color: #3BE8B0; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; margin-right: 8px; margin-bottom: 4px; display: inline-block;">
                                            📍 ${area}
                                        </span>
                                    `).join('')}
                                </div>
                            </div>` : ''}

                            ${data.certifications && data.certifications.length > 0 ? `
                            <div style="margin-bottom: 20px;">
                                <div style="font-size: 14px; font-weight: 600; color: #6E6E73; margin-bottom: 8px;">CERTIFICATIONS</div>
                                <div>
                                    ${data.certifications.map(cert => `
                                        <span style="background-color: #FFF4E6; color: #FFB900; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; margin-right: 8px; margin-bottom: 4px; display: inline-block;">
                                            🏆 ${cert}
                                        </span>
                                    `).join('')}
                                </div>
                            </div>` : ''}

                            <!-- Credentials Summary -->
                            <div style="background-color: #FAFAFA; border-radius: 8px; padding: 20px; border-left: 4px solid #3BE8B0;">
                                <div style="font-size: 14px; font-weight: 600; color: #6E6E73; margin-bottom: 12px;">CREDENTIALS VERIFICATION</div>
                                <div style="display: flex; gap: 16px; flex-wrap: wrap;">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <span style="width: 20px; height: 20px; background-color: ${data.insurance ? '#3BE8B0' : '#E9664A'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">
                                            ${data.insurance ? '✓' : '✗'}
                                        </span>
                                        <span style="font-size: 14px; color: #2A2B2E;">Insurance Coverage</span>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <span style="width: 20px; height: 20px; background-color: ${data.bonded ? '#3BE8B0' : '#E9664A'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">
                                            ${data.bonded ? '✓' : '✗'}
                                        </span>
                                        <span style="font-size: 14px; color: #2A2B2E;">Bonded Status</span>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <span style="width: 20px; height: 20px; background-color: ${data.businessLicense ? '#3BE8B0' : '#E9664A'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">
                                            ${data.businessLicense ? '✓' : '✗'}
                                        </span>
                                        <span style="font-size: 14px; color: #2A2B2E;">Business License</span>
                                    </div>
                                </div>
                            </div>

                            ${data.portfolio ? `
                            <div style="margin-top: 20px;">
                                <div style="font-size: 14px; font-weight: 600; color: #6E6E73; margin-bottom: 8px;">PORTFOLIO/WEBSITE</div>
                                <div style="background-color: #E9F7FE; border-radius: 8px; padding: 16px;">
                                    <a href="${data.portfolio}" target="_blank" style="color: #17619C; text-decoration: none; font-weight: 500; word-break: break-all;">
                                        🔗 ${data.portfolio}
                                    </a>
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
                                            <a href="mailto:${data.email}?subject=RealTechee Service Provider Partnership - Next Steps" style="display: inline-block; background-color: #3BE8B0; color: #151515; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                                                ✅ Approve Partnership
                                            </a>
                                        </td>
                                        <td style="padding: 0 8px 12px 0;">
                                            <a href="tel:${data.phone}" style="display: inline-block; background-color: #17619C; color: white; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                                                📞 Schedule Onboarding
                                            </a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 0 8px 12px 0;">
                                            <a href="mailto:${data.email}?subject=RealTechee Service Provider Application - Credential Verification" style="display: inline-block; background-color: #FFB900; color: #151515; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                                                🔍 Verify Credentials
                                            </a>
                                        </td>
                                        <td style="padding: 0 8px 12px 0;">
                                            <a href="https://d200k2wsaf8th3.amplifyapp.com/admin/affiliates/${data.submissionId}" style="display: inline-block; background-color: #2A2B2E; color: white; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                                                📋 Full Review
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
                                <strong>RealTechee Service Provider Network</strong><br>
                                This is an automated notification for the partnerships team.<br>
                                <span style="color: #6E6E73;">Please review applications within 72 hours and verify credentials.</span>
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
NEW SERVICE PROVIDER APPLICATION - REALTECHEE
🤝 SERVICE PROVIDER

Company: ${data.companyName}
Contact: ${data.contactName}
Email: ${data.email}
Phone: ${formatPhoneForDisplay(data.phone)}
Service Type: ${data.serviceType}
License: ${data.businessLicense || 'Not provided'}
Experience: ${data.yearsInBusiness || 'Not provided'}
Insured: ${data.insurance ? 'Yes' : 'No'}
Bonded: ${data.bonded ? 'Yes' : 'No'}
Submitted: ${formatTimestamp(data.submittedAt)}
ID: ${data.submissionId}

SERVICE AREAS: ${data.serviceAreas ? data.serviceAreas.join(', ') : 'None listed'}
CERTIFICATIONS: ${data.certifications ? data.certifications.join(', ') : 'None listed'}
PORTFOLIO: ${data.portfolio || 'Not provided'}

ACTIONS:
- Email: ${data.email}
- Call: ${data.phone}
- Review: https://d200k2wsaf8th3.amplifyapp.com/admin/affiliates/${data.submissionId}

RealTechee Service Provider Network
Review within 72 hours and verify credentials.
    `;

    return { subject, html, text };
  },

  sms: (data: AffiliateFormData) => {
    const testIndicator = data.testData ? '[TEST] ' : '';
    const credentialsStatus = [data.insurance ? 'Insured' : '', data.bonded ? 'Bonded' : '', data.businessLicense ? 'Licensed' : ''].filter(Boolean).join(', ') || 'Credentials pending';
    
    return `${testIndicator}🤝 RealTechee: New service provider "${data.companyName}" (${data.serviceType}). Contact: ${data.contactName}. Status: ${credentialsStatus}. Review: https://d200k2wsaf8th3.amplifyapp.com/admin/affiliates/${data.submissionId}`;
  }
};