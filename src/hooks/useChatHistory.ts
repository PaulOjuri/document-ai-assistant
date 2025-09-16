import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-provider';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Chat {
  id: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export function useChatHistory() {
  const [chatHistory, setChatHistory] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Load chat history on mount
  useEffect(() => {
    if (user) {
      loadChatHistory();
    }
  }, [user]);

  const loadChatHistory = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/chat-history');
      if (response.ok) {
        const data = await response.json();
        setChatHistory(data.chats || []);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveChat = async (messages: ChatMessage[], chatId?: string) => {
    if (!user || messages.length === 0) return null;

    try {
      const response = await fetch('/api/chat-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId,
          messages: messages.map(msg => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp.toISOString(),
          })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const savedChat = data.chat;

        // Update chat history
        setChatHistory(prev => {
          if (chatId) {
            // Update existing chat
            return prev.map(chat =>
              chat.id === chatId
                ? { ...savedChat, messages: messages }
                : chat
            );
          } else {
            // Add new chat
            return [{ ...savedChat, messages: messages }, ...prev];
          }
        });

        return savedChat.id;
      }
    } catch (error) {
      console.error('Error saving chat:', error);
    }

    return null;
  };

  const deleteChat = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chat-history?chatId=${chatId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
        if (currentChatId === chatId) {
          setCurrentChatId(null);
        }
        return true;
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }

    return false;
  };

  const loadChat = (chatId: string) => {
    const chat = chatHistory.find(c => c.id === chatId);
    if (chat) {
      setCurrentChatId(chatId);
      // Convert timestamp strings back to Date objects
      const messagesWithDates = chat.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
      return messagesWithDates;
    }
    return null;
  };

  const startNewChat = () => {
    setCurrentChatId(null);
  };

  const archiveCurrentChatAndStartNew = async (currentMessages: ChatMessage[]) => {
    // Save current chat if it has meaningful content (more than just the welcome message)
    if (currentMessages.length > 1 && currentChatId === null) {
      const savedChatId = await saveChat(currentMessages);
      if (savedChatId) {
        setCurrentChatId(null); // Reset for new chat
        await loadChatHistory(); // Refresh the history list
      }
    }
    // If there's already a current chat ID, it should be auto-saved already
    setCurrentChatId(null);
  };

  return {
    chatHistory,
    currentChatId,
    isLoading,
    saveChat,
    deleteChat,
    loadChat,
    startNewChat,
    archiveCurrentChatAndStartNew,
    loadChatHistory
  };
}