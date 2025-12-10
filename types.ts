export enum NodeType {
  FOLDER = 'FOLDER',
  FILE = 'FILE'
}

export enum FileCategory {
  IDEA = 'IDEA',
  PLANNING = 'PLANNING',
  CHARACTER = 'CHARACTER',
  CHAPTER = 'CHAPTER',
  OTHER = 'OTHER'
}

export enum ViewMode {
  LANDING = 'LANDING',
  EDITOR = 'EDITOR',
  STATS = 'STATS'
}

export interface User {
  email: string;
  name: string;
  avatar?: string;
}

export interface FileNode {
  id: string;
  parentId: string | null;
  title: string;
  type: NodeType;
  category?: FileCategory;
  content?: string; // Only for files
  children?: string[]; // IDs of children
  wordCount?: number;
  lastModified: number;
  isOpen?: boolean; // For folders
  fileHandle?: FileSystemFileHandle; // Handle for File System Access API
  tags?: string[];
}

export interface Book {
  id: string;
  title: string;
  coverImage?: string; // URL
  rootFolderId: string;
  status: 'Drafting' | 'Editing' | 'Completed' | 'Planning';
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export interface AppState {
  view: ViewMode;
  user: User | null;
  books: Book[];
  fileMap: Record<string, FileNode>; // Flat map for easy lookup
  activeBookId: string | null;
  activeFileId: string | null;
  darkMode: boolean;
  focusMode: boolean;
  sidebarOpen: boolean;
  assistantOpen: boolean;
  assistantHistory: AssistantMessage[];
}

export interface ExportConfig {
  format: 'PDF' | 'EPUB' | 'DOCX';
  template: 'Standard' | 'Manuscript' | 'Modern';
  includeCover: boolean;
  scope: 'current' | 'project';
}

export interface DashboardStats {
  totalWords: number;
  bookProgress: {
    bookId: string;
    bookTitle: string;
    progress: number; // 0-100
    estimatedCompletion: string;
    tone: string;
  }[];
}

export interface WritingStats {
  dailyGoal: number; // Words per day
  weeklyGoal: number; // Words per week
  currentStreak: number; // Days in a row
  longestStreak: number; // Best streak ever
  totalTimeMinutes: number; // Total time spent writing
  dailyHistory: {
    date: string; // YYYY-MM-DD
    wordCount: number;
    timeMinutes: number;
  }[];
  lastWriteDate: string; // YYYY-MM-DD
}