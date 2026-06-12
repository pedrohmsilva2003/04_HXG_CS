# Hexagon Portal - Centralized Authentication Implementation Guide

**Version:** 1.0  
**Date:** January 14, 2026  
**Status:** Implementation Complete  

---

## Executive Summary

This guide implements centralized authentication for the Hexagon Portal ecosystem. The Portal serves as the single entry point for authentication, while three sub-applications (Viagens, Calibrações, Insumos) trust and validate sessions established by the Portal.

### Key Principles
- ✅ **Single Sign-On (SSO):** One login for all apps
- ✅ **Centralized User Management:** Supabase as single source of truth
- ✅ **No Authentication Duplication:** Sub-apps don't have login screens
- ✅ **Transparent Navigation:** Seamless transitions between systems
- ✅ **Deep Link Support:** Direct URLs automatically redirect to Portal if needed

---

## System Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                      HEXAGON PORTAL                          │
│                                                              │
│  • Central Authentication (Supabase)                        │
│  • User Database (Single Source of Truth)                   │
│  • Dashboard with App Cards                                 │
│  • Session Token Generation                                 │
│  • Logout & Session Management                              │
└─────────────────────────────────────────────────────────────┘
             │                    │                    │
             ↓                    ↓                    ↓
    ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────┐
    │ VIAGENS APP     │  │ CALIBRAÇÕES APP  │  │ INSUMOS APP     │
    │                 │  │                  │  │                 │
    │ • Auth Validation│  │ • Auth Validation│  │ • Auth Validation
    │ • Portal Token  │  │ • Portal Token   │  │ • Portal Token
    │ • Auto-Redirect │  │ • Auto-Redirect  │  │ • Auto-Redirect
    └─────────────────┘  └──────────────────┘  └─────────────────┘
```

### Technology Stack

- **Portal & Sub-Apps:** React + TypeScript + Vite
- **Authentication:** Supabase (managed)
- **State Management:** localStorage + React Context
- **Session Sharing:** Cross-domain localStorage + URL parameters

---

## Authentication Flow

### Flow 1: User Login via Portal

```
1. User accesses Portal URL
   └─> https://hexagon-portal.vercel.app/

2. Portal displays login form
   └─> Email + Password (managed in Supabase)

3. User enters credentials
   └─> Portal queries Supabase: app_users table

4. Supabase validates credentials
   └─> Checks email, password, status (active/pending/blocked)

5. Portal generates auth token
   ├─> userId
   ├─> email  
   ├─> name (optional)
   └─> issuedAt timestamp

6. Token stored in localStorage
   └─> Key: "portal_auth"
   └─> Value: JSON encoded token

7. Portal displays dashboard
   └─> Shows available applications (Viagens, Calibrações, Insumos)
```

### Flow 2: Accessing App via Portal (Normal)

```
1. User in Portal dashboard
   
2. User clicks app card (e.g., "Solicitação de Viagem")

3. Portal opens app in new tab
   └─> URL includes: ?returnTo=[encoded-portal-url]&auth=[encoded-token]

4. Sub-app loads (ProtectedRoute component)

5. ProtectedRoute validates token
   ├─> Checks: token exists in localStorage
   ├─> Checks: token not expired (< 24 hours)
   └─> If valid → render app ✅

6. App renders with user context
   └─> useProtectedAuth() hook provides token data
```

### Flow 3: Deep Link Access (Direct URL)

```
1. User visits sub-app directly
   └─> https://hexagon-viagens.vercel.app/

2. Sub-app loads (ProtectedRoute component)

3. ProtectedRoute checks token
   └─> No token found in localStorage ❌

4. ProtectedRoute constructs Portal login URL
   ├─> Base: https://hexagon-portal.vercel.app/
   ├─> With returnTo: ?returnTo=[current-url]
   └─> Result: https://hexagon-portal.vercel.app/?returnTo=https://hexagon-viagens.vercel.app/

5. Browser redirects to Portal
   
6. User logs in (see Flow 1)
   
7. Portal detects returnTo parameter
   ├─> Generates auth token
   ├─> Stores in localStorage
   └─> Redirects back to original sub-app URL

8. Sub-app reloads with valid token
   └─> ProtectedRoute validates ✅
   └─> App renders normally
```

### Flow 4: Session Expiration & Re-authentication

```
1. User in sub-app
   └─> Token is 25+ hours old

2. User interacts with app

3. useProtectedAuth() checks token age
   └─> Calculates: now - token.issuedAt
   └─> Threshold: 24 hours

4. Token found to be expired ⏰

5. Component triggers redirect
   ├─> Clears expired token
   ├─> Constructs Portal URL with returnTo
   └─> Result: https://hexagon-portal.vercel.app/?returnTo=[sub-app-url]

6. User logs in again

7. Portal redirects back to sub-app
   └─> New token issued and stored
```

---

## Implementation Details

### Portal Implementation (`src/main.tsx`)

#### 1. Authentication Service

```typescript
// Login function
const authService = {
  login: async (email: string, password: string) => {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single();

    // Validate status
    if (data.status === 'pending') {
      throw new Error('Awaiting manager approval');
    }

    // Generate auth token for sub-apps
    setAuthToken(user.id, user.email, user.name);
    
    return { success: true, user };
  }
};
```

#### 2. Return URL Handling

```typescript
// LoginPageWrapper component
const handleLoginSuccess = (user: User) => {
  const returnToParam = getReturnToParam();
  
  if (returnToParam) {
    // Redirect to original sub-app or Portal route
    setTimeout(() => {
      if (returnToParam.includes('hexagon-')) {
        // External sub-app redirect
        window.location.href = returnToParam;
      } else {
        // Internal Portal route redirect
        navigate(returnToParam);
      }
    }, 500);
  }
};
```

#### 3. Dashboard App Cards

```typescript
// Each app card includes returnTo parameter
const handleOpenApp = (appUrl: string) => {
  const returnToParam = encodeURIComponent(window.location.href);
  const finalUrl = `${appUrl}?returnTo=${returnToParam}`;
  
  window.open(finalUrl, '_blank');
};
```

---

### Sub-App Implementation

#### 1. ProtectedRoute Wrapper

```typescript
// Wrap entire app with ProtectedRoute
export const ProtectedRoute: React.FC = ({ children }) => {
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    
    if (!token) {
      // Redirect to Portal
      const portalUrl = getPortalLoginUrl(window.location.href);
      window.location.href = portalUrl;
      return;
    }

    // Validate token age
    const tokenAge = Date.now() - token.issuedAt;
    if (tokenAge > 24 * 60 * 60 * 1000) {
      // Token expired - redirect to Portal
      const portalUrl = getPortalLoginUrl(window.location.href);
      window.location.href = portalUrl;
      return;
    }

    setIsValid(true);
  }, []);

  return isValid ? children : <LoadingFallback />;
};
```

#### 2. Auth Context Hook

```typescript
// Access user in any component
function MyComponent() {
  const token = useProtectedAuth();
  
  return (
    <div>
      <p>User: {token.email}</p>
      <button onClick={() => {
        clearAuthToken();
        window.location.href = PORTAL_URL;
      }}>
        Logout
      </button>
    </div>
  );
}
```

---

## File Structure

### Portal (`src/` directory)

```
src/
├── main.tsx                           # Main entry point with routing
├── components/
│   ├── LoginPage.tsx                 # Login form component
│   ├── Dashboard.tsx                 # App cards dashboard
│   ├── ProtectedRoute.tsx           # Auth validation wrapper (shared)
│   └── ...
├── utils/
│   ├── authGuard.ts                 # Auth token management (shared)
│   └── ...
├── services/
│   ├── supabaseClient.ts            # Supabase configuration
│   ├── userService.ts               # User operations
│   └── ...
└── contexts/
    └── AuthContext.tsx               # Auth state management
```

### Sub-App (Viagens, Calibrações, Insumos)

```
src/
├── main.tsx                          # Wrap with ProtectedRoute
├── App.tsx                           # Main app component
├── components/
│   ├── ProtectedRoute.tsx           # Copy from Portal
│   └── ...
├── utils/
│   ├── authGuard.ts                 # Copy from Portal
│   └── ...
└── services/
    └── ...
```

---

## API Reference

### Token Structure

```typescript
interface AuthToken {
  userId: string;           // User ID from Supabase
  email: string;            // User email
  name?: string;            // User display name (optional)
  issuedAt: number;        // Timestamp token was created
}
```

Example token:
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john.doe@leica-geosystems.com",
  "name": "John Doe",
  "issuedAt": 1705171200000
}
```

### authGuard.ts Functions

#### `getAuthToken(): AuthToken | null`
Retrieve stored authentication token

#### `setAuthToken(userId, email, name?): void`
Store authentication token (Portal only)

#### `clearAuthToken(): void`
Remove authentication token (logout)

#### `isAuthenticated(): boolean`
Check if user is authenticated

#### `getPortalLoginUrl(returnUrl?): string`
Get Portal login URL with optional returnTo parameter

#### `getReturnToParam(): string | null`
Extract returnTo from current URL

#### `validateSessionAndRedirect(): boolean`
Validate session and redirect if needed (returns true if valid)

---

## Deployment Checklist

### Portal Setup

- [ ] Supabase project created with `app_users` table
- [ ] User table has columns: id, email, password, name, role, status, created_at
- [ ] Portal deployed to `https://hexagon-portal.vercel.app/`
- [ ] Environment variables configured (.env.local)
- [ ] Auth token storage configured (localStorage)

### Sub-App Setup (for each: Viagens, Calibrações, Insumos)

- [ ] Copy `authGuard.ts` from Portal
- [ ] Copy `ProtectedRoute.tsx` component
- [ ] Wrap app with `<ProtectedRoute>` in main entry point
- [ ] Update Logout button to clear token and redirect to Portal
- [ ] Test authentication flow (see Testing section)
- [ ] Deploy to production URL

### Cross-Domain Configuration

- [ ] All apps on HTTPS in production
- [ ] CORS configured if needed
- [ ] localStorage accessible across same domain
- [ ] Session cookies not required (using localStorage)

---

## Testing Checklist

### Test 1: Portal Login
- [ ] Navigate to Portal
- [ ] Enter valid credentials
- [ ] Login succeeds and dashboard displays
- [ ] App cards are visible

### Test 2: Open App from Portal
- [ ] Click app card from dashboard
- [ ] App opens in new tab
- [ ] Sub-app displays without login prompt
- [ ] User context is available (email visible)

### Test 3: Direct Sub-App Access (No Session)
- [ ] Open sub-app URL directly in browser
- [ ] Redirect to Portal login occurs
- [ ] Login with valid credentials
- [ ] Redirect back to original sub-app
- [ ] Sub-app content displays

### Test 4: Session Expiration
- [ ] Manually set token `issuedAt` to 25 hours ago in localStorage
- [ ] Refresh sub-app page
- [ ] Redirect to Portal login occurs
- [ ] Login again
- [ ] Sub-app displays normally

### Test 5: Logout
- [ ] Click logout in sub-app
- [ ] Token cleared from localStorage
- [ ] Redirect to Portal occurs
- [ ] Portal login page displays

### Test 6: Cross-Tab Behavior
- [ ] Login in one tab (Portal)
- [ ] Open sub-app in another tab
- [ ] Sub-app should work (token in localStorage shared)
- [ ] Logout in one tab
- [ ] Refresh other tab
- [ ] Should redirect to Portal

---

## Security Considerations

### Token Management
- Tokens stored in localStorage (accessible to JavaScript)
- Use Content Security Policy (CSP) to prevent XSS
- 24-hour expiration reduces exposure window
- No sensitive data in token (only ID and email)

### HTTPS Requirement
- All production URLs must use HTTPS
- Prevents man-in-the-middle attacks
- localhost development OK without HTTPS

### User Validation
- Supabase validates password securely
- No password stored in token
- Status check prevents pending/blocked users

### Cross-Domain
- Same-origin localStorage prevents token theft
- Sub-apps on different domains cannot access Portal token
- returnTo parameter URL-encoded to prevent injection

---

## Troubleshooting

### Issue: Token Not Found After Portal Login
**Solution:**
- Check browser localStorage for `portal_auth` key
- Verify Portal domain matches sub-app domain (for same-domain storage)
- Check browser console for errors in `setAuthToken()` call

### Issue: Redirect Loop Between Portal and Sub-App
**Solution:**
- Verify token is being stored correctly in localStorage
- Check token `issuedAt` is current timestamp
- Clear localStorage and login again fresh

### Issue: returnTo Parameter Lost
**Solution:**
- Ensure URL parameters are properly encoded with `encodeURIComponent()`
- Verify Portal extracts parameter with `getReturnToParam()`
- Check browser console for redirect URL

### Issue: Sub-App Not Recognizing Token
**Solution:**
- Verify `authGuard.ts` is same version in Portal and sub-app
- Check localStorage key is exactly `"portal_auth"`
- Verify token JSON format matches interface

---

## Maintenance & Support

### Updating Token Expiration
Edit `src/utils/authGuard.ts`:
```typescript
const MAX_TOKEN_AGE = 24 * 60 * 60 * 1000; // Change as needed
```

### Monitoring
- Check Portal login success rate
- Monitor redirect chains (should be minimal)
- Track session expiration frequency
- Monitor sub-app access patterns

### Future Enhancements
- [ ] Refresh token mechanism (extend session without re-login)
- [ ] Silent token refresh (background)
- [ ] Multi-factor authentication (MFA)
- [ ] Session activity tracking
- [ ] Audit logging for auth events

---

## Glossary

| Term | Definition |
|------|-----------|
| **Portal** | Central authentication hub (hexagon-portal.vercel.app) |
| **Sub-App** | Independent application (Viagens, Calibrações, Insumos) |
| **Auth Token** | Data structure containing userId, email, issuedAt |
| **Session** | Valid authentication state (token exists and not expired) |
| **returnTo** | URL parameter to redirect user after login |
| **ProtectedRoute** | Component that validates auth before rendering |
| **Deep Link** | Direct URL to sub-app (bypasses Portal) |

---

## Document Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-14 | Initial implementation documentation |

---

## Quick Reference

### Setup New Sub-App
1. Copy `authGuard.ts` from Portal `src/utils/`
2. Copy `ProtectedRoute.tsx` from Portal `src/components/`
3. Wrap app with `<ProtectedRoute>` in `src/main.tsx`
4. Add logout button that calls `clearAuthToken()`
5. Test authentication flows
6. Deploy to production URL

### Portal Login URL
```
https://hexagon-portal.vercel.app/
With returnTo:
https://hexagon-portal.vercel.app/?returnTo=https://hexagon-viagens.vercel.app/
```

### Environment Variables
Portal and sub-apps need:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Token Validation
```typescript
const token = getAuthToken();
const isExpired = (Date.now() - token.issuedAt) > MAX_TOKEN_AGE;
const isValid = token && !isExpired;
```

---

**End of Documentation**
