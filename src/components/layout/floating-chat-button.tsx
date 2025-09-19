'use client';

import { Bot, MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FloatingChatButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export function FloatingChatButton({ onClick, isOpen }: FloatingChatButtonProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={onClick}
        className={`
          relative h-14 w-14 rounded-full shadow-lg transition-all duration-300 ease-in-out
          ${isOpen
            ? 'bg-[var(--error-red)] hover:bg-[var(--error-red)] scale-110'
            : 'bg-[var(--primary-green)] hover:bg-[var(--dark-green)] hover:scale-110'
          }
          group
        `}
        aria-label={isOpen ? "Close AI Chat" : "Open AI Chat"}
      >
        {/* Pulse animation when closed */}
        {!isOpen && (
          <div className="absolute inset-0 rounded-full bg-[var(--primary-green)] animate-ping opacity-20"></div>
        )}

        {/* Icon with rotation animation */}
        <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
          {isOpen ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <Bot className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
          )}
        </div>

        {/* Tooltip */}
        <div className={`
          absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded
          whitespace-nowrap opacity-0 pointer-events-none transition-opacity duration-200
          group-hover:opacity-100
        `}>
          {isOpen ? 'Close AI Chat' : 'Ask SAFe AI'}
        </div>
      </Button>
    </div>
  );
}