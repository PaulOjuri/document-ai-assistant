'use client';

import { useState, useEffect } from 'react';
import { X, Download, Edit, Trash2, Tag, FolderOpen, Star, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getFileTypeIcon, getSafeArtifactColor, getPriorityColor, formatBytes } from '@/lib/utils';
import { documentService } from '@/lib/supabase/documents';
import { useAuth } from '@/components/auth/auth-provider';
import type { Database } from '@/lib/supabase/database.types';

type Document = Database['public']['Tables']['documents']['Row'];

interface DocumentViewerProps {
  document: Document;
  onClose: () => void;
  onUpdate?: (document: Document) => void;
  onDelete?: (documentId: string) => void;
}

export function DocumentViewer({ document, onClose, onUpdate, onDelete }: DocumentViewerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingData, setEditingData] = useState({
    title: document.title,
    tags: document.tags.join(', '),
    artifact_type: document.artifact_type || '',
    priority: document.priority || '',
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const updatedDocument = await documentService.updateDocument(
        document.id,
        {
          title: editingData.title,
          tags: editingData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
          artifact_type: editingData.artifact_type || null,
          priority: editingData.priority || null,
        },
        user.id
      );

      onUpdate?.(updatedDocument);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update document:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !window.confirm('Are you sure you want to delete this document?')) return;

    setLoading(true);
    try {
      await documentService.deleteDocument(document.id, user.id);
      onDelete?.(document.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete document:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    window.open(document.file_url, '_blank');
  };

  const renderContent = () => {
    if (document.file_type === 'pdf') {
      return (
        <div className="h-96 border border-[var(--border)] rounded-lg overflow-hidden">
          <iframe
            src={`${document.file_url}#view=fit`}
            className="w-full h-full"
            title={document.title}
          />
        </div>
      );
    }

    if (document.file_type === 'txt' || document.file_type === 'md') {
      return (
        <div className="bg-[var(--muted)] rounded-lg p-4 max-h-96 overflow-y-auto">
          <pre className="whitespace-pre-wrap text-sm">{document.content}</pre>
        </div>
      );
    }

    return (
      <div className="bg-[var(--muted)] rounded-lg p-8 text-center">
        <div className="text-6xl mb-4">{getFileTypeIcon(document.file_type)}</div>
        <p className="text-[var(--muted-foreground)] mb-4">
          Preview not available for {document.file_type.toUpperCase()} files
        </p>
        <Button onClick={handleDownload}>
          <Download className="w-4 h-4 mr-2" />
          Download to View
        </Button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">{getFileTypeIcon(document.file_type)}</div>
              {isEditing ? (
                <Input
                  value={editingData.title}
                  onChange={(e) => setEditingData(prev => ({ ...prev, title: e.target.value }))}
                  className="text-xl font-bold bg-transparent border-none p-0 h-auto"
                />
              ) : (
                <CardTitle className="text-xl">{document.title}</CardTitle>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {!isEditing && (
                <>
                  <Button variant="ghost" size="icon" onClick={handleDownload}>
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleDelete}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Metadata */}
          <div className="space-y-3">
            <div className="flex items-center space-x-4 text-sm text-[var(--muted-foreground)]">
              <span>{document.file_type.toUpperCase()}</span>
              <span>•</span>
              <span>{formatBytes(document.file_size)}</span>
              <span>•</span>
              <span>Updated {new Date(document.updated_at).toLocaleDateString()}</span>
            </div>

            {/* SAFe Artifact & Priority */}
            <div className="flex items-center space-x-4">
              {isEditing ? (
                <div className="flex items-center space-x-2">
                  <select
                    value={editingData.artifact_type}
                    onChange={(e) => setEditingData(prev => ({ ...prev, artifact_type: e.target.value }))}
                    className="px-3 py-1 border border-[var(--border)] rounded-md text-sm"
                  >
                    <option value="">Select Artifact Type</option>
                    <option value="Epic">Epic</option>
                    <option value="Feature">Feature</option>
                    <option value="User Story">User Story</option>
                    <option value="Capability">Capability</option>
                    <option value="Solution">Solution</option>
                    <option value="Theme">Theme</option>
                    <option value="Enabler">Enabler</option>
                  </select>
                  <select
                    value={editingData.priority}
                    onChange={(e) => setEditingData(prev => ({ ...prev, priority: e.target.value }))}
                    className="px-3 py-1 border border-[var(--border)] rounded-md text-sm"
                  >
                    <option value="">Select Priority</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              ) : (
                <>
                  {document.artifact_type && (
                    <span className={`text-xs px-2 py-1 rounded-full ${getSafeArtifactColor(document.artifact_type)}`}>
                      {document.artifact_type}
                    </span>
                  )}
                  {document.priority && (
                    <span className={`text-sm font-medium ${getPriorityColor(document.priority)}`}>
                      {document.priority} Priority
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Tags */}
            <div className="flex items-center space-x-2">
              <Tag className="w-4 h-4 text-[var(--muted-foreground)]" />
              {isEditing ? (
                <Input
                  value={editingData.tags}
                  onChange={(e) => setEditingData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="Enter tags separated by commas"
                  className="flex-1"
                />
              ) : (
                <div className="flex flex-wrap gap-1">
                  {document.tags.length > 0 ? (
                    document.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-[var(--muted-foreground)]">No tags</span>
                  )}
                </div>
              )}
            </div>

            {/* Edit Actions */}
            {isEditing && (
              <div className="flex items-center space-x-2">
                <Button onClick={handleSave} disabled={loading} size="sm">
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditingData({
                      title: document.title,
                      tags: document.tags.join(', '),
                      artifact_type: document.artifact_type || '',
                      priority: document.priority || '',
                    });
                  }}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="max-h-[60vh] overflow-y-auto">
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}