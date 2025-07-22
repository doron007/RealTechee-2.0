import { contactsAPI, propertiesAPI } from '../utils/amplifyAPI';

export interface Contact {
  id?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  company?: string;
  brokerage?: string;
  owner?: string;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
}

export interface Property {
  id?: string;
  propertyFullAddress?: string;
  houseAddress?: string;
  city?: string;
  state?: string;
  zip?: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  floors?: number;
  sizeSqft?: number;
  yearBuilt?: number;
  redfinLink?: string;
  zillowLink?: string;
  owner?: string;
}

export interface ContactDuplicateMatch {
  id: string;
  contact: Contact;
  matchType: 'exact_email' | 'exact_phone' | 'similar_name' | 'similar_company';
  confidence: number;
  reason: string;
}

export interface PropertyDuplicateMatch {
  id: string;
  property: Property;
  matchType: 'exact_address' | 'similar_address' | 'same_coordinates';
  confidence: number;
  reason: string;
}

export interface ValidationResult {
  isValid: boolean;
  duplicates: ContactDuplicateMatch[] | PropertyDuplicateMatch[];
  suggestions: string[];
  errors: string[];
}

class DataValidationService {
  /**
   * Check for duplicate contacts using multiple criteria
   */
  async validateContact(contact: Contact, excludeId?: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const duplicates: ContactDuplicateMatch[] = [];
    const suggestions: string[] = [];

    try {
      // Get all contacts for comparison
      const result = await contactsAPI.list();
      if (!result.success) {
        throw new Error('Failed to fetch contacts for validation');
      }

      const existingContacts = result.data.filter((c: Contact) => c.id !== excludeId);

      // Check for exact email match
      if (contact.email) {
        const emailMatch = existingContacts.find((c: Contact) => 
          c.email?.toLowerCase() === contact.email?.toLowerCase()
        );
        if (emailMatch && emailMatch.id) {
          duplicates.push({
            id: emailMatch.id,
            contact: emailMatch,
            matchType: 'exact_email',
            confidence: 1.0,
            reason: `Email "${contact.email}" already exists in the system`
          });
        }
      }

      // Check for exact phone match
      if (contact.phone) {
        const normalizedPhone = this.normalizePhone(contact.phone);
        const phoneMatch = existingContacts.find((c: Contact) => 
          c.phone && c.id && this.normalizePhone(c.phone!) === normalizedPhone
        );
        if (phoneMatch && phoneMatch.id) {
          duplicates.push({
            id: phoneMatch.id,
            contact: phoneMatch,
            matchType: 'exact_phone',
            confidence: 0.9,
            reason: `Phone "${contact.phone}" already exists in the system`
          });
        }
      }

      // Check for similar name matches
      if (contact.firstName && contact.lastName) {
        const nameMatches = existingContacts.filter((c: Contact) => {
          if (!c.firstName || !c.lastName) return false;
          
          const similarity = this.calculateNameSimilarity(
            contact.firstName!, contact.lastName!,
            c.firstName!, c.lastName!
          );
          return similarity > 0.8;
        });

        nameMatches.forEach((match: Contact) => {
          if (match.id) {
            duplicates.push({
              id: match.id,
              contact: match,
              matchType: 'similar_name',
              confidence: 0.7,
              reason: `Similar name found: "${match.fullName}"`
            });
          }
        });
      }

      // Check for company/brokerage matches
      if (contact.company || contact.brokerage) {
        const companyMatches = existingContacts.filter((c: Contact) => {
          if (contact.company && c.company) {
            return c.company.toLowerCase().includes(contact.company.toLowerCase()) ||
                   contact.company.toLowerCase().includes(c.company.toLowerCase());
          }
          if (contact.brokerage && c.brokerage) {
            return c.brokerage.toLowerCase().includes(contact.brokerage.toLowerCase()) ||
                   contact.brokerage.toLowerCase().includes(c.brokerage.toLowerCase());
          }
          return false;
        });

        companyMatches.forEach((match: Contact) => {
          if (match.id) {
            duplicates.push({
              id: match.id,
              contact: match,
              matchType: 'similar_company',
              confidence: 0.6,
              reason: `Similar company/brokerage found: "${match.company || match.brokerage}"`
            });
          }
        });
      }

      // Generate suggestions
      if (duplicates.length > 0) {
        suggestions.push('Consider merging with existing contact to avoid duplicates');
        suggestions.push('Verify if this is the same person with updated information');
        suggestions.push('Check if this contact should be linked to existing records');
      }

      // Validate required fields
      if (!contact.firstName?.trim()) {
        errors.push('First name is required');
      }
      if (!contact.lastName?.trim()) {
        errors.push('Last name is required');
      }
      if (!contact.email?.trim()) {
        errors.push('Email is required');
      } else if (!this.isValidEmail(contact.email)) {
        errors.push('Please enter a valid email address');
      }

      return {
        isValid: errors.length === 0 && duplicates.filter(d => d.matchType === 'exact_email').length === 0,
        duplicates,
        suggestions,
        errors
      };

    } catch (error) {
      console.error('Error validating contact:', error);
      return {
        isValid: false,
        duplicates: [],
        suggestions: [],
        errors: ['Failed to validate contact against existing records']
      };
    }
  }

  /**
   * Check for duplicate properties using address matching
   */
  async validateProperty(property: Property, excludeId?: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const duplicates: PropertyDuplicateMatch[] = [];
    const suggestions: string[] = [];

    try {
      // Get all properties for comparison
      const result = await propertiesAPI.list();
      if (!result.success) {
        throw new Error('Failed to fetch properties for validation');
      }

      const existingProperties = result.data.filter((p: Property) => p.id !== excludeId);

      // Check for exact address match
      if (property.propertyFullAddress) {
        const normalizedAddress = this.normalizeAddress(property.propertyFullAddress);
        const addressMatch = existingProperties.find((p: Property) => 
          p.propertyFullAddress && this.normalizeAddress(p.propertyFullAddress!) === normalizedAddress
        );
        if (addressMatch && addressMatch.id) {
          duplicates.push({
            id: addressMatch.id,
            property: addressMatch,
            matchType: 'exact_address',
            confidence: 1.0,
            reason: `Address "${property.propertyFullAddress}" already exists in the system`
          });
        }
      }

      // Check for similar address matches
      if (property.houseAddress && property.city && property.state && property.zip) {
        const addressMatches = existingProperties.filter((p: Property) => {
          if (!p.houseAddress || !p.city || !p.state || !p.zip) return false;
          
          const similarity = this.calculateAddressSimilarity(
            property.houseAddress!, property.city!, property.state!, property.zip!,
            p.houseAddress!, p.city!, p.state!, p.zip!
          );
          return similarity > 0.8;
        });

        addressMatches.forEach((match: Property) => {
          if (match.id) {
            duplicates.push({
              id: match.id,
              property: match,
              matchType: 'similar_address',
              confidence: 0.8,
              reason: `Similar address found: "${match.propertyFullAddress}"`
            });
          }
        });
      }

      // Generate suggestions
      if (duplicates.length > 0) {
        suggestions.push('Consider updating existing property record instead of creating new one');
        suggestions.push('Verify if this is the same property with updated information');
        suggestions.push('Check if property details need to be merged');
      }

      // Validate required fields
      if (!property.houseAddress?.trim()) {
        errors.push('House address is required');
      }
      if (!property.city?.trim()) {
        errors.push('City is required');
      }
      if (!property.state?.trim()) {
        errors.push('State is required');
      }
      if (!property.zip?.trim()) {
        errors.push('ZIP code is required');
      } else if (!this.isValidZipCode(property.zip)) {
        errors.push('Please enter a valid ZIP code');
      }

      return {
        isValid: errors.length === 0 && duplicates.filter(d => d.matchType === 'exact_address').length === 0,
        duplicates,
        suggestions,
        errors
      };

    } catch (error) {
      console.error('Error validating property:', error);
      return {
        isValid: false,
        duplicates: [],
        suggestions: [],
        errors: ['Failed to validate property against existing records']
      };
    }
  }

  /**
   * Search for contacts by various criteria
   */
  async searchContacts(query: string): Promise<Contact[]> {
    try {
      const result = await contactsAPI.list();
      if (!result.success) return [];

      const normalizedQuery = query.toLowerCase().trim();
      
      return result.data.filter((contact: Contact) => {
        const searchFields = [
          contact.firstName,
          contact.lastName,
          contact.fullName,
          contact.email,
          contact.phone,
          contact.mobile,
          contact.company,
          contact.brokerage
        ];

        return searchFields.some(field => 
          field && field.toLowerCase().includes(normalizedQuery)
        );
      });
    } catch (error) {
      console.error('Error searching contacts:', error);
      return [];
    }
  }

  /**
   * Search for properties by address
   */
  async searchProperties(query: string): Promise<Property[]> {
    try {
      const result = await propertiesAPI.list();
      if (!result.success) return [];

      const normalizedQuery = query.toLowerCase().trim();
      
      return result.data.filter((property: Property) => {
        const searchFields = [
          property.propertyFullAddress,
          property.houseAddress,
          property.city,
          property.state,
          property.zip
        ];

        return searchFields.some(field => 
          field && field.toLowerCase().includes(normalizedQuery)
        );
      });
    } catch (error) {
      console.error('Error searching properties:', error);
      return [];
    }
  }

  // Helper methods
  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, ''); // Remove all non-digit characters
  }

  private normalizeAddress(address: string): string {
    return address.toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .trim();
  }

  private calculateNameSimilarity(firstName1: string, lastName1: string, firstName2: string, lastName2: string): number {
    const name1 = `${firstName1} ${lastName1}`.toLowerCase();
    const name2 = `${firstName2} ${lastName2}`.toLowerCase();
    
    // Simple similarity calculation (can be enhanced with Levenshtein distance)
    if (name1 === name2) return 1.0;
    
    const words1 = name1.split(' ');
    const words2 = name2.split(' ');
    
    let matches = 0;
    const totalWords = Math.max(words1.length, words2.length);
    
    words1.forEach(word1 => {
      if (words2.some(word2 => word1 === word2)) {
        matches++;
      }
    });
    
    return matches / totalWords;
  }

  private calculateAddressSimilarity(
    house1: string, city1: string, state1: string, zip1: string,
    house2: string, city2: string, state2: string, zip2: string
  ): number {
    // Exact matches have higher weight
    if (house1.toLowerCase() === house2.toLowerCase() && 
        city1.toLowerCase() === city2.toLowerCase() && 
        state1.toLowerCase() === state2.toLowerCase()) {
      return 1.0;
    }
    
    // Partial matches
    let score = 0;
    if (house1.toLowerCase().includes(house2.toLowerCase()) || 
        house2.toLowerCase().includes(house1.toLowerCase())) score += 0.4;
    if (city1.toLowerCase() === city2.toLowerCase()) score += 0.3;
    if (state1.toLowerCase() === state2.toLowerCase()) score += 0.2;
    if (zip1 === zip2) score += 0.1;
    
    return score;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidZipCode(zip: string): boolean {
    const zipRegex = /^\d{5}(-\d{4})?$/;
    return zipRegex.test(zip);
  }
}

export const dataValidationService = new DataValidationService();