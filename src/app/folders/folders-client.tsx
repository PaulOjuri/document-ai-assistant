'use client';

import { useState, useEffect } from 'react';
import { Folder, FolderPlus, Plus, Edit, Trash2, ChevronRight, ChevronDown, MessageSquare, FileText, Mic, Settings, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import { Database } from '@/lib/supabase/database.types';

type FolderRow = Database['public']['Tables']['folders']['Row'];

interface FolderWithChildren extends FolderRow {
  children: FolderWithChildren[];
  document_count?: number;
  note_count?: number;
  audio_count?: number;
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

const FEATURE_SUBFOLDERS = ['Contexts', 'Meeting Transcripts', 'User Stories'];

export function FoldersClient() {
  const [folders, setFolders] = useState<FolderWithChildren[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string>('no-parent');
  const [folderType, setFolderType] = useState<'feature' | 'general' | 'custom'>('custom');
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
      const [foldersResponse, documentsResponse, notesResponse, audiosResponse] = await Promise.all([
        supabase
          .from('folders')
          .select('*')
          .eq('user_id', user.id)
          .order('name'),
        supabase
          .from('documents')
          .select('folder_id')
          .eq('user_id', user.id),
        supabase
          .from('notes')
          .select('folder_id')
          .eq('user_id', user.id),
        supabase
          .from('audios')
          .select('folder_id')
          .eq('user_id', user.id)
      ]);

      if (foldersResponse.error) throw foldersResponse.error;

      const folders = foldersResponse.data || [];
      const documents = documentsResponse.data || [];
      const notes = notesResponse.data || [];
      const audios = audiosResponse.data || [];

      // Calculate counts for each folder
      const folderStats = folders.reduce((acc, folder) => {
        acc[folder.id] = {
          document_count: documents.filter(d => d.folder_id === folder.id).length,
          note_count: notes.filter(n => n.folder_id === folder.id).length,
          audio_count: audios.filter(a => a.folder_id === folder.id).length,
        };
        return acc;
      }, {} as Record<string, { document_count: number; note_count: number; audio_count: number }>);

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
    } catch (error) {
      console.error('Error loading folders:', error);
    } finally {
      setLoading(false);
    }
  };

  const createFolder = async () => {
    if (!user || !newFolderName.trim()) return;

    try {
      let foldersToCreate: Array<{ name: string; parent_id?: string }> = [];

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
                name: subfolderName,
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

  const renderFolder = (folder: FolderWithChildren, level: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const hasChildren = folder.children.length > 0;
    const totalItems = (folder.document_count || 0) + (folder.note_count || 0) + (folder.audio_count || 0);

    return (
      <div key={folder.id} className="w-full">
        <div
          className={`flex items-center justify-between p-3 rounded-lg border transition-colors hover:bg-[var(--muted)] ${
            level > 0 ? 'ml-6 border-l-2 border-[var(--primary-green)]' : ''
          }`}
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

            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium">{folder.name}</span>
                {folder.name === 'General Context' && (
                  <Badge variant="secondary" className="text-xs">
                    <Settings className="w-3 h-3 mr-1" />
                    System
                  </Badge>
                )}
                {folder.parent_id && FEATURE_SUBFOLDERS.includes(folder.name) && (
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
                  {(folder.audio_count || 0) > 0 && (
                    <div className="flex items-center space-x-1">
                      <Mic className="w-3 h-3" />
                      <span>{folder.audio_count}</span>
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
                  <DialogTitle>Create Subfolder in "{folder.name}"</DialogTitle>
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

        {hasChildren && isExpanded && (
          <div className="mt-2 space-y-2">
            {folder.children.map(child => renderFolder(child, level + 1))}
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Folder Management</h1>
            <p className="text-[var(--muted-foreground)]">
              Organize your documents, notes, and audio files by features and contexts
            </p>
          </div>
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
                      <SelectItem value="feature">Feature Folder (with Contexts, Meeting Transcripts, User Stories)</SelectItem>
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
                      <li className="ml-4">• Contexts</li>
                      <li className="ml-4">• Meeting Transcripts</li>
                      <li className="ml-4">• User Stories</li>
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
              Create feature-based folders with sub-organization for contexts, transcripts, and stories.
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
    </div>
  );
}