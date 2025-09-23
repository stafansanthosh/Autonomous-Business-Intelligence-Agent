"use client";
import React, { useState } from 'react';
import { ParsedFileMeta } from '../../lib/data/csv';

interface Props {
  files: ParsedFileMeta[];
  onFiles: (files: FileList | null) => void;
  metrics: { totalFiles: number; totalRows: number; topColumns: {name:string;count:number}[]; columnsUnionCount: number };
  loadSampleLinks?: { label: string; href: string }[];
}

export const SidePanel: React.FC<Props> = ({ files, onFiles, metrics, loadSampleLinks = [] }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggle = (name: string) => setExpanded(e => ({ ...e, [name]: !e[name] }));
  return (
    <div className="flex flex-col w-full h-full">
      <h2 className="text-md font-semibold">Data Files</h2>
      <label htmlFor="fileInput" className="text-xs font-medium mt-2">Upload CSV Files</label>
      <input id="fileInput" type="file" multiple accept=".csv" onChange={(e)=>onFiles(e.target.files)} />
      <div className="mt-4">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600 mb-1">Sample Datasets</div>
        <ul className="space-y-1 text-[11px]">
          {loadSampleLinks.map(l => (
            <li key={l.href}>
              <a className="text-indigo-600 underline hover:text-indigo-800" href={l.href} download>{l.label}</a>
            </li>
          ))}
          {loadSampleLinks.length === 0 && <li className="text-gray-500 italic">No samples</li>}
        </ul>
      </div>
      <div className="mt-3 space-y-2 overflow-y-auto pr-1">
        {files.map(f => (
          <div key={f.name} className="border rounded p-2 bg-white dark:bg-slate-800 dark:border-slate-700">
            <div className="flex items-center justify-between cursor-pointer" onClick={()=>toggle(f.name)}>
              <div className="text-sm font-medium truncate" title={f.name}>{f.name}</div>
              <div className="text-[11px] text-gray-500">{f.rowCount} rows{f.truncated && <span className="ml-1 text-amber-600">(truncated)</span>}</div>
            </div>
            {expanded[f.name] && (
              <div className="mt-2 space-y-2 text-xs">
                {f.warnings.map((w,i)=><div key={i} className="text-amber-600">⚠ {w}</div>)}
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="font-semibold">Columns:</span> {f.columns.length}</div>
                  {f.distinctSku !== undefined && <div><span className="font-semibold">Distinct SKU:</span> {f.distinctSku}</div>}
                  <div className="col-span-2">
                    <span className="font-semibold">Schema:</span>
                    <ul className="mt-1 max-h-32 overflow-auto space-y-0.5">
                      {f.columns.map(c => <li key={c}>{c} <span className="text-[10px] text-gray-500">({f.columnTypes[c]})</span></li>)}
                    </ul>
                  </div>
                  <div className="col-span-2">
                    <span className="font-semibold">Numeric Stats:</span>
                    <ul className="mt-1 max-h-24 overflow-auto space-y-0.5">
                      {Object.entries(f.numericStats).map(([c,s]) => <li key={c}>{c}: {s.min} – {s.max}</li>)}
                      {Object.keys(f.numericStats).length === 0 && <li className="italic text-gray-500">None</li>}
                    </ul>
                  </div>
                </div>
                <div>
                  <span className="font-semibold">Samples:</span>
                  <pre className="bg-gray-100 dark:bg-slate-900 p-1 rounded mt-1 overflow-auto max-h-40">{JSON.stringify(f.sampleRows, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <h3 className="text-sm font-medium mt-4">Aggregate Summary</h3>
      <pre className="text-xs bg-gray-100 dark:bg-slate-800 p-2 rounded max-h-56 overflow-auto">{JSON.stringify(metrics, null, 2)}</pre>
    </div>
  );
};