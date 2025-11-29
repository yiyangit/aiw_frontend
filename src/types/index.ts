export interface Problem {
  id: string;
  statement: string;
  solution: string;
  subject: string;
  chapter?: string;
  section?: string;
  origin: string;
  difficulty: number;
  collections?: CollectionInfo[];
}

export interface CollectionInfo {
  id: string;
  name: string;
  description?: string;
}

export interface Category {
  id: string;
  name: string;
  parent_id?: string;
  path: string;
  description?: string;
  created_at: string;
  updated_at: string;
  children?: Category[];
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  problem_ids: string[];
  category_ids: string[];
  created_at: string;
  updated_at: string;
  problems?: Problem[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
}