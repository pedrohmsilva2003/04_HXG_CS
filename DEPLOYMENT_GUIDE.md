# Multi-App Deployment on Vercel with Single Domain

## Overview

This guide explains how to deploy the Portal HXG ecosystem on Vercel with a single domain and multiple applications under subpaths:

- **Portal (Main)**: https://portal.empresa.com/ - Authentication gateway
- **Travel App**: https://portal.empresa.com/viagens - Protected route
- **Calibration App**: https://portal.empresa.com/calibracoes - Protected route

## Architecture

### Authentication Flow

```
1. User visits https://portal.empresa.com/
2. User logs in via Portal login page
3. On successful login:
   - Portal stores user data in localStorage (current_user)
   - Portal stores auth token in localStorage (portal_auth)
4. Portal provides navigation links to /viagens and /calibracoes
5. When user navigates to /viagens or /calibracoes:
   - Sub-app checks for "portal_auth" token
   - If authenticated: display app
   - If not authenticated: redirect to / (Portal login)
```

### Cross-Origin LocalStorage

All apps on the same domain (portal.empresa.com) share the same localStorage. This allows:
- Portal to store `portal_auth` token
- Sub-apps to check `portal_auth` without API calls
- Logout on Portal immediately affects all sub-apps

## Portal App Configuration

### 1. Authentication Storage

The Portal app now stores an auth token when user logs in:

**File**: `src/utils/authGuard.ts`
- `setAuthToken(userId, email)` - Called on login success
- `clearAuthToken()` - Called on logout
- `getAuthToken()` - Retrieves token (used by sub-apps)
- `isAuthenticated()` - Checks if token exists

**Updated in**: `src/main.tsx`
```tsx
// After successful login
setAuthToken(user.id, user.email);

// On logout
clearAuthToken();
```

### 2. Navigation Links

Add navigation links in Dashboard or Header to allow users to access sub-apps:

```tsx
// Example: Add to header or dashboard
<a href="/viagens" style={{...}}>Viagens</a>
<a href="/calibracoes" style={{...}}>Calibrações</a>
```

### 3. Vite Configuration

Portal uses root base URL (`/`):

**File**: `vite.config.ts`
```typescript
export default defineConfig({
  base: '/',
  // ... rest of config
});
```

### 4. Vercel Configuration

**File**: `vercel.json`
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "routes": [
    {
      "src": "/(?!api)",
      "status": 200,
      "dest": "/index.html"
    }
  ]
}
```

## Sub-App Setup (Travel & Calibration)

### Step 1: Create Sub-App Project

For each sub-app (Travel at `/viagens` and Calibration at `/calibracoes`), create a new Vite + React project:

```bash
npm create vite@latest viagens -- --template react-ts
cd viagens
npm install
npm install react-router-dom lucide-react
```

Copy `src/utils/authGuard.ts` from Portal to each sub-app.

### Step 2: Add Auth Guard

**File**: `src/App.tsx` (or main entry component)

```tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './utils/authGuard';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!isAuthenticated()) {
    // Redirect to Portal login
    window.location.href = '/';
    return null;
  }
  return <>{children}</>;
};

export default function App() {
  return (
    <BrowserRouter basename="/viagens">
      <Routes>
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <YourMainComponent />
            </ProtectedRoute>
          } 
        />
        {/* Other routes... */}
      </Routes>
    </BrowserRouter>
  );
}
```

### Step 3: Configure Vite for Subpath

**File**: `vite.config.ts` (for sub-app)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Set base to subpath - Travel app
  base: '/viagens/',
  plugins: [react()],
  // ... rest of config
});
```

For Calibration, use `base: '/calibracoes/'`

### Step 4: Configure Vercel for Sub-App

**File**: `vercel.json` (for sub-app)

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "routes": [
    {
      "src": "/viagens/(.*)",
      "status": 200,
      "dest": "/viagens/index.html"
    },
    {
      "src": "/(.*)",
      "dest": "/"
    }
  ]
}
```

For Calibration, replace `viagens` with `calibracoes`.

## Deployment Strategy

### Option 1: Monorepo Approach (Recommended)

Structure your Vercel organization as a monorepo:

```
projeto-portal/
├── portal/           # Main Portal app
│   ├── src/
│   ├── vite.config.ts
│   ├── vercel.json
│   └── package.json
├── viagens/          # Travel sub-app
│   ├── src/
│   ├── vite.config.ts
│   ├── vercel.json
│   └── package.json
└── calibracoes/      # Calibration sub-app
    ├── src/
    ├── vite.config.ts
    ├── vercel.json
    └── package.json
```

Deploy each app to Vercel separately, but they share the same domain via DNS configuration.

### Option 2: Separate Vercel Projects with Custom Domain

1. **Portal**: Deploy at `portal.empresa.com` (or use Vercel's default domain)
2. **Viagens**: Deploy at separate Vercel project, configured to serve at `/viagens` via DNS/proxy
3. **Calibracoes**: Deploy at separate Vercel project, configured to serve at `/calibracoes` via DNS/proxy

### Option 3: Single Monorepo with Routes

Use Vercel's monorepo feature with a root `vercel.json` that routes requests:

```json
{
  "version": 2,
  "routes": [
    {
      "src": "/",
      "dest": "/portal"
    },
    {
      "src": "/viagens(.*)",
      "dest": "/viagens$1"
    },
    {
      "src": "/calibracoes(.*)",
      "dest": "/calibracoes$1"
    }
  ]
}
```

## Testing Locally

### Development Setup

1. **Portal** (port 3019):
```bash
cd portal
npm run dev
```

2. **Travel App** (port 3029):
```bash
cd viagens
VITE_BASE=/viagens npm run dev
```

3. **Calibration App** (port 3039):
```bash
cd calibracoes
VITE_BASE=/calibracoes npm run dev
```

### Using a Local Proxy

For testing locally with the same domain structure, use nginx or a local proxy server to route:
- `localhost:8000/` → Portal on 3019
- `localhost:8000/viagens` → Viagens on 3029
- `localhost:8000/calibracoes` → Calibracoes on 3039

## Security Considerations

1. **Auth Token**: Simple localStorage token (not secure for production)
   - Consider JWT tokens with expiration
   - Add token validation on backend

2. **CORS**: All apps on same domain - no CORS issues
   - If APIs are separate, configure CORS headers properly

3. **Session Management**:
   - Logout on one app logs out all apps (shared localStorage)
   - Add heartbeat check to detect session expiration

4. **Environment Variables**:
   - Each app should have its own `.env.production`
   - API endpoints should be environment-specific

## Common Issues & Solutions

### Issue: Blank page on sub-app load
**Solution**: Ensure `basename` in BrowserRouter matches the subpath
```tsx
<BrowserRouter basename="/viagens">
```

### Issue: Assets not loading (404)
**Solution**: Check `base` in `vite.config.ts`
```typescript
base: '/viagens/',  // Must end with /
```

### Issue: Auth check redirects endlessly
**Solution**: Add a loading state to prevent race conditions
```tsx
const [isChecking, setIsChecking] = useState(true);
useEffect(() => {
  if (!isAuthenticated()) {
    window.location.href = '/';
  } else {
    setIsChecking(false);
  }
}, []);
```

### Issue: localStorage not shared between apps
**Solution**: Ensure all apps are on same domain (not subdomains)
- ✅ `portal.empresa.com` and `portal.empresa.com/viagens`
- ❌ `portal.empresa.com` and `viagens.empresa.com` (different domains)

## Deployment Checklist

- [ ] Portal app configured with `base: '/'`
- [ ] Portal stores `portal_auth` token on login
- [ ] Portal clears `portal_auth` token on logout
- [ ] Portal has navigation links to sub-apps
- [ ] Sub-apps have `ProtectedRoute` component
- [ ] Sub-apps configured with correct `base` (e.g., `/viagens/`)
- [ ] Sub-apps have `basename` in BrowserRouter
- [ ] Each app has `vercel.json` configured
- [ ] All apps share same custom domain (portal.empresa.com)
- [ ] Test locally with proxy server
- [ ] Deploy Portal first (handles root routes)
- [ ] Deploy sub-apps to Vercel
- [ ] Configure Vercel routes to point to correct projects
- [ ] Test auth flow across apps
- [ ] Test logout on Portal affects sub-apps

## Navigation Example

Add this to Portal's Dashboard or Header:

```tsx
<div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
  <a 
    href="/viagens"
    style={{
      padding: '12px 24px',
      background: '#005198',
      color: 'white',
      borderRadius: '8px',
      textDecoration: 'none',
      fontWeight: '600',
    }}
  >
    Solicitar Viagem
  </a>
  <a 
    href="/calibracoes"
    style={{
      padding: '12px 24px',
      background: '#005198',
      color: 'white',
      borderRadius: '8px',
      textDecoration: 'none',
      fontWeight: '600',
    }}
  >
    Calibrações
  </a>
</div>
```

## Resources

- [Vite Documentation](https://vitejs.dev/)
- [Vercel Documentation](https://vercel.com/docs)
- [React Router v7](https://reactrouter.com/)
- [localStorage MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
