/**
 * Shared Handlebars Helpers
 * Used by both Live Preview and Lambda processor for identical template rendering
 */

// Date formatting helper with robust error handling
export const formatDate = (dateValue: any): string => {
  if (!dateValue) return '';
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return '';
    
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.warn('formatDate error:', error);
    return '';
  }
};

// Phone formatting helper with validation
export const formatPhone = (phoneValue: any): string => {
  if (!phoneValue) return '';
  
  try {
    const cleaned = phoneValue.toString().replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned[0] === '1') {
      return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phoneValue.toString();
  } catch (error) {
    console.warn('formatPhone error:', error);
    return phoneValue?.toString() || '';
  }
};

// Urgency color helper
export const getUrgencyColor = (urgency: any): string => {
  const urgencyLevel = urgency?.toString().toLowerCase() || '';
  switch (urgencyLevel) {
    case 'high': return '#ef4444';
    case 'medium': return '#f59e0b';
    case 'low': return '#10b981';
    default: return '#6b7280';
  }
};

// Urgency label helper (missing from Live Preview)
export const getUrgencyLabel = (urgency: any): string => {
  const urgencyLevel = urgency?.toString().toLowerCase() || '';
  switch (urgencyLevel) {
    case 'high': return '🔴 HIGH';
    case 'medium': return '🟡 MEDIUM';
    case 'low': return '🟢 LOW';
    default: return '';
  }
};

// Yes/No helper with robust handling
export const yesNo = (value: any): string => {
  if (value === null || value === undefined) return 'No';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string') {
    const normalized = value.toLowerCase().trim();
    return ['true', 'yes', '1', 'on'].includes(normalized) ? 'Yes' : 'No';
  }
  return value ? 'Yes' : 'No';
};

// File links helper with error handling
export const fileLinks = (filesValue: any): string => {
  if (!filesValue) return '';
  
  try {
    let files: string[] = [];
    
    if (typeof filesValue === 'string') {
      files = JSON.parse(filesValue);
    } else if (Array.isArray(filesValue)) {
      files = filesValue;
    }
    
    if (!Array.isArray(files) || files.length === 0) return '';
    
    return files.map(fileUrl => {
      const fileName = fileUrl.split('/').pop() || 'file';
      const fileExt = fileName.split('.').pop()?.toLowerCase() || '';
      
      // Basic file type detection
      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt);
      const icon = isImage ? '🖼️' : '📄';
      
      return `<a href="${fileUrl}" target="_blank" style="display: inline-block; margin: 4px; padding: 8px 12px; background: #f3f4f6; border-radius: 8px; text-decoration: none; color: #374151;">${icon} ${fileName}</a>`;
    }).join(' ');
  } catch (error) {
    console.warn('fileLinks error:', error);
    return '';
  }
};

// Default value helper (missing from Live Preview)
export const defaultValue = (value: any, fallback: string = ''): string => {
  return (value !== null && value !== undefined && value !== '') ? value.toString() : fallback;
};

// Equality helper (missing from Live Preview)
export const eq = (a: any, b: any): boolean => {
  return a === b;
};

// Join helper (missing from Live Preview)
export const join = (array: any, separator: string = ', '): string => {
  if (!Array.isArray(array)) return '';
  return array.filter(Boolean).join(separator);
};

// Parse JSON helper (missing from Live Preview)
export const parseJson = (jsonString: any): any => {
  if (!jsonString) return {};
  try {
    return typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
  } catch (error) {
    console.warn('parseJson error:', error);
    return {};
  }
};

// Encode URI helper (missing from Live Preview)
export const encodeURI = (value: any): string => {
  if (!value) return '';
  try {
    return encodeURIComponent(value.toString());
  } catch (error) {
    console.warn('encodeURI error:', error);
    return value?.toString() || '';
  }
};

// Register all helpers with a Handlebars instance
export const registerHelpers = (Handlebars: any) => {
  Handlebars.registerHelper('formatDate', formatDate);
  Handlebars.registerHelper('formatPhone', formatPhone);
  Handlebars.registerHelper('getUrgencyColor', getUrgencyColor);
  Handlebars.registerHelper('getUrgencyLabel', getUrgencyLabel);
  Handlebars.registerHelper('yesNo', yesNo);
  Handlebars.registerHelper('fileLinks', fileLinks);
  Handlebars.registerHelper('default', defaultValue);
  Handlebars.registerHelper('eq', eq);
  Handlebars.registerHelper('join', join);
  Handlebars.registerHelper('parseJson', parseJson);
  Handlebars.registerHelper('encodeURI', encodeURI);
  
  // Register conditional helpers
  Handlebars.registerHelper('if', function(this: any, conditional: any, options: any) {
    if (conditional) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  });
  
  Handlebars.registerHelper('unless', function(this: any, conditional: any, options: any) {
    if (!conditional) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  });
};

export default {
  formatDate,
  formatPhone,
  getUrgencyColor,
  getUrgencyLabel,
  yesNo,
  fileLinks,
  defaultValue,
  eq,
  join,
  parseJson,
  encodeURI,
  registerHelpers
};