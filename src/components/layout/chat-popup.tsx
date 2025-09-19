'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, X, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/components/auth/auth-provider';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatPopup({ isOpen, onClose }: ChatPopupProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: `Hi! I'm your SAFe AI Assistant. 🤖

I can help you with:
• **Analyze documents** using INVEST criteria
• **Prioritize backlog** with WSJF scoring
• **Review meeting notes** for action items
• **Create folders** for organization

What would you like help with?`,
          timestamp: new Date()
        }
      ]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMinimized]);

  const handleSend = async (messageText?: string) => {
    const messageToSend = messageText || input.trim();
    if (!messageToSend || !user) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageToSend,
      timestamp: new Date()
    };

    const aiMessageId = (Date.now() + 1).toString();
    const aiResponse: ChatMessage = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage, aiResponse]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSend,
          userId: user.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      setMessages(prev => prev.map(msg =>
        msg.id === aiMessageId
          ? { ...msg, content: data.response }
          : msg
      ));
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.map(msg =>
        msg.id === aiMessageId
          ? { ...msg, content: 'Sorry, I encountered an error. Please try again.' }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 z-40">
      <div className={`
        bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-xl
        transition-all duration-300 ease-in-out
        ${isMinimized ? 'w-80 h-16' : 'w-96 h-[500px]'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-[var(--accent-blue)] rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium text-sm">SAFe AI Assistant</span>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-6 w-6 p-0 hover:bg-[var(--muted)]"
            >
              <Minimize2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 hover:bg-[var(--muted)]"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Chat Content */}
        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 h-[360px]">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex space-x-2 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-6 h-6 bg-[var(--accent-blue)] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] p-3 rounded-lg text-sm ${
                      message.role === 'user'
                        ? 'bg-[var(--primary-green)] text-white'
                        : 'bg-[var(--muted)] border border-[var(--border)]'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-6 h-6 bg-[var(--primary-green)] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex space-x-2 justify-start">
                  <div className="w-6 h-6 bg-[var(--accent-blue)] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="max-w-[75%] p-3 rounded-lg bg-[var(--muted)] border border-[var(--border)]">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 border-2 border-[var(--primary-green)] border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm">Analyzing...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-[var(--border)]">
              <div className="flex space-x-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about SAFe practices..."
                  onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                  className="flex-1 text-sm"
                  disabled={isLoading}
                />
                <Button
                  onClick={() => handleSend()}
                  disabled={isLoading || !input.trim()}
                  size="sm"
                  className="px-3"
                >
                  <Send className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}