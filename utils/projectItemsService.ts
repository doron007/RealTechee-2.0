import path from 'path';
import { readCsvFile } from './csvUtils';
import { ProjectMilestone, ProjectPayment, ProjectComment } from '../types/projectItems';

// Define paths to CSV files
const MILESTONES_CSV_PATH = path.join(process.cwd(), 'data', 'csv', 'ProjectMilestones.csv');
const PAYMENTS_CSV_PATH = path.join(process.cwd(), 'data', 'csv', 'ProjectPaymentTerms.csv');
const COMMENTS_CSV_PATH = path.join(process.cwd(), 'data', 'csv', 'ProjectComments.csv');

/**
 * Get all milestones for a project by projectID
 */
export async function getProjectMilestones(projectID: string): Promise<ProjectMilestone[]> {
  try {
    const milestones = readCsvFile<ProjectMilestone>(MILESTONES_CSV_PATH);
    return milestones.filter(milestone => milestone['Project ID'] === projectID)
      .sort((a, b) => {
        // Sort by order if available, otherwise by completion status
        if (a.Order !== undefined && b.Order !== undefined) {
          return a.Order - b.Order;
        }
        // Put completed items first
        return a['Is Complete'] === b['Is Complete'] ? 0 : a['Is Complete'] ? -1 : 1;
      });
  } catch (error) {
    console.error(`Error fetching milestones for project ${projectID}:`, error);
    return [];
  }
}

/**
 * Get all payments for a project by projectID
 */
export async function getProjectPayments(projectID: string): Promise<ProjectPayment[]> {
  try {
    const payments = readCsvFile<ProjectPayment>(PAYMENTS_CSV_PATH);
    return payments.filter(payment => payment.projectID === projectID)
      .sort((a, b) => {
        // Sort by order if available, otherwise by payment status
        if (a.Order !== undefined && b.Order !== undefined) {
          return a.Order - b.Order;
        }
        // Put paid items first
        return a.Paid === b.Paid ? 0 : a.Paid ? -1 : 1;
      });
  } catch (error) {
    console.error(`Error fetching payments for project ${projectID}:`, error);
    return [];
  }
}

/**
 * Get all comments for a project by projectID
 */
export async function getProjectComments(projectID: string): Promise<ProjectComment[]> {
  try {
    const comments = readCsvFile<ProjectComment>(COMMENTS_CSV_PATH);
    return comments.filter(comment => comment['Project ID'] === projectID)
      .sort((a, b) => {
        // Sort by creation date if available, newest first
        const dateA = a['Created Date'] ? new Date(a['Created Date']) : new Date(0);
        const dateB = b['Created Date'] ? new Date(b['Created Date']) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
  } catch (error) {
    console.error(`Error fetching comments for project ${projectID}:`, error);
    return [];
  }
}
