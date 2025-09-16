'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Eye, MoreHorizontal, Tag, Calendar } from 'lucide-react';
import { getFileTypeIcon, getSafeArtifactColor, getPriorityColor, formatBytes } from '@/lib/utils';
import type { Document } from '@/types';

interface DocumentCardProps {
  document: Document;
  onView?: (document: Document) => void;
  onDownload?: (document: Document) => void;
  onDelete?: (document: Document) => void;
}

export function DocumentCard({ document, onView, onDownload, onDelete }: DocumentCardProps) {
  const fileIcon = getFileTypeIcon(document.fileType);

  return (
    <Card className="group hover:shadow-md transition-all duration-200 hover:border-[var(--primary-green)] w-full overflow-hidden">
      <CardHeader className="pb-3 overflow-hidden">
        <div className="flex items-start justify-between w-full">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="text-2xl flex-shrink-0">{fileIcon}</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate max-w-full overflow-hidden text-ellipsis whitespace-nowrap" title={document.title}>
                {document.title}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-[var(--muted-foreground)]">
                  {document.fileType?.toUpperCase() || 'UNKNOWN'}
                </span>
                <span className="text-xs text-[var(--muted-foreground)]">•</span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {formatBytes(document.content.length * 2)} {/* Rough estimate */}
                </span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Content Preview */}
          <p className="text-xs text-[var(--muted-foreground)] line-clamp-2">
            {document.content.substring(0, 120)}...
          </p>

          {/* Tags and Metadata */}
          <div className="space-y-2">
            {/* SAFe Artifact & Priority */}
            <div className="flex items-center justify-between">
              {document.artifactType && (
                <span className={`text-xs px-2 py-1 rounded-full ${getSafeArtifactColor(document.artifactType)}`}>
                  {document.artifactType}
                </span>
              )}
              {document.priority && (
                <span className={`text-xs font-medium ${getPriorityColor(document.priority)}`}>
                  {document.priority} Priority
                </span>
              )}
            </div>

            {/* Tags */}
            {document.tags.length > 0 && (
              <div className="flex items-center space-x-1 flex-wrap">
                <Tag className="w-3 h-3 text-[var(--muted-foreground)]" />
                {document.tags.slice(0, 3).map((tag, index) => (
                  <span key={index} className="text-xs bg-[var(--muted)] px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
                {document.tags.length > 3 && (
                  <span className="text-xs text-[var(--muted-foreground)]">
                    +{document.tags.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Date and Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3 text-[var(--muted-foreground)]" />
              <span className="text-xs text-[var(--muted-foreground)]">
                {new Date(document.updatedAt).toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onView?.(document)}
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onDownload?.(document)}
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}