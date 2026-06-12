# Architecture Diagrams & System Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     SINGLE DOMAIN                               │
│                  portal.empresa.com                             │
│                                                                 │
│  ┌──────────────────┐   ┌──────────────────┐ ┌──────────────┐  │
│  │   Portal Root    │   │    /viagens      │ │ /calibracoes │  │
│  │        /         │   │  (Travel App)    │ │  (Calib App) │  │
│  │                  │   │                  │ │              │  │
│  │ ✅ Login         │   │ 🔐 Protected     │ │ 🔐 Protected │  │
│  │ ✅ Auth Gateway  │   │ ✅ Uses Auth     │ │ ✅ Uses Auth │  │
│  │ ✅ Dashboard     │   │ ✅ Authenticated │ │ ✅ Authenti- │  │
│  │ ✅ App Links     │   │                  │ │    cated     │  │
│  └────────┬─────────┘   └────────┬─────────┘ └──────┬───────┘  │
│           │                      │                  │           │
│           └──────────────────────┴──────────────────┘           │
│                                                                 │
│         All share same localStorage (portal_auth)              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Authentication Flow Diagram

```
    ┌─────────────────────────────────────────────────────────┐
    │  USER VISITS https://portal.empresa.com/               │
    └──────────────────────┬────────────────────────────────┘
                           │
                           ▼
    ┌─────────────────────────────────────────────────────────┐
    │  LOGIN PAGE                                             │
    │  - Email input field                                    │
    │  - Password input field                                 │
    │  - "Entrar" button                                      │
    └──────────────────────┬────────────────────────────────┘
                           │
                           ▼
         ┌────────────────────────────────────┐
         │  User submits credentials         │
         │  authService.login(email, pass)  │
         └─────────┬────────────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────────────┐
    │  Validate against Supabase app_users    │
    │  (Check email & password match)         │
    └───┬────────────────────────────┬────────┘
        │ Invalid                   │ Valid
        ▼                            ▼
    ┌─────────────┐    ┌──────────────────────────────────────────┐
    │  Show error │    │  ✅ LOGIN SUCCESSFUL                      │
    │  message    │    │                                            │
    └─────────────┘    │  localStorage.setItem('current_user', ...) │
                       │  setAuthToken(userId, email)               │
                       │                                            │
                       │  localStorage['portal_auth'] = {            │
                       │    userId: 'abc123',                       │
                       │    email: 'user@empresa.com',              │
                       │    issuedAt: 1704816000000                 │
                       │  }                                         │
                       └──────────┬─────────────────────────────────┘
                                  │
                                  ▼
                       ┌──────────────────────────────┐
                       │  SHOW DASHBOARD              │
                       │  "Suas Aplicações"          │
                       │                              │
                       │  ✈️ Viagem                  │
                       │  📊 Calibrações             │
                       └───┬────────────────────┬────┘
                           │                    │
                    (Click link)         (Click link)
                           │                    │
                           ▼                    ▼
              ┌──────────────────────┐  ┌──────────────────────┐
              │ Navigate to /viagens │  │ Navigate to          │
              │                      │  │ /calibracoes         │
              └──────┬───────────────┘  └───────┬──────────────┘
                     │                           │
                     ▼                           ▼
        ┌────────────────────────────┐ ┌────────────────────────────┐
        │ Travel App Loads           │ │ Calibration App Loads      │
        │                            │ │                            │
        │ Check: isAuthenticated()   │ │ Check: isAuthenticated()   │
        │ - Reads localStorage['..'] │ │ - Reads localStorage['..'] │
        │ - Token exists? ✅         │ │ - Token exists? ✅         │
        │                            │ │                            │
        │ Show Travel App Content    │ │ Show Calibration Content   │
        └────────────────────────────┘ └────────────────────────────┘
                     │                           │
                (User actions)            (User actions)
                     │                           │
                     └──────────┬────────────────┘
                                │
                                ▼
                    ┌──────────────────────────┐
                    │  Portal: Click "Sair"    │
                    │  (Logout)                │
                    └─────────┬────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────────────┐
        │  authService.logout()                          │
        │                                                 │
        │  localStorage.removeItem('current_user')       │
        │  clearAuthToken()                              │
        │  localStorage.removeItem('portal_auth')        │
        └──────────────┬────────────────────────────────┘
                       │
                       ▼
    ┌────────────────────────────────────────┐
    │  Portal: Show Login Page                │
    │  (Auth token cleared)                   │
    └────────────────────────────────────────┘
                       │
       (If sub-app still open...)
                       │
                       ▼
    ┌────────────────────────────────────────────────────┐
    │  Sub-App: Check isAuthenticated()                 │
    │  - localStorage['portal_auth'] missing! ❌        │
    │  - Redirect to window.location.href = "/"         │
    │                                                    │
    │  User sent back to Portal Login Page              │
    └────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                      BROWSER localStorage                          │
│                                                                     │
│  ┌────────────────────────────┐  ┌──────────────────────────────┐  │
│  │  portal_auth (Shared)      │  │  current_user (Portal only)  │  │
│  │  ────────────────────────  │  │  ─────────────────────────── │  │
│  │  {                         │  │  {                           │  │
│  │    userId: "abc123"        │  │    id: "abc123"              │  │
│  │    email: "user@empresa"   │  │    name: "Pedro Silva"       │  │
│  │    issuedAt: 1704816000000 │  │    email: "user@empresa"     │  │
│  │  }                         │  │    role: "manager"           │  │
│  │                            │  │    department: "TI"          │  │
│  │  ✅ Read by Portal         │  │    password: "***"           │  │
│  │  ✅ Read by Viagens        │  │    status: "active"          │  │
│  │  ✅ Read by Calibrações    │  │    ...                       │  │
│  │  ✅ Cleared on logout      │  │  }                           │  │
│  │                            │  │                              │  │
│  │                            │  │  ⚠️ Portal sensitive data    │  │
│  │                            │  │  ⚠️ Not read by sub-apps     │  │
│  └────────────────────────────┘  └──────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                           ▲
                           │
             ┌─────────────┼─────────────┐
             │             │             │
             ▼             ▼             ▼
        ┌────────┐    ┌────────┐   ┌─────────┐
        │ Portal │    │Viagens │   │Calib.   │
        │        │    │        │   │         │
        │✅ Sets │    │✅ Reads│   │✅ Reads │
        │✅ Clears  │    │(Auth)│   │(Auth)   │
        │        │    │       │   │         │
        └────────┘    └────────┘   └─────────┘
```

## Router Configuration Diagram

```
               ┌────────────────────────────────────────┐
               │  Browser navigates to URL              │
               │  https://portal.empresa.com/viagens    │
               └──────────────┬─────────────────────────┘
                              │
                              ▼
                  ┌──────────────────────────┐
                  │  Vite base: '/viagens/'  │
                  │  (Asset loading root)    │
                  └────────────┬─────────────┘
                               │
                               ▼
                   ┌───────────────────────────────┐
                   │  React Router:                │
                   │  BrowserRouter               │
                   │  basename="/viagens"         │
                   │  (App routing root)          │
                   └────────┬────────────────────┘
                            │
                            ▼
            ┌───────────────────────────────────────┐
            │  Routes:                              │
            │  <Route path="/" element={...} />    │
            │  <Route path="/create" element={...} │
            │  <Route path="/:id" element={...} />  │
            └───────────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
      /viagens/         /viagens/create   /viagens/123
      (List page)       (Create form)     (Details page)
```

## Deployment Architecture

```
                        ┌─────────────────────────────────────┐
                        │  Domain: portal.empresa.com         │
                        │  (Single SSL Certificate)           │
                        └──────┬──────────────────────────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
    ┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐
    │  Vercel Project  │ │ Vercel Proj  │ │ Vercel Project   │
    │  "Portal"        │ │ "Viagens"    │ │ "Calibracoes"    │
    │                  │ │              │ │                  │
    │ Deployment:      │ │ Deployment:  │ │ Deployment:      │
    │ Prod domain:     │ │ Prod domain: │ │ Prod domain:     │
    │ root (/)         │ │ root (/)     │ │ root (/)         │
    │                  │ │              │ │                  │
    │ Vite base: '/'   │ │ Vite base:   │ │ Vite base:       │
    │                  │ │ '/viagens/'  │ │ '/calibracoes/'  │
    │ Output: dist/    │ │ Output:dist/ │ │ Output: dist/    │
    │ Size: ~250KB     │ │ Size: ~180KB │ │ Size: ~200KB     │
    │                  │ │              │ │                  │
    │ Build trigger:   │ │ Build trigger│ │ Build trigger:   │
    │ Git push to main │ │ Git push     │ │ Git push to main │
    └──────────────────┘ └──────────────┘ └──────────────────┘
            │                    │                 │
            └────────────────────┼─────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Vercel Edge Network   │
                    │   (Global CDN)          │
                    │                         │
                    │  - Cache assets         │
                    │  - Route requests       │
                    │  - SSL termination      │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌────────────────────────────┐
                    │ DNS Resolution             │
                    │ portal.empresa.com → IP    │
                    │ (Vercel nameservers)       │
                    └────────────────────────────┘
```

## File Structure & Dependencies

```
portal/
├── src/
│   ├── utils/
│   │   └── authGuard.ts          ← Exported to sub-apps
│   │       ├── setAuthToken()     → localStorage['portal_auth']
│   │       ├── clearAuthToken()   → remove localStorage key
│   │       ├── getAuthToken()     → read from localStorage
│   │       └── isAuthenticated()  → check if token exists
│   │
│   ├── services/
│   │   └── supabaseClient.ts      ← Singleton Supabase instance
│   │
│   ├── main.tsx
│   │   ├── imports authGuard     ✅
│   │   ├── imports supabase      ✅
│   │   ├── calls setAuthToken()  ✅ (on login success)
│   │   ├── calls clearAuthToken()✅ (on logout)
│   │   └── authService object   ✅ (uses supabase)
│   │
│   └── Dashboard.tsx
│       ├── Link to /viagens      ✅
│       └── Link to /calibracoes  ✅
│
├── vite.config.ts                ✅ base: '/'
├── vercel.json                   ✅ SPA routing
└── package.json                  ✅ dependencies

viagens/  (to be created)
├── src/
│   ├── utils/
│   │   └── authGuard.ts          ← Copied from portal
│   ├── App.tsx
│   │   ├── imports authGuard    (needed)
│   │   ├── isAuthenticated()    (needed)
│   │   ├── ProtectedRoute       (needed)
│   │   └── BrowserRouter        (needed)
│   │       └── basename="/viagens"
│   └── pages/
│       ├── TravelList.tsx
│       ├── CreateTravel.tsx
│       └── TravelDetails.tsx
│
├── vite.config.ts               (base: '/viagens/')
├── vercel.json                  (routing rules)
└── package.json

calibracoes/  (to be created)
├── src/
│   ├── utils/
│   │   └── authGuard.ts          ← Copied from portal
│   ├── App.tsx
│   │   ├── imports authGuard    (needed)
│   │   ├── isAuthenticated()    (needed)
│   │   ├── ProtectedRoute       (needed)
│   │   └── BrowserRouter        (needed)
│   │       └── basename="/calibracoes"
│   └── pages/
│       ├── CalibrationList.tsx
│       ├── CreateCalibration.tsx
│       └── CalibrationDetails.tsx
│
├── vite.config.ts               (base: '/calibracoes/')
├── vercel.json                  (routing rules)
└── package.json
```

## Request Flow Diagram

```
Request: https://portal.empresa.com/viagens

         │
         ▼
    ┌────────────────────────────────┐
    │  Vercel Edge (Global CDN)      │
    │  1. DNS resolution             │
    │  2. Check cache                │
    │  3. Route to correct project   │
    └──────────────┬─────────────────┘
                   │
                   ▼
    ┌────────────────────────────────┐
    │  Vercel Project: Viagens       │
    │  (Matches /viagens route)      │
    └──────────────┬─────────────────┘
                   │
                   ▼
    ┌────────────────────────────────┐
    │  Serve: /viagens/index.html    │
    │  (Vite-built SPA)              │
    └──────────────┬─────────────────┘
                   │
                   ▼
    ┌────────────────────────────────┐
    │  Browser loads HTML:           │
    │  - Script: /viagens/main.tsx   │
    │  - Assets: /viagens/chunk.js   │
    │  - Styles: /viagens/style.css  │
    └──────────────┬─────────────────┘
                   │
                   ▼
    ┌────────────────────────────────┐
    │  React App Initializes:        │
    │  1. ProtectedRoute checks auth │
    │  2. isAuthenticated() called   │
    │  3. Reads localStorage         │
    │  4. Checks portal_auth token   │
    └──────────────┬─────────────────┘
                   │
         ┌─────────┴─────────┐
         │ Token exists?     │
         └─────────┬─────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼ YES                 ▼ NO
    ┌────────────┐     ┌─────────────────────────┐
    │ Load App   │     │ window.location.href='/'│
    │ Content    │     │ (Redirect to login)     │
    │ ✅         │     └─────────────────────────┘
    └────────────┘
```

## Summary

This multi-app architecture provides:

✅ **Single Domain**: Easy to manage DNS and SSL  
✅ **Shared Authentication**: One login for all apps  
✅ **Independent Deployment**: Each app on separate Vercel project  
✅ **Scalable**: Easy to add new apps  
✅ **Secure**: Token-based auth with logout across all apps  
✅ **Fast**: CDN-cached assets, optimized builds  

