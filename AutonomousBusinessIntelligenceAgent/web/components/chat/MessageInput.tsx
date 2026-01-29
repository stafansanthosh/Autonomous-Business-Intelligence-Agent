"use client";
import React, { useState } from 'react';
import { SendMessageFn } from './types';

interface Props { onSend: SendMessageFn; disabled?: boolean; }

export const MessageInput: React.FC<Props> = ({ onSend, disabled }) => {
  const [value, setValue] = useState('List potential winners this week');
  const send = async () => {
    if (!value.trim()) return;
    await onSend(value.trim());
  };
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="chat-q" className="text-xs font-medium">Your Question</label>
      <textarea
        id="chat-q"
        className="border rounded p-2 w-full h-24 dark:bg-slate-900"
        value={value}
        onChange={e=>setValue(e.target.value)}
      />
      <div className="flex items-center gap-2">
        <button onClick={send} disabled={disabled} className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50 text-sm">{disabled? 'Asking…' : 'Ask'}</button>
      </div>
    </div>
  );
};