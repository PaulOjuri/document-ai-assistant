'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { FloatingChatButton } from './floating-chat-button';
import { ChatPopup } from './chat-popup';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const isOnChatPage = pathname === '/chat';
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="main-layout-container bg-[var(--background)]">
      <Header />
      <div className="main-content-area">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Floating chat button and popup - only show on pages other than chat */}
      {!isOnChatPage && (
        <>
          <FloatingChatButton
            onClick={() => setIsChatOpen(!isChatOpen)}
            isOpen={isChatOpen}
          />
          <ChatPopup
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
          />
        </>
      )}
    </div>
  );
}