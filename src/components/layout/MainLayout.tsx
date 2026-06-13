import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { useImpersonation } from '@/contexts/ImpersonationContext';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isImpersonating } = useImpersonation();

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:start-2 focus:rounded-lg focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:shadow-lg"
      >
        تخطّي إلى المحتوى
      </a>
      <Sidebar />
      <main
        id="main-content"
        className={`flex-1 h-screen overflow-y-auto ${isImpersonating ? 'pt-12' : ''}`}
      >
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
