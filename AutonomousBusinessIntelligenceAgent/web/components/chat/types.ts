export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  pending?: boolean; // streaming in progress
  tables?: ParsedTable[];
}

export interface ParsedTable {
  headers: string[];
  rows: string[][];
}

export interface SendMessageFn {
  (text: string): Promise<void>;
}