import { fetchAuthSession } from 'aws-amplify/auth';

interface TokenInfo {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  expiresAt: number;
}

export class TokenManager {
  private static TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry
  private static lastTokenCheck = 0;
  private static TOKEN_CHECK_INTERVAL = 60 * 1000; // Check every minute

  /**
   * Get current token information
   */
  static async getTokenInfo(): Promise<TokenInfo | null> {
    try {
      const session = await fetchAuthSession();
      
      if (!session.tokens?.accessToken || !session.tokens?.idToken) {
        console.warn('⚠️ No valid tokens found in session');
        return null;
      }

      const accessToken = session.tokens.accessToken.toString();
      const idToken = session.tokens.idToken.toString();
      // Note: refreshToken may not be available in all token objects
      const refreshToken = (session.tokens as any).refreshToken?.toString();
      
      // Parse expiry from JWT payload
      const tokenPayload = this.parseJWTPayload(accessToken);
      const expiresAt = tokenPayload?.exp ? tokenPayload.exp * 1000 : Date.now() + (60 * 60 * 1000); // Default 1 hour

      return {
        accessToken,
        idToken,
        refreshToken,
        expiresAt
      };
    } catch (error) {
      console.error('❌ Failed to get token info:', error);
      return null;
    }
  }

  /**
   * Check if current tokens are valid and not close to expiry
   */
  static async areTokensValid(): Promise<boolean> {
    try {
      const tokenInfo = await this.getTokenInfo();
      if (!tokenInfo) {
        return false;
      }

      const now = Date.now();
      const timeUntilExpiry = tokenInfo.expiresAt - now;
      
      // Consider tokens invalid if they expire within the threshold
      const isValid = timeUntilExpiry > this.TOKEN_REFRESH_THRESHOLD;
      
      if (!isValid) {
        console.log(`⏰ Tokens expire in ${Math.round(timeUntilExpiry / 1000)}s - need refresh`);
      }
      
      return isValid;
    } catch (error) {
      console.error('❌ Failed to check token validity:', error);
      return false;
    }
  }

  /**
   * Proactively refresh tokens if needed
   */
  static async refreshTokensIfNeeded(): Promise<boolean> {
    try {
      const now = Date.now();
      
      // Rate limit token checks
      if (now - this.lastTokenCheck < this.TOKEN_CHECK_INTERVAL) {
        return true;
      }
      
      this.lastTokenCheck = now;
      
      const areValid = await this.areTokensValid();
      if (areValid) {
        return true;
      }

      console.log('🔄 Refreshing authentication tokens...');
      
      // Force a new session fetch which should trigger refresh
      const session = await fetchAuthSession({ forceRefresh: true });
      
      if (session.tokens?.accessToken && session.tokens?.idToken) {
        console.log('✅ Tokens refreshed successfully');
        return true;
      } else {
        console.warn('⚠️ Token refresh did not return valid tokens');
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to refresh tokens:', error);
      return false;
    }
  }

  /**
   * Validate and safely call an authenticated function
   */
  static async withValidTokens<T>(fn: () => Promise<T>): Promise<T> {
    const tokensRefreshed = await this.refreshTokensIfNeeded();
    
    if (!tokensRefreshed) {
      throw new Error('Failed to refresh authentication tokens');
    }

    return await fn();
  }

  /**
   * Parse JWT payload without verification (for expiry checking)
   */
  private static parseJWTPayload(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to parse JWT payload:', error);
      return null;
    }
  }

  /**
   * Get time until token expiry in milliseconds
   */
  static async getTimeUntilExpiry(): Promise<number | null> {
    try {
      const tokenInfo = await this.getTokenInfo();
      if (!tokenInfo) {
        return null;
      }

      return tokenInfo.expiresAt - Date.now();
    } catch (error) {
      console.error('Failed to get time until expiry:', error);
      return null;
    }
  }

  /**
   * Start automatic token refresh monitoring
   */
  static startTokenMonitoring(): () => void {
    console.log('🔄 Starting automatic token monitoring...');
    
    const interval = setInterval(async () => {
      try {
        await this.refreshTokensIfNeeded();
      } catch (error) {
        console.error('Token monitoring error:', error);
      }
    }, this.TOKEN_CHECK_INTERVAL);

    // Return cleanup function
    return () => {
      console.log('🛑 Stopping token monitoring');
      clearInterval(interval);
    };
  }
}