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
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Plus, Search, Filter, Calendar, Flag, Clock, Brain, FileText, StickyNote } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';

interface Todo {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'High' | 'Medium' | 'Low';
  due_date?: string;
  source: 'manual' | 'meeting_summary' | 'document' | 'note' | 'auto_detected';
  source_id?: string;
  source_type?: string;
  tags?: string[];
  folder_id?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

interface TodoClientProps {
  initialTodos: Todo[];
}

export function TodoClientPage({ initialTodos }: TodoClientProps) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetectDialogOpen, setIsDetectDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [detectedTodos, setDetectedTodos] = useState<any[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);

  // Form states for creating new todos
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoDescription, setNewTodoDescription] = useState('');
  const [newTodoPriority, setNewTodoPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [newTodoDueDate, setNewTodoDueDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { user } = useAuth();
  const router = useRouter();
  const supabase = createSupabaseClient();

  const todoCount = todos.length;
  const completedCount = todos.filter(todo => todo.status === 'completed').length;
  const pendingCount = todos.filter(todo => todo.status === 'pending').length;
  const inProgressCount = todos.filter(todo => todo.status === 'in_progress').length;

  // Load documents and notes for smart detection
  useEffect(() => {
    if (user && isDetectDialogOpen) {
      loadContentForDetection();
    }
  }, [user, isDetectDialogOpen]);

  const loadContentForDetection = async () => {
    if (!user) return;

    try {
      const [docsResponse, notesResponse] = await Promise.all([
        supabase
          .from('documents')
          .select('id, title, content')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(20),
        supabase
          .from('notes')
          .select('id, title, content')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(20)
      ]);

      if (docsResponse.data) setDocuments(docsResponse.data);
      if (notesResponse.data) setNotes(notesResponse.data);
    } catch (error) {
      console.error('Error loading content:', error);
    }
  };

  const handleSmartDetection = async (contentItems: any[]) => {
    setIsDetecting(true);
    setDetectedTodos([]);

    try {
      const allDetectedTodos = [];

      for (const item of contentItems) {
        const response = await fetch('/api/detect-todos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: `Title: ${item.title}\n\nContent: ${item.content}`,
            sourceId: item.id,
            sourceType: item.content ? 'document' : 'note'
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.todos && data.todos.length > 0) {
            allDetectedTodos.push(...data.todos.map((todo: any) => ({
              ...todo,
              sourceTitle: item.title,
              sourceId: item.id
            })));
          }
        }
      }

      setDetectedTodos(allDetectedTodos);
    } catch (error) {
      console.error('Error detecting todos:', error);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleCreateDetectedTodos = async (todosToCreate: any[]) => {
    try {
      const response = await fetch('/api/create-todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          todos: todosToCreate
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTodos(prev => [...data.todos, ...prev]);
        setDetectedTodos([]);
        setIsDetectDialogOpen(false);
      }
    } catch (error) {
      console.error('Error creating detected todos:', error);
    }
  };

  // Filter todos based on search and filters
  const filteredTodos = todos.filter(todo => {
    const matchesSearch = todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (todo.description && todo.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = filterStatus === 'all' || todo.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || todo.priority === filterPriority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleCreateTodo = async () => {
    if (!user || !newTodoTitle.trim()) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('todos')
        .insert([
          {
            title: newTodoTitle.trim(),
            description: newTodoDescription.trim() || null,
            priority: newTodoPriority,
            due_date: newTodoDueDate || null,
            source: 'manual' as const,
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating todo:', error);
      } else {
        setTodos([data, ...todos]);

        // Reset form
        setNewTodoTitle('');
        setNewTodoDescription('');
        setNewTodoPriority('Medium');
        setNewTodoDueDate('');
        setIsCreateDialogOpen(false);
      }
    } catch (error) {
      console.error('Error creating todo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTodoStatus = async (todoId: string, newStatus: Todo['status']) => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .update({ status: newStatus })
        .eq('id', todoId)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating todo:', error);
      } else {
        setTodos(todos.map(todo =>
          todo.id === todoId ? data : todo
        ));
      }
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'pending':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <MainLayout>
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Todo Management</h1>
              <p className="text-muted-foreground mt-2">
                Manage your tasks and track progress
              </p>
            </div>
            <div className="flex gap-2">
              <Dialog open={isDetectDialogOpen} onOpenChange={setIsDetectDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Brain className="w-4 h-4 mr-2" />
                    Smart Detection
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Smart Todo Detection</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    <p className="text-muted-foreground">
                      AI will analyze your recent documents and notes to detect actionable todo items.
                    </p>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center">
                          <FileText className="w-4 h-4 mr-2" />
                          Recent Documents ({documents.length})
                        </h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {documents.map((doc) => (
                            <div key={doc.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`doc-${doc.id}`}
                                defaultChecked
                                className="rounded"
                              />
                              <label
                                htmlFor={`doc-${doc.id}`}
                                className="text-sm truncate flex-1"
                                title={doc.title}
                              >
                                {doc.title}
                              </label>
                            </div>
                          ))}
                          {documents.length === 0 && (
                            <p className="text-sm text-muted-foreground">No documents found</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-3 flex items-center">
                          <StickyNote className="w-4 h-4 mr-2" />
                          Recent Notes ({notes.length})
                        </h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {notes.map((note) => (
                            <div key={note.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`note-${note.id}`}
                                defaultChecked
                                className="rounded"
                              />
                              <label
                                htmlFor={`note-${note.id}`}
                                className="text-sm truncate flex-1"
                                title={note.title}
                              >
                                {note.title}
                              </label>
                            </div>
                          ))}
                          {notes.length === 0 && (
                            <p className="text-sm text-muted-foreground">No notes found</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {detectedTodos.length > 0 && (
                      <div className="border-t pt-6">
                        <h3 className="font-semibold mb-3">
                          Detected Todos ({detectedTodos.length})
                        </h3>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {detectedTodos.map((todo, index) => (
                            <div key={index} className="flex items-start space-x-2">
                              <input
                                type="checkbox"
                                id={`detected-${index}`}
                                defaultChecked
                                className="mt-1 rounded"
                              />
                              <div className="flex-1">
                                <label
                                  htmlFor={`detected-${index}`}
                                  className="font-medium text-sm block"
                                >
                                  {todo.title}
                                </label>
                                {todo.description && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {todo.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge className={getPriorityColor(todo.priority)} variant="outline">
                                    {todo.priority}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    from "{todo.sourceTitle}"
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        onClick={() => setIsDetectDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <div className="flex gap-2">
                        {detectedTodos.length === 0 && (
                          <Button
                            onClick={() => {
                              const selectedDocs = documents.filter((_, index) =>
                                (document.getElementById(`doc-${documents[index].id}`) as HTMLInputElement)?.checked
                              );
                              const selectedNotes = notes.filter((_, index) =>
                                (document.getElementById(`note-${notes[index].id}`) as HTMLInputElement)?.checked
                              );
                              handleSmartDetection([...selectedDocs, ...selectedNotes]);
                            }}
                            disabled={isDetecting || (documents.length === 0 && notes.length === 0)}
                          >
                            {isDetecting ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                Analyzing...
                              </>
                            ) : (
                              <>
                                <Brain className="w-4 h-4 mr-2" />
                                Detect Todos
                              </>
                            )}
                          </Button>
                        )}
                        {detectedTodos.length > 0 && (
                          <Button
                            onClick={() => {
                              const selectedTodos = detectedTodos.filter((_, index) =>
                                (document.getElementById(`detected-${index}`) as HTMLInputElement)?.checked
                              );
                              handleCreateDetectedTodos(selectedTodos);
                            }}
                          >
                            Create Selected Todos
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New Todo
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Todo</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium">Title *</label>
                    <Input
                      placeholder="Enter todo title..."
                      value={newTodoTitle}
                      onChange={(e) => setNewTodoTitle(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      placeholder="Enter todo description..."
                      value={newTodoDescription}
                      onChange={(e) => setNewTodoDescription(e.target.value)}
                      rows={4}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Priority</label>
                      <Select value={newTodoPriority} onValueChange={(value) => setNewTodoPriority(value as Todo['priority'])}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Due Date</label>
                      <Input
                        type="date"
                        value={newTodoDueDate}
                        onChange={(e) => setNewTodoDueDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateTodo}
                      disabled={isLoading || !newTodoTitle.trim()}
                    >
                      {isLoading ? 'Creating...' : 'Create Todo'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Total Todos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{todoCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-600">{pendingCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">In Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{completedCount}</p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search todos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Todos List */}
          <div className="space-y-4">
            {filteredTodos.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <CheckSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">
                    {todos.length === 0 ? 'No todos yet' : 'No todos match your filters'}
                  </h3>
                  <p className="text-muted-foreground">
                    {todos.length === 0
                      ? 'Create your first todo to get started'
                      : 'Try adjusting your search or filters'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredTodos.map((todo) => (
                <Card key={todo.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{todo.title}</h3>
                          <Badge className={getPriorityColor(todo.priority)}>
                            <Flag className="w-3 h-3 mr-1" />
                            {todo.priority}
                          </Badge>
                          <Badge className={getStatusColor(todo.status)}>
                            {todo.status.replace('_', ' ')}
                          </Badge>
                        </div>

                        {todo.description && (
                          <p className="text-muted-foreground mb-3">{todo.description}</p>
                        )}

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Created {formatDate(todo.created_at)}
                          </div>
                          {todo.due_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Due {formatDate(todo.due_date)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {todo.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateTodoStatus(todo.id, 'in_progress')}
                          >
                            Start
                          </Button>
                        )}
                        {todo.status === 'in_progress' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateTodoStatus(todo.id, 'completed')}
                          >
                            Complete
                          </Button>
                        )}
                        {(todo.status === 'pending' || todo.status === 'in_progress') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateTodoStatus(todo.id, 'cancelled')}
                          >
                            Cancel
                          </Button>
                        )}
                        {todo.status === 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateTodoStatus(todo.id, 'pending')}
                          >
                            Reopen
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}