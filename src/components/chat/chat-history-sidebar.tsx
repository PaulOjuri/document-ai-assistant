'use client';

import { useState } from 'react';
import { MessageSquare, Trash2, Plus, Clock, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useChatHistory } from '@/hooks/useChatHistory';

interface ChatHistorySidebarProps {
  onChatSelect?: (chatId: string, messages: Array<{ role: string; content: string; timestamp: Date }>) => void;
  onNewChat?: () => void;
  onArchiveAndNew?: (currentMessages: Array<{ role: string; content: string; timestamp: Date }>) => void;
}

export function ChatHistorySidebar({ onChatSelect, onNewChat, onArchiveAndNew }: ChatHistorySidebarProps) {
  const { chatHistory, isLoading, deleteChat, startNewChat, currentChatId } = useChatHistory();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleChatSelect = (chatId: string) => {
    const messages = chatHistory.find(c => c.id === chatId)?.messages || [];
    const messagesWithDates = messages.map(msg => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }));
    onChatSelect?.(chatId, messagesWithDates);
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(chatId);
    const success = await deleteChat(chatId);
    if (!success) {
      setDeletingId(null);
    }
  };

  const handleNewChat = () => {
    startNewChat();
    onNewChat?.();
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getPreviewText = (messages: Array<{ role: string; content: string; timestamp?: Date | string }>) => {
    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length === 0) return 'New conversation';
    const lastUserMessage = userMessages[userMessages.length - 1];
    return lastUserMessage.content.substring(0, 60) + (lastUserMessage.content.length > 60 ? '...' : '');
  };

  return (
    <div className="w-80 bg-[var(--card)] border-r border-[var(--border)] flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-[var(--primary-green)]" />
            <h2 className="font-semibold">Chat History</h2>
          </div>
          <Button
            onClick={handleNewChat}
            size="sm"
            variant="outline"
            className="flex items-center space-x-1"
          >
            <Archive className="w-4 h-4" />
            <span>Archive & New</span>
          </Button>
        </div>
      </div>

      {/* Chat History List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-[var(--primary-green)] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : chatHistory.length === 0 ? (
          <div className="text-center py-8 text-[var(--muted-foreground)]">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No chat history yet</p>
            <p className="text-xs">Start a conversation to see it here</p>
          </div>
        ) : (
          chatHistory.map((chat) => (
            <Card
              key={chat.id}
              className={`cursor-pointer transition-colors hover:bg-[var(--muted)] ${
                currentChatId === chat.id ? 'ring-2 ring-[var(--primary-green)]' : ''
              }`}
              onClick={() => handleChatSelect(chat.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Clock className="w-3 h-3 text-[var(--muted-foreground)] flex-shrink-0" />
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {formatTimestamp(chat.updated_at)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-[var(--foreground)] truncate">
                      {getPreviewText(chat.messages)}
                    </p>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {chat.messages.length} messages
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={(e) => handleDeleteChat(chat.id, e)}
                    variant="ghost"
                    size="sm"
                    disabled={deletingId === chat.id}
                    className="flex-shrink-0 p-1 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900 dark:hover:text-red-400"
                  >
                    {deletingId === chat.id ? (
                      <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--border)] bg-[var(--background)]">
        <p className="text-xs text-[var(--muted-foreground)] text-center">
          Conversations are automatically saved
        </p>
      </div>
    </div>
  );
}