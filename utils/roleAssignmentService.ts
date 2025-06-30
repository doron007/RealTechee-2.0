/**
 * Role Assignment Service
 * 
 * Intelligent role determination based on contact information
 * Used by PostConfirmation trigger and admin tools
 */

export type UserRole = 'super_admin' | 'admin' | 'accounting' | 'srm' | 'agent' | 'homeowner' | 'provider' | 'guest';

export interface ContactInfo {
  email: string;
  company?: string;
  brokerage?: string;
  firstName?: string;
  lastName?: string;
}

export interface RoleAssignmentResult {
  role: UserRole;
  explanation: string;
  confidence: 'high' | 'medium' | 'low';
}

export class RoleAssignmentService {
  
  /**
   * Determine user role based on contact information
   */
  static determineUserRole(contact: ContactInfo): RoleAssignmentResult {
    const normalizedEmail = contact.email.toLowerCase().trim();
    
    // Super admin check (highest priority)
    if (normalizedEmail === 'info@realtechee.com') {
      return {
        role: 'super_admin',
        explanation: 'Official RealTechee super admin email',
        confidence: 'high'
      };
    }
    
    // Admin role checks
    const adminResult = this.checkAdminRole(contact, normalizedEmail);
    if (adminResult) return adminResult;
    
    // Agent role checks
    const agentResult = this.checkAgentRole(contact, normalizedEmail);
    if (agentResult) return agentResult;
    
    // Provider role checks
    const providerResult = this.checkProviderRole(contact);
    if (providerResult) return providerResult;
    
    // SRM role checks
    const srmResult = this.checkSRMRole(contact, normalizedEmail);
    if (srmResult) return srmResult;
    
    // Accounting role checks
    const accountingResult = this.checkAccountingRole(normalizedEmail);
    if (accountingResult) return accountingResult;
    
    // Default to homeowner
    return {
      role: 'homeowner',
      explanation: 'Default role for new users',
      confidence: 'low'
    };
  }
  
  /**
   * Check if contact qualifies for admin role
   */
  private static checkAdminRole(contact: ContactInfo, email: string): RoleAssignmentResult | null {
    // Email patterns suggesting admin
    const adminPatterns = ['admin', 'administrator', 'management', 'manager'];
    const hasAdminEmail = adminPatterns.some(pattern => email.includes(pattern));
    
    // RealTechee employee check
    const company = contact.company?.toLowerCase() || '';
    const brokerage = contact.brokerage?.toLowerCase() || '';
    const isRealTecheeEmployee = 
      company.includes('realtechee') || 
      company.includes('real techee') ||
      brokerage.includes('realtechee') ||
      brokerage.includes('real techee');
    
    if (hasAdminEmail && isRealTecheeEmployee) {
      return {
        role: 'admin',
        explanation: `Admin email pattern + RealTechee employee (${contact.company || contact.brokerage})`,
        confidence: 'high'
      };
    }
    
    if (hasAdminEmail) {
      return {
        role: 'admin',
        explanation: `Admin email pattern detected in ${email}`,
        confidence: 'medium'
      };
    }
    
    if (isRealTecheeEmployee) {
      return {
        role: 'admin',
        explanation: `RealTechee employee (${contact.company || contact.brokerage})`,
        confidence: 'medium'
      };
    }
    
    return null;
  }
  
  /**
   * Check if contact qualifies for agent role
   */
  private static checkAgentRole(contact: ContactInfo, email: string): RoleAssignmentResult | null {
    const brokerage = contact.brokerage?.toLowerCase() || '';
    const company = contact.company?.toLowerCase() || '';
    
    // Has brokerage information (strong indicator)
    if (brokerage && brokerage !== 'none' && brokerage !== 'n/a' && brokerage !== 'null') {
      return {
        role: 'agent',
        explanation: `Real estate brokerage: ${contact.brokerage}`,
        confidence: 'high'
      };
    }
    
    // Email patterns suggesting agent
    const agentPatterns = ['agent', 'realtor', 'broker', 'realty'];
    const hasAgentEmail = agentPatterns.some(pattern => email.includes(pattern));
    
    // Company patterns suggesting real estate
    const realEstatePatterns = [
      'realty', 'real estate', 'broker', 'keller williams', 'coldwell banker', 
      'century 21', 'remax', 're/max', 'exp realty', 'compass', 'berkshire hathaway'
    ];
    const hasRealEstateCompany = realEstatePatterns.some(pattern => company.includes(pattern));
    
    if (hasAgentEmail && hasRealEstateCompany) {
      return {
        role: 'agent',
        explanation: `Agent email pattern + real estate company (${contact.company})`,
        confidence: 'high'
      };
    }
    
    if (hasAgentEmail) {
      return {
        role: 'agent',
        explanation: `Agent-related email pattern in ${email}`,
        confidence: 'medium'
      };
    }
    
    if (hasRealEstateCompany) {
      return {
        role: 'agent',
        explanation: `Real estate company: ${contact.company}`,
        confidence: 'medium'
      };
    }
    
    return null;
  }
  
  /**
   * Check if contact qualifies for provider role
   */
  private static checkProviderRole(contact: ContactInfo): RoleAssignmentResult | null {
    const company = contact.company?.toLowerCase() || '';
    const brokerage = contact.brokerage?.toLowerCase() || '';
    
    // Has company but no brokerage (suggests service provider)
    const hasCompany = company && company !== 'none' && company !== 'n/a' && company !== 'null';
    const noBrokerage = !brokerage || brokerage === 'none' || brokerage === 'n/a' || brokerage === 'null';
    
    if (hasCompany && noBrokerage) {
      // Exclude common homeowner company patterns
      const homeownerPatterns = ['self', 'personal', 'private', 'individual', 'homeowner', 'retired', 'unemployed'];
      const isHomeownerPattern = homeownerPatterns.some(pattern => company.includes(pattern));
      
      if (!isHomeownerPattern) {
        return {
          role: 'provider',
          explanation: `Service provider company: ${contact.company}`,
          confidence: 'medium'
        };
      }
    }
    
    return null;
  }
  
  /**
   * Check if contact qualifies for SRM role
   */
  private static checkSRMRole(contact: ContactInfo, email: string): RoleAssignmentResult | null {
    const srmPatterns = ['srm', 'senior', 'relationship', 'manager', 'director', 'vp', 'vice president'];
    const hasSRMEmail = srmPatterns.some(pattern => email.includes(pattern));
    
    if (hasSRMEmail) {
      return {
        role: 'srm',
        explanation: `Senior role pattern detected in ${email}`,
        confidence: 'medium'
      };
    }
    
    return null;
  }
  
  /**
   * Check if contact qualifies for accounting role
   */
  private static checkAccountingRole(email: string): RoleAssignmentResult | null {
    const accountingPatterns = ['accounting', 'finance', 'bookkeeper', 'cpa', 'accountant', 'bookkeeping'];
    const hasAccountingEmail = accountingPatterns.some(pattern => email.includes(pattern));
    
    if (hasAccountingEmail) {
      return {
        role: 'accounting',
        explanation: `Accounting-related email pattern in ${email}`,
        confidence: 'medium'
      };
    }
    
    return null;
  }
  
  /**
   * Get all possible roles for a contact (for admin review)
   */
  static getAllPossibleRoles(contact: ContactInfo): RoleAssignmentResult[] {
    const results: RoleAssignmentResult[] = [];
    const email = contact.email.toLowerCase().trim();
    
    // Test all role types
    const adminResult = this.checkAdminRole(contact, email);
    if (adminResult) results.push(adminResult);
    
    const agentResult = this.checkAgentRole(contact, email);
    if (agentResult) results.push(agentResult);
    
    const providerResult = this.checkProviderRole(contact);
    if (providerResult) results.push(providerResult);
    
    const srmResult = this.checkSRMRole(contact, email);
    if (srmResult) results.push(srmResult);
    
    const accountingResult = this.checkAccountingRole(email);
    if (accountingResult) results.push(accountingResult);
    
    // Always include the default
    results.push({
      role: 'homeowner',
      explanation: 'Default role',
      confidence: 'low'
    });
    
    return results;
  }
  
  /**
   * Validate if a role assignment makes sense for a contact
   */
  static validateRoleAssignment(contact: ContactInfo, proposedRole: UserRole): {
    valid: boolean;
    reasoning: string;
    confidence: 'high' | 'medium' | 'low';
  } {
    const allPossibleRoles = this.getAllPossibleRoles(contact);
    const matchingRole = allPossibleRoles.find(r => r.role === proposedRole);
    
    if (matchingRole) {
      return {
        valid: true,
        reasoning: matchingRole.explanation,
        confidence: matchingRole.confidence
      };
    }
    
    return {
      valid: false,
      reasoning: `Role '${proposedRole}' does not match contact profile. Suggested: ${allPossibleRoles[0]?.role || 'homeowner'}`,
      confidence: 'low'
    };
  }
}