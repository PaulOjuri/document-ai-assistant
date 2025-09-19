'use client';

import { useState } from 'react';
import { Grid, List, Filter, SortAsc } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DocumentCard } from './document-card';
import { DocumentListView } from './document-list-view';
import type { Document } from '@/types';

type FolderOption = {
  id: string;
  name: string;
};

interface DocumentGridProps {
  documents: Document[];
  folders?: FolderOption[];
  onDocumentView?: (document: Document) => void;
  onDocumentDownload?: (document: Document) => void;
  onDocumentDelete?: (document: Document) => void;
  onDocumentMoveToFolder?: (document: Document, folderId: string | null) => void;
}

const mockDocuments: Document[] = [
  {
    id: '1',
    title: 'PI Planning Q4 2024 - Epic Overview',
    content: 'Program Increment planning document for Q4 2024 focusing on mobile application features and customer experience improvements. This epic encompasses multiple features including user authentication, payment processing, and enhanced search capabilities...',
    fileUrl: '/uploads/pi-planning-q4.pdf',
    fileType: 'pdf',
    tags: ['pi-planning', 'epic', 'mobile'],
    artifactType: 'Epic',
    priority: 'High',
    userId: 'user1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: '2',
    title: 'User Authentication Feature Requirements',
    content: 'Detailed requirements for implementing secure user authentication including OAuth integration, multi-factor authentication, and password policies. The feature supports social login providers and enterprise SSO...',
    fileUrl: '/uploads/auth-requirements.docx',
    fileType: 'docx',
    tags: ['authentication', 'security', 'feature'],
    artifactType: 'Feature',
    priority: 'High',
    userId: 'user1',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18'),
  },
  {
    id: '3',
    title: 'Sprint 23 Retrospective Notes',
    content: 'Retrospective notes from Sprint 23 covering what went well, what could be improved, and action items for the next sprint. Team velocity increased by 15% this sprint...',
    fileUrl: '/uploads/sprint-23-retro.md',
    fileType: 'md',
    tags: ['retrospective', 'sprint', 'improvement'],
    artifactType: 'User Story',
    priority: 'Medium',
    userId: 'user1',
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-16'),
  },
  {
    id: '4',
    title: 'Payment Gateway Integration Story',
    content: 'As a customer, I want to securely pay for my orders using multiple payment methods so that I can complete my purchase conveniently. Acceptance criteria include support for credit cards, PayPal, and digital wallets...',
    fileUrl: '/uploads/payment-story.txt',
    fileType: 'txt',
    tags: ['payment', 'integration', 'user-story'],
    artifactType: 'User Story',
    priority: 'Medium',
    userId: 'user1',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-14'),
  },
  {
    id: '5',
    title: 'Mobile App Capability Overview',
    content: 'Capability document outlining the mobile application development approach, technology stack, and architectural decisions. Includes native iOS and Android development with shared business logic...',
    fileUrl: '/uploads/mobile-capability.pdf',
    fileType: 'pdf',
    tags: ['mobile', 'capability', 'architecture'],
    artifactType: 'Capability',
    priority: 'High',
    userId: 'user1',
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-12'),
  },
  {
    id: '6',
    title: 'Team Velocity Analysis Q1 2024',
    content: 'Analysis of team velocity trends and sprint performance metrics for Q1 2024. Includes recommendations for capacity planning and process improvements...',
    fileUrl: '/uploads/velocity-analysis.pdf',
    fileType: 'pdf',
    tags: ['metrics', 'velocity', 'analysis'],
    priority: 'Low',
    userId: 'user1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-10'),
  },
];

export function DocumentGrid({
  documents = mockDocuments,
  folders = [],
  onDocumentView,
  onDocumentDownload,
  onDocumentDelete,
  onDocumentMoveToFolder
}: DocumentGridProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'type'>('date');

  const sortedDocuments = [...documents].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.title.localeCompare(b.title);
      case 'type':
        return a.fileType.localeCompare(b.fileType);
      case 'date':
      default:
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">Documents</h2>
          <span className="text-sm text-[var(--muted-foreground)]">
            {documents.length} files
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortBy(sortBy === 'date' ? 'name' : sortBy === 'name' ? 'type' : 'date')}
          >
            <SortAsc className="w-4 h-4 mr-2" />
            Sort by {sortBy}
          </Button>

          <Button
            variant="outline"
            size="sm"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>

          <div className="flex items-center border border-[var(--border)] rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Document Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedDocuments.map((document) => (
            <DocumentCard
              key={document.id}
              document={document}
              folders={folders}
              onView={onDocumentView}
              onDownload={onDocumentDownload}
              onDelete={onDocumentDelete}
              onMoveToFolder={onDocumentMoveToFolder}
            />
          ))}
        </div>
      ) : (
        <DocumentListView
          documents={sortedDocuments}
          onView={onDocumentView}
          onDownload={onDocumentDownload}
          onDelete={onDocumentDelete}
        />
      )}

      {documents.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-lg font-medium mb-2">No documents found</h3>
          <p className="text-[var(--muted-foreground)] mb-4">
            Start by uploading your first document or creating a new note.
          </p>
          <Button>Upload Document</Button>
        </div>
      )}
    </div>
  );
}