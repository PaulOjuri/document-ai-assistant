export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      folders: {
        Row: {
          id: string
          name: string
          parent_id: string | null
          safe_artifact: string | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          parent_id?: string | null
          safe_artifact?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          parent_id?: string | null
          safe_artifact?: string | null
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          title: string
          content: string
          file_url: string
          file_type: string
          file_size: number
          embedding: number[] | null
          tags: string[]
          artifact_type: string | null
          priority: string | null
          folder_id: string | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          file_url: string
          file_type: string
          file_size: number
          embedding?: number[] | null
          tags?: string[]
          artifact_type?: string | null
          priority?: string | null
          folder_id?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          file_url?: string
          file_type?: string
          file_size?: number
          embedding?: number[] | null
          tags?: string[]
          artifact_type?: string | null
          priority?: string | null
          folder_id?: string | null
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      notes: {
        Row: {
          id: string
          title: string
          content: string
          template: string | null
          tags: string[]
          embedding: number[] | null
          linked_docs: string[]
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          template?: string | null
          tags?: string[]
          embedding?: number[] | null
          linked_docs?: string[]
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          template?: string | null
          tags?: string[]
          embedding?: number[] | null
          linked_docs?: string[]
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      audios: {
        Row: {
          id: string
          title: string
          file_url: string
          duration: number
          transcription: string | null
          meeting_type: string | null
          participants: string[]
          embedding: number[] | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          file_url: string
          duration: number
          transcription?: string | null
          meeting_type?: string | null
          participants?: string[]
          embedding?: number[] | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          file_url?: string
          duration?: number
          transcription?: string | null
          meeting_type?: string | null
          participants?: string[]
          embedding?: number[] | null
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      chats: {
        Row: {
          id: string
          messages: Json[]
          context: string[]
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          messages: Json[]
          context?: string[]
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          messages?: Json[]
          context?: string[]
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}