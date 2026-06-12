# Sub-App Authentication Guard Template

This document provides a template for implementing centralized authentication in Hexagon sub-applications (Viagens, Calibrações, Insumos).

## Overview

All sub-apps must validate authentication through the Portal before allowing access. If no valid session exists, users are redirected to Portal for login, then returned to the original app.

**Key URLs:**
- Portal: `https://hexagon-portal.vercel.app/`
- Viagens: `https://hexagon-viagens.vercel.app/`
- Calibrações: `https://hexagon-calibracao.vercel.app/`
- Insumos: `https://hexagon-insumos.vercel.app/`

---

## Implementation Steps

### Step 1: Copy Auth Guard Utilities

Copy these files from Portal to your sub-app project:

```
src/utils/authGuard.ts          # Authentication token management
src/components/ProtectedRoute.tsx # Route protection wrapper
```

### Step 2: Wrap App with ProtectedRoute

Update your main entry point (`src/main.tsx` or `src/App.tsx`):

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ProtectedRoute } from './components/ProtectedRoute';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ProtectedRoute>
      <App />
    </ProtectedRoute>
  </React.StrictMode>
);
```

**What this does:**
- On app load, checks for valid authentication token from Portal
- If no token exists or it's expired, redirects to Portal login
- Passes current URL as `returnTo` parameter so user returns here after login
- Only renders app content if authentication is valid

### Step 3: Use Auth Token in Your App

To access authenticated user information in any component:

```tsx
import { useProtectedAuth } from '../components/ProtectedRoute';

const MyComponent: React.FC = () => {
  const token = useProtectedAuth();
  
  if (!token) {
    return <div>Redirecting...</div>;
  }
  
  return (
    <div>
      <p>Welcome, {token.email}</p>
      <p>User ID: {token.userId}</p>
    </div>
  );
};
```

### Step 4: Implement Logout

When user logs out, clear the Portal authentication:

```tsx
import { clearAuthToken } from '../utils/authGuard';

const handleLogout = () => {
  clearAuthToken();
  // Redirect to Portal
  window.location.href = 'https://hexagon-portal.vercel.app/';
};
```

---

## Authentication Flow Diagrams

### Flow 1: App Access via Portal (Normal)

```
User → Portal Dashboard
    ↓
  [Click App Card]
    ↓
  auth token stored in localStorage
  returnTo parameter added to URL
    ↓
  Sub-App Opens
    ↓
  [ProtectedRoute checks token]
    ↓
  Token Valid → Render App ✅
```

### Flow 2: Deep Link Access (No Session)

```
User → Direct URL to Sub-App
    ↓
  [ProtectedRoute checks token]
    ↓
  No Token Found → Redirect to Portal
    ↓
  Portal URL: https://hexagon-portal.vercel.app/?returnTo=[encoded sub-app URL]
    ↓
  User Logs In
    ↓
  Portal stores token + processes returnTo
    ↓
  Redirect to original Sub-App
    ↓
  [ProtectedRoute validates token]
    ↓
  Token Valid → Render App ✅
```

### Flow 3: Session Expired

```
User in Sub-App
    ↓
  [Token age > 24 hours]
    ↓
  useProtectedAuth() detects expired token
    ↓
  Redirect to Portal with returnTo parameter
    ↓
  User re-authenticates
    ↓
  Redirect back to Sub-App
```

---

## API Reference

### authGuard.ts Functions

#### `getAuthToken(): AuthToken | null`
Retrieve the current authentication token from localStorage.

```tsx
const token = getAuthToken();
if (token) {
  console.log('User email:', token.email);
  console.log('Token age:', Date.now() - token.issuedAt, 'ms');
}
```

#### `setAuthToken(userId, email, name?): void`
Store authentication token (called by Portal only).

```tsx
setAuthToken('user-123', 'user@example.com', 'John Doe');
```

#### `clearAuthToken(): void`
Remove authentication token (use on logout).

```tsx
clearAuthToken();
window.location.href = 'https://hexagon-portal.vercel.app/';
```

#### `isAuthenticated(): boolean`
Check if user is currently authenticated.

```tsx
if (isAuthenticated()) {
  // Show app content
} else {
  // Show redirect message
}
```

#### `getPortalLoginUrl(returnUrl?): string`
Get Portal login URL with optional returnTo parameter.

```tsx
const loginUrl = getPortalLoginUrl(window.location.href);
window.location.href = loginUrl;
```

#### `getReturnToParam(): string | null`
Extract returnTo parameter from current URL (set by Portal).

```tsx
const returnTo = getReturnToParam();
// Use this to redirect user after login
```

### ProtectedRoute Component

#### `<ProtectedRoute children fallback?>`
Wrapper component that validates authentication before rendering content.

**Props:**
- `children` (React.ReactNode): Component to render if authenticated
- `fallback` (React.ReactNode, optional): Component to show while validating

**Example:**
```tsx
<ProtectedRoute
  fallback={<LoadingScreen />}
>
  <Dashboard />
</ProtectedRoute>
```

#### `useProtectedAuth(): AuthToken`
Hook to access auth token and validate in any component.

**Throws:** Error if used outside ProtectedRoute context  
**Returns:** AuthToken if valid, otherwise redirects to Portal

**Example:**
```tsx
function Dashboard() {
  const token = useProtectedAuth();
  
  return <div>User: {token.email}</div>;
}
```

---

## Configuration

### Token Expiration (24 hours)

Token is considered valid for 24 hours from issue time. To modify:

**In `src/utils/authGuard.ts`:**
```tsx
const MAX_TOKEN_AGE = 24 * 60 * 60 * 1000; // Change this value
```

### Portal URL Configuration

For localhost development, the Portal URL is auto-detected. For production, update:

**In `src/utils/authGuard.ts`:**
```tsx
export const getPortalUrl = (): string => {
  // Customize logic here based on your deployment
  return 'https://hexagon-portal.vercel.app';
};
```

---

## Testing

### Test 1: Normal Flow (Via Portal)
1. Open Portal: `https://hexagon-portal.vercel.app/`
2. Login with valid credentials
3. Click app card (e.g., Viagens)
4. ✅ App should open with valid session

### Test 2: Deep Link (No Session)
1. Open sub-app directly: `https://hexagon-viagens.vercel.app/`
2. ✅ Should redirect to Portal login
3. Login with valid credentials
4. ✅ Should redirect back to Viagens with session

### Test 3: Session Expiration
1. Manually set token issuedAt to past: 
   ```tsx
   // In browser console:
   const token = JSON.parse(localStorage.getItem('portal_auth'));
   token.issuedAt = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
   localStorage.setItem('portal_auth', JSON.stringify(token));
   ```
2. Refresh app
3. ✅ Should redirect to Portal for re-authentication

### Test 4: Logout
1. Click Logout button in app
2. Token cleared from localStorage
3. ✅ Should redirect to Portal

---

## Troubleshooting

### Issue: Redirect Loop
**Cause:** ProtectedRoute redirecting infinitely  
**Solution:** Ensure Token is properly stored in localStorage before redirecting

### Issue: Token Not Shared Between Tabs
**Cause:** localStorage is domain-specific  
**Solution:** Confirm app is on same domain as Portal

### Issue: Expired Token Not Detected
**Cause:** Token age calculation issue  
**Solution:** Check browser system time and token `issuedAt` timestamp

### Issue: returnTo Parameter Lost
**Cause:** URL encoding issue  
**Solution:** Ensure parameter is properly decoded with `decodeURIComponent()`

---

## Security Considerations

1. **HTTPS Only:** All sub-apps must use HTTPS in production
2. **Token Storage:** localStorage is accessible to all scripts (use CSP)
3. **Token Expiration:** 24-hour limit reduces exposure window
4. **CORS:** Ensure Portal and sub-apps can communicate cross-domain
5. **No Password Storage:** Tokens contain only userId and email (no sensitive data)

---

## Example: Complete Sub-App Setup

**`src/main.tsx`:**
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ProtectedRoute } from './components/ProtectedRoute';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ProtectedRoute>
        <App />
      </ProtectedRoute>
    </BrowserRouter>
  </React.StrictMode>
);
```

**`src/App.tsx`:**
```tsx
import React from 'react';
import { useProtectedAuth } from './components/ProtectedRoute';
import { clearAuthToken } from './utils/authGuard';

function App() {
  const token = useProtectedAuth();

  const handleLogout = () => {
    clearAuthToken();
    window.location.href = 'https://hexagon-portal.vercel.app/';
  };

  return (
    <div>
      <header>
        <h1>Welcome, {token.email}!</h1>
        <button onClick={handleLogout}>Logout</button>
      </header>
      <main>
        {/* Your app content */}
      </main>
    </div>
  );
}

export default App;
```

---

## Support

For questions or issues:
1. Check troubleshooting section above
2. Review Portal implementation in `src/main.tsx`
3. Check browser console for error messages
4. Verify localStorage contains `portal_auth` token
