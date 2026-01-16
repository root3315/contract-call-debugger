import { ParsedTransaction } from './transaction-parser.js';
export interface FormatOptions {
    showHash?: boolean;
    showTimestamp?: boolean;
    showGasDetails?: boolean;
    colorize?: boolean;
    verbose?: boolean;
}
declare const COLORS: {
    reset: string;
    red: string;
    green: string;
    yellow: string;
    blue: string;
    magenta: string;
    cyan: string;
    white: string;
    gray: string;
};
export declare function colorize(text: string, color: keyof typeof COLORS): string;
export declare function formatTransaction(tx: ParsedTransaction, options?: FormatOptions): string;
export declare function formatTransactionSummary(transactions: ParsedTransaction[]): string;
export declare function formatCallTrace(calls: Array<{
    depth: number;
    from: string;
    to: string;
    value: bigint;
    input: string;
    output?: string;
    error?: string;
}>): string;
export declare function formatError(error: Error, context?: string): string;
export declare function createProgressBar(current: number, total: number, width?: number): string;
export {};
//# sourceMappingURL=formatter.d.ts.map