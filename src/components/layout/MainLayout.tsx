import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { useImpersonation } from '@/contexts/ImpersonationContext';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isImpersonating } = useImpersonation();

  return (
    <div className="h-screen flex flex-row-reverse bg-background overflow-hidden">
      <Sidebar />
      <main className={`flex-1 h-screen overflow-y-auto ${isImpersonating ? 'pt-12' : ''}`}>
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
