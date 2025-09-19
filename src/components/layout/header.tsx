'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, User, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchInterface } from '@/components/search/search-interface';
import { useAuth } from '@/components/auth/auth-provider';

export function Header() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  const handleSearchResult = (result: any) => {
    // Handle search result selection
    console.log('Selected search result:', result);
    // You can navigate to the result or open a modal here
  };

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/documents', label: 'Documents' },
    { href: '/notes', label: 'Notes' },
    { href: '/audio', label: 'Audio' },
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
          placeholder="Search documents, notes, and audio..."
          showFilters={true}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon">
          <Bell className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <Settings className="w-5 h-5" />
        </Button>

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