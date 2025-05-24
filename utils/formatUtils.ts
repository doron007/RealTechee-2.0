// Utility function to format currency values without decimals
export const formatCurrency = (value: string | undefined): string => {
  if (!value) return '0';
  // Convert to number, round to remove decimals, then format with commas
  return Math.round(parseFloat(value)).toLocaleString('en-US');
};
