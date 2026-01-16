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

export function extractFunctionSelector(data: string): string | null {
  if (data.length < 10 || !data.startsWith('0x')) {
    return null;
  }
  return data.slice(0, 10);
}

export function decodeCalldata(
  data: string,
  abi: ContractABI[]
): { functionName: string; inputs: DecodedInput[] } | null {
  if (data === '0x' || data.length < 10) {
    return null;
  }

  const selector = extractFunctionSelector(data);
  if (!selector) {
    return null;
  }

  const functionABI = abi.find((item) => {
    if (item.type !== 'function') return false;
    if (item.selector) {
      return item.selector === selector;
    }
    return false;
  });

  if (!functionABI) {
    return null;
  }

  const calldata = data.slice(10);
  const inputs: DecodedInput[] = [];
  let offset = 0;

  for (const input of functionABI.inputs) {
    const decoded = decodeParameter(calldata, input.type, offset);
    inputs.push({
      name: input.name || 'param',
      type: input.type,
      value: decoded.value,
    });
    offset = decoded.nextOffset;
  }

  return {
    functionName: functionABI.name,
    inputs,
  };
}

function decodeParameter(
  calldata: string,
  type: string,
  offset: number
): { value: string | number | bigint | boolean | Record<string, unknown>; nextOffset: number } {
  const hexValue = calldata.slice(offset * 2, offset * 2 + 64);

  if (type === 'address') {
    const address = '0x' + hexValue.slice(-40);
    return { value: address, nextOffset: offset + 32 };
  }

  if (type === 'uint256' || type === 'uint' || type.startsWith('uint')) {
    const value = BigInt('0x' + hexValue);
    return { value: Number(value), nextOffset: offset + 32 };
  }

  if (type === 'int256' || type === 'int' || type.startsWith('int')) {
    const value = BigInt('0x' + hexValue);
    return { value: Number(value), nextOffset: offset + 32 };
  }

  if (type === 'bool') {
    const value = BigInt('0x' + hexValue) !== 0n;
    return { value, nextOffset: offset + 32 };
  }

  if (type === 'bytes32') {
    return { value: '0x' + hexValue, nextOffset: offset + 32 };
  }

  if (type === 'string' || type === 'bytes') {
    const dataOffset = Number(BigInt('0x' + hexValue));
    const lengthHex = calldata.slice(dataOffset * 2, dataOffset * 2 + 64);
    const length = Number(BigInt('0x' + lengthHex));

    if (type === 'string') {
      const strHex = calldata.slice(dataOffset * 2 + 64, dataOffset * 2 + 64 + length * 2);
      const value = Buffer.from(strHex, 'hex').toString('utf-8');
      return { value, nextOffset: offset + 32 };
    } else {
      const bytesHex = calldata.slice(dataOffset * 2 + 64, dataOffset * 2 + 64 + length * 2);
      return { value: '0x' + bytesHex, nextOffset: offset + 32 };
    }
  }

  if (type.startsWith('uint') || type.startsWith('int')) {
    const value = BigInt('0x' + hexValue);
    return { value: Number(value), nextOffset: offset + 32 };
  }

  return { value: '0x' + hexValue, nextOffset: offset + 32 };
}

export function parseTransactionData(
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
  abi?: ContractABI[]
): ParsedTransaction {
  let functionName: string | undefined;
  let inputs: DecodedInput[] = [];

  if (abi && tx.data && tx.data !== '0x') {
    const decoded = decodeCalldata(tx.data, abi);
    if (decoded) {
      functionName = decoded.functionName;
      inputs = decoded.inputs;
    }
  }

  let status: 'success' | 'failed' | 'pending' | undefined;
  if (tx.status !== undefined) {
    status = tx.status === 1 ? 'success' : 'failed';
  }

  return {
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    value: tx.value,
    gasLimit: tx.gasLimit,
    gasPrice: tx.gasPrice,
    maxFeePerGas: tx.maxFeePerGas,
    maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
    nonce: tx.nonce,
    data: tx.data,
    functionName,
    inputs,
    blockNumber: tx.blockNumber,
    timestamp: tx.timestamp,
    status,
  };
}

export function formatAddress(address: string): string {
  if (address.length <= 10) {
    return address;
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatValue(value: bigint, decimals: number = 18): string {
  const ethValue = Number(value) / Math.pow(10, decimals);
  return ethValue.toFixed(6);
}

export function formatGasCost(gasUsed: bigint, gasPrice: bigint): string {
  const cost = gasUsed * gasPrice;
  return formatValue(cost, 18);
}
