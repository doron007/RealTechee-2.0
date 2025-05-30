// Utility function to format currency values without decimals
export const formatCurrency = (value: string | undefined): string => {
  if (!value) return '0';
  // Convert to number, round to remove decimals, then format with commas
  return Math.round(parseFloat(value)).toLocaleString('en-US');
};

// Format phone number to (XXX) XXX-XXXX format
export const formatPhoneNumber = (phone: string = ''): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length !== 10) return phone; // Return original if not 10 digits
  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
};

interface FormatDateOptions {
  timeZone?: string;
  withTime?: boolean;
}

// Format date with optional timezone and time display
export const formatDate = (date: Date, options: FormatDateOptions = {}): string => {
  const { timeZone, withTime = false } = options;
  
  try {
    const formatOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...(withTime && {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      ...(timeZone && { timeZone })
    };

    return new Intl.DateTimeFormat('en-US', formatOptions).format(date);
  } catch (error) {
    console.warn('Error formatting date:', error);
    return date.toLocaleDateString();
  }
};
