'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { createSupabaseClient } from '@/lib/supabase/client';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Mic,
  Play,
  Pause,
  Download,
  Search,
  Filter,
  Plus,
  Upload,
  FileAudio,
  X,
  Save,
  Folder,
  Calendar,
  Users,
  FolderPlus
} from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';

interface Audio {
  id: string;
  title: string;
  file_url: string;
  duration: number;
  transcription?: string;
  meeting_type?: string;
  participants?: string[];
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

interface AudioClientProps {
  initialAudios: Audio[];
}

const MEETING_TYPES = [
  { value: 'sprint-planning', label: 'Sprint Planning', color: 'bg-blue-100 text-blue-700' },
  { value: 'retrospective', label: 'Retrospective', color: 'bg-green-100 text-green-700' },
  { value: 'pi-planning', label: 'PI Planning', color: 'bg-purple-100 text-purple-700' },
  { value: 'daily-standup', label: 'Daily Standup', color: 'bg-orange-100 text-orange-700' },
  { value: 'system-demo', label: 'System Demo', color: 'bg-red-100 text-red-700' },
  { value: 'po-sync', label: 'PO Sync', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'inspect-adapt', label: 'Inspect & Adapt', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'other', label: 'Other Meeting', color: 'bg-gray-100 text-gray-700' }
];

export function AudioClientPage({ initialAudios }: AudioClientProps) {
  const [audios, setAudios] = useState<Audio[]>(initialAudios);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isCreateFolderDialogOpen, setIsCreateFolderDialogOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [audioTitle, setAudioTitle] = useState('');
  const [audioTranscript, setAudioTranscript] = useState('');
  const [selectedMeetingType, setSelectedMeetingType] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('no-folder');
  const [customDate, setCustomDate] = useState('');
  const [participants, setParticipants] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);

  const { user } = useAuth();
  const router = useRouter();
  const supabase = createSupabaseClient();

  const audiosCount = audios.length;

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

  // Handle folder creation
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
        // Add the new folder to the list
        setFolders([...folders, data]);
        setNewFolderName('');
        setIsCreateFolderDialogOpen(false);
      }
    } catch (error) {
      console.error('Error creating folder:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Audio file dropzone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const audioFiles = acceptedFiles.filter(file =>
      file.type.startsWith('audio/') ||
      file.name.toLowerCase().endsWith('.mp3') ||
      file.name.toLowerCase().endsWith('.wav') ||
      file.name.toLowerCase().endsWith('.m4a') ||
      file.name.toLowerCase().endsWith('.ogg')
    );
    setUploadFiles(audioFiles);
    if (audioFiles.length > 0 && !audioTitle) {
      setAudioTitle(audioFiles[0].name.replace(/\.[^/.]+$/, ""));
    }
  }, [audioTitle]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.ogg', '.aac']
    },
    multiple: false
  });

  // Upload audio file to Supabase Storage
  const uploadAudioFile = async (file: File): Promise<string | null> => {
    if (!user) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('audios')
      .upload(fileName, file);

    if (error) {
      console.error('Error uploading file:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('audios')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  // Get audio duration from file
  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      audio.addEventListener('loadedmetadata', () => {
        resolve(Math.round(audio.duration));
        URL.revokeObjectURL(audio.src);
      });
      audio.addEventListener('error', () => {
        resolve(0);
        URL.revokeObjectURL(audio.src);
      });
    });
  };

  // Handle audio upload
  const handleUploadAudio = async () => {
    if (!user || !uploadFiles.length || !audioTitle.trim()) return;

    setIsLoading(true);
    try {
      const file = uploadFiles[0];
      const fileUrl = await uploadAudioFile(file);

      if (!fileUrl) {
        throw new Error('Failed to upload file');
      }

      const duration = await getAudioDuration(file);
      const participantsArray = participants.trim()
        ? participants.split(',').map(p => p.trim()).filter(p => p)
        : [];

      const { data, error } = await supabase
        .from('audios')
        .insert([
          {
            title: audioTitle.trim(),
            file_url: fileUrl,
            duration: duration,
            transcription: audioTranscript.trim() || null,
            meeting_type: selectedMeetingType || null,
            participants: participantsArray,
            folder_id: selectedFolder === 'no-folder' ? null : selectedFolder || null,
            custom_date: customDate || null,
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating audio record:', error);
      } else {
        // Add the new audio to the list
        setAudios([data, ...audios]);

        // Reset form
        resetForm();
        setIsUploadDialogOpen(false);

        // Refresh to get server-side data
        router.refresh();
      }
    } catch (error) {
      console.error('Error uploading audio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setUploadFiles([]);
    setAudioTitle('');
    setAudioTranscript('');
    setSelectedMeetingType('');
    setSelectedFolder('no-folder');
    setCustomDate('');
    setParticipants('');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleQuickRecord = (meetingType: string) => {
    setSelectedMeetingType(meetingType);
    setIsUploadDialogOpen(true);
  };

  const togglePlayback = (audioId: string) => {
    if (currentlyPlaying === audioId) {
      setCurrentlyPlaying(null);
    } else {
      setCurrentlyPlaying(audioId);
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
            <h1 className="text-3xl font-bold text-[var(--foreground)]">Audio Recordings</h1>
            <p className="text-[var(--muted-foreground)] mt-1">
              Upload, record and transcribe meetings, planning sessions, and retrospectives
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <Search className="w-4 h-4 mr-2" />
              Search Audio
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Dialog open={isCreateFolderDialogOpen} onOpenChange={setIsCreateFolderDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <FolderPlus className="w-4 h-4 mr-2" />
                  New Folder
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Folder</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Folder Name</label>
                    <Input
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Enter folder name..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCreateFolder();
                        }
                      }}
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setNewFolderName('');
                        setIsCreateFolderDialogOpen(false);
                      }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateFolder}
                      disabled={isLoading || !newFolderName.trim()}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isLoading ? 'Creating...' : 'Create Folder'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => fetchFolders()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Audio
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Upload Audio Recording</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  {/* File Upload */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Audio File</label>
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                        isDragActive
                          ? 'border-[var(--primary-green)] bg-green-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input {...getInputProps()} />
                      {uploadFiles.length > 0 ? (
                        <div className="space-y-2">
                          <FileAudio className="w-8 h-8 text-[var(--primary-green)] mx-auto" />
                          <p className="text-sm font-medium">{uploadFiles[0].name}</p>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            {(uploadFiles[0].size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                          <p className="text-sm">
                            {isDragActive
                              ? 'Drop the audio file here...'
                              : 'Drag & drop an audio file here, or click to select'}
                          </p>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            Supports MP3, WAV, M4A, OGG files
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Meeting Type */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Meeting Type (optional)
                    </label>
                    <Select value={selectedMeetingType} onValueChange={setSelectedMeetingType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select meeting type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-type">No specific type</SelectItem>
                        {MEETING_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
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
                      Recording Date (optional)
                    </label>
                    <Input
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      placeholder="Select the date this was recorded"
                    />
                  </div>

                  {/* Title */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Title</label>
                    <Input
                      value={audioTitle}
                      onChange={(e) => setAudioTitle(e.target.value)}
                      placeholder="Enter audio title..."
                    />
                  </div>

                  {/* Participants */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Participants (optional)
                    </label>
                    <Input
                      value={participants}
                      onChange={(e) => setParticipants(e.target.value)}
                      placeholder="Enter participant names, separated by commas"
                    />
                  </div>

                  {/* Transcript */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Transcript (optional)
                    </label>
                    <Textarea
                      value={audioTranscript}
                      onChange={(e) => setAudioTranscript(e.target.value)}
                      placeholder="Paste or type the transcript here..."
                      rows={8}
                      className="font-mono text-sm"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        resetForm();
                        setIsUploadDialogOpen(false);
                      }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUploadAudio}
                      disabled={isLoading || !uploadFiles.length || !audioTitle.trim()}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isLoading ? 'Uploading...' : 'Upload Audio'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">
                Total Recordings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{audiosCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">
                Total Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {audios.length ? formatDuration(audios.reduce((acc, audio) => acc + audio.duration, 0)) : '0:00'}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">
                Transcribed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {audios.filter(a => a.transcription).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {audios.filter(a =>
                  new Date(a.created_at).getMonth() === new Date().getMonth()
                ).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Meeting Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mic className="w-5 h-5 text-[var(--primary-green)]" />
              <span>Quick Upload by Type</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {MEETING_TYPES.map((meetingType, index) => (
                <Card key={index} className="cursor-pointer hover:bg-[var(--muted)] transition-colors">
                  <CardContent className="p-4 text-center">
                    <div className={`w-12 h-12 ${meetingType.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                      <Upload className="w-6 h-6" />
                    </div>
                    <h3 className="font-medium mb-2">{meetingType.label}</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickRecord(meetingType.value)}
                    >
                      Upload Audio
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Recordings */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Recordings</CardTitle>
          </CardHeader>
          <CardContent>
            {audiosCount === 0 ? (
              <div className="text-center py-12">
                <FileAudio className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-4" />
                <h3 className="font-medium text-lg mb-2">No recordings yet</h3>
                <p className="text-[var(--muted-foreground)] mb-4">
                  Start by uploading your first audio recording or transcript
                </p>
                <Button onClick={() => setIsUploadDialogOpen(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Audio
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {audios.map((audio) => (
                  <Card key={audio.id} className="cursor-pointer hover:bg-[var(--muted)] transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-[var(--primary-green)] rounded-full flex items-center justify-center">
                            <FileAudio className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-medium mb-1">{audio.title}</h3>
                            <div className="flex items-center space-x-4 text-sm text-[var(--muted-foreground)] flex-wrap">
                              <span>Duration: {formatDuration(audio.duration)}</span>
                              <span>•</span>
                              <span>{new Date(audio.created_at).toLocaleDateString()}</span>
                              {audio.custom_date && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {new Date(audio.custom_date).toLocaleDateString()}
                                  </span>
                                </>
                              )}
                              {audio.folder_id && (
                                <>
                                  <span>•</span>
                                  <span className="bg-[var(--accent-blue)] text-white px-2 py-1 rounded flex items-center">
                                    <Folder className="w-3 h-3 mr-1" />
                                    {folders.find(f => f.id === audio.folder_id)?.name || 'Unknown Folder'}
                                  </span>
                                </>
                              )}
                              {audio.meeting_type && (
                                <>
                                  <span>•</span>
                                  <span className="bg-[var(--primary-green)] text-white px-2 py-1 rounded text-xs">
                                    {MEETING_TYPES.find(t => t.value === audio.meeting_type)?.label || audio.meeting_type}
                                  </span>
                                </>
                              )}
                              {audio.transcription && (
                                <>
                                  <span>•</span>
                                  <span className="text-green-600">Transcribed</span>
                                </>
                              )}
                            </div>
                            {audio.participants && audio.participants.length > 0 && (
                              <div className="text-sm text-[var(--muted-foreground)] mt-1 flex items-center">
                                <Users className="w-3 h-3 mr-1" />
                                Participants: {audio.participants.join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => togglePlayback(audio.id)}
                          >
                            {currentlyPlaying === audio.id ? (
                              <Pause className="w-4 h-4 mr-2" />
                            ) : (
                              <Play className="w-4 h-4 mr-2" />
                            )}
                            {currentlyPlaying === audio.id ? 'Pause' : 'Play'}
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      {audio.transcription && (
                        <div className="mt-4 p-3 bg-[var(--muted)] rounded-md">
                          <h4 className="text-sm font-medium mb-2">Transcript:</h4>
                          <p className="text-sm text-[var(--muted-foreground)] line-clamp-3">
                            {audio.transcription}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}