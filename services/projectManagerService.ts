/**
 * Project Manager Assignment Service
 * Handles fetching available project managers and validating assignments
 */

import { contactsAPI } from '../utils/amplifyAPI';

export interface ProjectManager {
  id: string;
  name: string;
  email: string;
  phone?: string;
  mobile?: string;
  company?: string;
  availability?: 'available' | 'busy' | 'unavailable';
}

export interface MeetingDetails {
  meetingDate?: string;
  meetingTime?: string;
  meetingType?: 'in-person' | 'virtual' | 'hybrid';
  meetingLocation?: string;
  assignedPM?: string;
  meetingNotes?: string;
}

class ProjectManagerService {
  private static instance: ProjectManagerService;

  static getInstance(): ProjectManagerService {
    if (!ProjectManagerService.instance) {
      ProjectManagerService.instance = new ProjectManagerService();
    }
    return ProjectManagerService.instance;
  }

  /**
   * Get all available project managers from contacts
   * Filter by company or role criteria to identify PMs
   */
  async getAvailableProjectManagers(): Promise<ProjectManager[]> {
    try {
      const result = await contactsAPI.list();
      
      if (!result.success || !result.data) {
        console.error('Failed to fetch contacts for project managers');
        return [];
      }

      // Filter contacts that could be project managers
      // This is a business logic filter - adjust criteria as needed
      const projectManagers = result.data
        .filter((contact: any) => {
          // Filter criteria for identifying project managers:
          // 1. Has company/brokerage field (internal staff)
          // 2. Email contains certain keywords
          // 3. Or explicitly tagged as project manager
          
          const hasCompany = contact.company && contact.company.toLowerCase().includes('realtechee');
          const hasRoleInEmail = contact.email && (
            contact.email.toLowerCase().includes('pm') ||
            contact.email.toLowerCase().includes('project') ||
            contact.email.toLowerCase().includes('manager')
          );
          const hasRoleInName = contact.fullName && (
            contact.fullName.toLowerCase().includes('project manager') ||
            contact.fullName.toLowerCase().includes('pm')
          );

          return hasCompany || hasRoleInEmail || hasRoleInName;
        })
        .map((contact: any) => ({
          id: contact.id,
          name: contact.fullName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
          email: contact.email || '',
          phone: contact.phone,
          mobile: contact.mobile,
          company: contact.company,
          availability: 'available' as const, // Default to available, can be enhanced with scheduling logic
        }))
        .filter((pm: ProjectManager) => pm.name && pm.email); // Ensure we have minimum required fields

      return projectManagers;
    } catch (error) {
      console.error('Error fetching project managers:', error);
      return [];
    }
  }

  /**
   * Validate if a project manager is available for assignment
   */
  async validatePMAssignment(pmId: string, meetingDateTime?: string): Promise<boolean> {
    try {
      // Basic validation - check if PM exists
      const availablePMs = await this.getAvailableProjectManagers();
      const pm = availablePMs.find(p => p.id === pmId);
      
      if (!pm) {
        return false;
      }

      // TODO: Add more sophisticated availability checking
      // - Check calendar integration
      // - Check current workload
      // - Check time conflicts
      
      return true;
    } catch (error) {
      console.error('Error validating PM assignment:', error);
      return false;
    }
  }

  /**
   * Get business hours for meeting scheduling
   */
  getBusinessHours(): { start: string; end: string; days: number[] } {
    return {
      start: '09:00',
      end: '17:00', 
      days: [1, 2, 3, 4, 5], // Monday to Friday
    };
  }

  /**
   * Validate meeting date/time against business rules
   */
  validateMeetingDateTime(dateTime: string): { valid: boolean; message?: string } {
    const meetingDate = new Date(dateTime);
    const now = new Date();
    
    // Check if date is in the future
    if (meetingDate <= now) {
      return { valid: false, message: 'Meeting date must be in the future' };
    }
    
    // Check if date is within 90 days
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 90);
    if (meetingDate > maxDate) {
      return { valid: false, message: 'Meeting date cannot be more than 90 days in the future' };
    }
    
    // Check business hours
    const businessHours = this.getBusinessHours();
    const dayOfWeek = meetingDate.getDay();
    const timeString = meetingDate.toTimeString().slice(0, 5); // HH:MM format
    
    if (!businessHours.days.includes(dayOfWeek)) {
      return { valid: false, message: 'Meetings can only be scheduled on business days (Monday-Friday)' };
    }
    
    if (timeString < businessHours.start || timeString > businessHours.end) {
      return { valid: false, message: `Meetings can only be scheduled during business hours (${businessHours.start}-${businessHours.end})` };
    }
    
    return { valid: true };
  }

  /**
   * Generate calendar event (ICS format) for meeting
   */
  generateCalendarEvent(meetingDetails: MeetingDetails & { requestId: string; contactName?: string }): string {
    const { meetingDate, meetingTime, meetingType, meetingLocation, assignedPM, meetingNotes, requestId, contactName } = meetingDetails;
    
    if (!meetingDate || !meetingTime) {
      throw new Error('Meeting date and time are required for calendar event generation');
    }

    const startDateTime = new Date(`${meetingDate}T${meetingTime}`);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour meeting
    
    // Format dates for ICS (YYYYMMDDTHHMMSS)
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const startFormatted = formatDate(startDateTime);
    const endFormatted = formatDate(endDateTime);
    const now = formatDate(new Date());

    const summary = `Property Assessment Meeting - ${contactName || 'Request'} #${requestId.slice(0, 8)}`;
    const description = [
      `Meeting Type: ${meetingType || 'In-person'}`,
      `Request ID: ${requestId}`,
      meetingLocation ? `Location: ${meetingLocation}` : '',
      assignedPM ? `Project Manager: ${assignedPM}` : '',
      meetingNotes ? `Notes: ${meetingNotes}` : '',
    ].filter(Boolean).join('\\n');

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//RealTechee//Meeting Scheduler//EN',
      'BEGIN:VEVENT',
      `UID:meeting-${requestId}-${now}@realtechee.com`,
      `DTSTAMP:${now}`,
      `DTSTART:${startFormatted}`,
      `DTEND:${endFormatted}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      meetingLocation ? `LOCATION:${meetingLocation}` : '',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].filter(Boolean).join('\r\n');
  }
}

export const projectManagerService = ProjectManagerService.getInstance();