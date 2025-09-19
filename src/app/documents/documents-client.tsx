'use client';

import { useState, useEffect } from 'react';
import { Plus, Upload, Folder, Filter } from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { DocumentGrid } from '@/components/documents/document-grid';
import { DocumentViewer } from '@/components/documents/document-viewer';
import { DocumentUploader } from '@/components/documents/document-uploader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createSupabaseClient } from '@/lib/supabase/client';
import { documentService } from '@/lib/supabase/documents';
import { useAuth } from '@/components/auth/auth-provider';
import type { Database } from '@/lib/supabase/database.types';

type Document = Database['public']['Tables']['documents']['Row'];
type Folder = Database['public']['Tables']['folders']['Row'];

interface DocumentsPageClientProps {
  initialDocuments: Document[];
}

export function DocumentsPageClient({ initialDocuments }: DocumentsPageClientProps) {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [loading, setLoading] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>(initialDocuments);
  const { user } = useAuth();
  const supabase = createSupabaseClient();

  // Load folders on mount
  useEffect(() => {
    if (user) {
      loadFolders();
    }
  }, [user]);

  // Filter documents when folder or documents change
  useEffect(() => {
    filterDocuments();
  }, [documents, selectedFolderId]);

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

  const filterDocuments = () => {
    if (selectedFolderId === 'all') {
      setFilteredDocuments(documents);
    } else if (selectedFolderId === 'none') {
      setFilteredDocuments(documents.filter(doc => !doc.folder_id));
    } else {
      setFilteredDocuments(documents.filter(doc => doc.folder_id === selectedFolderId));
    }
  };

  const refreshDocuments = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const freshDocuments = await documentService.getDocuments(user.id);
      setDocuments(freshDocuments);
    } catch (error) {
      console.error('Failed to refresh documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentView = (document: Document) => {
    setSelectedDocument(document);
  };

  const handleDocumentDownload = (document: Document) => {
    window.open(document.file_url, '_blank');
  };

  const handleDocumentDelete = async (document: Document) => {
    if (!user || !window.confirm('Are you sure you want to delete this document?')) return;

    try {
      await documentService.deleteDocument(document.id, user.id);
      setDocuments(prev => prev.filter(d => d.id !== document.id));
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  const handleDocumentUpdate = (updatedDocument: Document) => {
    setDocuments(prev => prev.map(d =>
      d.id === updatedDocument.id ? updatedDocument : d
    ));
  };

  const handleDocumentMoveToFolder = async (document: Document, folderId: string | null) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('documents')
        .update({ folder_id: folderId })
        .eq('id', document.id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update the local state
      setDocuments(prev => prev.map(d =>
        d.id === document.id ? { ...d, folder_id: folderId } : d
      ));
    } catch (error) {
      console.error('Failed to move document to folder:', error);
    }
  };

  const handleUploadComplete = (uploadedDocuments: Document[]) => {
    setDocuments(prev => [...uploadedDocuments, ...prev]);
    loadFolders(); // Refresh folders in case new ones were created
    setShowUploader(false);
  };

  return (
    <MainLayout>
      <div className="p-8">
        {!showUploader ? (
          <>
            {/* Header with Upload Button */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold">Documents</h1>
                <p className="text-[var(--muted-foreground)] mt-1">
                  Manage your SAFe artifacts and documentation
                </p>
              </div>
              <Button onClick={() => setShowUploader(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Documents
              </Button>
            </div>

            {/* Folder Filter */}
            {folders.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-[var(--muted-foreground)]" />
                    <span className="text-sm font-medium">Filter by folder:</span>
                  </div>
                  <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                    <SelectTrigger className="w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Documents ({documents.length})</SelectItem>
                      <SelectItem value="none">
                        <div className="flex items-center space-x-2">
                          <span>No Folder</span>
                          <span className="text-[var(--muted-foreground)]">
                            ({documents.filter(doc => !doc.folder_id).length})
                          </span>
                        </div>
                      </SelectItem>
                      {folders.map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          <div className="flex items-center space-x-2">
                            <Folder className="w-4 h-4" />
                            <span>{folder.name}</span>
                            <span className="text-[var(--muted-foreground)]">
                              ({documents.filter(doc => doc.folder_id === folder.id).length})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Document Grid */}
            {filteredDocuments.length > 0 ? (
              <DocumentGrid
                documents={filteredDocuments}
                folders={folders}
                onDocumentView={handleDocumentView}
                onDocumentDownload={handleDocumentDownload}
                onDocumentDelete={handleDocumentDelete}
                onDocumentMoveToFolder={handleDocumentMoveToFolder}
              />
            ) : documents.length > 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="text-6xl mb-4">📁</div>
                  <h3 className="text-lg font-medium mb-2">No documents in this folder</h3>
                  <p className="text-[var(--muted-foreground)] mb-6">
                    Try selecting a different folder or upload new documents.
                  </p>
                  <Button onClick={() => setSelectedFolderId('all')}>
                    Show All Documents
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="text-6xl mb-4">📄</div>
                  <h3 className="text-lg font-medium mb-2">No documents yet</h3>
                  <p className="text-[var(--muted-foreground)] mb-6">
                    Start by uploading your first document to get organized with SAFe artifacts.
                  </p>
                  <Button onClick={() => setShowUploader(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Your First Document
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <>
            {/* Upload Interface */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">Upload Documents</h1>
              <p className="text-[var(--muted-foreground)]">
                Add your SAFe artifacts, requirements, and documentation
              </p>
            </div>

            <DocumentUploader
              onUploadComplete={handleUploadComplete}
              onClose={() => setShowUploader(false)}
            />
          </>
        )}

        {/* Document Viewer Modal */}
        {selectedDocument && (
          <DocumentViewer
            document={selectedDocument}
            onClose={() => setSelectedDocument(null)}
            onUpdate={handleDocumentUpdate}
            onDelete={(documentId) => {
              setDocuments(prev => prev.filter(d => d.id !== documentId));
              setSelectedDocument(null);
            }}
          />
        )}
      </div>
    </MainLayout>
  );
}