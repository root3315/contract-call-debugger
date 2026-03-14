import {
  ParsedTransaction,
  ContractABI,
  parseTransactionData,
  formatAddress,
} from './transaction-parser.js';
import {
  formatTransaction,
  formatTransactionSummary,
  formatCallTrace,
  FormatOptions,
} from './formatter.js';

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

export class ContractCallDebugger {
  private config: DebuggerConfig;
  private sessions: Map<string, DebugSession>;
  private currentSessionId: string | null = null;

  constructor(config: DebuggerConfig = {}) {
    this.config = {
      colorize: process.stdout.isTTY,
      ...config,
    };
    this.sessions = new Map();
  }

  createSession(id?: string): string {
    const sessionId = id || `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const session: DebugSession = {
      id: sessionId,
      transactions: [],
      callTraces: [],
      startTime: Date.now(),
    };

    this.sessions.set(sessionId, session);
    this.currentSessionId = sessionId;

    return sessionId;
  }

  getCurrentSession(): DebugSession | null {
    if (!this.currentSessionId) {
      return null;
    }
    return this.sessions.get(this.currentSessionId) || null;
  }

  getSession(sessionId: string): DebugSession | null {
    return this.sessions.get(sessionId) || null;
  }

  addTransaction(
    tx: {
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
    },
    sessionId?: string
  ): ParsedTransaction {
    const targetSessionId = sessionId || this.currentSessionId || this.createSession();
    const session = this.sessions.get(targetSessionId);

    if (!session) {
      throw new Error(`Session ${targetSessionId} not found`);
    }

    const parsed = parseTransactionData(tx, this.config.abi);
    session.transactions.push(parsed);

    return parsed;
  }

  addCallTrace(trace: CallTraceEntry[], sessionId?: string): void {
    const targetSessionId = sessionId || this.currentSessionId;

    if (!targetSessionId) {
      throw new Error('No active session');
    }

    const session = this.sessions.get(targetSessionId);
    if (!session) {
      throw new Error(`Session ${targetSessionId} not found`);
    }

    session.callTraces.push(trace);
  }

  analyzeTransaction(tx: ParsedTransaction): AnalysisResult {
    const issues: AnalysisIssue[] = [];
    const warnings: AnalysisIssue[] = [];
    const info: AnalysisIssue[] = [];

    if (tx.status === 'failed') {
      issues.push({
        type: 'error',
        severity: 'high',
        message: 'Transaction failed',
        details: tx.error || 'Unknown error',
      });
    }

    if (tx.gasLimit > 10000000n) {
      warnings.push({
        type: 'warning',
        severity: 'medium',
        message: 'Very high gas limit',
        details: `Gas limit ${tx.gasLimit.toString()} exceeds 10M`,
      });
    }

    if (tx.functionName === undefined && tx.data !== '0x') {
      warnings.push({
        type: 'warning',
        severity: 'low',
        message: 'Unknown function call',
        details: 'Could not decode function from calldata',
      });
    }

    if (tx.value > 100n * 10n ** 18n) {
      info.push({
        type: 'info',
        severity: 'low',
        message: 'Large value transfer',
        details: `Transferring ${Number(tx.value) / 1e18} ETH`,
      });
    }

    if (tx.nonce === 0) {
      info.push({
        type: 'info',
        severity: 'low',
        message: 'First transaction from address',
        details: `Nonce is 0 for ${formatAddress(tx.from)}`,
      });
    }

    return {
      transaction: tx,
      issues,
      warnings,
      info,
      riskScore: this.calculateRiskScore(issues, warnings),
    };
  }

  private calculateRiskScore(issues: AnalysisIssue[], warnings: AnalysisIssue[]): number {
    let score = 0;

    for (const issue of issues) {
      if (issue.severity === 'high') score += 30;
      if (issue.severity === 'medium') score += 20;
      if (issue.severity === 'low') score += 10;
    }

    for (const warning of warnings) {
      if (warning.severity === 'high') score += 15;
      if (warning.severity === 'medium') score += 10;
      if (warning.severity === 'low') score += 5;
    }

    return Math.min(score, 100);
  }

  analyzeSession(sessionId?: string): SessionAnalysis {
    const targetSessionId = sessionId || this.currentSessionId;

    if (!targetSessionId) {
      throw new Error('No active session');
    }

    const session = this.sessions.get(targetSessionId);
    if (!session) {
      throw new Error(`Session ${targetSessionId} not found`);
    }

    const transactionAnalyses = session.transactions.map((tx) => this.analyzeTransaction(tx));

    const allIssues = transactionAnalyses.flatMap((a) => a.issues);
    const allWarnings = transactionAnalyses.flatMap((a) => a.warnings);
    const allInfo = transactionAnalyses.flatMap((a) => a.info);

    const avgRiskScore =
      transactionAnalyses.reduce((sum, a) => sum + a.riskScore, 0) / transactionAnalyses.length;

    return {
      sessionId: targetSessionId,
      transactionCount: session.transactions.length,
      transactionAnalyses,
      totalIssues: allIssues.length,
      totalWarnings: allWarnings.length,
      totalInfo: allInfo.length,
      averageRiskScore: avgRiskScore,
      startTime: new Date(session.startTime),
      endTime: session.endTime ? new Date(session.endTime) : undefined,
    };
  }

  detectReentrancyPattern(trace: CallTraceEntry[]): ReentrancyDetection {
    const callStack: string[] = [];
    const reentrancyPoints: ReentrancyPoint[] = [];
    const addressCallCount = new Map<string, number>();

    for (const call of trace) {
      const toAddress = call.to.toLowerCase();

      if (call.error) {
        callStack.length = 0;
        continue;
      }

      const isReentrant = callStack.includes(toAddress);

      if (isReentrant) {
        const stackIndex = callStack.indexOf(toAddress);
        reentrancyPoints.push({
          address: call.to,
          depth: call.depth,
          callIndex: trace.indexOf(call),
          reentrantFromDepth: stackIndex,
        });
      }

      callStack.push(toAddress);

      const count = (addressCallCount.get(toAddress) || 0) + 1;
      addressCallCount.set(toAddress, count);
    }

    return {
      detected: reentrancyPoints.length > 0,
      points: reentrancyPoints,
      uniqueAddressesCalled: addressCallCount.size,
      maxCallsToSingleAddress: Math.max(...Array.from(addressCallCount.values())),
    };
  }

  formatTransaction(tx: ParsedTransaction, options?: FormatOptions): string {
    return formatTransaction(tx, { ...this.config, ...options });
  }

  formatSession(sessionId?: string): string {
    const targetSessionId = sessionId || this.currentSessionId;

    if (!targetSessionId) {
      return 'No active session';
    }

    const session = this.sessions.get(targetSessionId);
    if (!session) {
      return `Session ${targetSessionId} not found`;
    }

    let output = '';

    for (const tx of session.transactions) {
      output += this.formatTransaction(tx) + '\n';
    }

    if (session.callTraces.length > 0) {
      for (const trace of session.callTraces) {
        output += formatCallTrace(trace);
      }
    }

    output += formatTransactionSummary(session.transactions);

    return output;
  }

  endSession(sessionId?: string): DebugSession | null {
    const targetSessionId = sessionId || this.currentSessionId;

    if (!targetSessionId) {
      return null;
    }

    const session = this.sessions.get(targetSessionId);
    if (!session) {
      return null;
    }

    session.endTime = Date.now();

    if (this.currentSessionId === targetSessionId) {
      this.currentSessionId = null;
    }

    return session;
  }

  clearAllSessions(): void {
    this.sessions.clear();
    this.currentSessionId = null;
  }

  updateConfig(config: Partial<DebuggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): DebuggerConfig {
    return { ...this.config };
  }
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
  reentrantFromDepth?: number;
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

export function createDebugger(config?: DebuggerConfig): ContractCallDebugger {
  return new ContractCallDebugger(config);
}

export function simulateTransactionFailure(
  reason: string,
  tx: ParsedTransaction
): ParsedTransaction {
  return {
    ...tx,
    status: 'failed',
    error: reason,
  };
}

export function estimateGasCost(
  gasUsed: bigint,
  gasPrice: bigint,
  ethPrice: number = 2000
): { costWei: bigint; costEth: number; costUsd: number } {
  const costWei = gasUsed * gasPrice;
  const costEth = Number(costWei) / 1e18;
  const costUsd = costEth * ethPrice;

  return {
    costWei,
    costEth,
    costUsd,
  };
}
