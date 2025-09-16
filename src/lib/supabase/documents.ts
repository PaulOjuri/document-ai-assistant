import { createSupabaseClient } from './client';
import type { Database } from './database.types';

type Document = Database['public']['Tables']['documents']['Row'];
type DocumentInsert = Database['public']['Tables']['documents']['Insert'];
type DocumentUpdate = Database['public']['Tables']['documents']['Update'];

export class DocumentService {
  private supabase = createSupabaseClient();

  async getDocuments(userId: string, folderId?: string) {
    let query = this.supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (folderId) {
      query = query.eq('folder_id', folderId);
    } else {
      query = query.is('folder_id', null);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch documents: ${error.message}`);
    }

    return data;
  }

  async getDocument(id: string, userId: string) {
    const { data, error } = await this.supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch document: ${error.message}`);
    }

    return data;
  }

  async createDocument(document: DocumentInsert) {
    const { data, error } = await this.supabase
      .from('documents')
      .insert(document)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create document: ${error.message}`);
    }

    return data;
  }

  async updateDocument(id: string, updates: DocumentUpdate, userId: string) {
    const { data, error } = await this.supabase
      .from('documents')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update document: ${error.message}`);
    }

    return data;
  }

  async deleteDocument(id: string, userId: string) {
    // First get the document to get the file URL
    const { data: document, error: fetchError } = await this.supabase
      .from('documents')
      .select('file_url')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch document for deletion: ${fetchError.message}`);
    }

    // Extract file path from URL for storage deletion
    const urlParts = document.file_url.split('/');
    const filePath = urlParts.slice(-2).join('/'); // userId/filename

    // Delete from storage
    const { error: storageError } = await this.supabase.storage
      .from('documents')
      .remove([filePath]);

    if (storageError) {
      console.warn('Failed to delete file from storage:', storageError.message);
    }

    // Delete from database
    const { error: dbError } = await this.supabase
      .from('documents')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (dbError) {
      throw new Error(`Failed to delete document: ${dbError.message}`);
    }

    return { success: true };
  }

  async searchDocuments(userId: string, query: string, filters?: {
    artifactType?: string;
    priority?: string;
    tags?: string[];
    folderId?: string;
  }) {
    let dbQuery = this.supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId);

    // Full-text search
    if (query) {
      dbQuery = dbQuery.or(`title.ilike.%${query}%,content.ilike.%${query}%`);
    }

    // Apply filters
    if (filters) {
      if (filters.artifactType) {
        dbQuery = dbQuery.eq('artifact_type', filters.artifactType);
      }
      if (filters.priority) {
        dbQuery = dbQuery.eq('priority', filters.priority);
      }
      if (filters.folderId) {
        dbQuery = dbQuery.eq('folder_id', filters.folderId);
      }
      if (filters.tags && filters.tags.length > 0) {
        dbQuery = dbQuery.overlaps('tags', filters.tags);
      }
    }

    dbQuery = dbQuery.order('updated_at', { ascending: false });

    const { data, error } = await dbQuery;

    if (error) {
      throw new Error(`Failed to search documents: ${error.message}`);
    }

    return data;
  }

  async getDocumentsByTag(userId: string, tag: string) {
    const { data, error } = await this.supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .contains('tags', [tag])
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch documents by tag: ${error.message}`);
    }

    return data;
  }

  async getDocumentsByArtifactType(userId: string, artifactType: string) {
    const { data, error } = await this.supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .eq('artifact_type', artifactType)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch documents by artifact type: ${error.message}`);
    }

    return data;
  }

  async updateDocumentTags(id: string, tags: string[], userId: string) {
    return this.updateDocument(id, { tags }, userId);
  }

  async updateDocumentArtifactType(id: string, artifactType: string, userId: string) {
    return this.updateDocument(id, { artifact_type: artifactType }, userId);
  }

  async updateDocumentPriority(id: string, priority: string, userId: string) {
    return this.updateDocument(id, { priority }, userId);
  }

  async moveDocumentToFolder(id: string, folderId: string | null, userId: string) {
    return this.updateDocument(id, { folder_id: folderId }, userId);
  }

  async getDocumentStats(userId: string) {
    const { data, error } = await this.supabase
      .from('documents')
      .select('artifact_type, priority, file_type')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to fetch document stats: ${error.message}`);
    }

    const stats = {
      total: data.length,
      byArtifactType: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
      byFileType: {} as Record<string, number>,
    };

    data.forEach(doc => {
      if (doc.artifact_type) {
        stats.byArtifactType[doc.artifact_type] = (stats.byArtifactType[doc.artifact_type] || 0) + 1;
      }
      if (doc.priority) {
        stats.byPriority[doc.priority] = (stats.byPriority[doc.priority] || 0) + 1;
      }
      stats.byFileType[doc.file_type] = (stats.byFileType[doc.file_type] || 0) + 1;
    });

    return stats;
  }
}

export const documentService = new DocumentService();