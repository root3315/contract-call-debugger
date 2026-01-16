import { ethers } from 'ethers';
export function extractFunctionSelector(data) {
    if (data.length < 10 || !data.startsWith('0x')) {
        return null;
    }
    return data.slice(0, 10);
}
export function decodeCalldata(data, abi) {
    if (data === '0x' || data.length < 10) {
        return null;
    }
    const selector = extractFunctionSelector(data);
    if (!selector) {
        return null;
    }
    const functionABI = abi.find((item) => {
        if (item.type !== 'function')
            return false;
        const signature = `${item.name}(${item.inputs.map((i) => i.type).join(',')})`;
        const computedSelector = ethers.id(signature).slice(0, 10);
        return computedSelector === selector;
    });
    if (!functionABI) {
        return null;
    }
    const calldata = data.slice(10);
    const inputs = [];
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
function decodeParameter(calldata, type, offset) {
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
        }
        else {
            const bytesHex = calldata.slice(dataOffset * 2 + 64, dataOffset * 2 + 64 + length * 2);
            return { value: '0x' + bytesHex, nextOffset: offset + 32 };
        }
    }
    if (type.startsWith('uint') || type.startsWith('int')) {
        const bits = parseInt(type.slice(4));
        const value = BigInt('0x' + hexValue);
        return { value: Number(value), nextOffset: offset + 32 };
    }
    return { value: '0x' + hexValue, nextOffset: offset + 32 };
}
export function parseTransactionData(tx, abi) {
    let functionName;
    let inputs = [];
    if (abi && tx.data && tx.data !== '0x') {
        const decoded = decodeCalldata(tx.data, abi);
        if (decoded) {
            functionName = decoded.functionName;
            inputs = decoded.inputs;
        }
    }
    let status;
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
export function formatAddress(address) {
    if (address.length <= 10) {
        return address;
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
export function formatValue(value, decimals = 18) {
    const ethValue = Number(value) / Math.pow(10, decimals);
    return ethValue.toFixed(6);
}
export function formatGasCost(gasUsed, gasPrice) {
    const cost = gasUsed * gasPrice;
    return formatValue(cost, 18);
}
//# sourceMappingURL=transaction-parser.js.map