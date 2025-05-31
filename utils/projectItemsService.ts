import path from 'path';
import crypto from 'crypto';
import { readCsvWithFilter, CsvRow } from './csvParser';
import { appendToCSV } from './csvUtils';
import { ProjectMilestone, ProjectPayment, ProjectComment } from '../types/projectItems';
import { processImageGallery } from './serverWixMediaUtils';

// Define paths to CSV files
const MILESTONES_CSV_PATH = path.join(process.cwd(), 'data', 'csv', 'ProjectMilestones.csv');
const PAYMENTS_CSV_PATH = path.join(process.cwd(), 'data', 'csv', 'ProjectPaymentTerms.csv');
const COMMENTS_CSV_PATH = path.join(process.cwd(), 'data', 'csv', 'ProjectComments.csv');

interface ProjectService {
  getProjectMilestones(projectID: string): Promise<ProjectMilestone[]>;
  getProjectPayments(projectID: string): Promise<ProjectPayment[]>;
  getProjectComments(projectID: string): Promise<ProjectComment[]>;
}

// Required column order for ProjectComments.csv
const COMMENT_COLUMNS = [
  "Posted By",
  "Nickname",
  "Project ID", 
  "Files",
  "Comment",
  "Is Private",
  "Posted By Profile Image",
  "Add To Gallery",
  "ID",
  "Created Date", 
  "Updated Date",
  "Owner"
];

// Required comment fields
const REQUIRED_COMMENT_FIELDS = ['Project ID', 'Posted By', 'Nickname', 'Comment'];

/**
 * Parse date string to ISO format
 */
function parseDate(dateStr: string | undefined): string | undefined {
  if (!dateStr?.trim()) return undefined;
  
  try {
    // Try parsing as ISO date (e.g. "2023-10-16T01:10:19Z")
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      // Return in format YYYY-MM-DDTHH:mm:ssZ (without milliseconds)
      return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
    }
    
    // Try MM/DD/YYYY format
    const matches = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (matches) {
      const [_, month, day, year] = matches;
      const formatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00Z`;
      const parsed = new Date(formatted);
      if (!isNaN(parsed.getTime())) {
        // Return in format YYYY-MM-DDTHH:mm:ssZ (without milliseconds)
        return parsed.toISOString().replace(/\.\d{3}Z$/, 'Z');
      }
    }
    
    console.warn(`Unable to parse date: ${dateStr}`);
    return undefined;
  } catch (error) {
    console.warn(`Error parsing date ${dateStr}:`, error);
    return undefined;
  }
}

/**
 * Convert a CSV row to a strongly typed milestone object
 */
function convertToMilestone(row: CsvRow): ProjectMilestone | null {
  try {
    // Handle Order - clean and convert to number if present
    let order: number | undefined;
    if (row.Order) {
      order = Number(row.Order);
      if (isNaN(order)) order = undefined;
    }

    // Convert to milestone object with required type checking
    const milestone: ProjectMilestone = {
      ID: row.ID || '',
      'Project ID': row['Project ID'] || '',
      Name: row.Name || '',
      Description: row.Description,
      Order: order,
      'Is Complete': row['Is Complete']?.toLowerCase() === 'true',
      'Is Category': row['Is Category']?.toLowerCase() === 'true',
      'Is Internal': row['Is Internal']?.toLowerCase() === 'true',
      'Created Date': parseDate(row['Created Date']),
      'Updated Date': parseDate(row['Updated Date']),
      'Estimated Start': parseDate(row['Estimated Start']),
      'Estimated Finish': parseDate(row['Estimated Finish']),
      Owner: row.Owner
    };

    // Validate required fields
    if (!milestone.ID || !milestone['Project ID'] || !milestone.Name) {
      console.warn('Missing required milestone fields:', row);
      return null;
    }

    return milestone;
  } catch (error) {
    console.error('Error converting row to milestone:', error);
    return null;
  }
}

/**
 * Convert a CSV row to a strongly typed payment object
 */
function convertToPayment(row: CsvRow): ProjectPayment | null {
  try {
    // Handle Payment Amount - clean and convert to number
    const amountStr = row['Payment Amount']?.toString().replace(/['"]/g, '').trim();
    const amount = amountStr ? Number(amountStr) : 0;
    if (isNaN(amount)) {
      console.warn('Invalid payment amount:', row);
      return null;
    }

    // Handle Order - clean and convert to number if present
    let order: number | undefined;
    if (row.Order) {
      order = Number(row.Order);
      if (isNaN(order)) order = undefined;
    }

    // Convert to payment object with required type checking
    const payment: ProjectPayment = {
      ID: row.ID || '',
      projectID: row.projectID || '',
      PaymentName: row.PaymentName || '',
      'Payment Amount': amount,
      Description: row.Description,
      Order: order,
      Paid: row.Paid?.toLowerCase() === 'true',
      Type: row.Type,
      paymentDue: parseDate(row.paymentDue),
      'Parent Payment ID': row['Parent Payment ID'],
      'Is Category': row['Is Category']?.toLowerCase() === 'true',
      Internal: row.Internal?.toLowerCase() === 'true',
      'Created Date': parseDate(row['Created Date']),
      'Updated Date': parseDate(row['Updated Date']),
      Owner: row.Owner
    };

    // Validate required fields
    if (!payment.ID || !payment.projectID || !payment.PaymentName) {
      console.warn('Missing required payment fields:', row);
      return null;
    }

    return payment;
  } catch (error) {
    console.error('Error converting row to payment:', error);
    return null;
  }
}

function createSummaryRow(id: string, projectId: string, name: string, amount: number): ProjectPayment {
  return {
    ID: id,
    projectID: projectId,
    PaymentName: name,
    'Payment Amount': amount,
    Paid: false,
    isSummaryRow: true,
    'Created Date': new Date().toISOString(),
    'Updated Date': new Date().toISOString()
  };
}

/**
 * Convert a CSV row to a strongly typed comment object
 */
function convertToComment(row: CsvRow): ProjectComment | null {
  try {
    // Required fields
    const requiredFields = ['ID', 'Project ID', 'Posted By', 'Nickname', 'Comment'];
    for (const field of requiredFields) {
      if (!row[field]) {
        console.warn(`[Comment Service] Missing required field ${field} in row:`, row);
        return null;
      }
    }

    // Create comment object with strict field mapping
    const comment: ProjectComment = {
      ID: row.ID,
      'Project ID': row['Project ID'],
      'Posted By': row['Posted By'],
      Nickname: row.Nickname,
      Comment: row.Comment,
      // Handle optional fields with proper defaults
      'Is Private': typeof row['Is Private'] === 'string' ? row['Is Private'].toLowerCase() === 'true' : false,
      // Files field needs special handling due to potential complex data
      Files: (() => {
        // If no Files field or empty array string, return empty string
        if (!row.Files || row.Files === '[]') return '';
        // Otherwise keep the raw value for later processing
        return row.Files;
      })(),
      // Optional fields with undefined fallback
      'Posted By Profile Image': row['Posted By Profile Image'] || undefined,
      'Add To Gallery': row['Add To Gallery'] || undefined,
      // Dates with validation
      'Created Date': parseDate(row['Created Date']) || new Date().toISOString(),
      'Updated Date': parseDate(row['Updated Date']) || new Date().toISOString(),
      Owner: row.Owner || ''
    };

    return comment;
  } catch (error) {
    console.error('[Comment Service] Error converting row to comment:', error, 'Row:', row);
    return null;
  }
}

/**
 * Sanitize HTML content by removing all tags and script content
 */
function sanitizeHTML(html: string): string {
  // First remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  // Then remove all other HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  return sanitized;
}

/**
 * Create a new comment object with required fields in the correct order
 */
function createOrderedComment(data: Partial<ProjectComment>): Record<string, any> {
  // Generate required fields if not provided
  const now = new Date().toISOString();
  const comment: Record<string, any> = {
    'Posted By': data['Posted By'] || '',
    'Nickname': data.Nickname || '',
    'Project ID': data['Project ID'] || '',
    'Files': data.Files || '',  // Return empty string for Files
    'Comment': data.Comment ? sanitizeHTML(data.Comment) : '',
    'Is Private': data['Is Private'] ?? false,
    'Posted By Profile Image': data['Posted By Profile Image'] || undefined,
    'Add To Gallery': data['Add To Gallery'] || undefined,
    'ID': data.ID || crypto.randomUUID(),
    'Created Date': data['Created Date'] || now,
    'Updated Date': data['Updated Date'] || now,
    'Owner': data.Owner || undefined
  };

  // Ensure properties are in the correct order
  return COMMENT_COLUMNS.reduce((ordered, key) => {
    ordered[key] = comment[key];
    return ordered;
  }, {} as Record<string, any>);
}

/**
 * Project Items Service implementation
 */
class ProjectItemsService implements ProjectService {
  async getProjectMilestones(projectID: string): Promise<ProjectMilestone[]> {
    try {
      if (!projectID?.trim()) {
        console.error('getProjectMilestones: Invalid or empty projectID');
        return [];
      }

      console.log(`[Milestone Service] Reading milestones for project ${projectID}`);
      const startTime = Date.now();

      // Read and filter CSV rows for this project only
      const rows = await readCsvWithFilter(MILESTONES_CSV_PATH, 'Project ID', projectID);
      
      // Convert filtered rows to milestone objects
      const milestones = rows
        .map(convertToMilestone)
        .filter((m): m is ProjectMilestone => m !== null)
        .sort((a, b) => {
          // Sort by Order if available
          if (typeof a.Order === 'number' && typeof b.Order === 'number') {
            return a.Order - b.Order;
          }
          // Fall back to creation date
          const dateA = a['Created Date'] ? new Date(a['Created Date']) : new Date(0);
          const dateB = b['Created Date'] ? new Date(b['Created Date']) : new Date(0);
          return dateA.getTime() - dateB.getTime();
        });

      const duration = Date.now() - startTime;
      console.log(`[Milestone Service] Found ${milestones.length} milestones in ${duration}ms`);
      
      return milestones;
    } catch (error) {
      console.error(`[Milestone Service] Error fetching milestones for project ${projectID}:`, error);
      throw error;
    }
  }

  async getProjectPayments(projectID: string): Promise<ProjectPayment[]> {
    try {
      if (!projectID?.trim()) {
        console.error('getProjectPayments: Invalid or empty projectID');
        return [];
      }

      console.log(`[Payment Service] Reading payments for project ${projectID}`);
      const startTime = Date.now();

      // Read and filter CSV rows for this project only
      const rows = await readCsvWithFilter(PAYMENTS_CSV_PATH, 'projectID', projectID);
      
      // Convert filtered rows to payment objects
      const payments = rows
        .map(convertToPayment)
        .filter((p): p is ProjectPayment => p !== null)
        .sort((a, b) => {
          // Sort by Order if available
          if (typeof a.Order === 'number' && typeof b.Order === 'number') {
            return a.Order - b.Order;
          }
          // Fall back to creation date
          const dateA = a['Created Date'] ? new Date(a['Created Date']) : new Date(0);
          const dateB = b['Created Date'] ? new Date(b['Created Date']) : new Date(0);
          return dateA.getTime() - dateB.getTime();
        });

      // If we have payments, add summary rows
      if (payments.length > 0) {
        // Calculate totals
        const totalPaid = payments
          .filter(p => p.Paid)
          .reduce((sum, p) => sum + p['Payment Amount'], 0);

        const totalAmount = payments
          .reduce((sum, p) => sum + p['Payment Amount'], 0);

        // Add empty line, paid total, and balance rows
        payments.push(
          createSummaryRow(`${projectID}-empty`, projectID, '_'.repeat(50), 0),
          createSummaryRow(`${projectID}-paid`, projectID, `Paid: $${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, totalPaid),
          createSummaryRow(`${projectID}-balance`, projectID, `Balance: $${(totalAmount - totalPaid).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, totalAmount - totalPaid)
        );
      }

      const duration = Date.now() - startTime;
      console.log(`[Payment Service] Found ${payments.length} payments in ${duration}ms`);
      
      return payments;
    } catch (error) {
      console.error(`[Payment Service] Error fetching payments for project ${projectID}:`, error);
      throw error;
    }
  }

  async getProjectComments(projectID: string): Promise<ProjectComment[]> {
    try {
      if (!projectID?.trim()) {
        console.error('getProjectComments: Invalid or empty projectID');
        return [];
      }

      console.log(`[Comment Service] Reading comments for project ${projectID}`);
      console.log(`[Comment Service] CSV file path: ${COMMENTS_CSV_PATH}`);
      const startTime = Date.now();

      // Read and filter CSV rows for this project only
      console.log(`[Comment Service] Reading comments from ${COMMENTS_CSV_PATH}`);
      const rows = await readCsvWithFilter(COMMENTS_CSV_PATH, 'Project ID', projectID);
      console.log(`[Comment Service] Found ${rows.length} rows for project ${projectID}`);
      
      // Convert filtered rows to comment objects
      const comments = rows
        .map(convertToComment)
        .filter((c): c is ProjectComment => c !== null);

      // Process images on the server side for all comments
      const processedComments = await Promise.all(
        comments.map(async (comment) => {
          if (comment.Files && comment.Files !== '[]') {
            try {
              // Parse Files field as JSON if it's a JSON string
              let filesArray: string[] = [];
              if (typeof comment.Files === 'string') {
                try {
                  const parsedFiles = JSON.parse(comment.Files);
                  
                  // Handle both array of file objects and direct array of URLs
                  if (Array.isArray(parsedFiles)) {
                    filesArray = parsedFiles.map(file => {
                      // If file is an object with src, extract the src
                      if (file && typeof file === 'object' && 'src' in file) {
                        return (file as { src: string }).src || '';
                      }
                      // If file is a string, use it directly
                      return typeof file === 'string' ? file : '';
                    });
                  }
                } catch (parseError) {
                  console.warn(`[Comment Service] Error parsing Files JSON for comment ${comment.ID}:`, parseError);
                  // If it's not valid JSON, treat it as a single URL unless it looks like malformed JSON
                  filesArray = comment.Files.startsWith('[') ? [] : [comment.Files];
                }
              }

              // Filter out empty strings and process URLs
              const validUrls = filesArray.filter(url => url && url.length > 0);
              const processedUrls = await processImageGallery(validUrls);

              return {
                ...comment,
                images: processedUrls
              };
            } catch (error) {
              console.error(`[Comment Service] Error processing images for comment ${comment.ID}:`, error);
              return {
                ...comment,
                images: []
              };
            }
          }
          return {
            ...comment,
            images: []
          };
        })
      );

      // Sort by creation date, newest first
      processedComments.sort((a, b) => {
        const dateA = a['Created Date'] ? new Date(a['Created Date']) : new Date(0);
        const dateB = b['Created Date'] ? new Date(b['Created Date']) : new Date(0);
        return dateB.getTime() - dateA.getTime(); // Reverse chronological order
      });

      const duration = Date.now() - startTime;
      console.log(`[Comment Service] Processed ${rows.length} rows into ${processedComments.length} valid comments in ${duration}ms`);
      
      return processedComments;
    } catch (error) {
      console.error(`[Comment Service] Error fetching comments for project ${projectID}:`, error);
      throw error;
    }
  }

  /**
   * Add a new comment to the project
   */
  async addComment(comment: Partial<ProjectComment>): Promise<ProjectComment | null> {
    // Validate required fields
    for (const field of REQUIRED_COMMENT_FIELDS) {
      if (!comment[field as keyof ProjectComment]) {
        throw new Error('Missing required fields');
      }
    }

    const orderedComment = createOrderedComment(comment);

    // Validate image URLs if present
    if (comment.Files && typeof comment.Files === 'string') {
      orderedComment.Files = comment.Files.split(',')
        .map(url => url.trim())
        .filter(url => url.match(/^https?:\/\/.+/))
        .join(', ');
    }

    if (comment['Posted By Profile Image'] && !comment['Posted By Profile Image'].match(/^https?:\/\/.+/)) {
      orderedComment['Posted By Profile Image'] = '';
    }

    const success = await appendToCSV(COMMENTS_CSV_PATH, orderedComment);
    return success ? orderedComment as ProjectComment : null;
  }
}

// Export singleton instance
export const projectItemsService = new ProjectItemsService();
