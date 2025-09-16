'use client';

import { useState, useEffect } from 'react';
import { Plus, Upload } from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { DocumentGrid } from '@/components/documents/document-grid';
import { DocumentViewer } from '@/components/documents/document-viewer';
import { DocumentUploader } from '@/components/documents/document-uploader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { documentService } from '@/lib/supabase/documents';
import { useAuth } from '@/components/auth/auth-provider';
import type { Database } from '@/lib/supabase/database.types';

type Document = Database['public']['Tables']['documents']['Row'];

interface DocumentsPageClientProps {
  initialDocuments: Document[];
}

export function DocumentsPageClient({ initialDocuments }: DocumentsPageClientProps) {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

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

  const handleUploadComplete = (uploadedDocuments: Document[]) => {
    setDocuments(prev => [...uploadedDocuments, ...prev]);
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

            {/* Document Grid */}
            {documents.length > 0 ? (
              <DocumentGrid
                documents={documents}
                onDocumentView={handleDocumentView}
                onDocumentDownload={handleDocumentDownload}
                onDocumentDelete={handleDocumentDelete}
              />
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