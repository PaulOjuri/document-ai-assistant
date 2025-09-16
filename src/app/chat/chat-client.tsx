'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Target, TrendingUp, Users, FileText, BookOpen, Lightbulb, Zap, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/main-layout';
import { useAuth } from '@/components/auth/auth-provider';
import { ChatHistorySidebar } from '@/components/chat/chat-history-sidebar';
import { useChatHistory } from '@/hooks/useChatHistory';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ContentSummary {
  documents: number;
  notes: number;
  audios: number;
}

interface ChatClientProps {
  contentSummary: ContentSummary;
}

const quickSuggestions = [
  {
    icon: Target,
    title: 'Analyze User Stories',
    prompt: 'Analyze my user stories using INVEST criteria and provide recommendations',
    description: 'Review story quality using INVEST criteria',
    color: 'bg-blue-100 text-blue-700'
  },
  {
    icon: TrendingUp,
    title: 'WSJF Prioritization',
    prompt: 'Help me prioritize my backlog using WSJF methodology',
    description: 'Prioritize backlog with WSJF scoring',
    color: 'bg-green-100 text-green-700'
  },
  {
    icon: Users,
    title: 'Meeting Analysis',
    prompt: 'Analyze my recent meeting notes and audio recordings for action items and insights',
    description: 'Extract insights from meetings',
    color: 'bg-purple-100 text-purple-700'
  },
  {
    icon: FileText,
    title: 'Document Review',
    prompt: 'Review my documents for SAFe compliance and best practices',
    description: 'Analyze documents for SAFe practices',
    color: 'bg-orange-100 text-orange-700'
  },
  {
    icon: BookOpen,
    title: 'PI Planning Guidance',
    prompt: 'Guide me through PI Planning preparation and best practices',
    description: 'PI Planning guidance and facilitation',
    color: 'bg-indigo-100 text-indigo-700'
  },
  {
    icon: Lightbulb,
    title: 'Acceptance Criteria',
    prompt: 'Help me create comprehensive acceptance criteria for my user stories',
    description: 'Generate AC for stories',
    color: 'bg-yellow-100 text-yellow-700'
  },
  {
    icon: FolderPlus,
    title: 'Create Folder',
    prompt: 'Help me create a new folder to organize my documents and notes',
    description: 'Create and organize folders',
    color: 'bg-cyan-100 text-cyan-700'
  }
];

export function ChatClientPage({ contentSummary }: ChatClientProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { saveChat, currentChatId, archiveCurrentChatAndStartNew } = useChatHistory();

  const initializeChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: `Welcome to your SAFe AI Assistant! 🤖

I'm a **Claude 3.5 Sonnet powered AI agent** specialized in SAFe and Agile practices. I have access to your:
📄 ${contentSummary.documents} documents
📝 ${contentSummary.notes} notes
🎤 ${contentSummary.audios} audio recordings

**I can help you with:**
• **Real-time analysis** of your content using INVEST criteria
• **Smart backlog prioritization** with WSJF scoring
• **PI Planning guidance** tailored to your situation
• **Meeting insights** from your audio and notes
• **SAFe artifact review** with specific recommendations
• **Custom acceptance criteria** generation

Choose a quick action below or ask me anything! I'll analyze your actual content to provide personalized SAFe guidance.

💡 *Tip: Try "Analyze my documents" or "Help me prioritize my backlog"*`,
        timestamp: new Date()
      }
    ]);
  };

  useEffect(() => {
    initializeChat();
  }, [contentSummary]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

      setMessages(prev => {
        const updatedMessages = prev.map(msg =>
          msg.id === aiMessageId
            ? { ...msg, content: data.response }
            : msg
        );

        // Auto-save chat after AI response
        setTimeout(() => {
          saveChat(updatedMessages, currentChatId);
        }, 1000);

        return updatedMessages;
      });
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

  const handleChatSelect = (chatId: string, chatMessages: ChatMessage[]) => {
    setMessages(chatMessages);
  };

  const handleNewChat = async () => {
    // Archive current chat if it has content, then start new
    await archiveCurrentChatAndStartNew(messages);
    initializeChat();
  };

  return (
    <MainLayout>
      <div className="flex h-screen overflow-hidden">
        <ChatHistorySidebar
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
        />
        <div className="flex flex-col flex-1 min-h-0">
        {/* Compact Header */}
        <div className="flex-shrink-0 p-4 border-b border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[var(--accent-blue)] rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--foreground)]">SAFe AI Assistant</h1>
                <p className="text-sm text-[var(--muted-foreground)]">GPT-4 powered SAFe expert</p>
              </div>
            </div>

            {/* Inline Stats */}
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-[var(--primary-green)] rounded-full"></div>
                <span>{contentSummary.documents} docs</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-[var(--accent-blue)] rounded-full"></div>
                <span>{contentSummary.notes} notes</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-[var(--warning-amber)] rounded-full"></div>
                <span>{contentSummary.audios} audio</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Row */}
        <div className="flex-shrink-0 p-4 border-b border-[var(--border)] bg-[var(--background)]">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {quickSuggestions.map((suggestion, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:bg-[var(--muted)] transition-colors"
                onClick={() => handleQuickSuggestion(suggestion.prompt)}
              >
                <CardContent className="p-3">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className={`w-8 h-8 ${suggestion.color} rounded-full flex items-center justify-center`}>
                      <suggestion.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-medium text-xs">{suggestion.title}</h3>
                      <p className="text-xs text-[var(--muted-foreground)] line-clamp-2">{suggestion.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex space-x-4 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="w-10 h-10 bg-[var(--accent-blue)] rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-6 h-6 text-white" />
                </div>
              )}
              <div
                className={`max-w-[70%] p-4 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-[var(--primary-green)] text-white'
                    : 'bg-[var(--card)] border border-[var(--border)]'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                <p className="text-xs opacity-70 mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
              {message.role === 'user' && (
                <div className="w-10 h-10 bg-[var(--primary-green)] rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex space-x-4 justify-start">
              <div className="w-10 h-10 bg-[var(--accent-blue)] rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div className="max-w-[70%] p-4 rounded-lg bg-[var(--card)] border border-[var(--border)]">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-5 h-5 border-2 border-[var(--primary-green)] border-t-transparent rounded-full animate-spin"></div>
                  <div className="text-sm">
                    <div className="font-medium text-[var(--foreground)]">Claude SAFe Agent</div>
                    <div className="text-xs text-[var(--muted-foreground)]">Analyzing your content and applying SAFe practices...</div>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-[var(--muted-foreground)]">
                  <div className="flex items-center space-x-2">
                    <div className="w-1 h-1 bg-[var(--primary-green)] rounded-full animate-pulse"></div>
                    <span>Reading documents, notes, and audio transcripts</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-1 h-1 bg-[var(--accent-blue)] rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <span>Applying INVEST criteria and WSJF analysis</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-1 h-1 bg-[var(--warning-amber)] rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    <span>Generating personalized recommendations</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 p-4 border-t border-[var(--border)] bg-[var(--card)] m-0">
          <div className="flex space-x-4">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about SAFe practices, analyze your content, or get guidance..."
              onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="px-6"
            >
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
          </div>
          <p className="text-xs text-[var(--muted-foreground)] mt-2 mb-0">
            AI can make mistakes. Verify SAFe practices with official documentation.
          </p>
        </div>
        </div>
      </div>
    </MainLayout>
  );
}