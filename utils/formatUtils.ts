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
