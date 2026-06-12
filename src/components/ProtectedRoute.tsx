import React, { useEffect } from 'react';
import { getAuthToken, getPortalLoginUrl } from '../utils/authGuard';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * ProtectedRoute - Validates authentication before rendering content
 * 
 * For use in sub-apps (Viagens, Calibrações, Insumos):
 * - Checks if user has valid Supabase session from Portal
 * - Redirects to Portal login if session invalid/expired
 * - Passes current URL as returnTo parameter for redirect after login
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback = <LoadingFallback /> 
}) => {
  const [isValidated, setIsValidated] = React.useState(false);
  const [isValid, setIsValid] = React.useState(false);

  useEffect(() => {
    const validate = async () => {
      const token = getAuthToken();
      
      if (!token) {
        // No token - redirect to Portal
        const returnUrl = window.location.href;
        const portalUrl = getPortalLoginUrl(returnUrl);
        console.log('[ProtectedRoute] No valid session. Redirecting to Portal:', portalUrl);
        window.location.href = portalUrl;
        return;
      }

      // Validate token age (24 hours max)
      const now = Date.now();
      const tokenAge = now - token.issuedAt;
      const MAX_TOKEN_AGE = 24 * 60 * 60 * 1000;

      if (tokenAge > MAX_TOKEN_AGE) {
        // Token expired - redirect to Portal
        const returnUrl = window.location.href;
        const portalUrl = getPortalLoginUrl(returnUrl);
        console.log('[ProtectedRoute] Session expired. Redirecting to Portal:', portalUrl);
        window.location.href = portalUrl;
        return;
      }

      // Token is valid
      setIsValid(true);
      setIsValidated(true);
    };

    validate();
  }, []);

  if (!isValidated) {
    return <>{fallback}</>;
  }

  if (!isValid) {
    return null;
  }

  return <>{children}</>;
};

/**
 * Loading fallback component
 */
const LoadingFallback: React.FC = () => (
  <div
    style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #005198 0%, #01adff 100%)',
    }}
  >
    <div
      style={{
        textAlign: 'center',
        color: 'white',
      }}
    >
      <div
        style={{
          fontSize: '48px',
          marginBottom: '16px',
        }}
      >
        ⬡
      </div>
      <div
        style={{
          fontSize: '18px',
          fontWeight: '600',
        }}
      >
        Verificando acesso...
      </div>
    </div>
  </div>
);

/**
 * Hook to check authentication in any component
 * Returns the current auth token or redirects to Portal if invalid
 */
export const useProtectedAuth = () => {
  const token = getAuthToken();

  useEffect(() => {
    if (!token) {
      const returnUrl = window.location.href;
      const portalUrl = getPortalLoginUrl(returnUrl);
      window.location.href = portalUrl;
    }
  }, [token]);

  return token;
};
