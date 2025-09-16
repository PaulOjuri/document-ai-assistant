'use client';

import { usePathname } from 'next/navigation';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { AISidebar } from './ai-sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const isOnChatPage = pathname === '/chat';

  return (
    <div className="main-layout-container bg-[var(--background)]">
      <Header />
      <div className="main-content-area">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
        {!isOnChatPage && <AISidebar />}
      </div>
    </div>
  );
}