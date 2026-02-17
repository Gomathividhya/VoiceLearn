
export enum AppView {
  HOME = 'home',
  READER = 'reader',
  SOLVER = 'solver',
  PROFILE = 'profile',
  LIBRARY = 'library',
  SEARCH = 'search'
}

export interface LibraryItem {
  id: string;
  title: string;
  author?: string;
  progress: number;
  coverUrl: string;
  lastRead: string;
  content: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isAudio?: boolean;
}
