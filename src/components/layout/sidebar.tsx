'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';
import { createSupabaseClient } from '@/lib/supabase/client';
import {
  Folder,
  FolderPlus,
  Upload,
  FileText,
  CheckSquare,
  ChevronRight,
  ChevronDown,
  Plus,
  Bot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface FolderNode {
  id: string;
  name: string;
  children?: FolderNode[];
  documentCount?: number;
  parent_id?: string | null;
}

function FolderTree({ folders, level = 0 }: { folders: FolderNode[]; level?: number }) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['1', '4', '7']));

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  return (
    <div className="space-y-1">
      {folders.map((folder) => (
        <div key={folder.id}>
          <div
            className={`flex items-center space-x-2 p-2 rounded-md hover:bg-[var(--muted)] cursor-pointer group ${
              level > 0 ? 'ml-4' : ''
            }`}
            onClick={() => folder.children && toggleFolder(folder.id)}
          >
            {folder.children && (
              <Button variant="ghost" size="icon" className="w-4 h-4 p-0">
                {expandedFolders.has(folder.id) ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </Button>
            )}
            <Folder className="w-4 h-4 text-[var(--primary-green)]" />
            <span className="text-sm flex-1">{folder.name}</span>
            {folder.documentCount && folder.documentCount > 0 && (
              <span className="text-xs text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-1 rounded-full">
                {folder.documentCount}
              </span>
            )}
          </div>
          {folder.children && expandedFolders.has(folder.id) && (
            <FolderTree folders={folder.children} level={level + 1} />
          )}
        </div>
      ))}
    </div>
  );
}

export function Sidebar() {
  const { user } = useAuth();
  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseClient();

  useEffect(() => {
    if (user) {
      loadFolders();
    }
  }, [user]);

  const loadFolders = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load folders and their content counts
      const [foldersResponse, documentsResponse, notesResponse] = await Promise.all([
        supabase
          .from('folders')
          .select('id, name, parent_id')
          .eq('user_id', user.id)
          .order('name'),
        supabase
          .from('documents')
          .select('folder_id')
          .eq('user_id', user.id),
        supabase
          .from('notes')
          .select('folder_id')
          .eq('user_id', user.id)
      ]);

      if (foldersResponse.error) throw foldersResponse.error;

      const foldersData = foldersResponse.data || [];
      const documents = documentsResponse.data || [];
      const notes = notesResponse.data || [];

      // Calculate total content count for each folder
      const folderCounts = foldersData.reduce((acc, folder) => {
        const docCount = documents.filter(d => d.folder_id === folder.id).length;
        const noteCount = notes.filter(n => n.folder_id === folder.id).length;

        acc[folder.id] = docCount + noteCount;
        return acc;
      }, {} as Record<string, number>);

      // Build folder tree
      const foldersWithCounts: FolderNode[] = foldersData.map(folder => ({
        ...folder,
        children: [],
        documentCount: folderCounts[folder.id] || 0
      }));

      const folderMap = new Map<string, FolderNode>();
      foldersWithCounts.forEach(folder => folderMap.set(folder.id, folder));

      const rootFolders: FolderNode[] = [];

      foldersWithCounts.forEach(folder => {
        if (folder.parent_id) {
          const parent = folderMap.get(folder.parent_id);
          if (parent) {
            if (!parent.children) parent.children = [];
            parent.children.push(folder);
          }
        } else {
          rootFolders.push(folder);
        }
      });

      setFolders(rootFolders);
    } catch (error) {
      console.error('Error loading folders:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="w-80 border-r border-[var(--border)] bg-[var(--card)] flex flex-col h-full">
      <div className="p-4 border-b border-[var(--border)]">
        <h2 className="font-semibold text-lg mb-4">Quick Actions</h2>
        <div className="space-y-2">
          <Link href="/documents">
            <Button className="w-full justify-start" variant="default">
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </Link>
          <Link href="/notes">
            <Button className="w-full justify-start" variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              New Note
            </Button>
          </Link>
          <Link href="/todo">
            <Button className="w-full justify-start" variant="outline">
              <CheckSquare className="w-4 h-4 mr-2" />
              Todo
            </Button>
          </Link>
          <Link href="/chat">
            <Button className="w-full justify-start" variant="outline">
              <Bot className="w-4 h-4 mr-2" />
              SAFe Chat
            </Button>
          </Link>
          <Link href="/folders">
            <Button className="w-full justify-start" variant="outline">
              <FolderPlus className="w-4 h-4 mr-2" />
              New Folder
            </Button>
          </Link>
        </div>
      </div>

      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">Folders</h3>
          <Link href="/folders">
            <Button variant="ghost" size="icon" className="w-6 h-6">
              <Plus className="w-4 h-4" />
            </Button>
          </Link>
        </div>
        <div className="max-h-96 overflow-y-auto scrollbar-hide">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-4 h-4 border-2 border-[var(--primary-green)] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : folders.length === 0 ? (
            <div className="text-center py-4 text-[var(--muted-foreground)]">
              <Folder className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No folders yet</p>
              <Link href="/folders" className="text-xs text-[var(--primary-green)] hover:underline">
                Create your first folder
              </Link>
            </div>
          ) : (
            <FolderTree folders={folders} />
          )}
        </div>
      </div>

    </aside>
  );
}