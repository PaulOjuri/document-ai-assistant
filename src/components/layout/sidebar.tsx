'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Folder,
  FolderPlus,
  Upload,
  FileText,
  Mic,
  Filter,
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
  safeArtifact?: string;
}

const mockFolders: FolderNode[] = [
  {
    id: '1',
    name: 'PI Planning Q4 2024',
    safeArtifact: 'Epic',
    documentCount: 12,
    children: [
      { id: '2', name: 'User Stories', documentCount: 8, safeArtifact: 'User Story' },
      { id: '3', name: 'Acceptance Criteria', documentCount: 4 }
    ]
  },
  {
    id: '4',
    name: 'Feature Backlog',
    safeArtifact: 'Feature',
    documentCount: 25,
    children: [
      { id: '5', name: 'Mobile App Features', documentCount: 15 },
      { id: '6', name: 'Web Platform Features', documentCount: 10 }
    ]
  },
  {
    id: '7',
    name: 'Meeting Notes',
    documentCount: 18,
    children: [
      { id: '8', name: 'Sprint Planning', documentCount: 6 },
      { id: '9', name: 'Retrospectives', documentCount: 4 },
      { id: '10', name: 'PO Sync', documentCount: 8 }
    ]
  }
];

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
            {folder.documentCount && (
              <span className="text-xs text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-1 rounded-full">
                {folder.documentCount}
              </span>
            )}
            {folder.safeArtifact && (
              <span className="text-xs bg-[var(--primary-green)] text-white px-2 py-1 rounded">
                {folder.safeArtifact}
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
          <Link href="/audio">
            <Button className="w-full justify-start" variant="outline">
              <Mic className="w-4 h-4 mr-2" />
              Audio
            </Button>
          </Link>
          <Link href="/chat">
            <Button className="w-full justify-start" variant="outline">
              <Bot className="w-4 h-4 mr-2" />
              SAFe Chat
            </Button>
          </Link>
          <Button className="w-full justify-start" variant="outline">
            <FolderPlus className="w-4 h-4 mr-2" />
            New Folder
          </Button>
        </div>
      </div>

      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">Folders</h3>
          <Button variant="ghost" size="icon" className="w-6 h-6">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="max-h-96 overflow-y-auto scrollbar-hide">
          <FolderTree folders={mockFolders} />
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center space-x-2 mb-3">
          <Filter className="w-4 h-4" />
          <h3 className="font-medium">Filters</h3>
        </div>
        <div className="space-y-3 flex-1">
          <Card className="p-3">
            <h4 className="text-sm font-medium mb-2">SAFe Artifacts</h4>
            <div className="space-y-1">
              {['Epic', 'Feature', 'User Story', 'Capability'].map((artifact) => (
                <label key={artifact} className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" className="rounded" />
                  <span>{artifact}</span>
                </label>
              ))}
            </div>
          </Card>

          <Card className="p-3">
            <h4 className="text-sm font-medium mb-2">File Types</h4>
            <div className="space-y-1">
              {['PDF', 'DOCX', 'Notes', 'Audio'].map((type) => (
                <label key={type} className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" className="rounded" />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </aside>
  );
}