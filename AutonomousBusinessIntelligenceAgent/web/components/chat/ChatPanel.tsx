"use client";
import React from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ChatMessage } from './types';

interface Props {
  messages: ChatMessage[];
  onSend: (text: string) => Promise<void>;
  loading: boolean;
  promptPreview: string;
}

export const ChatPanel: React.FC<Props> = ({ messages, onSend, loading, promptPreview }) => {
  return (
    <div className="flex flex-col w-full h-full">
      <h1 className="text-lg font-semibold mb-2">Chat</h1>
      <div className="flex-1 min-h-0 flex flex-col border rounded bg-gray-50 dark:bg-slate-900/40 p-3 mb-4">
        <MessageList messages={messages} />
      </div>
      <MessageInput onSend={onSend} disabled={loading} />
      <div className="text-[11px] text-gray-500 mt-3 font-mono break-words">Prompt Preview: {promptPreview}</div>
    </div>
  );
};