'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Bell, User, Settings, LogOut, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchInterface } from '@/components/search/search-interface';
import { useAuth } from '@/components/auth/auth-provider';
import { createSupabaseClient } from '@/lib/supabase/client';

interface Notification {
  id: string;
  type: string;
  title: string;
  message?: string;
  data?: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

export function Header() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const supabase = createSupabaseClient();

  useEffect(() => {
    if (user) {
      loadNotifications();
      checkDeadlines();

      // Check for new notifications every 5 minutes
      const interval = setInterval(() => {
        checkDeadlines();
        loadNotifications();
      }, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/notifications?limit=10');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.notifications?.filter((n: Notification) => !n.read).length || 0);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const checkDeadlines = async () => {
    if (!user) return;

    try {
      await fetch('/api/check-deadlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error checking deadlines:', error);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, read: true })
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    setIsLoadingNotifications(true);
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      await Promise.all(
        unreadNotifications.map(n => markNotificationAsRead(n.id))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleSearchResult = (result: { type: string; id: string; title: string }) => {
    // Handle search result selection
    console.log('Selected search result:', result);
    // You can navigate to the result or open a modal here
  };

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/documents', label: 'Documents' },
    { href: '/notes', label: 'Notes' },
    { href: '/todo', label: 'Todo' },
    { href: '/folders', label: 'Folders' },
    { href: '/chat', label: 'SAFe Chat' },
  ];

  return (
    <header className="h-16 border-b border-[var(--border)] bg-[var(--card)] px-6 flex items-center justify-between">
      <div className="flex items-center space-x-8">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-[var(--primary-green)] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">DA</span>
          </div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">Document AI Assistant</h1>
        </Link>

        {/* Navigation Menu */}
        <nav className="hidden md:flex items-center space-x-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                pathname === item.href
                  ? 'bg-[var(--primary-green)] text-white'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex-1 max-w-md mx-8">
        <SearchInterface
          onResultSelect={handleSearchResult}
          placeholder="Search documents, notes, and todos..."
          showFilters={true}
        />
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50">
              <div className="p-3 border-b border-[var(--border)] flex items-center justify-between">
                <h3 className="font-medium text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    disabled={isLoadingNotifications}
                    className="text-xs"
                  >
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotifications(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-[var(--muted-foreground)] text-sm">
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-b border-[var(--border)] hover:bg-[var(--muted)] cursor-pointer ${
                        !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{notification.title}</p>
                          {notification.message && (
                            <p className="text-xs text-[var(--muted-foreground)] mt-1">
                              {notification.message}
                            </p>
                          )}
                          <p className="text-xs text-[var(--muted-foreground)] mt-2">
                            {formatTimeAgo(notification.created_at)}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-3 border-t border-[var(--border)] text-center">
                  <Link href="/notifications" className="text-xs text-[var(--primary-green)] hover:underline">
                    View all notifications
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5" />
          </Button>
        </Link>

        {user && (
          <div className="flex items-center space-x-2 ml-4">
            <div className="text-sm">
              <p className="font-medium">{user.user_metadata?.name || user.email}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}