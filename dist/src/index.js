import { ContractCallDebugger } from './debugger.js';
import { parseTransactionData, formatAddress, } from './transaction-parser.js';
import { formatTransaction, formatTransactionSummary, formatError, } from './formatter.js';
export { ContractCallDebugger, createDebugger, simulateTransactionFailure, estimateGasCost, } from './debugger.js';
export { parseTransactionData, decodeCalldata, extractFunctionSelector, formatAddress, formatValue, formatGasCost, } from './transaction-parser.js';
export { formatTransaction, formatTransactionSummary, formatCallTrace, formatError, colorize, createProgressBar, } from './formatter.js';
export class ContractCallDebuggerCLI {
    debugger;
    config;
    constructor(config = {}) {
        this.config = config;
        this.debugger = new ContractCallDebugger(config);
    }
    async runDemo() {
        console.log('');
        console.log('╔═══════════════════════════════════════════════════════════╗');
        console.log('║     Contract Call Debugger - Interactive Demo             ║');
        console.log('╚═══════════════════════════════════════════════════════════╝');
        console.log('');
        const sessionId = this.debugger.createSession('demo_session');
        console.log(`Created session: ${sessionId}`);
        console.log('');
        const sampleTransactions = this.generateSampleTransactions();
        console.log('Adding sample transactions to session...\n');
        for (const tx of sampleTransactions) {
            const parsed = this.debugger.addTransaction(tx);
            console.log(`  Added: ${parsed.hash.slice(0, 10)}... → ${formatAddress(parsed.to)}`);
        }
        console.log('');
        const sampleTrace = [
            {
                depth: 0,
                from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
                to: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
                value: 0n,
                input: '0xa9059cbb',
            },
            {
                depth: 1,
                from: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
                to: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
                value: 0n,
                input: '0xa9059cbb',
            },
            {
                depth: 1,
                from: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
                to: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
                value: 0n,
                input: '0xa9059cbb',
            },
        ];
        this.debugger.addCallTrace(sampleTrace);
        console.log('Added call trace with 3 nested calls\n');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('                    TRANSACTION DETAILS                     ');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('');
        const session = this.debugger.getCurrentSession();
        if (session) {
            for (const tx of session.transactions) {
                console.log(this.debugger.formatTransaction(tx));
                console.log('');
            }
        }
        console.log('═══════════════════════════════════════════════════════════');
        console.log('                      ANALYSIS RESULTS                      ');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('');
        const analysis = this.debugger.analyzeSession();
        console.log(`Session: ${analysis.sessionId}`);
        console.log(`Transactions Analyzed: ${analysis.transactionCount}`);
        console.log(`Total Issues: ${analysis.totalIssues}`);
        console.log(`Total Warnings: ${analysis.totalWarnings}`);
        console.log(`Total Info: ${analysis.totalInfo}`);
        console.log(`Average Risk Score: ${analysis.averageRiskScore.toFixed(1)}/100`);
        console.log('');
        for (const txAnalysis of analysis.transactionAnalyses) {
            const tx = txAnalysis.transaction;
            console.log(`Transaction: ${tx.hash.slice(0, 10)}...`);
            if (txAnalysis.issues.length > 0) {
                console.log('  Issues:');
                for (const issue of txAnalysis.issues) {
                    console.log(`    [${issue.severity.toUpperCase()}] ${issue.message}`);
                }
            }
            if (txAnalysis.warnings.length > 0) {
                console.log('  Warnings:');
                for (const warning of txAnalysis.warnings) {
                    console.log(`    [${warning.severity.toUpperCase()}] ${warning.message}`);
                }
            }
            if (txAnalysis.info.length > 0) {
                console.log('  Info:');
                for (const info of txAnalysis.info) {
                    console.log(`    [${info.severity.toUpperCase()}] ${info.message}`);
                }
            }
            console.log(`  Risk Score: ${txAnalysis.riskScore}/100`);
            console.log('');
        }
        const reentrancyResult = this.debugger.detectReentrancyPattern(sampleTrace);
        console.log('═══════════════════════════════════════════════════════════');
        console.log('                   REENTRANCY ANALYSIS                      ');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('');
        console.log(`Reentrancy Detected: ${reentrancyResult.detected ? 'YES' : 'NO'}`);
        console.log(`Unique Addresses Called: ${reentrancyResult.uniqueAddressesCalled}`);
        console.log(`Max Calls to Single Address: ${reentrancyResult.maxCallsToSingleAddress}`);
        if (reentrancyResult.points.length > 0) {
            console.log('Potential Reentrancy Points:');
            for (const point of reentrancyResult.points) {
                console.log(`  - Address: ${formatAddress(point.address)} at depth ${point.depth}`);
            }
        }
        console.log('');
        console.log(formatTransactionSummary(sampleTransactions.map((tx) => parseTransactionData(tx))));
        this.debugger.endSession();
        console.log('Demo completed successfully!');
        console.log('');
    }
    generateSampleTransactions() {
        return [
            {
                hash: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890',
                from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
                to: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
                value: 0n,
                gasLimit: 100000n,
                gasPrice: 20000000000n,
                nonce: 42,
                data: '0xa9059cbb000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f0beb0000000000000000000000000000000000000000000000056bc75e2d63100000',
                blockNumber: 18500000,
                timestamp: 1700000000,
                status: 1,
            },
            {
                hash: '0x2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890ab',
                from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
                to: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
                value: 500000000000000000n,
                gasLimit: 21000n,
                gasPrice: 25000000000n,
                nonce: 43,
                data: '0x',
                blockNumber: 18500001,
                timestamp: 1700000012,
                status: 1,
            },
            {
                hash: '0x3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcd',
                from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
                to: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
                value: 0n,
                gasLimit: 150000n,
                maxFeePerGas: 30000000000n,
                maxPriorityFeePerGas: 2000000000n,
                nonce: 44,
                data: '0x095ea7b3000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f0beb0000000000000000000000000000000000000000000000000000000005f5e100',
                blockNumber: 18500002,
                timestamp: 1700000024,
                status: 0,
            },
        ];
    }
    debugTransaction(tx, options) {
        const parsed = parseTransactionData(tx, this.config.abi);
        return formatTransaction(parsed, { ...this.config, ...options });
    }
    debugMultipleTransactions(transactions, options) {
        const parsed = transactions.map((tx) => parseTransactionData(tx, this.config.abi));
        let output = '';
        for (const tx of parsed) {
            output += formatTransaction(tx, { ...this.config, ...options }) + '\n';
        }
        output += formatTransactionSummary(parsed);
        return output;
    }
    getDebugger() {
        return this.debugger;
    }
}
export function createCLI(config) {
    return new ContractCallDebuggerCLI(config);
}
async function main() {
    const args = process.argv.slice(2);
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
Contract Call Debugger - Smart Contract Interaction Debugger

Usage:
  node dist/index.js [options]

Options:
  --help, -h     Show this help message
  --demo         Run the interactive demo

Examples:
  node dist/index.js --demo
  `);
        return;
    }
    const cli = createCLI({ colorize: true });
    if (args.includes('--demo')) {
        await cli.runDemo();
    }
    else {
        await cli.runDemo();
    }
}
main().catch((error) => {
    console.error(formatError(error, 'Main execution failed'));
    process.exit(1);
});
//# sourceMappingURL=index.js.map