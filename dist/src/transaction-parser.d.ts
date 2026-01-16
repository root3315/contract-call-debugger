export interface DecodedInput {
    name: string;
    type: string;
    value: string | number | bigint | boolean | Record<string, unknown>;
}
export interface DecodedOutput {
    name: string;
    type: string;
    value: string | number | bigint | boolean | Record<string, unknown>;
}
export interface ParsedTransaction {
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
    functionName?: string;
    inputs: DecodedInput[];
    outputs?: DecodedOutput[];
    blockNumber?: number;
    timestamp?: number;
    status?: 'success' | 'failed' | 'pending';
    error?: string;
}
export interface ContractABI {
    inputs: Array<{
        name: string;
        type: string;
        indexed?: boolean;
    }>;
    name: string;
    outputs: Array<{
        name: string;
        type: string;
    }>;
    stateMutability: string;
    type: 'function' | 'constructor' | 'event' | 'fallback' | 'receive';
    selector?: string;
}
export declare function extractFunctionSelector(data: string): string | null;
export declare function decodeCalldata(data: string, abi: ContractABI[]): {
    functionName: string;
    inputs: DecodedInput[];
} | null;
export declare function parseTransactionData(tx: {
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
}, abi?: ContractABI[]): ParsedTransaction;
export declare function formatAddress(address: string): string;
export declare function formatValue(value: bigint, decimals?: number): string;
export declare function formatGasCost(gasUsed: bigint, gasPrice: bigint): string;
//# sourceMappingURL=transaction-parser.d.ts.map