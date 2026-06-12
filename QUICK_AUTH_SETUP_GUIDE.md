# Quick Implementation Guide - Sub-App Authentication

**For:** Developers implementing Hexagon sub-apps (Viagens, Calibrações, Insumos)  
**Time Required:** 15-30 minutes per app

---

## TL;DR (Too Long; Didn't Read)

1. Copy 2 files from Portal to your sub-app
2. Wrap your app with `<ProtectedRoute>`
3. Add logout button that clears token
4. Test and deploy
5. Done ✅

---

## Step-by-Step Implementation

### Step 1: Copy Files from Portal (5 min)

Copy these 2 files from the Portal project to your sub-app:

**From Portal → To Sub-App:**

```
Portal/src/utils/authGuard.ts
  ↓
SubApp/src/utils/authGuard.ts

Portal/src/components/ProtectedRoute.tsx
  ↓
SubApp/src/components/ProtectedRoute.tsx
```

### Step 2: Update Main Entry Point (2 min)

Open your sub-app's `src/main.tsx`:

**Before:**
```tsx
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

**After:**
```tsx
import { ProtectedRoute } from './components/ProtectedRoute';

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

### Step 3: Add Logout Function (3 min)

Find your logout button (usually in Header/Navbar component) and update it:

**Before:**
```tsx
const handleLogout = () => {
  // Your existing logout code
  localStorage.removeItem('current_user');
};
```

**After:**
```tsx
import { clearAuthToken } from '../utils/authGuard';

const handleLogout = () => {
  // Clear Portal auth token
  clearAuthToken();
  
  // Redirect to Portal
  window.location.href = 'https://hexagon-portal.vercel.app/';
};
```

### Step 4: Access User Information (2 min)

To display current user info in your app:

**Option A: Use the Hook (Recommended)**
```tsx
import { useProtectedAuth } from '../components/ProtectedRoute';

function Dashboard() {
  const token = useProtectedAuth();
  
  return (
    <div>
      <h1>Welcome, {token.email}!</h1>
      <p>User ID: {token.userId}</p>
    </div>
  );
}
```

**Option B: Direct Access**
```tsx
import { getAuthToken } from '../utils/authGuard';

function Header() {
  const token = getAuthToken();
  
  return <span>{token?.email}</span>;
}
```

### Step 5: Test Authentication (10 min)

#### Test 1: Login via Portal
1. Open Portal: https://hexagon-portal.vercel.app/
2. Login with test credentials
3. Click your app card
4. App should open WITHOUT login prompt ✅

#### Test 2: Deep Link Access
1. Open your sub-app URL directly (e.g., https://hexagon-viagens.vercel.app/)
2. You should be redirected to Portal login
3. Login with credentials
4. You should be redirected back to your app ✅

#### Test 3: Logout
1. Click logout in your app
2. You should be redirected to Portal
3. Verify token is removed from localStorage (F12 → Application → localStorage) ✅

### Step 6: Deploy (varies)

Deploy your sub-app to production. Auth should work automatically across all environments.

---

## What Just Happened?

When a user accesses your sub-app:

1. **ProtectedRoute** checks if user has valid Portal token
2. If **NO token**: Redirects to Portal login with `returnTo` parameter
3. If **token EXPIRED**: Redirects to Portal login
4. If **token VALID**: Renders your app normally
5. When user logs out: Token is cleared and user is sent back to Portal

---

## Common Tasks

### Display Current User Email
```tsx
import { useProtectedAuth } from '../components/ProtectedRoute';

const token = useProtectedAuth();
console.log(token.email); // user@example.com
```

### Check If User Is Authenticated
```tsx
import { isAuthenticated } from '../utils/authGuard';

if (isAuthenticated()) {
  // User is logged in
} else {
  // User not logged in (shouldn't happen due to ProtectedRoute)
}
```

### Manually Check Token Age
```tsx
import { getAuthToken } from '../utils/authGuard';

const token = getAuthToken();
const ageInHours = (Date.now() - token.issuedAt) / (1000 * 60 * 60);
console.log(`Token age: ${ageInHours} hours`);
```

### Programmatically Logout
```tsx
import { clearAuthToken } from '../utils/authGuard';

function logout() {
  clearAuthToken();
  window.location.href = 'https://hexagon-portal.vercel.app/';
}
```

---

## Debugging

### "No valid session" error?
Check browser localStorage:
1. Press F12 to open Developer Tools
2. Go to **Application** → **Storage** → **Local Storage**
3. Look for key: `portal_auth`
4. If missing: User needs to login via Portal first

### Infinite redirect loop?
1. Check browser console for errors
2. Verify `portal_auth` token exists in localStorage
3. Clear localStorage and login again fresh

### Token not accessible?
1. Ensure `ProtectedRoute` wrapper is applied
2. Verify `useProtectedAuth()` is called inside component tree
3. Check that component is child of `<ProtectedRoute>`

---

## FAQ

**Q: Do I need to change my Supabase configuration?**  
A: No. Sub-apps don't query Supabase directly for auth. Portal handles all authentication.

**Q: Can users access sub-apps without Portal?**  
A: No. ProtectedRoute will redirect them to Portal login first.

**Q: What if Portal is down?**  
A: Users cannot login, but existing sessions continue to work for 24 hours.

**Q: How long does a session last?**  
A: 24 hours from login. After that, user must login again.

**Q: Can I customize the redirect URL?**  
A: Yes, edit `getPortalUrl()` in `src/utils/authGuard.ts`

**Q: Should I store the token in sessionStorage instead?**  
A: No, localStorage is required for persistence and cross-tab sharing.

**Q: How do I test locally?**  
A: Run Portal locally too, and update `getPortalUrl()` to point to localhost

---

## Files Needed

| File | Source | Purpose |
|------|--------|---------|
| `authGuard.ts` | Portal → Sub-App | Token management |
| `ProtectedRoute.tsx` | Portal → Sub-App | Route protection |
| `main.tsx` | Edit in Sub-App | Wrap with ProtectedRoute |
| Header component | Edit in Sub-App | Add logout handler |

---

## Environment Setup

Make sure your sub-app has same `.env` variables as Portal:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

(Though sub-apps may not use them directly, it's good to have)

---

## URLs Reference

| App | URL |
|-----|-----|
| Portal | https://hexagon-portal.vercel.app/ |
| Viagens | https://hexagon-viagens.vercel.app/ |
| Calibrações | https://hexagon-calibracao.vercel.app/ |
| Insumos | https://hexagon-insumos.vercel.app/ |

---

## Next Steps

1. ✅ Copy the 2 files
2. ✅ Wrap with ProtectedRoute
3. ✅ Add logout handler
4. ✅ Test locally
5. ✅ Deploy to production
6. ✅ Celebrate! 🎉

---

## Support

If something doesn't work:

1. Check browser console (F12) for errors
2. Check localStorage for `portal_auth` token
3. Review full guide: `HEXAGON_AUTHENTICATION_GUIDE.md`
4. Review template: `SUB_APP_AUTH_GUARD_TEMPLATE.md`
5. Check Portal implementation: `src/main.tsx`

---

**That's it! Your sub-app is now integrated with Hexagon's centralized authentication system.** 🚀
