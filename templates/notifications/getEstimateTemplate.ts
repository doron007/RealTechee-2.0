/**
 * Enhanced Get Estimate Request notification template
 * Uses actual payload structure from production system
 * Includes comprehensive sections for all form data
 */

import { 
  formatTimestamp, 
  formatPhoneForDisplay, 
  getUrgencyColor, 
  getUrgencyLabel 
} from './utils';

// Enhanced type definition matching actual payload structure
export interface GetEstimateFormData {
  // Customer/Agent Information
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  
  agentFullName?: string;
  agentEmail?: string;
  agentPhone?: string;
  agentBrokerage?: string;
  
  // Homeowner Information  
  homeownerFullName?: string;
  homeownerEmail?: string;
  homeownerPhone?: string;
  
  // Property Details
  propertyAddress?: string;
  propertyStreetAddress?: string;
  propertyCity?: string;
  propertyState?: string;
  propertyZip?: string;
  
  // Project Information
  relationToProperty?: string;
  needFinance?: boolean;
  projectType?: string;
  projectMessage?: string;
  
  // Meeting Details
  meetingType?: string;
  meetingDateTime?: string;
  requestedVisitDateTime?: string;
  
  // File Attachments (JSON strings of S3 URLs)
  uploadedMedia?: string;
  uplodedDocuments?: string; // Note: typo in actual payload
  uploadedVideos?: string;
  
  // System Fields
  submissionId: string;
  submissionTimestamp: string;
  dashboardUrl?: string;
  urgency?: 'low' | 'medium' | 'high';
  
  // Test data identification
  testData?: boolean;
  leadSource?: string;
}

// Fixed file links with absolute URLs and proper encoding for email clients
export const fileLinks = (jsonUrls?: string, type?: string): string => {
  if (!jsonUrls) return '';
  
  try {
    const urls = JSON.parse(jsonUrls);
    if (!Array.isArray(urls) || urls.length === 0) return '';
    
    const typeLabels = {
      images: 'Images',
      documents: 'Documents', 
      videos: 'Videos'
    };
    
    const typeIcons = {
      images: '🖼️',
      documents: '📄',
      videos: '🎥'
    };
    
    const typeLabel = typeLabels[type as keyof typeof typeLabels] || 'Files';
    const typeIcon = typeIcons[type as keyof typeof typeIcons] || '📎';
    
    if (urls.length === 0) return '';
    
    let html = `<div style="margin-bottom: 16px;">`;
    html += `<div style="font-size: 14px; font-weight: 600; color: #6b7280; margin-bottom: 8px;">${typeIcon} ${typeLabel} (${urls.length})</div>`;
    
    urls.forEach((url: string, index: number) => {
      // Convert relative URLs to absolute URLs for email clients
      const absoluteUrl = url.startsWith('http') ? url : `https://d200k2wsaf8th3.amplifyapp.com${url}`;
      const fileName = url.split('/').pop() || `File ${index + 1}`;
      const cleanFileName = fileName.split('-').slice(1).join('-') || fileName;
      
      html += `<div style="margin: 8px 0;">`;
      html += `<a href="${absoluteUrl}" target="_blank" style="display: inline-block; color: #2563eb; text-decoration: none; background-color: #eff6ff; padding: 12px 16px; border-radius: 6px; font-size: 16px; font-weight: 500; min-height: 44px; box-sizing: border-box; line-height: 1.2; border: 1px solid #bfdbfe;">`;
      html += `${typeIcon} ${cleanFileName}`;
      html += `</a>`;
      html += `</div>`;
    });
    
    html += `</div>`;
    return html;
  } catch (error) {
    return '';
  }
};

export const getEstimateTemplate = {
  email: (data: GetEstimateFormData) => {
    const urgencyColor = getUrgencyColor(data.urgency);
    const urgencyLabel = getUrgencyLabel(data.urgency);
    const testDataBadge = data.testData ? `
      <div style="background-color: #FFB900; color: #151515; padding: 8px 16px; border-radius: 6px; font-weight: 600; text-align: center; margin-bottom: 24px;">
        ⚠️ TEST DATA - E2E Testing Session
      </div>` : '';

    // Helper function to check if agent info is different from customer
    const hasAgentInfo = data.agentFullName && data.agentFullName !== data.customerName;
    const hasHomeownerInfo = data.homeownerFullName && data.homeownerFullName !== data.customerName;
    
    // Format meeting date
    const meetingDate = data.meetingDateTime || data.requestedVisitDateTime;
    const formattedMeetingDate = meetingDate ? formatTimestamp(meetingDate) : 'Not scheduled';
    
    // Format address for subject
    const addressForSubject = data.propertyAddress || `${data.propertyStreetAddress}, ${data.propertyCity}, ${data.propertyState} ${data.propertyZip}`;
    
    // Format submission date for subject and body
    const submissionDate = formatTimestamp(data.submissionTimestamp);

    const subject = `${data.testData ? '[TEST] ' : ''}New Estimate Request - ${addressForSubject} - ${submissionDate}`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Estimate Request - RealTechee</title>
    <style>
        /* Enhanced iPhone mobile optimization */
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; max-width: 100% !important; }
            .content { padding: 16px !important; }
            .section-padding { padding: 0 16px 20px !important; }
            .button-stack { 
                display: block !important; 
                margin: 10px 0 !important; 
                width: 100% !important;
                text-align: center !important;
                box-sizing: border-box !important;
            }
            .flex-container { flex-direction: column !important; }
            .flex-item { min-width: 100% !important; margin-bottom: 16px !important; }
            /* iPhone-specific text size adjustments */
            .mobile-text { font-size: 16px !important; line-height: 1.4 !important; }
            .mobile-small-text { font-size: 14px !important; }
            /* Enhanced touch targets */
            .mobile-button {
                min-height: 44px !important;
                padding: 14px 20px !important;
                font-size: 16px !important;
            }
        }
        
        /* Dark mode support for iOS */
        @media (prefers-color-scheme: dark) {
            .dark-mode-bg { background-color: #1f2937 !important; }
            .dark-mode-text { color: #f9fafb !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #1f2937; background-color: #f8fafc;">
    <div style="max-width: 100%; background-color: #f8fafc; padding: 20px 0;">
        <div class="container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); overflow: hidden;">
                    
            <!-- Header -->
            <div style="background-color: #111827; padding: 20px; text-align: center;">
                <h1 style="margin: 0; color: #FFFFFF; font-size: 24px; font-weight: 700;">RealTechee</h1>
            </div>

            <!-- Test Data Badge -->
            ${testDataBadge ? `<div class="content" style="padding: 16px 24px 0;">${testDataBadge}</div>` : ''}

            <!-- Alert Section -->
            <div class="content" style="padding: ${testDataBadge ? '16px' : '24px'} 24px; background-color: #f8fafc;">
                <div style="margin-bottom: 12px;">
                    <span style="background-color: ${urgencyColor}; color: white; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; margin-right: 8px;">
                        ${urgencyLabel}
                    </span>
                    <span style="background-color: #e5e7eb; color: #6b7280; padding: 6px 12px; border-radius: 4px; font-size: 11px; font-weight: 500;">
                        ID: ${data.submissionId}
                    </span>
                </div>
                <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: #111827; line-height: 1.2;">
                    New Estimate Request
                </h1>
                <p class="mobile-text" style="margin: 0; font-size: 14px; color: #6b7280;">
                    Submitted ${submissionDate} • ${data.projectType || 'General Renovation'}
                </p>
            </div>

            <!-- Quick Summary -->
            <div class="section-padding" style="padding: 0 24px 24px;">
                <div style="background-color: #f3f4f6; border-radius: 6px; padding: 16px; border-left: 3px solid ${urgencyColor};">
                    <div class="flex-container" style="display: flex; flex-wrap: wrap; gap: 16px;">
                        <div class="flex-item" style="flex: 1; min-width: 180px;">
                            <div style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Customer</div>
                            <div class="mobile-text" style="font-size: 14px; font-weight: 600; color: #111827;">${data.customerName}</div>
                            <div class="mobile-small-text" style="font-size: 12px; color: #6b7280;">${data.customerEmail}</div>
                        </div>
                        <div class="flex-item" style="flex: 1; min-width: 120px;">
                            <div style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Property</div>
                            <div class="mobile-text" style="font-size: 13px; font-weight: 500; color: #111827; line-height: 1.3;">${addressForSubject}</div>
                        </div>
                        <div class="flex-item" style="flex: 1; min-width: 100px;">
                            <div style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Urgency</div>
                            <div style="font-size: 12px; font-weight: 500; color: #111827;">${data.urgency || 'Standard'}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Customer Contact Details -->
            <div class="section-padding" style="padding: 0 24px 24px;">
                <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #111827;">
                    Customer Information
                </h3>
                <div style="background-color: #f9fafb; border-radius: 6px; padding: 16px; border: 1px solid #e5e7eb;">
                    <div style="margin-bottom: 12px;">
                        <div style="font-size: 12px; font-weight: 500; color: #6b7280; margin-bottom: 2px;">Name</div>
                        <div style="font-size: 14px; font-weight: 600; color: #111827;">${data.customerName}</div>
                    </div>
                    <div style="margin-bottom: 12px;">
                        <div style="font-size: 12px; font-weight: 500; color: #6b7280; margin-bottom: 2px;">Email</div>
                        <a href="mailto:${data.customerEmail}" style="color: #2563eb; text-decoration: none; font-size: 14px; font-weight: 500;">${data.customerEmail}</a>
                    </div>
                    ${data.customerPhone ? `
                    <div style="margin-bottom: 12px;">
                        <div style="font-size: 12px; font-weight: 500; color: #6b7280; margin-bottom: 2px;">Phone</div>
                        <a href="tel:${data.customerPhone}" style="color: #2563eb; text-decoration: none; font-size: 14px; font-weight: 500;">${formatPhoneForDisplay(data.customerPhone)}</a>
                    </div>
                    ` : ''}
                    ${data.relationToProperty ? `
                    <div style="margin-bottom: 0;">
                        <div style="font-size: 12px; font-weight: 500; color: #6b7280; margin-bottom: 2px;">Relation to Property</div>
                        <span style="background-color: #dbeafe; color: #1d4ed8; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">
                            ${data.relationToProperty}
                        </span>
                    </div>
                    ` : ''}
                </div>
            </div>

            ${hasAgentInfo ? `
            <!-- Agent Information -->
            <div class="section-padding" style="padding: 0 24px 24px;">
                <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #111827;">
                    Agent Information
                </h3>
                <div style="background-color: #eff6ff; border-radius: 6px; padding: 16px; border: 1px solid #bfdbfe;">
                    <div style="margin-bottom: 12px;">
                        <div style="font-size: 12px; font-weight: 500; color: #6b7280; margin-bottom: 2px;">Agent</div>
                        <div style="font-size: 14px; font-weight: 600; color: #111827;">${data.agentFullName}</div>
                    </div>
                    ${data.agentEmail ? `
                    <div style="margin-bottom: 12px;">
                        <div style="font-size: 12px; font-weight: 500; color: #6b7280; margin-bottom: 2px;">Email</div>
                        <a href="mailto:${data.agentEmail}" style="color: #2563eb; text-decoration: none; font-size: 14px; font-weight: 500;">${data.agentEmail}</a>
                    </div>
                    ` : ''}
                    ${data.agentPhone ? `
                    <div style="margin-bottom: 12px;">
                        <div style="font-size: 12px; font-weight: 500; color: #6b7280; margin-bottom: 2px;">Phone</div>
                        <a href="tel:${data.agentPhone}" style="color: #2563eb; text-decoration: none; font-size: 14px; font-weight: 500;">${formatPhoneForDisplay(data.agentPhone)}</a>
                    </div>
                    ` : ''}
                    ${data.agentBrokerage ? `
                    <div style="margin-bottom: 0;">
                        <div style="font-size: 12px; font-weight: 500; color: #6b7280; margin-bottom: 2px;">Brokerage</div>
                        <div style="font-size: 14px; font-weight: 500; color: #111827;">${data.agentBrokerage}</div>
                    </div>
                    ` : ''}
                </div>
            </div>
            ` : ''}

            ${hasHomeownerInfo ? `
            <!-- Homeowner Information -->
            <div class="section-padding" style="padding: 0 24px 24px;">
                <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #111827;">
                    Homeowner Information
                </h3>
                <div style="background-color: #f0fdf4; border-radius: 6px; padding: 16px; border: 1px solid #bbf7d0;">
                    <div style="margin-bottom: 12px;">
                        <div style="font-size: 12px; font-weight: 500; color: #6b7280; margin-bottom: 2px;">Homeowner</div>
                        <div style="font-size: 14px; font-weight: 600; color: #111827;">${data.homeownerFullName}</div>
                    </div>
                    ${data.homeownerEmail ? `
                    <div style="margin-bottom: 12px;">
                        <div style="font-size: 12px; font-weight: 500; color: #6b7280; margin-bottom: 2px;">Email</div>
                        <a href="mailto:${data.homeownerEmail}" style="color: #2563eb; text-decoration: none; font-size: 14px; font-weight: 500;">${data.homeownerEmail}</a>
                    </div>
                    ` : ''}
                    ${data.homeownerPhone ? `
                    <div style="margin-bottom: 0;">
                        <div style="font-size: 12px; font-weight: 500; color: #6b7280; margin-bottom: 2px;">Phone</div>
                        <a href="tel:${data.homeownerPhone}" style="color: #2563eb; text-decoration: none; font-size: 14px; font-weight: 500;">${formatPhoneForDisplay(data.homeownerPhone)}</a>
                    </div>
                    ` : ''}
                </div>
            </div>
            ` : ''}

            <!-- Property Details -->
            <div class="section-padding" style="padding: 0 24px 24px;">
                <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #111827;">
                    Property Information
                </h3>
                <div style="background-color: #fefce8; border-radius: 6px; padding: 16px; border: 1px solid #fde047; border-left: 3px solid #eab308;">
                    ${data.propertyAddress ? `
                    <div style="margin-bottom: 0;">
                        <div style="font-size: 12px; font-weight: 500; color: #6b7280; margin-bottom: 2px;">Address</div>
                        <div style="font-size: 14px; font-weight: 600; color: #111827; line-height: 1.4;">${data.propertyAddress}</div>
                    </div>
                    ` : ''}
                    ${data.propertyStreetAddress && !data.propertyAddress ? `
                    <div style="margin-bottom: 12px;">
                        <div style="font-size: 12px; font-weight: 500; color: #6b7280; margin-bottom: 2px;">Street Address</div>
                        <div style="font-size: 14px; font-weight: 600; color: #111827;">${data.propertyStreetAddress}</div>
                    </div>
                    <div style="margin-bottom: 0;">
                        <div style="font-size: 12px; font-weight: 500; color: #6b7280; margin-bottom: 2px;">City, State ZIP</div>
                        <div style="font-size: 14px; font-weight: 500; color: #111827;">${data.propertyCity}, ${data.propertyState} ${data.propertyZip}</div>
                    </div>
                    ` : ''}
                </div>
            </div>

            <!-- Project Details -->
            <div class="section-padding" style="padding: 0 24px 24px;">
                <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #111827;">
                    Project Details
                </h3>
                <div style="background-color: #f8fafc; border-radius: 6px; padding: 16px; border: 1px solid #e2e8f0;">
                    <div class="flex-container" style="display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 12px;">
                        ${data.projectType ? `
                        <div class="flex-item" style="flex: 1; min-width: 140px;">
                            <div style="font-size: 12px; font-weight: 500; color: #6b7280; margin-bottom: 2px;">Project Type</div>
                            <span style="background-color: #dbeafe; color: #1d4ed8; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">
                                ${data.projectType}
                            </span>
                        </div>
                        ` : ''}
                        <div class="flex-item" style="flex: 1; min-width: 120px;">
                            <div style="font-size: 12px; font-weight: 500; color: #6b7280; margin-bottom: 2px;">Financing</div>
                            <span style="background-color: ${data.needFinance ? '#dcfce7' : '#fee2e2'}; color: ${data.needFinance ? '#166534' : '#991b1b'}; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">
                                ${data.needFinance ? 'Required' : 'Not needed'}
                            </span>
                        </div>
                        ${data.urgency ? `
                        <div class="flex-item" style="flex: 1; min-width: 100px;">
                            <div style="font-size: 12px; font-weight: 500; color: #6b7280; margin-bottom: 2px;">Urgency</div>
                            <span style="background-color: ${data.urgency === 'high' ? '#fee2e2' : data.urgency === 'medium' ? '#fef3c7' : '#d1fae5'}; color: ${data.urgency === 'high' ? '#991b1b' : data.urgency === 'medium' ? '#92400e' : '#166534'}; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 500;">
                                ${data.urgency}
                            </span>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>

            ${data.projectMessage ? `
            <!-- Project Description -->
            <div class="section-padding" style="padding: 0 24px 24px;">
                <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #111827;">
                    Project Description
                </h3>
                <div style="background-color: #f0fdfa; border-radius: 6px; padding: 16px; border-left: 3px solid #14b8a6;">
                    <p style="margin: 0; font-size: 14px; color: #111827; line-height: 1.5; white-space: pre-wrap;">${data.projectMessage}</p>
                </div>
            </div>
            ` : ''}

            <!-- Meeting Information -->
            <div class="section-padding" style="padding: 0 24px 24px;">
                <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #111827;">
                    Meeting Details
                </h3>
                <div style="background-color: #eff6ff; border-radius: 6px; padding: 16px; border-left: 3px solid #2563eb;">
                    ${data.meetingType ? `
                    <div style="margin-bottom: 12px;">
                        <div style="font-size: 12px; font-weight: 500; color: #6b7280; margin-bottom: 2px;">Meeting Type</div>
                        <span style="background-color: #dbeafe; color: #1d4ed8; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 500;">
                            ${data.meetingType === 'upload' ? 'Pictures & video walkthrough' : 
                              data.meetingType === 'video-call' ? 'Video call' : 
                              data.meetingType === 'in-person' ? 'In-person home visit' : 
                              data.meetingType === 'true' ? 'In-person home visit' :
                              data.meetingType === 'false' ? 'Virtual consultation' :
                              data.meetingType || 'Virtual consultation'}
                        </span>
                    </div>
                    ` : ''}
                    <div style="margin-bottom: 0;">
                        <div style="font-size: 12px; font-weight: 500; color: #6b7280; margin-bottom: 2px;">Requested Date</div>
                        <div style="font-size: 14px; font-weight: 600; color: #111827;">${formattedMeetingDate}</div>
                    </div>
                </div>
            </div>

            <!-- File Attachments -->
            ${(data.uploadedMedia || data.uplodedDocuments || data.uploadedVideos) ? `
            <div class="section-padding" style="padding: 0 24px 24px;">
                <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #111827;">
                    Attached Files
                </h3>
                <div style="background-color: #f8fafc; border-radius: 6px; padding: 16px; border: 1px solid #e2e8f0;">
                    ${fileLinks(data.uploadedMedia, 'images')}
                    ${fileLinks(data.uplodedDocuments, 'documents')}
                    ${fileLinks(data.uploadedVideos, 'videos')}
                </div>
            </div>
            ` : ''}

            <!-- Action Buttons -->
            <div class="section-padding" style="padding: 0 24px 32px;">
                <h3 style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #111827;">Quick Actions</h3>
                <div style="text-align: center;">
                    <div style="margin-bottom: 16px;">
                        <a href="mailto:${data.customerEmail}?subject=Re: Estimate Request - ${data.propertyAddress || 'Property'}" class="button-stack mobile-button" style="display: inline-block; background-color: #dc2626; color: white; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 0 8px 12px 0; min-height: 44px; min-width: 200px; text-align: center; line-height: 1.2;">
                            📧 Reply to Customer
                        </a>
                        ${data.customerPhone ? `
                        <a href="tel:${data.customerPhone}" class="button-stack mobile-button" style="display: inline-block; background-color: #2563eb; color: white; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 0 8px 12px 0; min-height: 44px; min-width: 200px; text-align: center; line-height: 1.2;">
                            📞 Call Customer
                        </a>
                        ` : ''}
                    </div>
                    <div>
                        <a href="${data.dashboardUrl || `https://d200k2wsaf8th3.amplifyapp.com/admin/requests/${data.submissionId}`}" class="mobile-button" style="display: inline-block; background-color: #111827; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; min-height: 44px; min-width: 250px; text-align: center; line-height: 1.2;">
                            🏠 View in Admin Dashboard
                        </a>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #111827; padding: 24px; text-align: center;">
                <p style="margin: 0; font-size: 13px; color: #ffffff; line-height: 1.4;">
                    <strong>RealTechee Estimate Request System</strong><br>
                    Internal notification • Respond within 24 hours
                </p>
            </div>
        </div>
    </div>
</body>
</html>`;

    const text = `
NEW ESTIMATE REQUEST - REALTECHEE
${urgencyLabel}

CUSTOMER: ${data.customerName}
Email: ${data.customerEmail}
${data.customerPhone ? `Phone: ${formatPhoneForDisplay(data.customerPhone)}` : ''}
${data.relationToProperty ? `Relation: ${data.relationToProperty}` : ''}

${hasAgentInfo ? `
AGENT: ${data.agentFullName}
${data.agentEmail ? `Email: ${data.agentEmail}` : ''}
${data.agentPhone ? `Phone: ${formatPhoneForDisplay(data.agentPhone)}` : ''}
${data.agentBrokerage ? `Brokerage: ${data.agentBrokerage}` : ''}
` : ''}

${hasHomeownerInfo ? `
HOMEOWNER: ${data.homeownerFullName}
${data.homeownerEmail ? `Email: ${data.homeownerEmail}` : ''}
${data.homeownerPhone ? `Phone: ${formatPhoneForDisplay(data.homeownerPhone)}` : ''}
` : ''}

PROPERTY: ${data.propertyAddress || `${data.propertyStreetAddress}, ${data.propertyCity}, ${data.propertyState} ${data.propertyZip}`}

PROJECT DETAILS:
Type: ${data.projectType || 'General Renovation'}
Financing: ${data.needFinance ? 'Required' : 'Not needed'}
Meeting: ${data.meetingType === 'in-person' ? 'In-Person Visit' : 'Virtual'} - ${formattedMeetingDate}

${data.projectMessage ? `DESCRIPTION:
${data.projectMessage}

` : ''}SUBMISSION INFO:
ID: ${data.submissionId}
Submitted: ${formatTimestamp(data.submissionTimestamp)}

ACTIONS:
- Reply: ${data.customerEmail}
${data.customerPhone ? `- Call: ${data.customerPhone}` : ''}
- Dashboard: ${data.dashboardUrl || `https://d200k2wsaf8th3.amplifyapp.com/admin/requests/${data.submissionId}`}

RealTechee Estimate Team
Respond within 24 hours.
    `;

    return { subject, html, text };
  },

  sms: (data: GetEstimateFormData) => {
    const urgencyIndicator = data.urgency === 'high' ? '🔴' : data.urgency === 'medium' ? '🟡' : '';
    const testIndicator = data.testData ? '[TEST] ' : '';
    const financeIndicator = data.needFinance ? '💰' : '';
    const meetingIndicator = data.meetingType === 'upload' ? '📸' : 
                            data.meetingType === 'video-call' ? '💻' : 
                            data.meetingType === 'in-person' ? '🏠' : '💻';
    
    return `${testIndicator}${urgencyIndicator}RealTechee: New estimate from ${data.customerName} ${financeIndicator}${meetingIndicator} ${data.projectType || 'Renovation'} - ${data.propertyAddress || 'Property'}. Contact: ${data.customerEmail}${data.customerPhone ? `, ${data.customerPhone}` : ''}. View: ${data.dashboardUrl || `https://d200k2wsaf8th3.amplifyapp.com/admin/requests/${data.submissionId}`}`;
  }
};