/**
 * DefaultLayout Component - Page Layout with Header
 * 
 * Wraps the Header component with main content area.
 * Use this component to maintain consistent layout across all pages.
 */

import React from 'react';
import { Header } from './Header';
import type { HeaderProps } from './Header';

export interface DefaultLayoutProps extends HeaderProps {
  /** Main content to be rendered below the header */
  children: React.ReactNode;
  
  /** Additional CSS classes for the main content container */
  contentClassName?: string;
}

export const DefaultLayout: React.FC<DefaultLayoutProps> = ({
  children,
  contentClassName = '',
  ...headerProps
}) => {
  return (
    <>
      <Header {...headerProps} />
      <main className={`max-w-7xl mx-auto px-4 py-8 print:p-0 print:max-w-none ${contentClassName}`}>
        {children}
      </main>
    </>
  );
};
