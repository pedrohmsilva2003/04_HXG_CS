# Multi-App Deployment - Implementation Checklist

## ✅ Portal App Configuration - COMPLETED

### Authentication & Token Management
- [x] Created `src/utils/authGuard.ts` with auth token functions
- [x] Updated `src/main.tsx` to import auth guard utilities
- [x] Modified `authService.login()` to call `setAuthToken(userId, email)` on success
- [x] Modified `authService.logout()` to call `clearAuthToken()` on logout
- [x] Auth token (`portal_auth`) stored in localStorage for sub-apps

### Navigation & Routing
- [x] Updated Dashboard to link to `/viagens` (was `/solicitacao-de-viagem`)
- [x] Dashboard already links to `/calibracoes`
- [x] Configured `vite.config.ts` with `base: '/'` for Portal root deployment
- [x] Created `vercel.json` with SPA routing rules

### Documentation
- [x] Created `DEPLOYMENT_GUIDE.md` - Complete deployment architecture guide
- [x] Created `SUB_APP_TEMPLATE_VIAGENS.md` - Travel app template with setup instructions
- [x] Created `SUB_APP_TEMPLATE_CALIBRACOES.md` - Calibration app template with setup instructions

---

## 🚀 Sub-Apps Configuration - TO IMPLEMENT

### Travel App (Viagens) at `/viagens`

**Setup Steps:**
1. Create new Vite project: `npm create vite@latest viagens -- --template react-ts`
2. Copy `src/utils/authGuard.ts` from Portal
3. Create `src/App.tsx` with `ProtectedRoute` component
4. Configure `vite.config.ts` with `base: '/viagens/'`
5. Create `vercel.json` with routing rules
6. Set `BrowserRouter basename="/viagens"` in router setup
7. Add link back to Portal: `<a href="/">← Voltar ao Portal</a>`
8. Deploy to Vercel

**Reference:** See `SUB_APP_TEMPLATE_VIAGENS.md`

### Calibration App (Calibrações) at `/calibracoes`

**Setup Steps:**
1. Create new Vite project: `npm create vite@latest calibracoes -- --template react-ts`
2. Copy `src/utils/authGuard.ts` from Portal
3. Create `src/App.tsx` with `ProtectedRoute` component
4. Configure `vite.config.ts` with `base: '/calibracoes/'`
5. Create `vercel.json` with routing rules
6. Set `BrowserRouter basename="/calibracoes"` in router setup
7. Add link back to Portal: `<a href="/">← Voltar ao Portal</a>`
8. Deploy to Vercel

**Reference:** See `SUB_APP_TEMPLATE_CALIBRACOES.md`

---

## 📋 Vercel Deployment Checklist

### Portal App
- [ ] Test locally: `npm run dev` (port 3019)
- [ ] Test build: `npm run build`
- [ ] Push to GitHub/GitLab
- [ ] Create Vercel project for Portal
- [ ] Deploy to `portal.empresa.com` (root)
- [ ] Verify `vercel.json` SPA routing works

### Travel App (Viagens)
- [ ] Implement using template `SUB_APP_TEMPLATE_VIAGENS.md`
- [ ] Test locally: `npm run dev` (port 3029)
- [ ] Test with Portal proxy at `http://localhost:8000/viagens`
- [ ] Test auth guard: Try accessing without logging in Portal
- [ ] Create Vercel project for Viagens
- [ ] Deploy to Vercel (configure for `/viagens` subpath)
- [ ] Add auth guard redirect test

### Calibration App (Calibrações)
- [ ] Implement using template `SUB_APP_TEMPLATE_CALIBRACOES.md`
- [ ] Test locally: `npm run dev` (port 3039)
- [ ] Test with Portal proxy at `http://localhost:8000/calibracoes`
- [ ] Test auth guard: Try accessing without logging in Portal
- [ ] Create Vercel project for Calibrações
- [ ] Deploy to Vercel (configure for `/calibracoes` subpath)
- [ ] Add auth guard redirect test

### Domain & DNS Configuration
- [ ] Configure primary domain: `portal.empresa.com` → Portal Vercel deployment
- [ ] Configure subpath routing: `/viagens` → Viagens Vercel deployment
- [ ] Configure subpath routing: `/calibracoes` → Calibrações Vercel deployment
- [ ] Test full flow: Login → Navigate to /viagens → Access app → Logout → Redirect to login
- [ ] Test localStorage sharing: Logout on Portal → Sub-app detects and redirects

---

## 🧪 Local Testing Setup

### Using Local Proxy (Recommended)

Install nginx or use a local proxy to simulate the production environment:

```bash
# Terminal 1: Portal
cd portal
npm run dev  # Runs on http://localhost:3019

# Terminal 2: Travel App
cd viagens
npm run dev  # Runs on http://localhost:3029

# Terminal 3: Calibration App
cd calibracoes
npm run dev  # Runs on http://localhost:3039

# Terminal 4: Nginx/Proxy (or use port forwarding)
# Configure proxy to forward:
# http://localhost:8000/ → http://localhost:3019
# http://localhost:8000/viagens → http://localhost:3029
# http://localhost:8000/calibracoes → http://localhost:3039
```

### Quick Test Without Proxy

1. Open Portal: http://localhost:3019
2. Login with valid credentials
3. Check browser DevTools > Storage > localStorage for `portal_auth` token
4. Open Viagens in new tab: http://localhost:3029
5. Should show content (token exists in localStorage)
6. Go back to Portal and click "Sair"
7. Open Viagens again (http://localhost:3029)
8. Should redirect to Portal login (token was cleared)

---

## 🔐 Security Considerations

### Current Implementation
- Simple localStorage token (suitable for internal/development)
- Token contains only `userId` and `email`
- Shared localStorage across same domain

### Production Improvements Needed
- [ ] Implement JWT tokens with expiration
- [ ] Add token validation on backend
- [ ] Implement secure httpOnly cookies (if possible with SPA)
- [ ] Add CORS headers for API calls
- [ ] Implement refresh token mechanism
- [ ] Add session timeout detection
- [ ] Encrypt sensitive data in transit (HTTPS)

---

## 📁 Final Project Structure

```
projeto-portal/
├── portal/                    # Main Portal App (root)
│   ├── src/
│   │   ├── utils/
│   │   │   └── authGuard.ts  # ✅ Shared auth utilities
│   │   ├── main.tsx          # ✅ Updated auth calls
│   │   └── ...
│   ├── vite.config.ts        # ✅ base: '/'
│   ├── vercel.json           # ✅ SPA routing
│   └── package.json
│
├── viagens/                   # Travel App (/viagens)
│   ├── src/
│   │   ├── utils/
│   │   │   └── authGuard.ts  # Copy from portal
│   │   ├── App.tsx           # With ProtectedRoute
│   │   └── ...
│   ├── vite.config.ts        # base: '/viagens/'
│   ├── vercel.json           # Subpath routing
│   └── package.json
│
└── calibracoes/               # Calibration App (/calibracoes)
    ├── src/
    │   ├── utils/
    │   │   └── authGuard.ts  # Copy from portal
    │   ├── App.tsx           # With ProtectedRoute
    │   └── ...
    ├── vite.config.ts        # base: '/calibracoes/'
    ├── vercel.json           # Subpath routing
    └── package.json

Plus Documentation:
├── DEPLOYMENT_GUIDE.md               # ✅ Complete architecture guide
├── SUB_APP_TEMPLATE_VIAGENS.md       # ✅ Travel app template
└── SUB_APP_TEMPLATE_CALIBRACOES.md   # ✅ Calibration app template
```

---

## 🔗 Key Integration Points

### Portal → Sub-Apps
```
1. User logs in at /
2. Portal calls setAuthToken(userId, email)
3. localStorage["portal_auth"] is set
4. Navigation links to /viagens or /calibracoes
```

### Sub-Apps → Portal
```
1. Sub-app loads and checks isAuthenticated()
2. If no token: redirect to window.location.href = "/"
3. If token exists: load app normally
4. On Portal logout: clearAuthToken() removes token
5. Next sub-app access detects missing token and redirects
```

### Cross-Domain Considerations
- All apps MUST be on same domain (portal.empresa.com)
- localStorage is NOT shared across different domains
- If apps are on different domains (viagens.empresa.com), implement server-side session or external auth service

---

## 📞 Support & References

- **Auth Guard API**: `src/utils/authGuard.ts`
- **Deployment Architecture**: `DEPLOYMENT_GUIDE.md`
- **Travel App Setup**: `SUB_APP_TEMPLATE_VIAGENS.md`
- **Calibration App Setup**: `SUB_APP_TEMPLATE_CALIBRACOES.md`
- **Vite Docs**: https://vitejs.dev/
- **Vercel Docs**: https://vercel.com/docs
- **React Router**: https://reactrouter.com/

---

## ✨ Next Steps

1. **Review Portal changes**: All auth and routing updates are complete
2. **Create Travel App**: Follow `SUB_APP_TEMPLATE_VIAGENS.md`
3. **Create Calibration App**: Follow `SUB_APP_TEMPLATE_CALIBRACOES.md`
4. **Test locally**: Use proxy to simulate production environment
5. **Deploy to Vercel**: Deploy each app as separate project
6. **Configure DNS**: Point domain to Portal, subpaths to respective apps
7. **Monitor & Iterate**: Check logs, test edge cases, refine security

---

**Last Updated**: January 9, 2026
**Status**: Portal Configuration Complete ✅ | Sub-Apps Pending Implementation 🔄
