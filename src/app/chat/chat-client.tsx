'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Upload, Save, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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


export function ChatClientPage({ contentSummary }: ChatClientProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [meetingTranscript, setMeetingTranscript] = useState('');
  const [isProcessingTranscript, setIsProcessingTranscript] = useState(false);
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
• **Meeting transcript analysis** - Extract action items and key decisions
• **SAFe artifact review** with specific recommendations
• **Custom acceptance criteria** generation

**Meeting Transcript Analysis:** Use the section above to paste meeting transcripts and I'll automatically extract:
- Action items with owners
- Key decisions made
- Next steps and deadlines
- Meeting participants and roles

Ask me anything! I'll analyze your actual content to provide personalized SAFe guidance.

💡 *Tip: Try "Analyze my documents" or paste a meeting transcript above*`,
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

  const handleProcessTranscript = async () => {
    if (!meetingTranscript.trim() || !user) return;

    setIsProcessingTranscript(true);

    const prompt = `Please analyze this meeting transcript and extract action items, key decisions, and next steps. Format the response as a structured summary with clear sections for Action Items, Key Decisions, Participants, and Next Steps. Here's the transcript:

${meetingTranscript}`;

    // Add the transcript processing as a chat message
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: 'Process meeting transcript and extract action items',
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

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: prompt,
          userId: user.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process transcript');
      }

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

      // Clear the transcript after processing
      setMeetingTranscript('');

    } catch (error) {
      console.error('Error processing transcript:', error);
      setMessages(prev => prev.map(msg =>
        msg.id === aiMessageId
          ? { ...msg, content: 'Sorry, I encountered an error processing the meeting transcript. Please try again.' }
          : msg
      ));
    } finally {
      setIsProcessingTranscript(false);
    }
  };

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


  const handleChatSelect = (chatId: string, chatMessages: ChatMessage[]) => {
    setMessages(chatMessages);
  };

  const handleNewChat = async () => {
    // Archive current chat if it has content, then start new
    await archiveCurrentChatAndStartNew(messages);
    initializeChat();
  };

  return (
    <div className="h-screen flex flex-col bg-[var(--background)]">
      {/* Custom header for chat page */}
      <div className="flex-shrink-0 h-16 border-b border-[var(--border)] bg-[var(--card)] px-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-[var(--primary-green)] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">DA</span>
          </div>
          <span className="font-semibold text-[var(--foreground)]">Document AI Assistant</span>
          <nav className="flex items-center space-x-6 ml-8">
            <a href="/dashboard" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Dashboard</a>
            <a href="/documents" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Documents</a>
            <a href="/notes" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Notes</a>
            <a href="/audio" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Audio</a>
            <span className="px-3 py-1 bg-[var(--primary-green)] text-white text-sm rounded-full">SAFe Chat</span>
          </nav>
        </div>
        <div className="text-sm text-[var(--muted-foreground)]">paulojuri105@gmail.com</div>
      </div>

      <div className="flex flex-1 overflow-hidden">
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
                <p className="text-sm text-[var(--muted-foreground)]">Claude 3 powered SAFe expert</p>
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

        {/* Meeting Transcript Section */}
        <div className="flex-shrink-0 p-4 border-b border-[var(--border)] bg-[var(--background)]">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-sm">
                <Mic className="w-4 h-4 text-[var(--primary-green)]" />
                <span>Meeting Transcript Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Textarea
                  placeholder="Paste your meeting transcript here. The AI will extract action items, key decisions, and next steps..."
                  value={meetingTranscript}
                  onChange={(e) => setMeetingTranscript(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <div className="flex items-center justify-between">
                  <div className="text-xs text-[var(--muted-foreground)]">
                    {meetingTranscript.length} characters
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMeetingTranscript('')}
                      disabled={!meetingTranscript.trim() || isProcessingTranscript}
                    >
                      Clear
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleProcessTranscript}
                      disabled={!meetingTranscript.trim() || isProcessingTranscript}
                    >
                      {isProcessingTranscript ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Save className="w-3 h-3 mr-2" />
                          Extract Action Items
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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
        <div className="flex-shrink-0 p-4 border-t border-[var(--border)] bg-[var(--card)]">
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
    </div>
  );
}