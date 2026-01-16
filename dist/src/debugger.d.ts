import { ParsedTransaction, ContractABI } from './transaction-parser.js';
import { FormatOptions } from './formatter.js';
export interface DebuggerConfig {
    rpcUrl?: string;
    abi?: ContractABI[];
    showHash?: boolean;
    showTimestamp?: boolean;
    showGasDetails?: boolean;
    colorize?: boolean;
    verbose?: boolean;
}
export interface CallTraceEntry {
    depth: number;
    from: string;
    to: string;
    value: bigint;
    input: string;
    output?: string;
    error?: string;
    gasUsed?: bigint;
}
export interface DebugSession {
    id: string;
    transactions: ParsedTransaction[];
    callTraces: CallTraceEntry[][];
    startTime: number;
    endTime?: number;
}
export declare class ContractCallDebugger {
    private config;
    private sessions;
    private currentSessionId;
    constructor(config?: DebuggerConfig);
    createSession(id?: string): string;
    getCurrentSession(): DebugSession | null;
    getSession(sessionId: string): DebugSession | null;
    addTransaction(tx: {
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
    }, sessionId?: string): ParsedTransaction;
    addCallTrace(trace: CallTraceEntry[], sessionId?: string): void;
    analyzeTransaction(tx: ParsedTransaction): AnalysisResult;
    private calculateRiskScore;
    analyzeSession(sessionId?: string): SessionAnalysis;
    detectReentrancyPattern(trace: CallTraceEntry[]): ReentrancyDetection;
    formatTransaction(tx: ParsedTransaction, options?: FormatOptions): string;
    formatSession(sessionId?: string): string;
    endSession(sessionId?: string): DebugSession | null;
    clearAllSessions(): void;
    updateConfig(config: Partial<DebuggerConfig>): void;
    getConfig(): DebuggerConfig;
}
export interface AnalysisIssue {
    type: 'error' | 'warning' | 'info';
    severity: 'high' | 'medium' | 'low';
    message: string;
    details: string;
}
export interface AnalysisResult {
    transaction: ParsedTransaction;
    issues: AnalysisIssue[];
    warnings: AnalysisIssue[];
    info: AnalysisIssue[];
    riskScore: number;
}
export interface ReentrancyPoint {
    address: string;
    depth: number;
    callIndex: number;
}
export interface ReentrancyDetection {
    detected: boolean;
    points: ReentrancyPoint[];
    uniqueAddressesCalled: number;
    maxCallsToSingleAddress: number;
}
export interface SessionAnalysis {
    sessionId: string;
    transactionCount: number;
    transactionAnalyses: AnalysisResult[];
    totalIssues: number;
    totalWarnings: number;
    totalInfo: number;
    averageRiskScore: number;
    startTime: Date;
    endTime?: Date;
}
export declare function createDebugger(config?: DebuggerConfig): ContractCallDebugger;
export declare function simulateTransactionFailure(reason: string, tx: ParsedTransaction): ParsedTransaction;
export declare function estimateGasCost(gasUsed: bigint, gasPrice: bigint, ethPrice?: number): {
    costWei: bigint;
    costEth: number;
    costUsd: number;
};
//# sourceMappingURL=debugger.d.ts.map