import { signOut } from 'aws-amplify/auth';

export class AuthStateManager {
  /**
   * Clear all authentication-related data from browser storage
   */
  static clearAllAuthData(): void {
    console.log('🔧 Starting complete authentication state reset...');
    
    // Clear localStorage
    const localStorageKeysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && this.isAuthRelatedKey(key)) {
        localStorageKeysToRemove.push(key);
      }
    }
    
    localStorageKeysToRemove.forEach(key => {
      console.log(`🗑️ Removing localStorage key: ${key}`);
      localStorage.removeItem(key);
    });
    
    // Clear sessionStorage
    const sessionStorageKeysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && this.isAuthRelatedKey(key)) {
        sessionStorageKeysToRemove.push(key);
      }
    }
    
    sessionStorageKeysToRemove.forEach(key => {
      console.log(`🗑️ Removing sessionStorage key: ${key}`);
      sessionStorage.removeItem(key);
    });
    
    console.log(`✅ Cleared ${localStorageKeysToRemove.length} localStorage and ${sessionStorage.length} sessionStorage auth items`);
    
    // Clear cookies (if any)
    this.clearAuthCookies();
    
    // Clear any cached credentials
    this.clearCachedCredentials();
  }

  /**
   * Check if a storage key is authentication-related
   */
  private static isAuthRelatedKey(key: string): boolean {
    const authPatterns = [
      'amplify',
      'aws',
      'cognito',
      'CognitoIdentityServiceProvider',
      'LastAuthUser',
      'accessToken',
      'idToken',
      'refreshToken',
      'clockDrift',
      'userData',
      'userSub',
      'identityId',
      'federatedInfo',
      'auth'
    ];
    
    return authPatterns.some(pattern => 
      key.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * Clear authentication-related cookies
   */
  private static clearAuthCookies(): void {
    const cookies = document.cookie.split(';');
    
    cookies.forEach(cookie => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      
      if (this.isAuthRelatedKey(name)) {
        console.log(`🍪 Removing cookie: ${name}`);
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
      }
    });
  }

  /**
   * Clear any cached credentials from global objects
   */
  private static clearCachedCredentials(): void {
    // Clear any global Amplify cache
    if (typeof window !== 'undefined') {
      (window as any).AWS = undefined;
      (window as any).__amplify = undefined;
      
      // Clear any cached auth sessions
      const globalKeys = Object.keys(window);
      globalKeys.forEach(key => {
        if (this.isAuthRelatedKey(key)) {
          console.log(`🌐 Clearing global: ${key}`);
          (window as any)[key] = undefined;
        }
      });
    }
  }

  /**
   * Perform complete authentication reset and redirect to login
   */
  static async performCompleteReset(redirectPath: string = '/admin'): Promise<void> {
    console.log('🔄 Performing complete authentication reset...');
    
    try {
      // First try to sign out gracefully
      try {
        await signOut();
        console.log('✅ Graceful sign out completed');
      } catch (signOutError) {
        console.warn('⚠️ Graceful sign out failed, proceeding with force reset:', signOutError);
      }
      
      // Clear all authentication data
      this.clearAllAuthData();
      
      // Wait a moment for cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Force page reload to clear any remaining state
      console.log('🔄 Reloading page to complete reset...');
      window.location.href = `/login?redirect=${encodeURIComponent(redirectPath)}&reset=true`;
      
    } catch (error) {
      console.error('❌ Error during complete reset:', error);
      // Force navigation even if reset fails
      window.location.href = `/login?redirect=${encodeURIComponent(redirectPath)}&reset=true&error=reset_failed`;
    }
  }

  /**
   * Check if authentication state appears corrupted
   */
  static isAuthStateCorrupted(): boolean {
    // Check for common signs of corrupted auth state
    const signs = [
      // Multiple conflicting auth tokens
      localStorage.getItem('LastAuthUser') && !localStorage.getItem('CognitoIdentityServiceProvider.4pdj4qp05o47a0g42cqlt99ccs.LastAuthUser'),
      
      // Presence of invalid or partial tokens
      Object.keys(localStorage).some(key => 
        key.includes('CognitoIdentityServiceProvider') && 
        key.includes('userData') && 
        !localStorage.getItem(key.replace('userData', 'idToken'))
      ),
      
      // Clock drift issues
      localStorage.getItem('clockDrift') && 
      Math.abs(parseInt(localStorage.getItem('clockDrift') || '0')) > 300000 // 5 minutes
    ];
    
    return signs.some(sign => sign);
  }

  /**
   * Get detailed authentication state report
   */
  static getAuthStateReport(): { 
    totalAuthKeys: number; 
    keysByCategory: Record<string, string[]>; 
    possibleIssues: string[];
    isCorrupted: boolean;
  } {
    const allKeys = [...Array(localStorage.length)].map((_, i) => localStorage.key(i)!);
    const authKeys = allKeys.filter(key => this.isAuthRelatedKey(key));
    
    const keysByCategory: Record<string, string[]> = {
      cognito: [],
      amplify: [],
      tokens: [],
      other: []
    };
    
    authKeys.forEach(key => {
      if (key.includes('Cognito')) keysByCategory.cognito.push(key);
      else if (key.includes('amplify')) keysByCategory.amplify.push(key);
      else if (key.includes('Token') || key.includes('token')) keysByCategory.tokens.push(key);
      else keysByCategory.other.push(key);
    });
    
    const possibleIssues: string[] = [];
    
    if (keysByCategory.cognito.length > 10) {
      possibleIssues.push('Too many Cognito keys - possible corruption');
    }
    
    if (keysByCategory.tokens.length === 0 && keysByCategory.cognito.length > 0) {
      possibleIssues.push('Cognito keys present but no tokens found');
    }
    
    const isCorrupted = this.isAuthStateCorrupted();
    
    return {
      totalAuthKeys: authKeys.length,
      keysByCategory,
      possibleIssues,
      isCorrupted
    };
  }
}