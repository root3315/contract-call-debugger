const COLORS = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
};
export function colorize(text, color) {
    return `${COLORS[color]}${text}${COLORS.reset}`;
}
export function formatTransaction(tx, options = {}) {
    const { showHash = true, showTimestamp = true, showGasDetails = true, colorize: useColor = false, verbose = false, } = options;
    const lines = [];
    const c = useColor ? colorize : (text) => text;
    lines.push(c('═══════════════════════════════════════════════════════════', 'gray'));
    if (showHash) {
        lines.push(c(`Transaction Hash: ${tx.hash}`, 'cyan'));
    }
    lines.push(c(`From: ${tx.from}`, 'white'));
    lines.push(c(`To:   ${tx.to}`, 'white'));
    if (tx.functionName) {
        lines.push(c(`Function: ${tx.functionName}()`, 'green'));
    }
    else if (tx.data && tx.data !== '0x') {
        lines.push(c(`Function: <unknown> (data present)`, 'yellow'));
    }
    else {
        lines.push(c(`Function: <native transfer>`, 'blue'));
    }
    const valueEth = Number(tx.value) / 1e18;
    lines.push(c(`Value: ${valueEth.toFixed(6)} ETH`, 'magenta'));
    if (showTimestamp && tx.timestamp) {
        const date = new Date(tx.timestamp * 1000);
        lines.push(c(`Timestamp: ${date.toISOString()}`, 'gray'));
    }
    if (tx.blockNumber) {
        lines.push(c(`Block: ${tx.blockNumber}`, 'gray'));
    }
    if (tx.status) {
        const statusText = tx.status === 'success' ? 'SUCCESS' : 'FAILED';
        const statusColor = tx.status === 'success' ? 'green' : 'red';
        lines.push(c(`Status: ${statusText}`, statusColor));
    }
    if (tx.error) {
        lines.push(c(`Error: ${tx.error}`, 'red'));
    }
    if (showGasDetails) {
        lines.push(c('───────────────────────────────────────────────────────', 'gray'));
        lines.push(c('Gas Details:', 'yellow'));
        lines.push(`  Gas Limit: ${tx.gasLimit.toString()}`);
        if (tx.gasPrice) {
            const gasPriceGwei = Number(tx.gasPrice) / 1e9;
            lines.push(`  Gas Price: ${gasPriceGwei.toFixed(2)} Gwei`);
        }
        if (tx.maxFeePerGas) {
            const maxFeeGwei = Number(tx.maxFeePerGas) / 1e9;
            lines.push(`  Max Fee: ${maxFeeGwei.toFixed(2)} Gwei`);
        }
        if (tx.maxPriorityFeePerGas) {
            const priorityFeeGwei = Number(tx.maxPriorityFeePerGas) / 1e9;
            lines.push(`  Priority Fee: ${priorityFeeGwei.toFixed(2)} Gwei`);
        }
        const totalCost = tx.gasPrice ? tx.gasLimit * tx.gasPrice : tx.maxFeePerGas ? tx.gasLimit * tx.maxFeePerGas : 0n;
        const costEth = Number(totalCost) / 1e18;
        lines.push(`  Max Cost: ${costEth.toFixed(6)} ETH`);
    }
    if (tx.inputs && tx.inputs.length > 0) {
        lines.push(c('───────────────────────────────────────────────────────', 'gray'));
        lines.push(c('Input Parameters:', 'yellow'));
        for (const input of tx.inputs) {
            const valueStr = formatParameterValue(input.value);
            lines.push(`  ${c(input.name, 'cyan')} (${c(input.type, 'gray')}): ${valueStr}`);
        }
    }
    if (verbose && tx.data && tx.data !== '0x') {
        lines.push(c('───────────────────────────────────────────────────────', 'gray'));
        lines.push(c('Raw Data:', 'yellow'));
        const dataPreview = tx.data.length > 66 ? tx.data.slice(0, 66) + '...' : tx.data;
        lines.push(`  ${dataPreview}`);
    }
    lines.push(c('═══════════════════════════════════════════════════════════', 'gray'));
    return lines.join('\n');
}
function formatParameterValue(value) {
    if (typeof value === 'bigint') {
        return value.toString();
    }
    if (typeof value === 'number') {
        if (value > 1e12) {
            return value.toLocaleString();
        }
        return value.toString();
    }
    if (typeof value === 'boolean') {
        return value ? 'true' : 'false';
    }
    if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value);
    }
    return String(value);
}
export function formatTransactionSummary(transactions) {
    const lines = [];
    lines.push('');
    lines.push('┌─────────────────────────────────────────────────────────────┐');
    lines.push('│                    TRANSACTION SUMMARY                       │');
    lines.push('└─────────────────────────────────────────────────────────────┘');
    lines.push('');
    const totalTx = transactions.length;
    const successful = transactions.filter((tx) => tx.status === 'success').length;
    const failed = transactions.filter((tx) => tx.status === 'failed').length;
    const pending = transactions.filter((tx) => tx.status === 'pending').length;
    lines.push(`Total Transactions: ${totalTx}`);
    lines.push(`Successful: ${successful}`);
    lines.push(`Failed: ${failed}`);
    lines.push(`Pending: ${pending}`);
    lines.push('');
    const totalValue = transactions.reduce((sum, tx) => sum + tx.value, 0n);
    const totalValueEth = Number(totalValue) / 1e18;
    lines.push(`Total Value Transferred: ${totalValueEth.toFixed(6)} ETH`);
    const uniqueAddresses = new Set();
    transactions.forEach((tx) => {
        uniqueAddresses.add(tx.from);
        uniqueAddresses.add(tx.to);
    });
    lines.push(`Unique Addresses: ${uniqueAddresses.size}`);
    const functionsUsed = new Set();
    transactions.forEach((tx) => {
        if (tx.functionName) {
            functionsUsed.add(tx.functionName);
        }
    });
    lines.push(`Unique Functions Called: ${functionsUsed.size}`);
    if (functionsUsed.size > 0) {
        lines.push('');
        lines.push('Functions used:');
        functionsUsed.forEach((fn) => {
            lines.push(`  - ${fn}()`);
        });
    }
    lines.push('');
    return lines.join('\n');
}
export function formatCallTrace(calls) {
    const lines = [];
    lines.push('');
    lines.push('Call Trace:');
    lines.push('');
    for (const call of calls) {
        const indent = '  '.repeat(call.depth);
        const prefix = call.depth === 0 ? '└─' : '  ├─';
        const valueEth = Number(call.value) / 1e18;
        const valueStr = valueEth > 0 ? `[${valueEth.toFixed(4)} ETH] ` : '';
        lines.push(`${indent}${prefix} ${valueStr}${call.from.slice(0, 10)}... → ${call.to.slice(0, 10)}...`);
        if (call.error) {
            lines.push(`${indent}   └─ ❌ ${call.error}`);
        }
    }
    lines.push('');
    return lines.join('\n');
}
export function formatError(error, context) {
    const lines = [];
    lines.push(colorize('╔═══════════════════════════════════════════════════════════╗', 'red'));
    lines.push(colorize('║                      ERROR DETECTED                        ║', 'red'));
    lines.push(colorize('╚═══════════════════════════════════════════════════════════╝', 'red'));
    lines.push('');
    if (context) {
        lines.push(`Context: ${context}`);
        lines.push('');
    }
    lines.push(colorize(`Message: ${error.message}`, 'red'));
    if (error.stack) {
        lines.push('');
        lines.push(colorize('Stack Trace:', 'gray'));
        const stackLines = error.stack.split('\n').slice(1, 5);
        stackLines.forEach((line) => {
            lines.push(colorize(`  ${line}`, 'gray'));
        });
    }
    lines.push('');
    return lines.join('\n');
}
export function createProgressBar(current, total, width = 40) {
    const percentage = Math.round((current / total) * 100);
    const filledWidth = Math.round((current / total) * width);
    const emptyWidth = width - filledWidth;
    const filled = '█'.repeat(filledWidth);
    const empty = '░'.repeat(emptyWidth);
    return `[${filled}${empty}] ${percentage}% (${current}/${total})`;
}
//# sourceMappingURL=formatter.js.map