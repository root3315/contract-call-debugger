import { ContractCallDebugger, DebuggerConfig } from './debugger.js';
import { FormatOptions } from './formatter.js';
export type { ParsedTransaction, ContractABI, DecodedInput, DecodedOutput, } from './transaction-parser.js';
export type { DebuggerConfig, CallTraceEntry, DebugSession, AnalysisIssue, AnalysisResult, ReentrancyPoint, ReentrancyDetection, SessionAnalysis, } from './debugger.js';
export type { FormatOptions } from './formatter.js';
export { ContractCallDebugger, createDebugger, simulateTransactionFailure, estimateGasCost, } from './debugger.js';
export { parseTransactionData, decodeCalldata, extractFunctionSelector, formatAddress, formatValue, formatGasCost, } from './transaction-parser.js';
export { formatTransaction, formatTransactionSummary, formatCallTrace, formatError, colorize, createProgressBar, } from './formatter.js';
export declare class ContractCallDebuggerCLI {
    private debugger;
    private config;
    constructor(config?: DebuggerConfig);
    runDemo(): Promise<void>;
    private generateSampleTransactions;
    debugTransaction(tx: {
        hash: string;
        from: string;
        to: string;
        value: bigint;
        gasLimit: bigint;
        gasPrice?: bigint;
        maxFeePerGas?: bigint;
        maxPriorityFeePerGas?: bigint;
        nonce: number;
        data: string;
        blockNumber?: number;
        timestamp?: number;
        status?: number;
    }, options?: FormatOptions): string;
    debugMultipleTransactions(transactions: Array<{
        hash: string;
        from: string;
        to: string;
        value: bigint;
        gasLimit: bigint;
        gasPrice?: bigint;
        maxFeePerGas?: bigint;
        maxPriorityFeePerGas?: bigint;
        nonce: number;
        data: string;
        blockNumber?: number;
        timestamp?: number;
        status?: number;
    }>, options?: FormatOptions): string;
    getDebugger(): ContractCallDebugger;
}
export declare function createCLI(config?: DebuggerConfig): ContractCallDebuggerCLI;
//# sourceMappingURL=index.d.ts.map