import { createSupabaseClient } from './client';
import type { Database } from './database.types';

type Document = Database['public']['Tables']['documents']['Row'];
type Folder = Database['public']['Tables']['folders']['Row'];
type Note = Database['public']['Tables']['notes']['Row'];
type Audio = Database['public']['Tables']['audios']['Row'];

export interface RealtimeEventCallbacks {
  onDocumentInsert?: (document: Document) => void;
  onDocumentUpdate?: (document: Document) => void;
  onDocumentDelete?: (documentId: string) => void;
  onFolderInsert?: (folder: Folder) => void;
  onFolderUpdate?: (folder: Folder) => void;
  onFolderDelete?: (folderId: string) => void;
  onNoteInsert?: (note: Note) => void;
  onNoteUpdate?: (note: Note) => void;
  onNoteDelete?: (noteId: string) => void;
  onAudioInsert?: (audio: Audio) => void;
  onAudioUpdate?: (audio: Audio) => void;
  onAudioDelete?: (audioId: string) => void;
}

export class RealtimeService {
  private supabase = createSupabaseClient();
  private subscriptions: Map<string, any> = new Map();

  subscribeToDocuments(userId: string, callbacks: RealtimeEventCallbacks) {
    const subscription = this.supabase
      .channel('documents-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'documents',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callbacks.onDocumentInsert?.(payload.new as Document);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'documents',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callbacks.onDocumentUpdate?.(payload.new as Document);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'documents',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callbacks.onDocumentDelete?.(payload.old.id);
        }
      )
      .subscribe();

    this.subscriptions.set('documents', subscription);
    return subscription;
  }

  subscribeToFolders(userId: string, callbacks: RealtimeEventCallbacks) {
    const subscription = this.supabase
      .channel('folders-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'folders',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callbacks.onFolderInsert?.(payload.new as Folder);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'folders',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callbacks.onFolderUpdate?.(payload.new as Folder);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'folders',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callbacks.onFolderDelete?.(payload.old.id);
        }
      )
      .subscribe();

    this.subscriptions.set('folders', subscription);
    return subscription;
  }

  subscribeToNotes(userId: string, callbacks: RealtimeEventCallbacks) {
    const subscription = this.supabase
      .channel('notes-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notes',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callbacks.onNoteInsert?.(payload.new as Note);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notes',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callbacks.onNoteUpdate?.(payload.new as Note);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notes',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callbacks.onNoteDelete?.(payload.old.id);
        }
      )
      .subscribe();

    this.subscriptions.set('notes', subscription);
    return subscription;
  }

  subscribeToAudios(userId: string, callbacks: RealtimeEventCallbacks) {
    const subscription = this.supabase
      .channel('audios-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audios',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callbacks.onAudioInsert?.(payload.new as Audio);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'audios',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callbacks.onAudioUpdate?.(payload.new as Audio);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'audios',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callbacks.onAudioDelete?.(payload.old.id);
        }
      )
      .subscribe();

    this.subscriptions.set('audios', subscription);
    return subscription;
  }

  subscribeToAllUserData(userId: string, callbacks: RealtimeEventCallbacks) {
    this.subscribeToDocuments(userId, callbacks);
    this.subscribeToFolders(userId, callbacks);
    this.subscribeToNotes(userId, callbacks);
    this.subscribeToAudios(userId, callbacks);
  }

  unsubscribe(channelName?: string) {
    if (channelName) {
      const subscription = this.subscriptions.get(channelName);
      if (subscription) {
        this.supabase.removeChannel(subscription);
        this.subscriptions.delete(channelName);
      }
    } else {
      // Unsubscribe from all
      this.subscriptions.forEach((subscription) => {
        this.supabase.removeChannel(subscription);
      });
      this.subscriptions.clear();
    }
  }

  unsubscribeAll() {
    this.unsubscribe();
  }
}

export const realtimeService = new RealtimeService();