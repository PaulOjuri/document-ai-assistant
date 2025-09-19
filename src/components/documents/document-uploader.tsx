'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, AlertCircle, CheckCircle, Folder, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import { getFileTypeIcon, formatBytes } from '@/lib/utils';

interface UploadFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  url?: string;
}

interface Folder {
  id: string;
  name: string;
  user_id: string;
}

interface DocumentUploaderProps {
  folderId?: string;
  onUploadComplete?: (documents: Array<{ id: string; title: string; content: string }>) => void;
  onClose?: () => void;
}

export function DocumentUploader({ folderId, onUploadComplete, onClose }: DocumentUploaderProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string>(folderId || 'no-folder');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const { user } = useAuth();
  const supabase = createSupabaseClient();

  // Load folders on component mount
  useEffect(() => {
    if (user) {
      loadFolders();
    }
  }, [user]);

  const loadFolders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (!error && data) {
        setFolders(data);
      }
    } catch (error) {
      console.error('Error loading folders:', error);
    }
  };

  const createFolder = async () => {
    if (!user || !newFolderName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('folders')
        .insert([{
          name: newFolderName.trim(),
          user_id: user.id,
        }])
        .select()
        .single();

      if (!error && data) {
        setFolders(prev => [...prev, data]);
        setSelectedFolderId(data.id);
        setNewFolderName('');
        setShowCreateFolder(false);
      }
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending' as const,
      progress: 0,
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const extractTextContent = async (file: File): Promise<string> => {
    if (file.type === 'text/plain' || file.type === 'text/markdown') {
      return await file.text();
    }

    // For PDF and DOCX, we'll need to implement text extraction
    // For now, return a placeholder
    return `Content extracted from ${file.name}. Full text extraction will be implemented with PDF.js and other libraries.`;
  };

  const uploadFiles = async () => {
    if (!user) return;

    setUploading(true);
    const uploadedDocuments = [];

    for (const uploadFile of files) {
      if (uploadFile.status === 'success') continue;

      try {
        // Update status to uploading
        setFiles(prev => prev.map(f =>
          f.id === uploadFile.id
            ? { ...f, status: 'uploading', progress: 0 }
            : f
        ));

        // Generate unique file path
        const fileExt = uploadFile.file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, uploadFile.file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Update progress
        setFiles(prev => prev.map(f =>
          f.id === uploadFile.id
            ? { ...f, progress: 50 }
            : f
        ));

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);

        // Extract text content
        const content = await extractTextContent(uploadFile.file);

        // Update progress
        setFiles(prev => prev.map(f =>
          f.id === uploadFile.id
            ? { ...f, progress: 75 }
            : f
        ));

        // Save document metadata to database
        const { data: documentData, error: dbError } = await supabase
          .from('documents')
          .insert({
            title: uploadFile.file.name.replace(/\.[^/.]+$/, ''), // Remove extension
            content,
            file_url: urlData.publicUrl,
            file_type: fileExt || 'unknown',
            file_size: uploadFile.file.size,
            tags: [],
            folder_id: selectedFolderId && selectedFolderId !== 'no-folder' ? selectedFolderId : null,
            user_id: user.id,
          })
          .select()
          .single();

        if (dbError) throw dbError;

        // Update status to success
        setFiles(prev => prev.map(f =>
          f.id === uploadFile.id
            ? { ...f, status: 'success', progress: 100, url: urlData.publicUrl }
            : f
        ));

        uploadedDocuments.push(documentData);

      } catch (error: unknown) {
        console.error('Upload error:', error);
        setFiles(prev => prev.map(f =>
          f.id === uploadFile.id
            ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' }
            : f
        ));
      }
    }

    setUploading(false);

    if (uploadedDocuments.length > 0) {
      onUploadComplete?.(uploadedDocuments);
    }
  };

  const allSuccessful = files.every(f => f.status === 'success');
  const hasFiles = files.length > 0;

  return (
    <div className="space-y-6">
      {/* Folder Selection */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-[var(--foreground)]">Select Folder</h3>
            <div className="flex items-center space-x-2">
              <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Choose a folder (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-folder">No folder</SelectItem>
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateFolder(true)}
                className="px-3"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Create Folder Input */}
            {showCreateFolder && (
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Enter folder name..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createFolder()}
                  className="flex-1"
                />
                <Button size="sm" onClick={createFolder} disabled={!newFolderName.trim()}>
                  Create
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowCreateFolder(false);
                    setNewFolderName('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Drag & Drop Area */}
      <Card className={`border-2 border-dashed transition-colors ${
        isDragActive
          ? 'border-[var(--primary-green)] bg-[var(--light-green)]'
          : 'border-[var(--border)]'
      }`}>
        <CardContent className="p-8">
          <div {...getRootProps()} className="cursor-pointer text-center">
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-[var(--muted-foreground)] mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {isDragActive ? 'Drop files here' : 'Upload Documents'}
            </h3>
            <p className="text-[var(--muted-foreground)] mb-4">
              Drag & drop files here, or click to select files
            </p>
            <div className="text-sm text-[var(--muted-foreground)]">
              Supported formats: PDF, DOCX, TXT, MD (Max 50MB per file)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {hasFiles && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Files to Upload</h3>
          <div className="space-y-2">
            {files.map((uploadFile) => (
              <Card key={uploadFile.id} className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">
                    {getFileTypeIcon(uploadFile.file.name.split('.').pop() || '')}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">
                        {uploadFile.file.name}
                      </p>
                      <div className="flex items-center space-x-2">
                        {uploadFile.status === 'pending' && (
                          <button
                            onClick={() => removeFile(uploadFile.id)}
                            className="text-[var(--muted-foreground)] hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        {uploadFile.status === 'success' && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                        {uploadFile.status === 'error' && (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-[var(--muted-foreground)]">
                      {formatBytes(uploadFile.file.size)}
                    </p>

                    {uploadFile.status === 'uploading' && (
                      <div className="mt-2">
                        <div className="bg-[var(--muted)] rounded-full h-2">
                          <div
                            className="bg-[var(--primary-green)] h-2 rounded-full transition-all"
                            style={{ width: `${uploadFile.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-[var(--muted-foreground)] mt-1">
                          Uploading... {uploadFile.progress}%
                        </p>
                      </div>
                    )}

                    {uploadFile.status === 'error' && (
                      <p className="text-xs text-red-600 mt-1">
                        {uploadFile.error}
                      </p>
                    )}

                    {uploadFile.status === 'success' && (
                      <p className="text-xs text-green-600 mt-1">
                        Upload completed successfully
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {hasFiles && (
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={uploading}
          >
            Cancel
          </Button>
          <div className="space-x-2">
            <Button
              variant="outline"
              onClick={() => setFiles([])}
              disabled={uploading}
            >
              Clear All
            </Button>
            <Button
              onClick={uploadFiles}
              disabled={uploading || files.length === 0}
            >
              {uploading ? 'Uploading...' : allSuccessful ? 'Upload Complete' : 'Upload Files'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}