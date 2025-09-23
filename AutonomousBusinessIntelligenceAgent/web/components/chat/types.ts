export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  pending?: boolean; // streaming in progress
}

export interface SendMessageFn {
  (text: string): Promise<void>;
}