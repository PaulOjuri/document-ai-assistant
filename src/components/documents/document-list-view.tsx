'use client';

import { Button } from '@/components/ui/button';
import { Eye, Download, MoreHorizontal, Tag, Calendar } from 'lucide-react';
import { getFileTypeIcon, getSafeArtifactColor, getPriorityColor, formatBytes } from '@/lib/utils';
import type { Document } from '@/types';

interface DocumentListViewProps {
  documents: Document[];
  onView?: (document: Document) => void;
  onDownload?: (document: Document) => void;
  onDelete?: (document: Document) => void;
}

export function DocumentListView({ documents, onView, onDownload, onDelete }: DocumentListViewProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] border-b border-[var(--border)]">
        <div className="col-span-4">Name</div>
        <div className="col-span-2">Type</div>
        <div className="col-span-2">Artifact</div>
        <div className="col-span-1">Priority</div>
        <div className="col-span-2">Modified</div>
        <div className="col-span-1">Actions</div>
      </div>

      {documents.map((document) => (
        <div
          key={document.id}
          className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-[var(--muted)] rounded-lg transition-colors group"
        >
          {/* Name */}
          <div className="col-span-4 flex items-center space-x-3">
            <span className="text-lg">{getFileTypeIcon(document.fileType)}</span>
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-sm truncate" title={document.title}>
                {document.title}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                {document.tags.slice(0, 2).map((tag, index) => (
                  <span key={index} className="text-xs bg-[var(--muted)] px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
                {document.tags.length > 2 && (
                  <span className="text-xs text-[var(--muted-foreground)]">
                    +{document.tags.length - 2}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Type */}
          <div className="col-span-2 flex items-center">
            <div>
              <span className="text-sm font-medium">{document.fileType.toUpperCase()}</span>
              <p className="text-xs text-[var(--muted-foreground)]">
                {formatBytes(document.content.length * 2)}
              </p>
            </div>
          </div>

          {/* Artifact */}
          <div className="col-span-2 flex items-center">
            {document.artifactType ? (
              <span className={`text-xs px-2 py-1 rounded-full ${getSafeArtifactColor(document.artifactType)}`}>
                {document.artifactType}
              </span>
            ) : (
              <span className="text-sm text-[var(--muted-foreground)]">—</span>
            )}
          </div>

          {/* Priority */}
          <div className="col-span-1 flex items-center">
            {document.priority ? (
              <span className={`text-xs font-medium ${getPriorityColor(document.priority)}`}>
                {document.priority}
              </span>
            ) : (
              <span className="text-sm text-[var(--muted-foreground)]">—</span>
            )}
          </div>

          {/* Modified */}
          <div className="col-span-2 flex items-center">
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3 text-[var(--muted-foreground)]" />
              <span className="text-sm text-[var(--muted-foreground)]">
                {new Date(document.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="col-span-1 flex items-center justify-end">
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8"
                onClick={() => onView?.(document)}
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8"
                onClick={() => onDownload?.(document)}
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}