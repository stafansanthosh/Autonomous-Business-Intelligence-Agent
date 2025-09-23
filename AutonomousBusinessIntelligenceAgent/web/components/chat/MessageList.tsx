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
  // Minimal markdown renderer (no external deps) for assistant messages
  const renderMarkdown = (text: string, hasTables: boolean) => {
    if (!text) return null;
    let work = text;
    // If tables were parsed, remove original markdown table blocks to avoid duplication
    if (hasTables) {
      work = work.replace(/(^|\n)\|[^\n]*\|\n\|?\s*(:?-+:?\s*\|)+\n[\s\S]*?(?=\n\n|\n?$)/g, '\n');
    }
    // Headings
    work = work.replace(/^### (.*)$/gm,'<h3 class="mt-3 mb-1 font-semibold text-sm">$1</h3>');
    work = work.replace(/^## (.*)$/gm,'<h2 class="mt-4 mb-2 font-semibold text-base">$1</h2>');
    work = work.replace(/^# (.*)$/gm,'<h1 class="mt-4 mb-2 font-semibold text-lg">$1</h1>');
    // Bold / Italic
    work = work.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
    work = work.replace(/\*([^*]+)\*/g,'<em>$1</em>');
    // Inline code
    work = work.replace(/`([^`]+)`/g,'<code class="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[11px]">$1</code>');
    // Bullet list (ordered + unordered)
    work = work.replace(/^(\d+)\. (.*)$/gm,'<li class="ml-4 list-decimal">$2</li>');
    work = work.replace(/^[-*] (.*)$/gm,'<li class="ml-4 list-disc">$1</li>');
    // Wrap orphan list items with <ul> / <ol> minimal pass
    work = work.replace(/(<li class=\"ml-4 list-disc\">[\s\S]*?<\/li>)/g, '<ul class="mb-2 mt-2 space-y-1">$1</ul>');
    work = work.replace(/(<li class=\"ml-4 list-decimal\">[\s\S]*?<\/li>)/g, '<ol class="mb-2 mt-2 space-y-1">$1</ol>');
    // Paragraph breaks
    work = work.replace(/\n{2,}/g,'</p><p>');
    work = `<p>${work}</p>`;
    return <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{__html: work}} />;
  };

  return (
    <div className="flex-1 overflow-y-auto space-y-3 pr-1" data-testid="message-list">
      {messages.map(m => (
  <div key={m.id} className={`rounded border p-2 text-sm bg-white dark:bg-slate-800 dark:border-slate-700 ${m.role==='user' ? 'border-indigo-300 bg-indigo-50 dark:bg-indigo-950/30' : 'border-gray-200'}`}> 
          <div className="font-semibold text-[11px] uppercase tracking-wide mb-1 opacity-70">{m.role}</div>
          {m.role==='assistant'
            ? renderMarkdown(m.content, !!(m.tables && m.tables.length))
            : (m.content || (m.pending ? '…' : ''))}
          {m.pending && <span className="animate-pulse ml-1">▌</span>}
          {!m.pending && m.tables && m.tables.length > 0 && (
            <div className="mt-3 space-y-4">
              {m.tables.map((t,i)=>(
                <div key={i} className="overflow-x-auto">
                  <table className="min-w-full text-[11px] border border-slate-300 dark:border-slate-600">
                    <thead className="bg-slate-100 dark:bg-slate-700">
                      <tr>{t.headers.map(h=> <th key={h} className="px-2 py-1 text-left font-semibold border-b border-slate-300 dark:border-slate-600">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {t.rows.map((r,ri)=>(
                        <tr key={ri} className="odd:bg-white even:bg-slate-50 dark:odd:bg-slate-800 dark:even:bg-slate-750">
                          {r.map((cell,ci)=>(<td key={ci} className="px-2 py-1 align-top border-t border-slate-200 dark:border-slate-600">{cell}</td>))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
};