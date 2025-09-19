'use client';

import { useState, useEffect } from 'react';
import { Folder, FolderPlus, Plus, Edit, Trash2, ChevronRight, ChevronDown, MessageSquare, FileText, CheckSquare, Settings, ArrowLeft, GripVertical, ExternalLink, Eye, MoveHorizontal, X } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import { MainLayout } from '@/components/layout/main-layout';
import { Database } from '@/lib/supabase/database.types';

type FolderRow = Database['public']['Tables']['folders']['Row'];
type DocumentRow = Database['public']['Tables']['documents']['Row'];

interface FolderWithChildren extends FolderRow {
  children: FolderWithChildren[];
  documents?: DocumentRow[];
  document_count?: number;
  note_count?: number;
  todo_count?: number;
}

interface PresetFolder {
  name: string;
  type: 'feature' | 'general';
  subfolders?: string[];
}

const PRESET_FOLDERS: PresetFolder[] = [
  {
    name: 'General Context',
    type: 'general',
    subfolders: ['Technology Stack', 'Team Structure', 'Processes', 'Guidelines']
  }
];

const FEATURE_SUBFOLDERS = ['Contexts', 'Meeting Summaries', 'User Stories'];

export function FoldersClient() {
  const [folders, setFolders] = useState<FolderWithChildren[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string>('no-parent');
  const [folderType, setFolderType] = useState<'feature' | 'general' | 'custom'>('custom');
  const [draggedDocument, setDraggedDocument] = useState<DocumentRow | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [unassignedDocuments, setUnassignedDocuments] = useState<DocumentRow[]>([]);
  const [selectedFolderDetail, setSelectedFolderDetail] = useState<FolderWithChildren | null>(null);
  const [folderDetailOpen, setFolderDetailOpen] = useState(false);
  const { user } = useAuth();
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

      // Load folders and their stats
      const [foldersResponse, documentsResponse, notesResponse, todosResponse] = await Promise.all([
        supabase
          .from('folders')
          .select('*')
          .eq('user_id', user.id)
          .order('name'),
        supabase
          .from('documents')
          .select('*')
          .eq('user_id', user.id)
          .order('title'),
        supabase
          .from('notes')
          .select('folder_id')
          .eq('user_id', user.id),
        supabase
          .from('todos')
          .select('folder_id')
          .eq('user_id', user.id)
      ]);

      if (foldersResponse.error) throw foldersResponse.error;

      const folders = foldersResponse.data || [];
      const documents = documentsResponse.data || [];
      const notes = notesResponse.data || [];
      const todos = todosResponse.data || [];

      // Calculate counts for each folder
      const folderStats = folders.reduce((acc, folder) => {
        const folderDocs = documents.filter(d => d.folder_id === folder.id);
        acc[folder.id] = {
          documents: folderDocs,
          document_count: folderDocs.length,
          note_count: notes.filter(n => n.folder_id === folder.id).length,
          todo_count: todos.filter(t => t.folder_id === folder.id).length,
        };
        return acc;
      }, {} as Record<string, { documents: DocumentRow[]; document_count: number; note_count: number; todo_count: number }>);

      // Build folder tree
      const foldersWithStats: FolderWithChildren[] = folders.map(folder => ({
        ...folder,
        children: [],
        ...folderStats[folder.id]
      }));

      const folderMap = new Map<string, FolderWithChildren>();
      foldersWithStats.forEach(folder => folderMap.set(folder.id, folder));

      const rootFolders: FolderWithChildren[] = [];

      foldersWithStats.forEach(folder => {
        if (folder.parent_id) {
          const parent = folderMap.get(folder.parent_id);
          if (parent) {
            parent.children.push(folder);
          }
        } else {
          rootFolders.push(folder);
        }
      });

      setFolders(rootFolders);

      // Load unassigned documents (documents with no folder_id)
      const unassignedDocs = documents.filter(doc => !doc.folder_id);
      setUnassignedDocuments(unassignedDocs);
    } catch (error) {
      console.error('Error loading folders:', error);
    } finally {
      setLoading(false);
    }
  };

  const createFolder = async () => {
    if (!user || !newFolderName.trim()) return;

    try {
      const foldersToCreate: Array<{ name: string; parent_id?: string }> = [];

      if (folderType === 'feature') {
        // Create feature folder with subfolders
        foldersToCreate.push({
          name: newFolderName.trim(),
          parent_id: selectedParentId && selectedParentId !== 'no-parent' ? selectedParentId : undefined
        });
      } else if (folderType === 'general') {
        // Create general context folder with subfolders
        const preset = PRESET_FOLDERS.find(p => p.name === newFolderName.trim());
        if (preset && preset.subfolders) {
          foldersToCreate.push({
            name: preset.name,
            parent_id: selectedParentId && selectedParentId !== 'no-parent' ? selectedParentId : undefined
          });
        } else {
          foldersToCreate.push({
            name: newFolderName.trim(),
            parent_id: selectedParentId && selectedParentId !== 'no-parent' ? selectedParentId : undefined
          });
        }
      } else {
        // Create custom folder
        foldersToCreate.push({
          name: newFolderName.trim(),
          parent_id: selectedParentId && selectedParentId !== 'no-parent' ? selectedParentId : undefined
        });
      }

      // Create main folder(s)
      for (const folderData of foldersToCreate) {
        const { data: mainFolder, error: mainError } = await supabase
          .from('folders')
          .insert([{
            name: folderData.name,
            parent_id: folderData.parent_id || null,
            user_id: user.id,
          }])
          .select()
          .single();

        if (mainError) throw mainError;

        // Create subfolders based on type
        if (folderType === 'feature' && mainFolder) {
          for (const subfolderName of FEATURE_SUBFOLDERS) {
            await supabase
              .from('folders')
              .insert([{
                name: `${subfolderName} - ${mainFolder.name}`,
                parent_id: mainFolder.id,
                user_id: user.id,
              }]);
          }
        } else if (folderType === 'general' && mainFolder) {
          const preset = PRESET_FOLDERS.find(p => p.name === newFolderName.trim());
          if (preset && preset.subfolders) {
            for (const subfolderName of preset.subfolders) {
              await supabase
                .from('folders')
                .insert([{
                  name: subfolderName,
                  parent_id: mainFolder.id,
                  user_id: user.id,
                }]);
            }
          }
        }
      }

      await loadFolders();
      setCreateDialogOpen(false);
      setNewFolderName('');
      setSelectedParentId('no-parent');
      setFolderType('custom');
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  const createGeneralContextFolder = async () => {
    setNewFolderName('General Context');
    setFolderType('general');
    setSelectedParentId('no-parent');
    await createFolder();
  };

  const deleteFolder = async (folderId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId)
        .eq('user_id', user.id);

      if (error) throw error;

      await loadFolders();
    } catch (error) {
      console.error('Error deleting folder:', error);
    }
  };

  const toggleExpanded = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleDragStart = (e: React.DragEvent, document: DocumentRow) => {
    setDraggedDocument(document);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverFolder(folderId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverFolder(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault();
    setDragOverFolder(null);

    if (!draggedDocument) return;

    try {
      const response = await fetch(`/api/documents/${draggedDocument.id}/folder`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folderId: targetFolderId === 'unassigned' ? null : targetFolderId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to move document');
      }

      // Reload folders to update the UI
      await loadFolders();

      // Update folder detail view if it's open
      if (selectedFolderDetail) {
        const updatedFolder = getAllFolders(folders).find(f => f.id === selectedFolderDetail.id);
        if (updatedFolder) {
          setSelectedFolderDetail(updatedFolder);
        }
      }
    } catch (error) {
      console.error('Error moving document:', error);
    } finally {
      setDraggedDocument(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('doc')) return '📝';
    if (fileType.includes('text')) return '📄';
    if (fileType.includes('image')) return '🖼️';
    return '📎';
  };

  const handleFolderDoubleClick = (folder: FolderWithChildren) => {
    console.log('Double-click triggered for folder:', folder.name);
    setSelectedFolderDetail(folder);
    setFolderDetailOpen(true);
  };

  const handleMoveDocument = async (document: DocumentRow, targetFolderId: string | null) => {
    try {
      const response = await fetch(`/api/documents/${document.id}/folder`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folderId: targetFolderId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to move document');
      }

      // Reload folders and update detail view
      await loadFolders();
      if (selectedFolderDetail) {
        const updatedFolder = getAllFolders(folders).find(f => f.id === selectedFolderDetail.id);
        if (updatedFolder) {
          setSelectedFolderDetail(updatedFolder);
        }
      }
    } catch (error) {
      console.error('Error moving document:', error);
    }
  };

  const renderFolder = (folder: FolderWithChildren, level: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const hasChildren = folder.children.length > 0;
    const totalItems = (folder.document_count || 0) + (folder.note_count || 0) + (folder.todo_count || 0);

    return (
      <div key={folder.id} className="w-full">
        <div
          className={`flex items-center justify-between p-3 rounded-lg border transition-colors hover:bg-[var(--muted)] ${
            level > 0 ? 'ml-6 border-l-2 border-[var(--primary-green)]' : ''
          } ${dragOverFolder === folder.id ? 'bg-[var(--primary-green)]/10 border-[var(--primary-green)]' : ''}`}
          onDragOver={(e) => handleDragOver(e, folder.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, folder.id)}
        >
          <div className="flex items-center space-x-3 flex-1">
            {hasChildren ? (
              <button
                onClick={() => toggleExpanded(folder.id)}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            ) : (
              <div className="w-4" />
            )}

            <Folder className="w-5 h-5 text-[var(--primary-green)]" />

            <div
              className="flex-1 cursor-pointer"
              onDoubleClick={(e) => {
                e.stopPropagation();
                handleFolderDoubleClick(folder);
              }}
            >
              <div className="flex items-center space-x-2">
                <span className="font-medium">{folder.name}</span>
                {folder.name === 'General Context' && (
                  <Badge variant="secondary" className="text-xs">
                    <Settings className="w-3 h-3 mr-1" />
                    System
                  </Badge>
                )}
                {folder.parent_id && FEATURE_SUBFOLDERS.some(subfolder => folder.name.startsWith(subfolder)) && (
                  <Badge variant="outline" className="text-xs">
                    Feature Sub
                  </Badge>
                )}
              </div>

              {totalItems > 0 && (
                <div className="flex items-center space-x-4 mt-1 text-xs text-[var(--muted-foreground)]">
                  {(folder.document_count || 0) > 0 && (
                    <div className="flex items-center space-x-1">
                      <FileText className="w-3 h-3" />
                      <span>{folder.document_count}</span>
                    </div>
                  )}
                  {(folder.note_count || 0) > 0 && (
                    <div className="flex items-center space-x-1">
                      <MessageSquare className="w-3 h-3" />
                      <span>{folder.note_count}</span>
                    </div>
                  )}
                  {(folder.todo_count || 0) > 0 && (
                    <div className="flex items-center space-x-1">
                      <CheckSquare className="w-3 h-3" />
                      <span>{folder.todo_count}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedParentId(folder.id);
                    setNewFolderName('');
                    setFolderType('custom');
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Subfolder in &quot;{folder.name}&quot;</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Folder Name</label>
                    <Input
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Enter folder name..."
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={createFolder}
                      disabled={!newFolderName.trim()}
                    >
                      Create
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteFolder(folder.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-2 space-y-2">
            {/* Render child folders first */}
            {hasChildren && (
              <div className="space-y-2">
                {folder.children.map(child => renderFolder(child, level + 1))}
              </div>
            )}

            {/* Render documents in this folder */}
            {folder.documents && folder.documents.length > 0 && (
              <div className={`space-y-1 ${level > 0 ? 'ml-6' : ''}`}>
                <div className="text-xs text-[var(--muted-foreground)] font-medium mb-2 flex items-center space-x-1">
                  <FileText className="w-3 h-3" />
                  <span>Documents ({folder.documents.length})</span>
                </div>
                {folder.documents.map(document => (
                  <div
                    key={document.id}
                    className="flex items-center justify-between p-2 rounded border border-[var(--border)] bg-[var(--card)] cursor-move hover:bg-[var(--muted)] transition-colors"
                    draggable
                    onDragStart={(e) => handleDragStart(e, document)}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <GripVertical className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
                      <span className="text-lg">{getFileTypeIcon(document.file_type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{document.title}</div>
                        <div className="text-xs text-[var(--muted-foreground)] flex items-center space-x-2">
                          <span>{formatFileSize(document.file_size)}</span>
                          <span>•</span>
                          <span>{document.file_type}</span>
                          {document.tags && document.tags.length > 0 && (
                            <>
                              <span>•</span>
                              <div className="flex items-center space-x-1">
                                {document.tags.slice(0, 2).map(tag => (
                                  <Badge key={tag} variant="outline" className="text-xs px-1 py-0">
                                    {tag}
                                  </Badge>
                                ))}
                                {document.tags.length > 2 && (
                                  <span className="text-xs">+{document.tags.length - 2}</span>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Link href={`/documents?id=${document.id}`}>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const getAllFolders = (folders: FolderWithChildren[]): FolderWithChildren[] => {
    const result: FolderWithChildren[] = [];

    folders.forEach(folder => {
      result.push(folder);
      if (folder.children.length > 0) {
        result.push(...getAllFolders(folder.children));
      }
    });

    return result;
  };

  const allFolders = getAllFolders(folders);
  const hasGeneralContext = folders.some(f => f.name === 'General Context');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-[var(--primary-green)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Folder Management</h1>
              <p className="text-muted-foreground mt-2">
                Organize your documents, notes, and content into folders
              </p>
            </div>
            <div className="flex space-x-2">
              {!hasGeneralContext && (
                <Button
                  onClick={createGeneralContextFolder}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>Create General Context</span>
                </Button>
              )}

              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <FolderPlus className="w-4 h-4" />
                <span>New Folder</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Folder Type</label>
                  <Select value={folderType} onValueChange={(value: 'feature' | 'general' | 'custom') => setFolderType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="feature">Feature Folder (with Contexts, Meeting Summaries, User Stories)</SelectItem>
                      <SelectItem value="general">General Context Folder</SelectItem>
                      <SelectItem value="custom">Custom Folder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Folder Name</label>
                  <Input
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder={
                      folderType === 'feature'
                        ? 'e.g., User Authentication, Payment System'
                        : folderType === 'general'
                        ? 'General Context'
                        : 'Enter folder name...'
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Parent Folder (Optional)</label>
                  <Select value={selectedParentId} onValueChange={setSelectedParentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent folder..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-parent">No parent (root level)</SelectItem>
                      {allFolders.map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          {folder.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {folderType === 'feature' && (
                  <div className="p-3 bg-[var(--muted)] rounded-lg">
                    <p className="text-sm font-medium mb-2">This will create:</p>
                    <ul className="text-sm text-[var(--muted-foreground)] space-y-1">
                      <li>• {newFolderName || 'Feature Name'}</li>
                      <li className="ml-4">• Contexts - {newFolderName || 'Feature Name'}</li>
                      <li className="ml-4">• Meeting Summaries - {newFolderName || 'Feature Name'}</li>
                      <li className="ml-4">• User Stories - {newFolderName || 'Feature Name'}</li>
                    </ul>
                  </div>
                )}

                {folderType === 'general' && (
                  <div className="p-3 bg-[var(--muted)] rounded-lg">
                    <p className="text-sm font-medium mb-2">This will create:</p>
                    <ul className="text-sm text-[var(--muted-foreground)] space-y-1">
                      <li>• General Context</li>
                      <li className="ml-4">• Technology Stack</li>
                      <li className="ml-4">• Team Structure</li>
                      <li className="ml-4">• Processes</li>
                      <li className="ml-4">• Guidelines</li>
                    </ul>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={createFolder}
                    disabled={!newFolderName.trim()}
                  >
                    Create Folder{folderType !== 'custom' ? 's' : ''}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
            </div>
          </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-sm">
              <Settings className="w-4 h-4 text-[var(--primary-green)]" />
              <span>General Context</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--muted-foreground)] mb-3">
              Store technology stack, team structure, and process documentation for AI context.
            </p>
            {!hasGeneralContext && (
              <Button
                onClick={createGeneralContextFolder}
                size="sm"
                variant="outline"
                className="w-full"
              >
                Create General Context
              </Button>
            )}
            {hasGeneralContext && (
              <Badge variant="secondary">Already created</Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-sm">
              <FolderPlus className="w-4 h-4 text-[var(--accent-blue)]" />
              <span>Feature Folders</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--muted-foreground)] mb-3">
              Create feature-based folders with sub-organization for contexts, meeting summaries, and user stories.
            </p>
            <Button
              onClick={() => {
                setFolderType('feature');
                setNewFolderName('');
                setCreateDialogOpen(true);
              }}
              size="sm"
              variant="outline"
              className="w-full"
            >
              Create Feature Folder
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-sm">
              <Folder className="w-4 h-4 text-[var(--warning-amber)]" />
              <span>Custom Folders</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--muted-foreground)] mb-3">
              Create custom folders for any specific organizational needs.
            </p>
            <Button
              onClick={() => {
                setFolderType('custom');
                setNewFolderName('');
                setCreateDialogOpen(true);
              }}
              size="sm"
              variant="outline"
              className="w-full"
            >
              Create Custom Folder
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Folder Tree */}
      <Card>
        <CardHeader>
          <CardTitle>Folder Structure</CardTitle>
        </CardHeader>
        <CardContent>
          {folders.length === 0 ? (
            <div className="text-center py-8 text-[var(--muted-foreground)]">
              <Folder className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No folders created yet</p>
              <p className="text-sm">Create your first folder to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {folders.map(folder => renderFolder(folder))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unassigned Documents */}
      {unassignedDocuments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Unassigned Documents</span>
                <Badge variant="secondary">{unassignedDocuments.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`space-y-1 p-3 rounded-lg border-2 border-dashed transition-colors ${
                  dragOverFolder === 'unassigned'
                    ? 'border-[var(--primary-green)] bg-[var(--primary-green)]/10'
                    : 'border-[var(--border)]'
                }`}
                onDragOver={(e) => handleDragOver(e, 'unassigned')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'unassigned')}
              >
                <div className="text-xs text-[var(--muted-foreground)] mb-2">
                  Drop documents here to remove from folders
                </div>
                {unassignedDocuments.map(document => (
                  <div
                    key={document.id}
                    className="flex items-center justify-between p-2 rounded border border-[var(--border)] bg-[var(--card)] cursor-move hover:bg-[var(--muted)] transition-colors"
                    draggable
                    onDragStart={(e) => handleDragStart(e, document)}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <GripVertical className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
                      <span className="text-lg">{getFileTypeIcon(document.file_type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{document.title}</div>
                        <div className="text-xs text-[var(--muted-foreground)] flex items-center space-x-2">
                          <span>{formatFileSize(document.file_size)}</span>
                          <span>•</span>
                          <span>{document.file_type}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Link href={`/documents?id=${document.id}`}>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
      )}

      {/* AI Integration Note */}
      <Card className="border-[var(--border)] bg-[var(--muted)]">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <MessageSquare className="w-4 h-4 text-[var(--muted-foreground)] mt-0.5" />
            <div>
              <p className="text-sm text-[var(--muted-foreground)]">
                Well-organized folders help the AI provide more relevant guidance for your specific features and contexts.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Folder Detail Modal */}
      <Dialog open={folderDetailOpen} onOpenChange={setFolderDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Folder className="w-5 h-5 text-[var(--primary-green)]" />
              <span>{selectedFolderDetail?.name}</span>
              {selectedFolderDetail?.documents && (
                <Badge variant="secondary">
                  {selectedFolderDetail.documents.length} documents
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedFolderDetail && (
            <div className="space-y-4">
              {/* Folder Info */}
              <div className="flex items-center space-x-4 text-sm text-[var(--muted-foreground)] bg-[var(--muted)] p-3 rounded-lg">
                <div className="flex items-center space-x-1">
                  <FileText className="w-4 h-4" />
                  <span>{selectedFolderDetail.document_count || 0} documents</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageSquare className="w-4 h-4" />
                  <span>{selectedFolderDetail.note_count || 0} notes</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckSquare className="w-4 h-4" />
                  <span>{selectedFolderDetail.todo_count || 0} todos</span>
                </div>
              </div>

              {/* Documents List */}
              {selectedFolderDetail.documents && selectedFolderDetail.documents.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="font-medium text-sm text-[var(--muted-foreground)]">Documents</h3>
                  <div className="space-y-2">
                    {selectedFolderDetail.documents.map(document => (
                      <div
                        key={document.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-[var(--card)] hover:bg-[var(--muted)] transition-colors"
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <span className="text-lg">{getFileTypeIcon(document.file_type)}</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{document.title}</div>
                            <div className="text-xs text-[var(--muted-foreground)] flex items-center space-x-2">
                              <span>{formatFileSize(document.file_size)}</span>
                              <span>•</span>
                              <span>{document.file_type}</span>
                              {document.tags && document.tags.length > 0 && (
                                <>
                                  <span>•</span>
                                  <div className="flex items-center space-x-1">
                                    {document.tags.slice(0, 2).map(tag => (
                                      <Badge key={tag} variant="outline" className="text-xs px-1 py-0">
                                        {tag}
                                      </Badge>
                                    ))}
                                    {document.tags.length > 2 && (
                                      <span className="text-xs">+{document.tags.length - 2}</span>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2">
                          {/* Move Button */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoveHorizontal className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Move Document</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <p className="text-sm text-[var(--muted-foreground)]">
                                  Select a destination folder for &quot;{document.title}&quot;
                                </p>
                                <Select
                                  onValueChange={(value) => {
                                    handleMoveDocument(document, value === 'unassigned' ? null : value);
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select destination folder..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="unassigned">Unassigned (No folder)</SelectItem>
                                    {allFolders
                                      .filter(f => f.id !== selectedFolderDetail.id)
                                      .map((folder) => (
                                        <SelectItem key={folder.id} value={folder.id}>
                                          {folder.name}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </DialogContent>
                          </Dialog>

                          {/* View Button */}
                          <Link href={`/documents?id=${document.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>

                          {/* Edit Button */}
                          <Link href={`/documents?id=${document.id}&edit=true`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-[var(--muted-foreground)]">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No documents in this folder</p>
                  <p className="text-sm">Drag documents here from other folders or upload new ones</p>
                </div>
              )}

              {/* Child Folders */}
              {selectedFolderDetail.children && selectedFolderDetail.children.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium text-sm text-[var(--muted-foreground)]">Subfolders</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedFolderDetail.children.map(childFolder => (
                      <div
                        key={childFolder.id}
                        className="flex items-center space-x-2 p-2 rounded border bg-[var(--card)] hover:bg-[var(--muted)] cursor-pointer transition-colors"
                        onDoubleClick={() => {
                          setSelectedFolderDetail(childFolder);
                        }}
                      >
                        <Folder className="w-4 h-4 text-[var(--primary-green)]" />
                        <span className="text-sm font-medium truncate">{childFolder.name}</span>
                        <div className="ml-auto text-xs text-[var(--muted-foreground)]">
                          {(childFolder.document_count || 0) + (childFolder.note_count || 0) + (childFolder.todo_count || 0)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
        </div>
      </div>
    </MainLayout>
  );
}