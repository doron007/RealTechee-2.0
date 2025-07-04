// Legacy format: format currency values without decimals (for backward compatibility)
export const formatCurrency = (value: string | undefined): string => {
  if (!value) return '0';
  // Convert to number, round to remove decimals, then format with commas
  return Math.round(parseFloat(value)).toLocaleString('en-US');
};

// Standard currency formatting with $ sign and decimals (project-wide standard)
export const formatCurrencyFull = (value?: number): string => {
  if (!value) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
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

// Format date with optional timezone and time display (can handle Date objects or date strings)
export const formatDate = (dateInput: Date | string, options: FormatDateOptions = {}): string => {
  const { timeZone, withTime = false } = options;
  
  // Handle both Date objects and date strings
  if (!dateInput) return 'N/A';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
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

// Format date as MM/DD/YYYY (common format for tables and forms)
export const formatDateShort = (dateInput?: Date | string): string => {
  if (!dateInput) return 'N/A';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  try {
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.warn('Error formatting date:', error);
    return 'N/A';
  }
};
