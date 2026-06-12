# Template: Calibration App (Calibrações) Sub-Application

This is a template guide for creating the Calibration (Calibrações) sub-application that runs under `/calibracoes` on the same domain as Portal.

## Project Setup

```bash
npm create vite@latest calibracoes -- --template react-ts
cd calibracoes
npm install
npm install react-router-dom lucide-react
```

## File Structure

```
calibracoes/
├── src/
│   ├── main.tsx              # Entry point
│   ├── App.tsx               # Main app with auth guard
│   ├── index.css             # Global styles
│   ├── pages/
│   │   ├── CalibrationList.tsx    # List all calibrations
│   │   ├── CreateCalibration.tsx  # Create new calibration
│   │   └── CalibrationDetails.tsx # View calibration details
│   ├── utils/
│   │   └── authGuard.ts      # Copy from Portal
│   └── types.ts              # Type definitions
├── vite.config.ts            # Set base: '/calibracoes/'
├── vercel.json               # Vercel routing config
├── tsconfig.json
├── index.html
└── package.json
```

## Key Files

### 1. vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // IMPORTANT: Set base to subpath where app will be deployed
  base: '/calibracoes/',
  plugins: [react()],
  server: {
    port: 3039,
    strictPort: true,
  },
});
```

### 2. src/App.tsx

```typescript
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { isAuthenticated } from './utils/authGuard';
import CalibrationList from './pages/CalibrationList';
import CreateCalibration from './pages/CreateCalibration';
import CalibrationDetails from './pages/CalibrationDetails';

/**
 * Protected Route Component
 * Checks if user is authenticated via Portal
 * Redirects to Portal login if not authenticated
 */
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
    <BrowserRouter basename="/calibracoes">
      <Routes>
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <CalibrationList />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/create" 
          element={
            <ProtectedRoute>
              <CreateCalibration />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/:id" 
          element={
            <ProtectedRoute>
              <CalibrationDetails />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}
```

### 3. src/main.tsx

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

### 4. vercel.json

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "routes": [
    {
      "src": "/calibracoes/(.*)",
      "status": 200,
      "dest": "/calibracoes/index.html"
    },
    {
      "src": "/(.*)",
      "dest": "/"
    }
  ]
}
```

### 5. index.html

```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Calibrações</title>
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### 6. utils/authGuard.ts

Copy this file from Portal's `src/utils/authGuard.ts`:

```typescript
/**
 * Auth Guard Utility - Used by sub-apps to verify authentication
 * Portal stores "portal_auth" token in localStorage when user logs in
 */

export interface AuthToken {
  userId: string;
  email: string;
  issuedAt: number;
}

const AUTH_KEY = 'portal_auth';

export const getAuthToken = (): AuthToken | null => {
  try {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) return null;
    const parsed = JSON.parse(token);
    if (parsed.userId && parsed.email) {
      return parsed;
    }
    return null;
  } catch (error) {
    console.error('Error reading auth token:', error);
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  return getAuthToken() !== null;
};

export const getAuthToken = (): AuthToken | null => {
  // ... implementation
};
```

## Development

```bash
# Terminal 1: Portal (root)
cd ../portal
npm run dev

# Terminal 2: Calibration app (/calibracoes)
cd calibracoes
npm run dev
```

Visit `http://localhost:8000` with a local proxy, or:
- Portal: `http://localhost:3019`
- Calibrações: `http://localhost:3039`

## Deployment to Vercel

1. Create a new Vercel project for the Calibration app
2. Connect to your Git repository (calibracoes folder)
3. Set Build Command: `npm run build`
4. Set Output Directory: `dist`
5. Deploy
6. Configure custom domain routing to serve at `/calibracoes` on `portal.empresa.com`

## Important Notes

- **Auth Check**: The `ProtectedRoute` checks `portal_auth` in localStorage
- **Navigation**: Use relative paths (e.g., `/calibracoes/create`) or absolute links (e.g., `href="/calibracoes/create"`)
- **Back to Portal**: Add a link back to Portal: `<a href="/">← Voltar ao Portal</a>`
- **Local Storage**: Shares localStorage with Portal (same domain)
- **Environment Variables**: Create `.env.production` for API endpoints

## Example: CalibrationList Component

```typescript
import React, { useState, useEffect } from 'react';
import { getAuthToken } from '../utils/authGuard';

export default function CalibrationList() {
  const [calibrations, setCalbrations] = useState([]);
  const auth = getAuthToken();

  useEffect(() => {
    // Fetch calibrations for current user
    console.log('Fetching calibrations for user:', auth?.email);
    // TODO: Load calibrations from API
  }, [auth]);

  return (
    <div>
      <h1>Minhas Calibrações</h1>
      <a href="/calibracoes/create">+ Nova Calibração</a>
      <div>
        {/* List calibrations */}
      </div>
      <a href="/">← Voltar ao Portal</a>
    </div>
  );
}
```

## Shared Authentication

Both sub-apps check the same `portal_auth` token. When a user logs out from Portal, the token is removed from localStorage, and both sub-apps will automatically redirect to login.

**Portal Logout Flow:**
1. User clicks "Sair" in Portal
2. Portal calls `clearAuthToken()` → removes `portal_auth`
3. User navigates to `/viagens` or `/calibracoes`
4. Sub-app checks `isAuthenticated()` → returns false
5. Sub-app redirects to `/` (Portal login)

## Related Documentation

- [Main DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- [Portal Configuration](./DEPLOYMENT_GUIDE.md#portal-app-configuration)
- [Travel App Template](./SUB_APP_TEMPLATE_VIAGENS.md)
- [Auth Guard Reference](./src/utils/authGuard.ts)
