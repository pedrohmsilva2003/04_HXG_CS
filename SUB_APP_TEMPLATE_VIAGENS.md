# Template: Travel App (Viagens) Sub-Application

This is a template guide for creating the Travel (Viagens) sub-application that runs under `/viagens` on the same domain as Portal.

## Project Setup

```bash
npm create vite@latest viagens -- --template react-ts
cd viagens
npm install
npm install react-router-dom lucide-react
```

## File Structure

```
viagens/
├── src/
│   ├── main.tsx              # Entry point
│   ├── App.tsx               # Main app with auth guard
│   ├── index.css             # Global styles
│   ├── pages/
│   │   ├── TravelList.tsx    # List all travel requests
│   │   ├── CreateTravel.tsx  # Create new travel
│   │   └── TravelDetails.tsx # View travel details
│   ├── utils/
│   │   └── authGuard.ts      # Copy from Portal
│   └── types.ts              # Type definitions
├── vite.config.ts            # Set base: '/viagens/'
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
  base: '/viagens/',
  plugins: [react()],
  server: {
    port: 3029,
    strictPort: true,
  },
});
```

### 2. src/App.tsx

```typescript
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { isAuthenticated } from './utils/authGuard';
import TravelList from './pages/TravelList';
import CreateTravel from './pages/CreateTravel';
import TravelDetails from './pages/TravelDetails';

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
    <BrowserRouter basename="/viagens">
      <Routes>
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <TravelList />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/create" 
          element={
            <ProtectedRoute>
              <CreateTravel />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/:id" 
          element={
            <ProtectedRoute>
              <TravelDetails />
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

### 5. index.html

```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Solicitação de Viagem</title>
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

# Terminal 2: Travel app (/viagens)
cd viagens
npm run dev
```

Visit `http://localhost:8000` with a local proxy, or:
- Portal: `http://localhost:3019`
- Viagens: `http://localhost:3029`

## Deployment to Vercel

1. Create a new Vercel project for the Travel app
2. Connect to your Git repository (viagens folder)
3. Set Build Command: `npm run build`
4. Set Output Directory: `dist`
5. Deploy
6. Configure custom domain routing to serve at `/viagens` on `portal.empresa.com`

## Important Notes

- **Auth Check**: The `ProtectedRoute` checks `portal_auth` in localStorage
- **Navigation**: Use relative paths (e.g., `/viagens/create`) or absolute links (e.g., `href="/viagens/create"`)
- **Back to Portal**: Add a link back to Portal: `<a href="/">← Voltar ao Portal</a>`
- **Local Storage**: Shares localStorage with Portal (same domain)
- **Environment Variables**: Create `.env.production` for API endpoints

## Example: TravelList Component

```typescript
import React, { useState, useEffect } from 'react';
import { getAuthToken } from '../utils/authGuard';

export default function TravelList() {
  const [travels, setTravels] = useState([]);
  const auth = getAuthToken();

  useEffect(() => {
    // Fetch travels for current user
    console.log('Fetching travels for user:', auth?.email);
    // TODO: Load travels from API
  }, [auth]);

  return (
    <div>
      <h1>Minhas Viagens</h1>
      <a href="/viagens/create">+ Nova Viagem</a>
      <div>
        {/* List travels */}
      </div>
      <a href="/">← Voltar ao Portal</a>
    </div>
  );
}
```

## Related Documentation

- [Main DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- [Portal Configuration](./DEPLOYMENT_GUIDE.md#portal-app-configuration)
- [Auth Guard Reference](./src/utils/authGuard.ts)
