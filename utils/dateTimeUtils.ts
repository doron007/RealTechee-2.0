/**
 * Utility functions for handling DateTime formatting and parsing
 * Ensures consistent ISO 8601 format across the application
 */

export class DateTimeUtils {
  /**
   * Generate a properly formatted ISO 8601 datetime string
   * Always returns format: YYYY-MM-DDTHH:mm:ss.sssZ
   */
  static now(): string {
    return new Date().toISOString();
  }

  /**
   * Convert a Date object to ISO string with validation
   */
  static toISOString(date: Date): string {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      throw new Error('Invalid date provided');
    }
    return date.toISOString();
  }

  /**
   * Parse datetime string and ensure it's in proper ISO format
   * Handles common malformed formats and returns standardized ISO string
   */
  static normalizeDateTime(dateString: string): string {
    if (!dateString || typeof dateString !== 'string') {
      throw new Error('Invalid datetime string provided');
    }

    // Handle common malformed formats
    let normalizedString = dateString.trim();
    
    // Fix .3NZ format (common from some date commands)
    if (normalizedString.includes('.3NZ')) {
      normalizedString = normalizedString.replace('.3NZ', '.000Z');
    }
    
    // Fix other malformed timezone formats
    if (normalizedString.endsWith('NZ') && !normalizedString.endsWith('Z')) {
      normalizedString = normalizedString.replace(/NZ$/, 'Z');
    }
    
    // Ensure milliseconds are present
    if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(normalizedString)) {
      normalizedString = normalizedString.replace('Z', '.000Z');
    }

    try {
      const date = new Date(normalizedString);
      if (isNaN(date.getTime())) {
        throw new Error(`Cannot parse datetime: ${dateString}`);
      }
      return date.toISOString();
    } catch (error) {
      throw new Error(`Failed to normalize datetime "${dateString}": ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate if a string is a proper ISO 8601 datetime
   */
  static isValidISODateTime(dateString: string): boolean {
    if (!dateString || typeof dateString !== 'string') {
      return false;
    }

    try {
      const date = new Date(dateString);
      return !isNaN(date.getTime()) && date.toISOString() === dateString;
    } catch {
      return false;
    }
  }

  /**
   * Parse datetime with robust error handling
   * Returns null for invalid dates instead of throwing
   */
  static safeParse(dateString: string): Date | null {
    try {
      const normalized = this.normalizeDateTime(dateString);
      const date = new Date(normalized);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  }

  /**
   * Format datetime for GraphQL AWSDateTime scalar type
   * Ensures compatibility with AWS AppSync
   */
  static forGraphQL(date: Date | string): string {
    if (typeof date === 'string') {
      return this.normalizeDateTime(date);
    }
    return this.toISOString(date);
  }

  /**
   * Create datetime for database insertion
   * Standardizes format for DynamoDB
   */
  static forDatabase(): string {
    return this.now();
  }

  /**
   * Parse date from database with fallback handling
   */
  static fromDatabase(dateString: string | null | undefined): Date | null {
    if (!dateString) return null;
    return this.safeParse(dateString);
  }

  /**
   * Format datetime for display to users
   */
  static forDisplay(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
    const dateObj = typeof date === 'string' ? this.safeParse(date) : date;
    if (!dateObj) return 'Invalid Date';

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    };

    return dateObj.toLocaleDateString('en-US', options || defaultOptions);
  }

  /**
   * Get time ago string (e.g., "2 hours ago")
   */
  static timeAgo(date: Date | string): string {
    const dateObj = typeof date === 'string' ? this.safeParse(date) : date;
    if (!dateObj) return 'Unknown time';

    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    
    return this.forDisplay(dateObj, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  /**
   * Debug datetime format issues
   */
  static debugDateTime(dateString: string): {
    original: string;
    normalized: string | null;
    isValid: boolean;
    error?: string;
  } {
    try {
      const normalized = this.normalizeDateTime(dateString);
      return {
        original: dateString,
        normalized,
        isValid: this.isValidISODateTime(normalized)
      };
    } catch (error) {
      return {
        original: dateString,
        normalized: null,
        isValid: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}