import { ContractCallDebugger, createDebugger, estimateGasCost, simulateTransactionFailure, } from '../src/debugger.js';
import { parseTransactionData, decodeCalldata, extractFunctionSelector, formatAddress, formatValue, } from '../src/transaction-parser.js';
import { formatTransaction, formatTransactionSummary, createProgressBar, } from '../src/formatter.js';
const TEST_ABI = [
    {
        inputs: [
            { name: 'recipient', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        name: 'transfer',
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function',
        selector: '0xa9059cbb',
    },
    {
        inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        name: 'approve',
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function',
        selector: '0x095ea7b3',
    },
];
function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message}: expected ${expected}, got ${actual}`);
    }
}
function assertTrue(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}
function assertType(value, type, message) {
    if (typeof value !== type) {
        throw new Error(`${message}: expected type ${type}, got ${typeof value}`);
    }
}
let testsPassed = 0;
let testsFailed = 0;
function test(name, fn) {
    try {
        fn();
        console.log(`  ✓ ${name}`);
        testsPassed++;
    }
    catch (error) {
        console.log(`  ✗ ${name}`);
        console.log(`    Error: ${error.message}`);
        testsFailed++;
    }
}
console.log('Contract Call Debugger - Test Suite\n');
console.log('Transaction Parser Tests:');
test('extractFunctionSelector extracts correct selector', () => {
    const data = '0xa9059cbb000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f0beb';
    const selector = extractFunctionSelector(data);
    assertEqual(selector, '0xa9059cbb', 'Should extract function selector');
});
test('extractFunctionSelector returns null for invalid data', () => {
    const selector1 = extractFunctionSelector('0x');
    const selector2 = extractFunctionSelector('0x1234');
    assertEqual(selector1, null, 'Should return null for empty data');
    assertEqual(selector2, null, 'Should return null for short data');
});
test('formatAddress truncates long addresses', () => {
    const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
    const formatted = formatAddress(address);
    assertTrue(formatted.includes('...'), 'Should include ellipsis');
    assertTrue(formatted.length < address.length, 'Should be shorter than original');
});
test('formatAddress returns short addresses unchanged', () => {
    const short = '0x1234';
    const formatted = formatAddress(short);
    assertEqual(formatted, short, 'Should return short addresses unchanged');
});
test('formatValue converts wei to ETH', () => {
    const oneEth = 1000000000000000000n;
    const formatted = formatValue(oneEth, 18);
    assertEqual(formatted, '1.000000', 'Should format 1 ETH correctly');
});
test('formatValue handles zero value', () => {
    const zero = 0n;
    const formatted = formatValue(zero, 18);
    assertEqual(formatted, '0.000000', 'Should format zero correctly');
});
test('parseTransactionData parses basic transaction', () => {
    const tx = {
        hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        to: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
        value: 1000000000000000000n,
        gasLimit: 21000n,
        nonce: 0,
        data: '0x',
        status: 1,
    };
    const parsed = parseTransactionData(tx);
    assertEqual(parsed.hash, tx.hash, 'Hash should match');
    assertEqual(parsed.from, tx.from, 'From should match');
    assertEqual(parsed.to, tx.to, 'To should match');
    assertEqual(parsed.value, tx.value, 'Value should match');
    assertEqual(parsed.status, 'success', 'Status should be success');
});
test('parseTransactionData detects failed status', () => {
    const tx = {
        hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        to: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
        value: 0n,
        gasLimit: 100000n,
        nonce: 0,
        data: '0x',
        status: 0,
    };
    const parsed = parseTransactionData(tx);
    assertEqual(parsed.status, 'failed', 'Status should be failed');
});
test('decodeCalldata decodes transfer function', () => {
    const transferCalldata = '0xa9059cbb000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f0beb0000000000000000000000000000000000000000000000056bc75e2d63100000';
    const result = decodeCalldata(transferCalldata, TEST_ABI);
    assertTrue(result !== null, 'Should decode successfully');
    if (result) {
        assertEqual(result.functionName, 'transfer', 'Function name should be transfer');
        assertEqual(result.inputs.length, 2, 'Should have 2 inputs');
    }
});
test('decodeCalldata returns null for empty data', () => {
    const result = decodeCalldata('0x', TEST_ABI);
    assertEqual(result, null, 'Should return null for empty data');
});
console.log('\nDebugger Tests:');
test('createDebugger creates instance', () => {
    const debuggerInstance = createDebugger();
    assertType(debuggerInstance, 'object', 'Should create object');
    assertTrue(debuggerInstance instanceof ContractCallDebugger, 'Should be ContractCallDebugger');
});
test('createSession creates new session', () => {
    const debuggerInstance = createDebugger();
    const sessionId = debuggerInstance.createSession('test_session');
    assertEqual(sessionId, 'test_session', 'Session ID should match');
});
test('createSession generates ID if not provided', () => {
    const debuggerInstance = createDebugger();
    const sessionId = debuggerInstance.createSession();
    assertTrue(sessionId.startsWith('session_'), 'Should generate session ID');
});
test('addTransaction adds transaction to session', () => {
    const debuggerInstance = createDebugger();
    debuggerInstance.createSession();
    const tx = {
        hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        to: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
        value: 0n,
        gasLimit: 100000n,
        nonce: 0,
        data: '0x',
    };
    const parsed = debuggerInstance.addTransaction(tx);
    assertEqual(parsed.hash, tx.hash, 'Transaction hash should match');
});
test('getCurrentSession returns active session', () => {
    const debuggerInstance = createDebugger();
    const sessionId = debuggerInstance.createSession('active_test');
    const session = debuggerInstance.getCurrentSession();
    assertTrue(session !== null, 'Should return session');
    if (session) {
        assertEqual(session.id, sessionId, 'Session ID should match');
    }
});
test('analyzeTransaction analyzes transaction', () => {
    const debuggerInstance = createDebugger();
    const tx = {
        hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        to: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
        value: 0n,
        gasLimit: 100000n,
        nonce: 0,
        data: '0x',
        status: 1,
    };
    const parsed = parseTransactionData(tx);
    const analysis = debuggerInstance.analyzeTransaction(parsed);
    assertType(analysis.riskScore, 'number', 'Risk score should be number');
    assertTrue(analysis.riskScore >= 0, 'Risk score should be non-negative');
    assertTrue(analysis.riskScore <= 100, 'Risk score should be <= 100');
});
test('analyzeTransaction detects failed transactions', () => {
    const debuggerInstance = createDebugger();
    const tx = {
        hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        to: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
        value: 0n,
        gasLimit: 100000n,
        nonce: 0,
        data: '0x',
        status: 0,
    };
    const parsed = parseTransactionData(tx);
    const analysis = debuggerInstance.analyzeTransaction(parsed);
    assertTrue(analysis.issues.length > 0, 'Should detect issues in failed tx');
});
test('detectReentrancyPattern detects reentrancy', () => {
    const debuggerInstance = createDebugger();
    const trace = [
        {
            depth: 0,
            from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
            to: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
            value: 0n,
            input: '0x',
        },
        {
            depth: 1,
            from: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
            to: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
            value: 0n,
            input: '0x',
        },
        {
            depth: 2,
            from: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
            to: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
            value: 0n,
            input: '0x',
        },
    ];
    const result = debuggerInstance.detectReentrancyPattern(trace);
    assertTrue(result.detected, 'Should detect reentrancy');
    assertTrue(result.points.length > 0, 'Should have reentrancy points');
});
test('endSession ends session', () => {
    const debuggerInstance = createDebugger();
    debuggerInstance.createSession('end_test');
    const session = debuggerInstance.endSession();
    assertTrue(session !== null, 'Should return session');
    if (session) {
        assertTrue(session.endTime !== undefined, 'Should have end time');
    }
});
test('clearAllSessions clears all sessions', () => {
    const debuggerInstance = createDebugger();
    debuggerInstance.createSession('session1');
    debuggerInstance.createSession('session2');
    debuggerInstance.clearAllSessions();
    const session = debuggerInstance.getCurrentSession();
    assertEqual(session, null, 'Should have no active session');
});
test('updateConfig updates configuration', () => {
    const debuggerInstance = createDebugger();
    debuggerInstance.updateConfig({ verbose: true, colorize: false });
    const config = debuggerInstance.getConfig();
    assertTrue(config.verbose === true, 'Verbose should be true');
    assertTrue(config.colorize === false, 'Colorize should be false');
});
console.log('\nFormatter Tests:');
test('formatTransaction formats transaction', () => {
    const tx = {
        hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        to: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
        value: 1000000000000000000n,
        gasLimit: 21000n,
        nonce: 0,
        data: '0x',
        status: 'success',
        inputs: [],
    };
    const formatted = formatTransaction(tx);
    assertTrue(formatted.includes('0x1234'), 'Should include hash');
    assertTrue(formatted.includes('0x742d'), 'Should include from address');
    assertTrue(formatted.includes('1.000000'), 'Should include value');
});
test('formatTransactionSummary creates summary', () => {
    const txs = [
        {
            hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
            to: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
            value: 1000000000000000000n,
            gasLimit: 21000n,
            nonce: 0,
            data: '0x',
            status: 'success',
            inputs: [],
        },
        {
            hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
            from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
            to: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
            value: 2000000000000000000n,
            gasLimit: 21000n,
            nonce: 1,
            data: '0x',
            status: 'success',
            inputs: [],
        },
    ];
    const summary = formatTransactionSummary(txs);
    assertTrue(summary.includes('Total Transactions: 2'), 'Should show total');
    assertTrue(summary.includes('Successful: 2'), 'Should show successful');
});
test('createProgressBar creates progress bar', () => {
    const bar = createProgressBar(50, 100, 20);
    assertTrue(bar.includes('50%'), 'Should include percentage');
    assertTrue(bar.includes('(50/100)'), 'Should include counts');
});
console.log('\nUtility Tests:');
test('estimateGasCost calculates cost', () => {
    const gasUsed = 21000n;
    const gasPrice = 20000000000n;
    const result = estimateGasCost(gasUsed, gasPrice, 2000);
    assertTrue(result.costWei > 0n, 'Cost in wei should be positive');
    assertTrue(result.costEth > 0, 'Cost in ETH should be positive');
    assertTrue(result.costUsd > 0, 'Cost in USD should be positive');
});
test('simulateTransactionFailure marks transaction as failed', () => {
    const tx = {
        hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        to: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
        value: 0n,
        gasLimit: 100000n,
        nonce: 0,
        data: '0x',
        status: 'success',
        inputs: [],
    };
    const failed = simulateTransactionFailure('Out of gas', tx);
    assertEqual(failed.status, 'failed', 'Status should be failed');
    assertEqual(failed.error, 'Out of gas', 'Error should match');
});
console.log('\n' + '='.repeat(50));
console.log(`Tests completed: ${testsPassed + testsFailed}`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);
console.log('='.repeat(50));
if (testsFailed > 0) {
    process.exit(1);
}
//# sourceMappingURL=debugger.test.js.map