declare module 'papaparse' {
  export interface ParseResult<T> { data: T[]; errors: any[]; meta: any; }
  export interface ParseConfig<T> {
    header?: boolean;
    dynamicTyping?: boolean;
    complete?: (results: ParseResult<T>) => void;
    step?: (result: ParseResult<T>, parser: { abort: () => void }) => void;
    skipEmptyLines?: boolean | 'greedy';
    error?: (error: any) => void;
  }
  export function parse<T>(file: File | string, config: ParseConfig<T>): void;
  const Papa: { parse: typeof parse };
  export default Papa;
}