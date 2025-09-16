export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  children?: Folder[];
  documents?: Document[];
  safeArtifact?: string;
  userId: string;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  fileUrl: string;
  fileType: string;
  embedding?: number[];
  tags: string[];
  artifactType?: string;
  priority?: string;
  folderId?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  template?: string;
  tags: string[];
  embedding?: number[];
  linkedDocs: string[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Audio {
  id: string;
  title: string;
  fileUrl: string;
  duration: number;
  transcription?: string;
  meetingType?: string;
  participants: string[];
  embedding?: number[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Chat {
  id: string;
  messages: ChatMessage[];
  context: string[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: string[];
}

export type SAFeArtifact =
  | 'Epic'
  | 'Feature'
  | 'User Story'
  | 'Capability'
  | 'Solution'
  | 'Theme'
  | 'Enabler';

export type MeetingType =
  | 'sprint-planning'
  | 'retrospective'
  | 'pi-planning'
  | 'daily-standup'
  | 'system-demo'
  | 'po-sync'
  | 'inspect-adapt';

export type Priority = 'High' | 'Medium' | 'Low';

export type FileType = 'pdf' | 'docx' | 'txt' | 'md' | 'mp3' | 'wav' | 'mp4';