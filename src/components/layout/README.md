# Layout Components

## Overview

This folder contains reusable layout components designed to be easily copied and used across multiple applications. These components are fully self-contained with no page-specific logic or route dependencies.

## Components

### Header

A flexible header component with logo, user profile, action buttons, and logout functionality.

**Location:** `src/components/layout/Header.tsx`

**Features:**
- Logo display (primary and secondary logos)
- Dynamic action buttons with badge support
- User profile display
- Logout functionality
- Fully customizable via props

**Usage:**
```tsx
import { Header, HeaderAction } from './src/components/layout/Header';

const actions: HeaderAction[] = [
  {
    id: 'notifications',
    icon: Bell,
    onClick: () => console.log('Notifications clicked'),
    title: 'Notificações',
    badge: 5
  }
];

<Header
  user={{
    name: 'João Silva',
    role: 'admin',
    roleLabel: 'Administrador'
  }}
  actions={actions}
  onLogoClick={() => navigateTo('/dashboard')}
  onUserClick={() => showProfileModal()}
  onLogout={() => logout()}
/>
```

### DefaultLayout

A layout wrapper that combines the Header component with main content area.

**Location:** `src/components/layout/DefaultLayout.tsx`

**Features:**
- Wraps Header + children
- Consistent spacing and max-width
- Print-friendly styling
- Fully responsive

**Usage:**
```tsx
import { DefaultLayout } from './src/components/layout/DefaultLayout';

<DefaultLayout
  user={currentUser}
  actions={headerActions}
  onLogoClick={() => navigate('/home')}
  onUserClick={() => showProfile()}
  onLogout={handleLogout}
>
  {/* Your page content goes here */}
  <Dashboard />
</DefaultLayout>
```

## Type Definitions

### HeaderUser
```typescript
interface HeaderUser {
  name: string;
  role: string;
  roleLabel: string;
}
```

### HeaderAction
```typescript
interface HeaderAction {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  title: string;
  badge?: number;
}
```

## Customization

### Logo Customization

You can customize the logos by passing the `logos` prop:

```tsx
<Header
  logos={{
    primary: { src: '/your-logo.png', alt: 'Your Company' },
    secondary: { src: '/your-brand.png', alt: 'Your Brand' }
  }}
  // ... other props
/>
```

### Styling

The components use Tailwind CSS classes. To customize:
1. Modify the className props
2. Override with custom CSS classes
3. Adjust the default classes in the component files

## Copying to Other Projects

To reuse these components in another application:

1. Copy the entire `src/components/layout` folder to your new project
2. Ensure you have the following dependencies:
   - `react`
   - `lucide-react` (for icons)
   - Tailwind CSS (for styling)
3. Update import paths if your project structure differs
4. Customize the default logos and styling as needed

## Best Practices

1. **Keep it generic**: Don't add project-specific logic to these components
2. **Use props**: All data and actions should be passed via props
3. **Document changes**: If you modify these components, update this README
4. **Test across views**: Ensure the layout works on all pages of your application

## Dependencies

- React 18+
- lucide-react (icons)
- Tailwind CSS (styling)

## License

Internal use only - Hexagon/Leica Geosystems
