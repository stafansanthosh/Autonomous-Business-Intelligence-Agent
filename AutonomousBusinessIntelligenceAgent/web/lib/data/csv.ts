import Papa from 'papaparse';

export interface NumericStats { min: number; max: number; }
export type ColumnType = 'number' | 'date' | 'string' | 'unknown';

export interface ParsedFileMeta {
  name: string;
  sizeBytes: number;
  rowCount: number;
  truncated: boolean;
  columns: string[];
  columnTypes: Record<string, ColumnType>;
  numericStats: Record<string, NumericStats>;
  sampleRows: Record<string, unknown>[];
  warnings: string[];
  distinctSku?: number;
  retainedRows?: Record<string, unknown>[]; // small datasets only
}

export interface ParseOptions {
  maxRows?: number; // default 25000
  maxSizeBytes?: number; // default 5MB
}

function inferType(value: unknown): ColumnType {
  if (value === null || value === undefined || value === '') return 'unknown';
  if (typeof value === 'number' && !isNaN(value)) return 'number';
  if (typeof value === 'string') {
    const num = Number(value);
    if (!isNaN(num) && value.trim() !== '') return 'number';
    // very loose date heuristic
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return 'date';
    return 'string';
  }
  return 'unknown';
}

export async function parseCsvFile(file: File, opts: ParseOptions = {}): Promise<ParsedFileMeta | null> {
  const maxRows = opts.maxRows ?? 25000;
  const maxSize = opts.maxSizeBytes ?? 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      name: file.name,
      sizeBytes: file.size,
      rowCount: 0,
      truncated: false,
      columns: [],
      columnTypes: {},
      numericStats: {},
      sampleRows: [],
      warnings: [`File skipped: exceeds ${(maxSize/1024/1024).toFixed(1)}MB limit (${(file.size/1024/1024).toFixed(2)}MB).`]
    };
  }
  return new Promise((resolve, reject) => {
    let rowCount = 0;
    let truncated = false;
    let columns: string[] = [];
    const columnTypes: Record<string, ColumnType> = {};
    const numericStats: Record<string, NumericStats> = {};
    const sampleRows: Record<string, unknown>[] = [];
  const warnings: string[] = [];
  const retainedRows: Record<string, unknown>[] = [];
    const skuSet = new Set<string>();

  Papa.parse<Record<string, unknown>>(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
  step: (res: any, parser: { abort: () => void }) => {
        const row = res.data;
        if (!columns.length) {
          columns = Object.keys(row);
        }
        // type inference and stats update
        for (const col of columns) {
          const val = row[col];
            const t = inferType(val);
            if (columnTypes[col] === undefined) columnTypes[col] = t;
            else if (columnTypes[col] !== t) {
              // widen if conflict
              if (columnTypes[col] !== t) columnTypes[col] = 'string';
            }
            if (t === 'number') {
              const numVal = typeof val === 'number' ? val : Number(val);
              if (!isNaN(numVal)) {
                if (!numericStats[col]) numericStats[col] = { min: numVal, max: numVal };
                else {
                  numericStats[col].min = Math.min(numericStats[col].min, numVal);
                  numericStats[col].max = Math.max(numericStats[col].max, numVal);
                }
              }
            }
        }
  if (rowCount < 3) sampleRows.push(row);
  if (rowCount < 1000) retainedRows.push(row); // retain up to 1000 for advanced metrics
        // SKU distinct detection
        const skuKey = Object.keys(row).find(k => k.toLowerCase() === 'sku');
        if (skuKey && typeof row[skuKey] === 'string') skuSet.add(row[skuKey] as string);
        rowCount++;
        if (rowCount >= maxRows) {
          truncated = true;
          warnings.push(`Row cap reached at ${maxRows}; remaining rows ignored.`);
          parser.abort();
        }
      },
      complete: () => {
        resolve({
          name: file.name,
          sizeBytes: file.size,
            rowCount,
            truncated,
            columns,
            columnTypes,
            numericStats,
            sampleRows,
            warnings,
            distinctSku: skuSet.size || undefined,
            retainedRows: retainedRows.length ? retainedRows : undefined
        });
      },
      error: (err: unknown) => reject(err)
    });
  });
}

export function summarizeFiles(files: ParsedFileMeta[]) {
  const totalFiles = files.length;
  const totalRows = files.reduce((a,f)=>a+f.rowCount,0);
  const columnFrequency: Record<string, number> = {};
  files.forEach(f => f.columns.forEach(c => { columnFrequency[c] = (columnFrequency[c]||0)+1; }));
  const topColumns = Object.entries(columnFrequency).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,count])=>({name,count}));
  return { totalFiles, totalRows, topColumns, columnsUnionCount: Object.keys(columnFrequency).length };
}