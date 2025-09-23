"use client";
import React, { useState } from 'react';
import { buildPromptPreview } from '../lib/prompt/buildPrompt';
import { ChatPanel } from '../components/chat/ChatPanel';
import { SidePanel } from '../components/layout/SidePanel';
import { ChatMessage } from '../components/chat/types';
import { parseCsvFile, ParsedFileMeta, summarizeFiles } from '../lib/data/csv';
import { buildMetricsSummaryFromFiles } from '../lib/data/metrics';
import { buildNeutralContext } from '../lib/data/contextSignals';

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
  const metricsSummaryObject = buildMetricsSummaryFromFiles(files) || aggregate; // legacy aggregate
  const neutralContext = buildNeutralContext(files) || { version: 1 as const, generatedAt: new Date().toISOString(), skuSignals: [], campaigns: [] };

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
        body: JSON.stringify({ question: text, context: neutralContext })
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
          // Append raw chunk (minus any end sentinel) without trimming to keep markdown structure
          const cleaned = chunk.replace(/@@END@@.*/,'');
          setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: m.content + cleaned, pending: !d } : m));
        }
      }
      // After full stream, normalize formatting, then parse markdown tables (supports optional 'Table:' label line)
      setMessages(prev => prev.map(m => {
        if (m.id !== assistantId) return m;
        const tables: { headers: string[]; rows: string[][] }[] = [];
        let content = m.content;
        // Normalize collapsed numbered items like '1.' stuck to prior word
        content = content.replace(/([a-zA-Z0-9])([0-9]+\.)/g, '$1\n$2');
        // Ensure newline before headings '### '
        content = content.replace(/([^\n])### /g, '$1\n### ');
        // Space after periods before next digit list item
        content = content.replace(/\.([0-9]+\.)/g, '.\n$1');
        // Observations & Insights: convert to heading if not already
        content = content.replace(/Observations & Insights:?/i, '### Observations & Insights');
        // Assign normalized content back for parsing
        m.content = content;
        const tableRegex = /(Table[^\n]*:\s*)?\n{0,2}\|([^\n]*?)\|\n\|?\s*(:?-+:?\s*\|)+\n([\s\S]*?)(?=\n\n|\n?$)/g; // enhanced matcher with optional label
        let match;
        while ((match = tableRegex.exec(content)) !== null) {
          const headerLine = match[2];
          const bodyBlock = match[4];
          const headers = headerLine.split('|').map(h => h.trim()).filter(Boolean);
            // Split rows, ignore empty
          const rows = bodyBlock.split(/\n/).map(r => r.trim()).filter(r => r.length>0 && r.includes('|')).map(r => r.replace(/^\|/, '').replace(/\|$/, ''))
            .map(r => r.split('|').map(c => c.trim()));
          if (headers.length && rows.length) {
            // Ensure each row has same length
            const normRows = rows.map(r => {
              if (r.length < headers.length) return [...r, ...Array(headers.length - r.length).fill('')];
              if (r.length > headers.length) return r.slice(0, headers.length);
              return r;
            });
            tables.push({ headers, rows: normRows });
          }
        }
        let newContent = content;
        if (tables.length) {
          // strip parsed tables from content so markdown renderer doesn't show raw ASCII
          newContent = newContent.replace(tableRegex, '\n');
          return { ...m, tables, content: newContent, pending: false };
        }
        return { ...m, pending: false };
      }));
    } catch (e: any) {
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: 'Error: ' + e.message, pending: false } : m));
    } finally { setLoading(false); }
  };

  const preview = buildPromptPreview(messages.filter(m=>m.role==='user').slice(-1)[0]?.content || '', neutralContext);
  // Build dynamic follow-up suggestions (simple heuristic, neutral, non-deterministic ordering)
  const followUps: string[] = (() => {
    const outs: string[] = [];
    try {
      if (neutralContext && Array.isArray((neutralContext as any).skuSignals)) {
        const skus: any[] = (neutralContext as any).skuSignals;
        if (skus.length) {
          const topVel = [...skus].sort((a,b)=> (b.velocity14?.avgUnits||0)-(a.velocity14?.avgUnits||0))[0];
          if (topVel?.sku) outs.push(`What is driving velocity changes for ${topVel.sku}?`);
          const lowCover = skus.filter(s=> typeof s.daysCover === 'number').sort((a,b)=> (a.daysCover||Infinity)-(b.daysCover||Infinity))[0];
          if (lowCover?.sku && lowCover.daysCover < 14) outs.push(`Risk of stockout for ${lowCover.sku}?`);
        }
      }
      if (neutralContext && Array.isArray((neutralContext as any).campaigns)) {
        const camps: any[] = (neutralContext as any).campaigns;
        if (camps.length) {
          const highRoas = [...camps].sort((a,b)=> (b.roas||0)-(a.roas||0))[0];
          if (highRoas?.campaign) outs.push(`Should we scale spend on campaign ${highRoas.campaign}?`);
        }
      }
    } catch { /* ignore */ }
    return outs.slice(0,3);
  })();
  return (
    <div className={"flex flex-1 overflow-hidden " + (dark? 'dark bg-slate-950 text-slate-100':'bg-white')}> 
      <div className="flex flex-col md:flex-row flex-1 w-full">
        <div className="md:w-2/3 w-full border-r border-gray-200 dark:border-slate-800 p-4 gap-4 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-400">Chat Session</span>
            <button onClick={()=>setDark(d=>!d)} className="text-xs border rounded px-2 py-1 dark:border-slate-600">{dark? 'Light' : 'Dark'}</button>
          </div>
          <ChatPanel messages={messages} onSend={sendMessage} loading={loading} promptPreview={preview} />
          {followUps.length>0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {followUps.map(f => (
                <button key={f} onClick={()=>!loading && sendMessage(f)} className="text-xs px-2 py-1 rounded border dark:border-slate-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition">
                  {f}
                </button>
              ))}
            </div>
          )}
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
