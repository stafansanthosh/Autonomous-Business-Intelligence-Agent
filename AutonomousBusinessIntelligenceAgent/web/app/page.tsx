"use client";
import React, { useState } from 'react';
import { buildPromptPreview } from '../lib/prompt/buildPrompt';
import { ChatPanel } from '../components/chat/ChatPanel';
import { SidePanel } from '../components/layout/SidePanel';
import { ChatMessage } from '../components/chat/types';
import { parseCsvFile, ParsedFileMeta, summarizeFiles } from '../lib/data/csv';
import { buildMetricsSummaryFromFiles } from '../lib/data/metrics';

// Using ParsedFileMeta from csv utility now

export default function HomePage() {
  const [files, setFiles] = useState<ParsedFileMeta[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [dark, setDark] = useState(false);

  const onFiles = async (fileList: FileList | null) => {
    if (!fileList) return;
    const parsed = await Promise.all(Array.from(fileList).map(f => parseCsvFile(f)));
    setFiles(prev => [...prev, ...parsed.filter(Boolean) as ParsedFileMeta[]]);
  };

  const aggregate = summarizeFiles(files);
  const metricsSummaryObject = buildMetricsSummaryFromFiles(files) || aggregate; // fallback to old aggregate if metrics not available

  const sendMessage = async (text: string): Promise<void> => {
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text };
    const assistantId = crypto.randomUUID();
    const assistantPlaceholder: ChatMessage = { id: assistantId, role: 'assistant', content: '', pending: true };
    setMessages(prev => [...prev, userMsg, assistantPlaceholder]);
    setLoading(true);
    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text, metricsSummary: metricsSummaryObject })
      });
      if (!resp.body) {
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: 'No stream returned', pending: false } : m));
        return;
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      while (!done) {
        const { value, done: d } = await reader.read();
        done = d;
        if (value) {
          const chunk = decoder.decode(value);
          setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: m.content + chunk.replace(/@@END@@.*/,'').trimEnd(), pending: !d } : m));
        }
      }
    } catch (e: any) {
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: 'Error: ' + e.message, pending: false } : m));
    } finally { setLoading(false); }
  };

  const preview = buildPromptPreview(messages.filter(m=>m.role==='user').slice(-1)[0]?.content || '', metricsSummaryObject);
  return (
    <div className={"flex flex-1 overflow-hidden " + (dark? 'dark bg-slate-950 text-slate-100':'bg-white')}> 
      <div className="flex flex-col md:flex-row flex-1 w-full">
        <div className="md:w-2/3 w-full border-r border-gray-200 dark:border-slate-800 p-4 gap-4 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-400">Chat Session</span>
            <button onClick={()=>setDark(d=>!d)} className="text-xs border rounded px-2 py-1 dark:border-slate-600">{dark? 'Light' : 'Dark'}</button>
          </div>
          <ChatPanel messages={messages} onSend={sendMessage} loading={loading} promptPreview={preview} />
        </div>
        <div className="md:w-1/3 w-full p-4 gap-4 overflow-y-auto bg-white dark:bg-slate-900 flex flex-col border-l border-gray-200 dark:border-slate-800">
          <SidePanel 
            files={files} 
            onFiles={onFiles} 
            metrics={aggregate}
            loadSampleLinks={[
              { label: 'orders.csv', href: '/samples/orders.csv' },
              { label: 'products.csv', href: '/samples/products.csv' },
              { label: 'inventory.csv', href: '/samples/inventory.csv' }
            ]}
          />
        </div>
      </div>
    </div>
  );
}
