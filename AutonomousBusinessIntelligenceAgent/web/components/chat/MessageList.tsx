"use client";
import React, { useEffect, useRef } from 'react';
import { ChatMessage } from './types';

interface Props { messages: ChatMessage[]; autoScroll?: boolean; }

export const MessageList: React.FC<Props> = ({ messages, autoScroll = true }) => {
  const endRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!autoScroll) return;
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, autoScroll]);
  return (
    <div className="flex-1 overflow-y-auto space-y-3 pr-1" data-testid="message-list">
      {messages.map(m => (
        <div key={m.id} className={`rounded border p-2 text-sm whitespace-pre-wrap bg-white dark:bg-slate-800 dark:border-slate-700 ${m.role==='user' ? 'border-indigo-300 bg-indigo-50 dark:bg-indigo-950/30' : 'border-gray-200'}`}> 
          <div className="font-semibold text-[11px] uppercase tracking-wide mb-1 opacity-70">{m.role}</div>
          {m.content || (m.pending ? '…' : '')}
          {m.pending && <span className="animate-pulse ml-1">▌</span>}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
};