import { PostConfirmationTriggerEvent } from 'aws-lambda';

export interface Contact {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  mobile?: string;
  company?: string;
  brokerage?: string;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LinkingResult {
  success: boolean;
  contactId?: string;
  isNewContact: boolean;
  assignedRole: string;
  explanation: string;
  error?: string;
}

export type PostConfirmationEvent = PostConfirmationTriggerEvent;

export interface NotificationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
}