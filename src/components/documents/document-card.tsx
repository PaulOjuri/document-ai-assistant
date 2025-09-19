'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Download, Eye, MoreHorizontal, Tag, Calendar, Folder, Move } from 'lucide-react';
import { getFileTypeIcon, getSafeArtifactColor, getPriorityColor, formatBytes } from '@/lib/utils';
import type { Document } from '@/types';

type FolderOption = {
  id: string;
  name: string;
};

interface DocumentCardProps {
  document: Document;
  folders?: FolderOption[];
  onView?: (document: Document) => void;
  onDownload?: (document: Document) => void;
  onDelete?: (document: Document) => void;
  onMoveToFolder?: (document: Document, folderId: string | null) => void;
}

export function DocumentCard({ document, folders = [], onView, onDownload, onDelete, onMoveToFolder }: DocumentCardProps) {
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string>(document.folder_id || 'no-folder');
  const fileIcon = getFileTypeIcon(document.fileType);

  const handleMoveToFolder = () => {
    const folderId = selectedFolderId === 'no-folder' ? null : selectedFolderId;
    onMoveToFolder?.(document, folderId);
    setShowFolderDialog(false);
  };

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
              {onMoveToFolder && (
                <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Move to folder"
                    >
                      <Move className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Move Document to Folder</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Document: {document.title}</label>
                      </div>
                      {folders.length > 0 ? (
                        <>
                          <div>
                            <label className="text-sm font-medium">Select Folder:</label>
                            <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                              <SelectTrigger className="mt-2">
                                <SelectValue placeholder="Choose a folder..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="no-folder">
                                  <div className="flex items-center space-x-2">
                                    <span>No Folder</span>
                                  </div>
                                </SelectItem>
                                {folders.map((folder) => (
                                  <SelectItem key={folder.id} value={folder.id}>
                                    <div className="flex items-center space-x-2">
                                      <Folder className="w-4 h-4" />
                                      <span>{folder.name}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setShowFolderDialog(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleMoveToFolder}>
                              Move Document
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-center py-4">
                            <Folder className="w-12 h-12 mx-auto mb-3 text-[var(--muted-foreground)]" />
                            <p className="text-sm text-[var(--muted-foreground)] mb-2">
                              No folders available
                            </p>
                            <p className="text-xs text-[var(--muted-foreground)]">
                              Create folders first to organize your documents
                            </p>
                          </div>
                          <div className="flex justify-center space-x-2">
                            <Button variant="outline" onClick={() => setShowFolderDialog(false)}>
                              Close
                            </Button>
                            <Button asChild>
                              <a href="/folders">Create Folders</a>
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onView?.(document)}
                title="View document"
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onDownload?.(document)}
                title="Download document"
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