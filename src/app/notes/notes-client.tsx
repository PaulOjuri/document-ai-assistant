'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Plus, Search, Filter, Save, X, Folder, FolderPlus, Eye, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';

interface Note {
  id: string;
  title: string;
  content: string;
  template?: string;
  tags?: string[];
  folder_id?: string;
  custom_date?: string;
  created_at: string;
  updated_at: string;
}

interface Folder {
  id: string;
  name: string;
  parent_id?: string;
  safe_artifact?: string;
  created_at: string;
  updated_at: string;
}

interface NotesClientProps {
  initialNotes: Note[];
}

const SAFE_TEMPLATES = [
  {
    id: 'user-story',
    name: 'User Story Template',
    content: `# User Story

## As a [type of user], I want [some goal] so that [some reason].

### Acceptance Criteria
- [ ] Given [some context]
- [ ] When [some action is performed]
- [ ] Then [some result is expected]

### Definition of Done
- [ ] Code written and tested
- [ ] Code reviewed by team
- [ ] Meets accessibility standards
- [ ] Documentation updated

### INVEST Check
- **Independent**: Can this story be developed independently?
- **Negotiable**: Are the details negotiable during development?
- **Valuable**: Does this provide value to users/stakeholders?
- **Estimable**: Can the team estimate the effort required?
- **Small**: Is this small enough to complete in one sprint?
- **Testable**: Can we test that this story is complete?

### Story Points: [Enter estimate]
### Priority: [High/Medium/Low]
### Sprint: [Enter target sprint]`
  },
  {
    id: 'epic',
    name: 'Epic Planning Template',
    content: `# Epic: [Epic Name]

## Overview
[Brief description of what this epic accomplishes]

## Business Value
[Why is this epic important? What business value does it provide?]

## User Personas
[Who are the primary users affected by this epic?]

## Features/Capabilities
[High-level features this epic will deliver]

## Success Metrics
[How will we measure success?]

## Dependencies
[What other epics/features/teams does this depend on?]

## Acceptance Criteria
- [ ] [High level criteria 1]
- [ ] [High level criteria 2]

## Stories Breakdown
[List of user stories that make up this epic]

## Timeline
- **Target Start**: [Date]
- **Target Completion**: [Date]
- **Key Milestones**: [Important dates]

## Risks & Assumptions
[What could go wrong? What are we assuming?]`
  },
  {
    id: 'retrospective',
    name: 'Sprint Retrospective Template',
    content: `# Sprint [X] Retrospective

**Date**: [Date]
**Participants**: [Team members present]
**Sprint Goal**: [What was the sprint goal?]

## What Went Well? 🟢
[Things the team did well this sprint]

## What Could Be Improved? 🟡
[Areas where the team can improve]

## What Didn't Go Well? 🔴
[Problems, blockers, or issues encountered]

## Action Items 🎯
- [ ] [Specific action item with owner and due date]
- [ ] [Another action item]

## Metrics
- **Sprint Goal Achievement**: [Met/Partially Met/Not Met]
- **Velocity**: [Story points completed]
- **Team Satisfaction**: [1-5 scale]

## Next Sprint Focus
[What should the team focus on in the next sprint?]`
  }
];

export function NotesClientPage({ initialNotes }: NotesClientProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreateFolderDialogOpen, setIsCreateFolderDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editNoteTitle, setEditNoteTitle] = useState('');
  const [editNoteContent, setEditNoteContent] = useState('');
  const [editNoteFolder, setEditNoteFolder] = useState<string>('no-folder');
  const [editCustomDate, setEditCustomDate] = useState<string>('');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedFolder, setSelectedFolder] = useState<string>('no-folder');
  const [customDate, setCustomDate] = useState<string>('');
  const [newFolderName, setNewFolderName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createSupabaseClient();

  const notesCount = notes.length;

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (templateId === 'blank') {
      setNewNoteTitle('');
      setNewNoteContent('');
    } else {
      const template = SAFE_TEMPLATES.find(t => t.id === templateId);
      if (template) {
        setNewNoteTitle(template.name);
        setNewNoteContent(template.content);
      }
    }
  };

  // Fetch folders on component mount
  const fetchFolders = async () => {
    if (!user) return;

    const { data: folders, error } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching folders:', error);
    } else {
      setFolders(folders || []);
    }
  };

  // Create new folder
  const handleCreateFolder = async () => {
    if (!user || !newFolderName.trim()) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('folders')
        .insert([
          {
            name: newFolderName.trim(),
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating folder:', error);
      } else {
        setFolders(prev => [...prev, data]);
        setNewFolderName('');
        setIsCreateFolderDialogOpen(false);
      }
    } catch (error) {
      console.error('Error creating folder:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!user || !newNoteTitle.trim() || !newNoteContent.trim()) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notes')
        .insert([
          {
            title: newNoteTitle.trim(),
            content: newNoteContent.trim(),
            template: selectedTemplate === 'blank' ? null : selectedTemplate || null,
            folder_id: selectedFolder === 'no-folder' ? null : selectedFolder || null,
            custom_date: customDate || null,
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating note:', error);
      } else {
        // Add the new note to the list
        setNotes([data, ...notes]);

        // Reset form
        setNewNoteTitle('');
        setNewNoteContent('');
        setSelectedTemplate('');
        setSelectedFolder('no-folder');
        setCustomDate('');
        setIsCreateDialogOpen(false);

        // Refresh to get server-side data
        router.refresh();
      }
    } catch (error) {
      console.error('Error creating note:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setNewNoteTitle('');
    setNewNoteContent('');
    setSelectedTemplate('');
    setSelectedFolder('');
    setCustomDate('');
  };

  const handleOpenNote = (note: Note) => {
    setSelectedNote(note);
    setIsViewDialogOpen(true);
  };

  const handleEditNote = (note: Note) => {
    setSelectedNote(note);
    setEditNoteTitle(note.title);
    setEditNoteContent(note.content);
    setEditNoteFolder(note.folder_id || 'no-folder');
    setEditCustomDate(note.custom_date || '');
    setIsEditDialogOpen(true);
  };

  const handleUpdateNote = async () => {
    if (!user || !selectedNote || !editNoteTitle.trim() || !editNoteContent.trim()) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notes')
        .update({
          title: editNoteTitle.trim(),
          content: editNoteContent.trim(),
          folder_id: editNoteFolder === 'no-folder' ? null : editNoteFolder || null,
          custom_date: editCustomDate || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedNote.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating note:', error);
      } else {
        // Update the note in the list
        setNotes(prevNotes =>
          prevNotes.map(note =>
            note.id === selectedNote.id ? { ...note, ...data } : note
          )
        );

        // Reset form
        setEditNoteTitle('');
        setEditNoteContent('');
        setEditNoteFolder('no-folder');
        setEditCustomDate('');
        setIsEditDialogOpen(false);
        setSelectedNote(null);

        // Refresh to get server-side data
        router.refresh();
      }
    } catch (error) {
      console.error('Error updating note:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNote = async (note: Note) => {
    if (!user) return;

    if (!confirm(`Are you sure you want to delete "${note.title}"? This action cannot be undone.`)) {
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', note.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting note:', error);
      } else {
        // Remove the note from the list
        setNotes(prevNotes => prevNotes.filter(n => n.id !== note.id));

        // Close any open dialogs
        setIsViewDialogOpen(false);
        setIsEditDialogOpen(false);
        setSelectedNote(null);

        // Refresh to get server-side data
        router.refresh();
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch folders on component mount
  useEffect(() => {
    fetchFolders();
  }, [user]);

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Notes</h1>
            <p className="text-[var(--muted-foreground)] mt-1">
              Create and manage your SAFe templates and meeting notes
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>

            <div className="flex space-x-2">
              <Dialog open={isCreateFolderDialogOpen} onOpenChange={setIsCreateFolderDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <FolderPlus className="w-4 h-4 mr-2" />
                    New Folder
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Folder</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Folder Name</label>
                      <Input
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="Enter folder name"
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setNewFolderName('');
                          setIsCreateFolderDialogOpen(false);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleCreateFolder} disabled={!newFolderName.trim() || isLoading}>
                        {isLoading ? 'Creating...' : 'Create Folder'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New Note
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Note</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4">
                    {/* Template Selection */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Use a SAFe Template (optional)
                      </label>
                      <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a template or start blank" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="blank">Blank Note</SelectItem>
                          {SAFE_TEMPLATES.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Folder Selection */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Folder (optional)
                      </label>
                      <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a folder or leave blank" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no-folder">No Folder</SelectItem>
                          {folders.map((folder) => (
                            <SelectItem key={folder.id} value={folder.id}>
                              {folder.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Custom Date */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Date (optional)
                      </label>
                      <Input
                        type="date"
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                        placeholder="Select a date for this note"
                      />
                    </div>

                    {/* Title */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Title</label>
                      <Input
                        value={newNoteTitle}
                        onChange={(e) => setNewNoteTitle(e.target.value)}
                        placeholder="Enter note title..."
                      />
                    </div>

                    {/* Content */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Content</label>
                      <Textarea
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        placeholder="Start writing your note..."
                        rows={15}
                        className="font-mono text-sm"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => {
                          resetForm();
                          setIsCreateDialogOpen(false);
                        }}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateNote}
                        disabled={isLoading || !newNoteTitle.trim() || !newNoteContent.trim()}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {isLoading ? 'Creating...' : 'Create Note'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">
                Total Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notesCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">
                Template Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {notes.filter(n => n.template).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">
                Retrospectives
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {notes.filter(n => n.template === 'retrospective').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">
                User Stories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {notes.filter(n => n.template === 'user-story').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Templates Section */}
        <Card>
          <CardHeader>
            <CardTitle>SAFe Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SAFE_TEMPLATES.map((template) => (
                <Card key={template.id} className="border-2 border-dashed border-[var(--border)] hover:border-[var(--primary-green)] transition-colors">
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-2">{template.name}</h3>
                    <p className="text-sm text-[var(--muted-foreground)] mb-3">
                      {template.id === 'user-story' && 'Standard user story with INVEST criteria'}
                      {template.id === 'epic' && 'Epic planning and breakdown template'}
                      {template.id === 'retrospective' && 'Sprint retrospective meeting notes'}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        handleTemplateSelect(template.id);
                        setIsCreateDialogOpen(true);
                      }}
                    >
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Notes</CardTitle>
          </CardHeader>
          <CardContent>
            {notesCount === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No notes yet</h3>
                <p className="text-[var(--muted-foreground)] mb-4">
                  Create your first note to get started with your SAFe documentation.
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Note
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {notes.map((note) => (
                  <Card key={note.id} className="cursor-pointer hover:bg-[var(--muted)] transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium mb-1">{note.title}</h3>
                          <p className="text-sm text-[var(--muted-foreground)] mb-2 line-clamp-3">
                            {note.content.substring(0, 200)}...
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-[var(--muted-foreground)] flex-wrap">
                            <span>Updated {new Date(note.updated_at).toLocaleDateString()}</span>
                            {note.custom_date && (
                              <span className="flex items-center">
                                📅 {new Date(note.custom_date).toLocaleDateString()}
                              </span>
                            )}
                            {note.folder_id && (
                              <span className="bg-[var(--accent-blue)] text-white px-2 py-1 rounded flex items-center">
                                <Folder className="w-3 h-3 mr-1" />
                                {folders.find(f => f.id === note.folder_id)?.name || 'Unknown Folder'}
                              </span>
                            )}
                            {note.template && (
                              <span className="bg-[var(--primary-green)] text-white px-2 py-1 rounded">
                                {SAFE_TEMPLATES.find(t => t.id === note.template)?.name || note.template}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenNote(note)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditNote(note)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteNote(note)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Note View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Eye className="w-5 h-5" />
                <span>{selectedNote?.title}</span>
              </DialogTitle>
            </DialogHeader>

            {selectedNote && (
              <div className="space-y-4">
                {/* Note Metadata */}
                <div className="flex items-center space-x-4 text-sm text-[var(--muted-foreground)] border-b pb-4">
                  <span>Created: {new Date(selectedNote.created_at).toLocaleDateString()}</span>
                  <span>Updated: {new Date(selectedNote.updated_at).toLocaleDateString()}</span>
                  {selectedNote.custom_date && (
                    <span className="flex items-center">
                      📅 {new Date(selectedNote.custom_date).toLocaleDateString()}
                    </span>
                  )}
                  {selectedNote.folder_id && (
                    <span className="bg-[var(--accent-blue)] text-white px-2 py-1 rounded flex items-center">
                      <Folder className="w-3 h-3 mr-1" />
                      {folders.find(f => f.id === selectedNote.folder_id)?.name || 'Unknown Folder'}
                    </span>
                  )}
                  {selectedNote.template && (
                    <span className="bg-[var(--primary-green)] text-white px-2 py-1 rounded">
                      {SAFE_TEMPLATES.find(t => t.id === selectedNote.template)?.name || selectedNote.template}
                    </span>
                  )}
                </div>

                {/* Note Content */}
                <div className="prose max-w-none">
                  <div className="bg-[var(--muted)] p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap font-mono text-sm text-[var(--foreground)]">
                      {selectedNote.content}
                    </pre>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between space-x-3 pt-4 border-t">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsViewDialogOpen(false);
                        handleEditNote(selectedNote);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Note
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDeleteNote(selectedNote)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Note
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setIsViewDialogOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Note Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Edit className="w-5 h-5" />
                <span>Edit Note</span>
              </DialogTitle>
            </DialogHeader>

            {selectedNote && (
              <div className="space-y-4">
                {/* Folder Selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Folder (optional)
                  </label>
                  <Select value={editNoteFolder} onValueChange={setEditNoteFolder}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a folder or leave blank" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-folder">No Folder</SelectItem>
                      {folders.map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          {folder.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom Date */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Date (optional)
                  </label>
                  <Input
                    type="date"
                    value={editCustomDate}
                    onChange={(e) => setEditCustomDate(e.target.value)}
                    placeholder="Select a date for this note"
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Title</label>
                  <Input
                    value={editNoteTitle}
                    onChange={(e) => setEditNoteTitle(e.target.value)}
                    placeholder="Enter note title..."
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Content</label>
                  <Textarea
                    value={editNoteContent}
                    onChange={(e) => setEditNoteContent(e.target.value)}
                    placeholder="Edit your note content..."
                    rows={15}
                    className="font-mono text-sm"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditDialogOpen(false);
                      setEditNoteTitle('');
                      setEditNoteContent('');
                      setEditNoteFolder('no-folder');
                      setEditCustomDate('');
                      setSelectedNote(null);
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateNote}
                    disabled={isLoading || !editNoteTitle.trim() || !editNoteContent.trim()}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}