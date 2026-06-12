/**
 * Auth Guard Utility - Centralized authentication for Hexagon Portal and Sub-apps
 * 
 * This utility:
 * 1. Validates Supabase session from Portal
 * 2. Stores auth tokens for cross-domain sharing
 * 3. Provides session validation for sub-apps
 * 4. Handles deep link redirects with returnTo parameter
 */

export interface AuthToken {
  userId: string;
  email: string;
  name?: string;
  issuedAt: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  token: AuthToken | null;
  loading: boolean;
  error: string | null;
}

const AUTH_KEY = 'portal_auth';
const RETURN_URL_KEY = 'portal_return_url';

/**
 * Get authentication token from localStorage
 */
export const getAuthToken = (): AuthToken | null => {
  try {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) return null;
    
    const parsed = JSON.parse(token);
    // Check if token has basic required fields
    if (parsed.userId && parsed.email) {
      return parsed;
    }
    return null;
  } catch (error) {
    console.error('Error reading auth token:', error);
    return null;
  }
};

/**
 * Store authentication token in localStorage
 * Called by Portal after successful Supabase login
 * @param userId - User ID from Supabase
 * @param email - User email from Supabase
 * @param name - User name (optional)
 */
export const setAuthToken = (userId: string, email: string, name?: string): void => {
  const token: AuthToken = {
    userId,
    email,
    name,
    issuedAt: Date.now(),
  };
  localStorage.setItem(AUTH_KEY, JSON.stringify(token));
};

/**
 * Remove authentication token
 * Called by Portal on logout
 */
export const clearAuthToken = (): void => {
  localStorage.removeItem(AUTH_KEY);
};

/**
 * Check if user is authenticated
 * Used by sub-apps at initialization
 */
export const isAuthenticated = (): boolean => {
  return getAuthToken() !== null;
};

/**
 * Store the URL to return to after login
 * Used by Portal to redirect back to original app
 * @param url - Full URL or path to return to
 */
export const setReturnUrl = (url: string): void => {
  if (url) {
    localStorage.setItem(RETURN_URL_KEY, url);
  }
};

/**
 * Get the stored return URL
 * Used by Portal after successful login
 */
export const getReturnUrl = (): string | null => {
  return localStorage.getItem(RETURN_URL_KEY);
};

/**
 * Clear the stored return URL
 * Called after redirect
 */
export const clearReturnUrl = (): void => {
  localStorage.removeItem(RETURN_URL_KEY);
};

/**
 * Get Portal base URL (handles both localhost and production)
 */
export const getPortalUrl = (): string => {
  // If already on Portal domain, return current origin
  const origin = window.location.origin;
  
  // Check if on sub-app domain
  if (origin.includes('viagens') || origin.includes('calibracao') || origin.includes('insumos')) {
    // Return Portal URL (in production, adjust as needed)
    return 'https://hexagon-portal.vercel.app';
  }
  
  // For localhost, assume Portal is running there
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    return origin;
  }
  
  return 'https://hexagon-portal.vercel.app';
};

/**
 * Construct Portal login URL with return URL parameter
 * @param returnUrl - URL to return to after login
 */
export const getPortalLoginUrl = (returnUrl?: string): string => {
  const portalUrl = getPortalUrl();
  let url = `${portalUrl}/`;
  
  if (returnUrl) {
    // Encode the return URL
    url += `?returnTo=${encodeURIComponent(returnUrl)}`;
  }
  
  return url;
};

/**
 * Build redirect URL for deep links
 * Redirects to Portal if session invalid, then back to original app
 */
export const buildDeepLinkRedirect = (originalUrl: string): string | null => {
  const token = getAuthToken();
  
  if (!token) {
    // No auth token - redirect to Portal login with returnTo parameter
    setReturnUrl(originalUrl);
    return getPortalLoginUrl(originalUrl);
  }
  
  // Token exists but might be expired - validate it
  const now = Date.now();
  const tokenAge = now - token.issuedAt;
  const MAX_TOKEN_AGE = 24 * 60 * 60 * 1000; // 24 hours
  
  if (tokenAge > MAX_TOKEN_AGE) {
    // Token expired - redirect to Portal for re-authentication
    clearAuthToken();
    setReturnUrl(originalUrl);
    return getPortalLoginUrl(originalUrl);
  }
  
  // Token is valid
  return null;
};

/**
 * Extract returnTo parameter from URL
 */
export const getReturnToParam = (): string | null => {
  const params = new URLSearchParams(window.location.search);
  return params.get('returnTo');
};

/**
 * Validate session and handle redirect if needed
 * Should be called in app initialization/Router level
 * Returns true if session is valid, false if redirect is needed
 */
export const validateSessionAndRedirect = (): boolean => {
  const token = getAuthToken();
  
  if (!token) {
    console.warn('[Auth Guard] No valid session - redirecting to Portal');
    const returnUrl = window.location.href;
    const portalUrl = getPortalLoginUrl(returnUrl);
    window.location.href = portalUrl;
    return false;
  }
  
  // Validate token age
  const now = Date.now();
  const tokenAge = now - token.issuedAt;
  const MAX_TOKEN_AGE = 24 * 60 * 60 * 1000; // 24 hours
  
  if (tokenAge > MAX_TOKEN_AGE) {
    console.warn('[Auth Guard] Session expired - redirecting to Portal');
    clearAuthToken();
    const returnUrl = window.location.href;
    const portalUrl = getPortalLoginUrl(returnUrl);
    window.location.href = portalUrl;
    return false;
  }
  
  return true;
};
