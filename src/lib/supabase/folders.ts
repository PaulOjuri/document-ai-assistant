import { createSupabaseClient } from './client';
import type { Database } from './database.types';

type Folder = Database['public']['Tables']['folders']['Row'];
type FolderInsert = Database['public']['Tables']['folders']['Insert'];
type FolderUpdate = Database['public']['Tables']['folders']['Update'];

export interface FolderWithChildren extends Folder {
  children?: FolderWithChildren[];
  document_count?: number;
}

export class FolderService {
  private supabase = createSupabaseClient();

  async getFolders(userId: string): Promise<FolderWithChildren[]> {
    const { data, error } = await this.supabase
      .from('folders')
      .select(`
        *,
        documents(count)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch folders: ${error.message}`);
    }

    // Build folder hierarchy
    const folderMap = new Map<string, FolderWithChildren>();
    const rootFolders: FolderWithChildren[] = [];

    // First pass: create all folders
    data.forEach(folder => {
      const folderWithChildren: FolderWithChildren = {
        ...folder,
        children: [],
        document_count: folder.documents?.[0]?.count || 0,
      };
      folderMap.set(folder.id, folderWithChildren);
    });

    // Second pass: build hierarchy
    data.forEach(folder => {
      const folderWithChildren = folderMap.get(folder.id)!;
      if (folder.parent_id) {
        const parent = folderMap.get(folder.parent_id);
        if (parent) {
          parent.children!.push(folderWithChildren);
        }
      } else {
        rootFolders.push(folderWithChildren);
      }
    });

    return rootFolders;
  }

  async getFolder(id: string, userId: string): Promise<Folder> {
    const { data, error } = await this.supabase
      .from('folders')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch folder: ${error.message}`);
    }

    return data;
  }

  async createFolder(folder: FolderInsert): Promise<Folder> {
    const { data, error } = await this.supabase
      .from('folders')
      .insert(folder)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create folder: ${error.message}`);
    }

    return data;
  }

  async updateFolder(id: string, updates: FolderUpdate, userId: string): Promise<Folder> {
    const { data, error } = await this.supabase
      .from('folders')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update folder: ${error.message}`);
    }

    return data;
  }

  async deleteFolder(id: string, userId: string): Promise<{ success: boolean }> {
    // Check if folder has children
    const { data: children, error: childrenError } = await this.supabase
      .from('folders')
      .select('id')
      .eq('parent_id', id)
      .eq('user_id', userId);

    if (childrenError) {
      throw new Error(`Failed to check folder children: ${childrenError.message}`);
    }

    if (children && children.length > 0) {
      throw new Error('Cannot delete folder with subfolders. Please delete subfolders first.');
    }

    // Check if folder has documents
    const { data: documents, error: documentsError } = await this.supabase
      .from('documents')
      .select('id')
      .eq('folder_id', id)
      .eq('user_id', userId);

    if (documentsError) {
      throw new Error(`Failed to check folder documents: ${documentsError.message}`);
    }

    if (documents && documents.length > 0) {
      throw new Error('Cannot delete folder containing documents. Please move or delete documents first.');
    }

    // Delete the folder
    const { error } = await this.supabase
      .from('folders')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete folder: ${error.message}`);
    }

    return { success: true };
  }

  async moveFolder(id: string, newParentId: string | null, userId: string): Promise<Folder> {
    // Check for circular reference
    if (newParentId) {
      const isCircular = await this.checkCircularReference(id, newParentId, userId);
      if (isCircular) {
        throw new Error('Cannot move folder: this would create a circular reference');
      }
    }

    return this.updateFolder(id, { parent_id: newParentId }, userId);
  }

  private async checkCircularReference(folderId: string, targetParentId: string, userId: string): Promise<boolean> {
    let currentId = targetParentId;

    while (currentId) {
      if (currentId === folderId) {
        return true; // Circular reference found
      }

      const { data, error } = await this.supabase
        .from('folders')
        .select('parent_id')
        .eq('id', currentId)
        .eq('user_id', userId)
        .single();

      if (error || !data) break;
      currentId = data.parent_id;
    }

    return false;
  }

  async getFolderPath(folderId: string, userId: string): Promise<Folder[]> {
    const path: Folder[] = [];
    let currentId = folderId;

    while (currentId) {
      const folder = await this.getFolder(currentId, userId);
      path.unshift(folder);
      currentId = folder.parent_id;
    }

    return path;
  }

  async getFolderStats(userId: string) {
    const { data, error } = await this.supabase
      .from('folders')
      .select('safe_artifact')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to fetch folder stats: ${error.message}`);
    }

    const stats = {
      total: data.length,
      bySafeArtifact: {} as Record<string, number>,
    };

    data.forEach(folder => {
      if (folder.safe_artifact) {
        stats.bySafeArtifact[folder.safe_artifact] = (stats.bySafeArtifact[folder.safe_artifact] || 0) + 1;
      }
    });

    return stats;
  }

  async searchFolders(userId: string, query: string): Promise<Folder[]> {
    const { data, error } = await this.supabase
      .from('folders')
      .select('*')
      .eq('user_id', userId)
      .ilike('name', `%${query}%`)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Failed to search folders: ${error.message}`);
    }

    return data;
  }
}

export const folderService = new FolderService();