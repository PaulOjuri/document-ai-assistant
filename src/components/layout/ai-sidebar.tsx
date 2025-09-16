'use client';

import { useState, useEffect } from 'react';
import { Send, Bot, User, Lightbulb, BookOpen, MessageSquare, FileText, Mic, Target, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/auth/auth-provider';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const quickSuggestions = [
  {
    icon: Target,
    title: 'Analyze User Stories',
    prompt: 'Analyze my user stories using INVEST criteria',
    description: 'Review story quality using INVEST criteria'
  },
  {
    icon: TrendingUp,
    title: 'WSJF Prioritization',
    prompt: 'Help me prioritize my backlog using WSJF',
    description: 'Prioritize backlog with WSJF scoring'
  },
  {
    icon: Users,
    title: 'Meeting Analysis',
    prompt: 'Analyze my recent meeting notes and audio recordings',
    description: 'Extract insights from meetings'
  },
  {
    icon: FileText,
    title: 'Document Review',
    prompt: 'Review my documents for SAFe compliance',
    description: 'Analyze documents for SAFe practices'
  },
  {
    icon: BookOpen,
    title: 'PI Planning Help',
    prompt: 'Guide me through PI Planning preparation',
    description: 'PI Planning guidance and facilitation'
  },
  {
    icon: Lightbulb,
    title: 'Generate Acceptance Criteria',
    prompt: 'Help me create acceptance criteria for my user stories',
    description: 'Create comprehensive AC for stories'
  }
];

export function AISidebar() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Initialize messages on client side only to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Hello! I\'m your **Claude 3.5 Sonnet powered** SAFe & Agile AI assistant. I can analyze your documents, notes, and audio to help with user story analysis, backlog prioritization, PI planning, and more. What would you like to work on today?',
        timestamp: new Date()
      }
    ]);
  }, []);

  const handleSend = async (messageText?: string) => {
    const messageToSend = messageText || input.trim();
    if (!messageToSend || !user) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageToSend,
      timestamp: new Date()
    };

    // Create a placeholder AI message for streaming
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

      // Handle JSON response (non-streaming for now)
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
          ? { ...msg, content: 'Sorry, I encountered an error processing your request. Please try again.' }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSuggestion = (prompt: string) => {
    handleSend(prompt);
  };

  return (
    <aside className="w-96 border-l border-[var(--border)] bg-[var(--card)] flex flex-col">
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-8 bg-[var(--accent-blue)] rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold">SAFe AI Assistant</h2>
            <p className="text-sm text-[var(--muted-foreground)]">Your Agile & SAFe Expert</p>
          </div>
        </div>

        <div className="space-y-2">
          {quickSuggestions.map((suggestion, index) => (
            <Card
              key={index}
              className="p-3 cursor-pointer hover:bg-[var(--muted)] transition-colors"
              onClick={() => handleQuickSuggestion(suggestion.prompt)}
            >
              <div className="flex items-start space-x-3">
                <suggestion.icon className="w-5 h-5 text-[var(--primary-green)] mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium">{suggestion.title}</h4>
                  <p className="text-xs text-[var(--muted-foreground)]">{suggestion.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex space-x-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 bg-[var(--accent-blue)] rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              <div
                className={`max-w-[75%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-[var(--primary-green)] text-white'
                    : 'bg-[var(--muted)] text-[var(--foreground)]'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                {isClient && (
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                )}
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 bg-[var(--primary-green)] rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-[var(--border)]">
          <div className="flex space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about SAFe practices, user stories..."
              onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              onClick={() => handleSend()}
              size="icon"
              disabled={isLoading || !input.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          {isLoading && (
            <div className="flex items-center space-x-2 mt-2">
              <div className="w-4 h-4 border-2 border-[var(--primary-green)] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-[var(--muted-foreground)]">SAFe AI is analyzing your content...</p>
            </div>
          )}
          <p className="text-xs text-[var(--muted-foreground)] mt-2">
            AI can make mistakes. Verify SAFe practices with official documentation.
          </p>
        </div>
      </div>
    </aside>
  );
}