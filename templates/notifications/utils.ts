/**
 * Utility functions for notification templates
 * Extracted to avoid circular dependencies
 */

export const formatPhoneForDisplay = (phone?: string): string => {
  if (!phone) return 'Not provided';
  // Basic phone formatting - can be enhanced
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

export const formatTimestamp = (timestamp: string): string => {
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

export const getUrgencyColor = (urgency?: string): string => {
  switch (urgency) {
    case 'high': return '#D11919'; // accent-red
    case 'medium': return '#FFB900'; // accent-yellow
    case 'low': return '#3BE8B0'; // accent-teal
    default: return '#17619C'; // accent-blue
  }
};

export const getUrgencyLabel = (urgency?: string): string => {
  switch (urgency) {
    case 'high': return '🔴 HIGH PRIORITY';
    case 'medium': return '🟡 MEDIUM PRIORITY';
    case 'low': return '🟢 LOW PRIORITY';
    default: return '🔵 STANDARD';
  }
};