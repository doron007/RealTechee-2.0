import React, { useState, useEffect } from 'react';
import { H3, H4, P2, P3 } from '../../typography';
import Button from '../../common/buttons/Button';
import { projectManagerService, type ProjectManager, type MeetingDetails } from '../../../services/projectManagerService';
import { meetingNotificationService, type MeetingNotificationPayload } from '../../../services/meetingNotificationService';
import { taskManagementService } from '../../../services/taskManagementService';
import { requestsAPI, contactsAPI } from '../../../utils/amplifyAPI';

interface MeetingSchedulerProps {
  requestId: string;
  currentMeetingData?: {
    requestedVisitDateTime?: string;
    visitDate?: string;
    virtualWalkthrough?: string;
  };
  contactInfo?: {
    homeownerContactId?: string;
    agentContactId?: string;
    propertyAddress?: string;
  };
  onMeetingScheduled?: (meetingDetails: MeetingDetails) => void;
  disabled?: boolean;
}

const MeetingScheduler: React.FC<MeetingSchedulerProps> = ({
  requestId,
  currentMeetingData,
  contactInfo,
  onMeetingScheduled,
  disabled = false,
}) => {
  const [projectManagers, setProjectManagers] = useState<ProjectManager[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [meetingDetails, setMeetingDetails] = useState<MeetingDetails>(() => {
    // Initialize with current data if available
    const visitDate = currentMeetingData?.visitDate ? new Date(currentMeetingData.visitDate) : null;
    const requestedDateTime = currentMeetingData?.requestedVisitDateTime ? new Date(currentMeetingData.requestedVisitDateTime) : null;
    
    return {
      meetingDate: visitDate?.toISOString().split('T')[0] || requestedDateTime?.toISOString().split('T')[0] || '',
      meetingTime: visitDate?.toTimeString().slice(0, 5) || requestedDateTime?.toTimeString().slice(0, 5) || '',
      meetingType: currentMeetingData?.virtualWalkthrough === 'Yes' ? 'virtual' : 
                   currentMeetingData?.virtualWalkthrough === 'No' ? 'in-person' : 'hybrid',
      meetingLocation: '',
      assignedPM: '',
      meetingNotes: '',
    };
  });

  useEffect(() => {
    loadProjectManagers();
  }, []);

  const loadProjectManagers = async () => {
    try {
      setLoading(true);
      const pms = await projectManagerService.getAvailableProjectManagers();
      setProjectManagers(pms);
    } catch (error) {
      console.error('Error loading project managers:', error);
      setError('Failed to load project managers');
    } finally {
      setLoading(false);
    }
  };

  const handleMeetingDetailChange = (field: keyof MeetingDetails, value: string) => {
    setMeetingDetails(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateAndSaveMeeting = async () => {
    try {
      setSaving(true);
      setError('');

      // Validate required fields
      if (!meetingDetails.meetingDate || !meetingDetails.meetingTime) {
        setError('Meeting date and time are required');
        return;
      }

      // Validate meeting date/time business rules
      const meetingDateTime = `${meetingDetails.meetingDate}T${meetingDetails.meetingTime}`;
      const validation = projectManagerService.validateMeetingDateTime(meetingDateTime);
      
      if (!validation.valid) {
        setError(validation.message || 'Invalid meeting date/time');
        return;
      }

      // Validate PM assignment if provided
      if (meetingDetails.assignedPM) {
        const isValidPM = await projectManagerService.validatePMAssignment(meetingDetails.assignedPM, meetingDateTime);
        if (!isValidPM) {
          setError('Selected project manager is not available');
          return;
        }
      }

      // Update the request with meeting information
      const visitDateTime = new Date(`${meetingDetails.meetingDate}T${meetingDetails.meetingTime}`);
      const updateData = {
        visitDate: visitDateTime.toISOString(),
        virtualWalkthrough: meetingDetails.meetingType === 'virtual' ? 'Yes' : 
                           meetingDetails.meetingType === 'in-person' ? 'No' : 'Either',
        // Store PM assignment and notes in existing fields
        officeNotes: meetingDetails.meetingNotes ? 
          `Meeting scheduled for ${visitDateTime.toLocaleDateString()} at ${visitDateTime.toLocaleTimeString()}. ` +
          `Type: ${meetingDetails.meetingType}. ` +
          `${meetingDetails.meetingLocation ? `Location: ${meetingDetails.meetingLocation}. ` : ''}` +
          `${meetingDetails.assignedPM ? `PM: ${meetingDetails.assignedPM}. ` : ''}` +
          `Notes: ${meetingDetails.meetingNotes}` : undefined,
      };

      const result = await requestsAPI.update(requestId, updateData);
      
      if (!result.success) {
        throw new Error('Failed to save meeting details');
      }

      // Send meeting confirmation notifications
      await sendMeetingNotifications(meetingDetails, visitDateTime);

      // Create PM tasks if a project manager is assigned
      if (meetingDetails.assignedPM) {
        await createProjectManagerTasks(meetingDetails);
      }

      // Call the callback if provided
      if (onMeetingScheduled) {
        onMeetingScheduled(meetingDetails);
      }

    } catch (error) {
      console.error('Error saving meeting:', error);
      setError(error instanceof Error ? error.message : 'Failed to save meeting');
    } finally {
      setSaving(false);
    }
  };

  const sendMeetingNotifications = async (meetingDetails: MeetingDetails, visitDateTime: Date) => {
    try {
      // Get contact information for notifications
      const contactData = await getContactsForNotification();
      
      const notificationPayload: MeetingNotificationPayload = {
        requestId,
        meetingDate: visitDateTime.toLocaleDateString(),
        meetingTime: visitDateTime.toLocaleTimeString(),
        meetingType: meetingDetails.meetingType || 'in-person',
        meetingLocation: meetingDetails.meetingLocation,
        assignedPM: meetingDetails.assignedPM,
        contactName: contactData.homeownerName,
        contactEmail: contactData.homeownerEmail,
        contactPhone: contactData.homeownerPhone,
        agentName: contactData.agentName,
        agentEmail: contactData.agentEmail,
        propertyAddress: contactInfo?.propertyAddress,
      };

      await meetingNotificationService.sendMeetingConfirmation(notificationPayload);
    } catch (error) {
      console.error('Error sending meeting notifications:', error);
      // Don't throw - meeting was saved successfully, notifications are secondary
    }
  };

  const getContactsForNotification = async () => {
    const contactData = {
      homeownerName: '',
      homeownerEmail: '',
      homeownerPhone: '',
      agentName: '',
      agentEmail: '',
    };

    try {
      // Get homeowner contact
      if (contactInfo?.homeownerContactId) {
        const homeownerResult = await contactsAPI.get(contactInfo.homeownerContactId);
        if (homeownerResult.success && homeownerResult.data) {
          contactData.homeownerName = homeownerResult.data.fullName || '';
          contactData.homeownerEmail = homeownerResult.data.email || '';
          contactData.homeownerPhone = homeownerResult.data.phone || homeownerResult.data.mobile || '';
        }
      }

      // Get agent contact
      if (contactInfo?.agentContactId) {
        const agentResult = await contactsAPI.get(contactInfo.agentContactId);
        if (agentResult.success && agentResult.data) {
          contactData.agentName = agentResult.data.fullName || '';
          contactData.agentEmail = agentResult.data.email || '';
        }
      }
    } catch (error) {
      console.error('Error getting contact data for notifications:', error);
    }

    return contactData;
  };

  const createProjectManagerTasks = async (meetingDetails: MeetingDetails) => {
    try {
      if (!meetingDetails.assignedPM) return;

      const tasks = await taskManagementService.createMeetingAssignmentTasks(
        requestId,
        meetingDetails,
        meetingDetails.assignedPM
      );

      console.log(`Created ${tasks.length} tasks for PM ${meetingDetails.assignedPM}`);
    } catch (error) {
      console.error('Error creating PM tasks:', error);
      // Don't throw - meeting was saved successfully, tasks are secondary
    }
  };

  const generateCalendarFile = () => {
    try {
      if (!meetingDetails.meetingDate || !meetingDetails.meetingTime) {
        setError('Meeting date and time are required for calendar export');
        return;
      }

      const icsContent = projectManagerService.generateCalendarEvent({
        ...meetingDetails,
        requestId,
        contactName: 'Property Owner', // Could be enhanced with actual contact name
      });

      // Create and download the ICS file
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `meeting-${requestId.slice(0, 8)}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating calendar file:', error);
      setError('Failed to generate calendar file');
    }
  };

  const businessHours = projectManagerService.getBusinessHours();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <H3 className="mb-4">Meeting Scheduling & Project Manager Assignment</H3>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <P3 className="text-red-700">{error}</P3>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Meeting Date */}
        <div>
          <label className="block">
            <P3 className="font-medium text-gray-700 mb-1">Meeting Date *</P3>
            <input
              type="date"
              value={meetingDetails.meetingDate}
              onChange={(e) => handleMeetingDetailChange('meetingDate', e.target.value)}
              disabled={disabled || saving}
              min={new Date().toISOString().split('T')[0]}
              max={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </label>
        </div>

        {/* Meeting Time */}
        <div>
          <label className="block">
            <P3 className="font-medium text-gray-700 mb-1">
              Meeting Time * (Business Hours: {businessHours.start}-{businessHours.end})
            </P3>
            <input
              type="time"
              value={meetingDetails.meetingTime}
              onChange={(e) => handleMeetingDetailChange('meetingTime', e.target.value)}
              disabled={disabled || saving}
              min={businessHours.start}
              max={businessHours.end}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </label>
        </div>

        {/* Meeting Type */}
        <div>
          <label className="block">
            <P3 className="font-medium text-gray-700 mb-1">Meeting Type</P3>
            <select
              value={meetingDetails.meetingType}
              onChange={(e) => handleMeetingDetailChange('meetingType', e.target.value)}
              disabled={disabled || saving}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="in-person">In-Person</option>
              <option value="virtual">Virtual</option>
              <option value="hybrid">Hybrid (Flexible)</option>
            </select>
          </label>
        </div>

        {/* Project Manager Assignment */}
        <div>
          <label className="block">
            <P3 className="font-medium text-gray-700 mb-1">
              Assigned Project Manager {loading && '(Loading...)'}
            </P3>
            <select
              value={meetingDetails.assignedPM}
              onChange={(e) => handleMeetingDetailChange('assignedPM', e.target.value)}
              disabled={disabled || saving || loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Select Project Manager...</option>
              {projectManagers.map((pm) => (
                <option key={pm.id} value={pm.name}>
                  {pm.name} {pm.email ? `(${pm.email})` : ''}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Meeting Location (for in-person/hybrid) */}
        {(meetingDetails.meetingType === 'in-person' || meetingDetails.meetingType === 'hybrid') && (
          <div className="md:col-span-2">
            <label className="block">
              <P3 className="font-medium text-gray-700 mb-1">Meeting Location</P3>
              <input
                type="text"
                value={meetingDetails.meetingLocation}
                onChange={(e) => handleMeetingDetailChange('meetingLocation', e.target.value)}
                disabled={disabled || saving}
                placeholder="Enter property address or meeting location"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </label>
          </div>
        )}

        {/* Meeting Notes */}
        <div className="md:col-span-2">
          <label className="block">
            <P3 className="font-medium text-gray-700 mb-1">Meeting Notes</P3>
            <textarea
              value={meetingDetails.meetingNotes}
              onChange={(e) => handleMeetingDetailChange('meetingNotes', e.target.value)}
              disabled={disabled || saving}
              rows={3}
              placeholder="Additional notes or special instructions for the meeting"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </label>
        </div>
      </div>

      {/* Current Meeting Info Display */}
      {currentMeetingData?.requestedVisitDateTime && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <H4 className="mb-2">Customer Requested Meeting</H4>
          <P2 className="text-gray-600">
            {new Date(currentMeetingData.requestedVisitDateTime).toLocaleDateString()} at{' '}
            {new Date(currentMeetingData.requestedVisitDateTime).toLocaleTimeString()}
          </P2>
          {currentMeetingData.virtualWalkthrough && (
            <P3 className="text-gray-500 mt-1">
              Virtual walkthrough preference: {currentMeetingData.virtualWalkthrough}
            </P3>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 mt-6">
        <Button
          onClick={validateAndSaveMeeting}
          disabled={disabled || saving || !meetingDetails.meetingDate || !meetingDetails.meetingTime}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:bg-gray-400"
        >
          {saving ? 'Saving...' : 'Schedule Meeting'}
        </Button>

        <Button
          onClick={generateCalendarFile}
          disabled={disabled || !meetingDetails.meetingDate || !meetingDetails.meetingTime}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md disabled:bg-gray-400"
        >
          Export to Calendar
        </Button>
      </div>

      {/* Business Rules Info */}
      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <P3 className="text-gray-600">
          <strong>Business Rules:</strong> Meetings can be scheduled Monday-Friday, {businessHours.start}-{businessHours.end}, 
          up to 90 days in advance. Project managers will be notified automatically.
        </P3>
      </div>
    </div>
  );
};

export default MeetingScheduler;