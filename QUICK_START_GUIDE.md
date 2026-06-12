# Multi-App Portal Deployment - Implementation Summary

## Overview

Your Portal HXG application is now configured to serve as the authentication gateway for a multi-app ecosystem on a single domain with subpaths:

- **Portal (Root)**: `https://portal.empresa.com/` — Authentication & app gateway
- **Travel App**: `https://portal.empresa.com/viagens` — Protected route
- **Calibration App**: `https://portal.empresa.com/calibracoes` — Protected route

---

## ✅ What's Been Implemented

### Portal App (Main Entry Point)

**Authentication System:**
- ✅ Login stores user data in localStorage (`current_user`)
- ✅ Login stores auth token in localStorage (`portal_auth`) for sub-apps
- ✅ Logout clears both auth token and user data
- ✅ Auth token contains `userId` and `email`

**File**: `src/utils/authGuard.ts`
```typescript
export const setAuthToken = (userId: string, email: string): void
export const clearAuthToken = (): void
export const getAuthToken = (): AuthToken | null
export const isAuthenticated = (): boolean
```

**Updated Files**:
- `src/main.tsx` — imports and uses auth guard
- `vite.config.ts` — set `base: '/'` for root deployment
- `vercel.json` — SPA routing configuration
- Dashboard app links updated: `/viagens` and `/calibracoes`

### Documentation Provided

1. **DEPLOYMENT_GUIDE.md** (12KB)
   - Complete architecture overview
   - Portal configuration details
   - Sub-app setup instructions
   - Vercel deployment strategies
   - Local testing setup
   - Security considerations
   - Troubleshooting guide

2. **IMPLEMENTATION_CHECKLIST.md** (6KB)
   - Step-by-step checklist for all tasks
   - Local testing procedures
   - Security improvements checklist
   - Final project structure
   - Next steps

3. **SUB_APP_TEMPLATE_VIAGENS.md** (7KB)
   - Complete travel app template
   - File-by-file setup instructions
   - Key code examples
   - Deployment guide

4. **SUB_APP_TEMPLATE_CALIBRACOES.md** (7KB)
   - Complete calibration app template
   - File-by-file setup instructions
   - Key code examples
   - Deployment guide

---

## 🔄 How It Works

### Authentication Flow

```
1. User accesses https://portal.empresa.com/
   ↓
2. Portal login page displayed
   ↓
3. User enters credentials and clicks "Entrar"
   ↓
4. Portal validates credentials against Supabase (app_users table)
   ↓
5. On success:
   - localStorage["current_user"] = { id, name, email, role, ... }
   - localStorage["portal_auth"] = { userId, email, issuedAt }
   - User sees Dashboard with app links
   ↓
6. User clicks "Solicitação de Viagem" link → navigates to /viagens
   ↓
7. Travel app loads and immediately checks:
   - isAuthenticated() → checks localStorage["portal_auth"]
   - If found: displays app
   - If not found: redirects to window.location.href = "/"
   ↓
8. Sub-app uses getAuthToken() to identify current user
```

### Logout Flow

```
1. User clicks "Sair" button in Portal header
   ↓
2. Portal calls:
   - localStorage.removeItem("current_user")
   - clearAuthToken() → localStorage.removeItem("portal_auth")
   ↓
3. User is shown login page
   ↓
4. If user was in Travel app (/viagens):
   - Sub-app checks isAuthenticated() on next interaction
   - Token is missing, so app redirects to /
   ↓
5. User is back at Portal login page
```

---

## 🚀 Next Steps for Sub-Apps

### Travel App (Viagens)

```bash
# 1. Create new Vite project
npm create vite@latest viagens -- --template react-ts
cd viagens
npm install
npm install react-router-dom lucide-react

# 2. Follow setup in SUB_APP_TEMPLATE_VIAGENS.md
# - Copy src/utils/authGuard.ts from Portal
# - Create src/App.tsx with ProtectedRoute
# - Configure vite.config.ts with base: '/viagens/'
# - Create vercel.json with routing rules
# - Set BrowserRouter basename="/viagens"

# 3. Test locally
npm run dev  # Runs on http://localhost:3029

# 4. Deploy to Vercel
# - Create new Vercel project
# - Set build command: npm run build
# - Set output directory: dist
# - Configure custom domain routing
```

### Calibration App (Calibrações)

```bash
# Same as Travel app, but:
# - base: '/calibracoes/'
# - BrowserRouter basename="/calibracoes"
# - Runs on http://localhost:3039
# - Routes requests to /calibracoes/*
```

---

## 📋 Key Configuration Files

### Portal: vite.config.ts
```typescript
export default defineConfig({
  base: '/',  // Root deployment
  plugins: [react()],
  // ...
});
```

### Portal: vercel.json
```json
{
  "version": 2,
  "routes": [
    {
      "src": "/(?!api)",
      "status": 200,
      "dest": "/index.html"
    }
  ]
}
```

### Sub-App: vite.config.ts (example: viagens)
```typescript
export default defineConfig({
  base: '/viagens/',  // Subpath deployment
  plugins: [react()],
  server: {
    port: 3029,
  }
});
```

### Sub-App: vercel.json (example: viagens)
```json
{
  "version": 2,
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

---

## 🧪 Local Testing

### Test Authentication Flow

**Terminal 1**: Portal
```bash
cd portal
npm run dev
```

**Terminal 2**: Travel App
```bash
cd viagens
npm run dev
```

**Browser Testing**:
1. Open http://localhost:3019 (Portal)
2. Log in with valid credentials
3. Check DevTools → Storage → localStorage for `portal_auth` token
4. Open http://localhost:3029 (Travel app) in new tab
5. Travel app should display content (not redirect)
6. Go back to Portal and click "Sair"
7. Check localStorage — `portal_auth` should be gone
8. Open Travel app again in same browser
9. Travel app should redirect to http://localhost:3019 (Portal login)

### Using a Local Proxy (Production Simulation)

Install and configure nginx or use a local proxy server:

```nginx
# Example nginx config
server {
    listen 8000;
    server_name localhost;

    location / {
        proxy_pass http://localhost:3019;
    }
    
    location /viagens {
        proxy_pass http://localhost:3029;
    }
    
    location /calibracoes {
        proxy_pass http://localhost:3039;
    }
}
```

Then test: http://localhost:8000/

---

## 🔐 Security Notes

### Current Implementation
- ✅ Simple, lightweight token in localStorage
- ✅ Suitable for internal applications
- ✅ Automatic logout across all sub-apps

### For Production
- [ ] Implement JWT tokens with expiration
- [ ] Validate tokens on backend
- [ ] Use secure httpOnly cookies if possible
- [ ] Implement CSRF protection
- [ ] Add rate limiting on login endpoint
- [ ] Monitor suspicious login attempts
- [ ] Implement session timeout (e.g., 30 min of inactivity)

---

## 📁 Project Structure After Implementation

```
projeto-portal/
│
├── portal/                      (Main app - root /)
│   ├── src/
│   │   ├── utils/
│   │   │   └── authGuard.ts    ✅ Shared auth utilities
│   │   ├── main.tsx            ✅ Updated auth system
│   │   ├── components/
│   │   ├── services/
│   │   └── ...
│   ├── vite.config.ts          ✅ base: '/'
│   ├── vercel.json             ✅ SPA routing
│   ├── DEPLOYMENT_GUIDE.md     ✅ Architecture guide
│   ├── IMPLEMENTATION_CHECKLIST.md ✅ Deployment checklist
│   ├── SUB_APP_TEMPLATE_VIAGENS.md ✅ Travel app template
│   ├── SUB_APP_TEMPLATE_CALIBRACOES.md ✅ Calibration app template
│   └── package.json
│
├── viagens/                     (Travel app - /viagens)
│   ├── src/
│   │   ├── utils/
│   │   │   └── authGuard.ts    📋 Copy from portal
│   │   ├── App.tsx             📋 With ProtectedRoute
│   │   ├── pages/
│   │   └── ...
│   ├── vite.config.ts          📋 base: '/viagens/'
│   ├── vercel.json             📋 Subpath routing
│   └── package.json
│
└── calibracoes/                 (Calibration app - /calibracoes)
    ├── src/
    │   ├── utils/
    │   │   └── authGuard.ts    📋 Copy from portal
    │   ├── App.tsx             📋 With ProtectedRoute
    │   ├── pages/
    │   └── ...
    ├── vite.config.ts          📋 base: '/calibracoes/'
    ├── vercel.json             📋 Subpath routing
    └── package.json

Legend:
✅ = Already implemented
📋 = To be implemented (use templates)
```

---

## 🎯 Implementation Timeline

**Phase 1: Portal (DONE)** ✅
- ✅ Auth token system implemented
- ✅ Navigation links configured
- ✅ Documentation created
- ✅ Vite & Vercel config ready

**Phase 2: Travel App (Next)**
- Create project from template
- Implement ProtectedRoute
- Test authentication
- Deploy to Vercel

**Phase 3: Calibration App**
- Create project from template
- Implement ProtectedRoute
- Test authentication
- Deploy to Vercel

**Phase 4: Integration & Launch**
- Configure domain DNS
- Test cross-app navigation
- Performance testing
- Security audit
- Launch on production

---

## 📚 Documentation Reference

| Document | Purpose | Audience |
|----------|---------|----------|
| DEPLOYMENT_GUIDE.md | Architecture, setup, troubleshooting | Developers |
| IMPLEMENTATION_CHECKLIST.md | Task tracking, verification | Project Managers |
| SUB_APP_TEMPLATE_VIAGENS.md | Travel app implementation | Developers |
| SUB_APP_TEMPLATE_CALIBRACOES.md | Calibration app implementation | Developers |
| src/utils/authGuard.ts | API reference | Developers |

---

## 💡 Key Concepts

### Why Subpaths Instead of Subdomains?
- ✅ Single domain simplifies DNS & SSL
- ✅ localStorage is shared (enables cross-app auth)
- ✅ No CORS issues
- ✅ Easier to manage in Vercel
- ❌ Subdomains would require separate auth systems or server-side sessions

### Why Not Merge All Apps into One?
- ✅ Independent development teams can work in parallel
- ✅ Separate deployments = faster iteration
- ✅ Smaller bundle sizes per app
- ✅ Easy to add new apps later
- ❌ Monolith would be harder to scale

### Why Use Vercel?
- ✅ Built for SPA/Vite projects
- ✅ Automatic deployments from Git
- ✅ Free tier suitable for internal apps
- ✅ Edge functions for advanced routing
- ✅ Environment variables per project

---

## 🆘 Troubleshooting

### Auth Token Not Persisting
**Check**:
1. Open DevTools → Application → localStorage
2. Look for `portal_auth` key after login
3. If missing: Check browser console for errors
4. Solution: Verify `setAuthToken()` is called in login handler

### Sub-App Doesn't Load
**Check**:
1. Is `basename` set correctly in BrowserRouter?
2. Is `base` set correctly in vite.config.ts?
3. Check browser console for routing errors
4. Try: `<BrowserRouter basename="/viagens">`

### Endless Redirect Loop
**Check**:
1. Is `isAuthenticated()` check happening before render?
2. Add loading state: `const [isChecking, setIsChecking] = useState(true)`
3. Only check auth once at app initialization
4. Solution: Use `useEffect` for one-time auth check

### Portal Login Not Storing Token
**Check**:
1. Is `setAuthToken(user.id, user.email)` called?
2. Is it after `localStorage.setItem('current_user', ...)`?
3. Check for JavaScript errors in login handler
4. Solution: Add `console.log('Token stored:', localStorage.getItem('portal_auth'))`

---

## 📞 Quick Links

- **Vite Documentation**: https://vitejs.dev/
- **Vercel Docs**: https://vercel.com/docs
- **React Router v7**: https://reactrouter.com/
- **localStorage MDN**: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
- **SPA Routing Guide**: https://vercel.com/docs/routing/rewrites#rewriting-to-a-public-file

---

## ✨ Summary

Your Portal HXG is now ready to serve as the authentication gateway for multiple applications. All the foundation is in place:

1. ✅ **Auth system**: Tokens stored in localStorage
2. ✅ **Routing**: Sub-app links in Dashboard
3. ✅ **Configuration**: Vite and Vercel configs ready
4. ✅ **Documentation**: Complete guides for sub-apps
5. ✅ **Templates**: Ready-to-use code for Travel & Calibration apps

**Next action**: Start building the Travel app following `SUB_APP_TEMPLATE_VIAGENS.md`

---

**Created**: January 9, 2026  
**Status**: ✅ Portal Configuration Complete | 🔄 Sub-Apps Ready for Implementation
