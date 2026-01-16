# Contract Call Debugger

A TypeScript-based debugger for smart contract interactions and calls. This tool helps developers analyze, trace, and debug Ethereum smart contract transactions with detailed insights into function calls, gas usage, and potential issues.

## Features

- **Transaction Parsing**: Decode calldata and extract function calls from raw transaction data
- **Call Trace Analysis**: Visualize nested contract calls and detect reentrancy patterns
- **Risk Analysis**: Automatic detection of potential issues and warnings in transactions
- **Gas Analysis**: Detailed gas cost breakdown and estimation
- **Session Management**: Group related transactions into debug sessions
- **Formatted Output**: Human-readable transaction summaries with optional colorization
- **ABI Support**: Decode function parameters using contract ABIs

## Installation

```bash
# Clone or navigate to the project directory
cd contract-call-debugger

# Install dependencies
npm install

# Build the project
npm run build
```

## Usage

### Running the Demo

```bash
npm start
# or
node dist/index.js --demo
```

### Programmatic Usage

```typescript
import { createDebugger, parseTransactionData, formatTransaction } from 'contract-call-debugger';

// Create a debugger instance
const debugger = createDebugger({
  colorize: true,
  verbose: false,
});

// Create a session for grouping transactions
const sessionId = debugger.createSession('my-session');

// Add a transaction to debug
const tx = {
  hash: '0x1234...',
  from: '0xsender...',
  to: '0xcontract...',
  value: 1000000000000000000n,
  gasLimit: 100000n,
  gasPrice: 20000000000n,
  nonce: 0,
  data: '0xa9059cbb...',
  status: 1,
};

const parsed = debugger.addTransaction(tx);

// Analyze the transaction
const analysis = debugger.analyzeTransaction(parsed);
console.log(`Risk Score: ${analysis.riskScore}/100`);

// Format and display the transaction
console.log(debugger.formatTransaction(parsed));

// End the session
debugger.endSession();
```

### Using the CLI Helper

```typescript
import { createCLI } from 'contract-call-debugger';

const cli = createCLI({ colorize: true });

// Debug a single transaction
const output = cli.debugTransaction(tx);
console.log(output);

// Debug multiple transactions with summary
const output = cli.debugMultipleTransactions([tx1, tx2, tx3]);
console.log(output);
```

### Decoding Calldata with ABI

```typescript
import { decodeCalldata } from 'contract-call-debugger';

const abi = [
  {
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

const calldata = '0xa9059cbb...';
const decoded = decodeCalldata(calldata, abi);

if (decoded) {
  console.log(`Function: ${decoded.functionName}`);
  console.log('Inputs:', decoded.inputs);
}
```

### Detecting Reentrancy Patterns

```typescript
import { createDebugger } from 'contract-call-debugger';

const debugger = createDebugger();

const callTrace = [
  {
    depth: 0,
    from: '0xuser...',
    to: '0xcontract...',
    value: 0n,
    input: '0x...',
  },
  {
    depth: 1,
    from: '0xcontract...',
    to: '0xtoken...',
    value: 0n,
    input: '0x...',
  },
  {
    depth: 2,
    from: '0xtoken...',
    to: '0xcontract...',  // Reentrancy point!
    value: 0n,
    input: '0x...',
  },
];

const result = debugger.detectReentrancyPattern(callTrace);
console.log(`Reentrancy detected: ${result.detected}`);
```

## How It Works

### Transaction Parsing

The debugger parses raw transaction data by:

1. Extracting the function selector (first 4 bytes of calldata)
2. Matching the selector against provided ABI definitions
3. Decoding function parameters based on their types
4. Formatting values for human readability

### Call Trace Analysis

Call traces represent the execution flow of nested contract calls. The debugger:

1. Tracks call depth and addresses involved
2. Identifies reentrancy patterns (same address called multiple times)
3. Detects errors at each call level
4. Visualizes the call hierarchy

### Risk Analysis

Each transaction is analyzed for potential issues:

- **Failed transactions**: Flagged as high severity
- **High gas limits**: Warned if exceeding thresholds
- **Unknown function calls**: Noted when ABI decoding fails
- **Large value transfers**: Informational alerts

### Session Management

Sessions allow grouping related transactions for batch analysis:

- Create sessions with custom or auto-generated IDs
- Add multiple transactions to a session
- Analyze all transactions in a session together
- Generate summary reports

## Project Structure

```
contract-call-debugger/
├── src/
│   ├── index.ts              # Main entry point and CLI
│   ├── debugger.ts           # Core debugger class
│   ├── transaction-parser.ts # Transaction parsing utilities
│   └── formatter.ts          # Output formatting utilities
├── tests/
│   └── debugger.test.ts      # Test suite
├── package.json
├── tsconfig.json
└── README.md
```

## API Reference

### ContractCallDebugger

Main debugger class with the following methods:

| Method | Description |
|--------|-------------|
| `createSession(id?)` | Create a new debug session |
| `getCurrentSession()` | Get the active session |
| `addTransaction(tx)` | Add a transaction to a session |
| `addCallTrace(trace)` | Add a call trace to a session |
| `analyzeTransaction(tx)` | Analyze a single transaction |
| `analyzeSession()` | Analyze all transactions in a session |
| `detectReentrancyPattern(trace)` | Detect reentrancy in call trace |
| `formatTransaction(tx)` | Format transaction for display |
| `formatSession()` | Format entire session for display |
| `endSession()` | End the current session |

### Utility Functions

| Function | Description |
|----------|-------------|
| `parseTransactionData(tx, abi?)` | Parse raw transaction data |
| `decodeCalldata(data, abi)` | Decode calldata using ABI |
| `formatAddress(address)` | Truncate address for display |
| `formatValue(value, decimals)` | Convert wei to ETH |
| `estimateGasCost(gasUsed, gasPrice, ethPrice)` | Calculate gas costs |

## Running Tests

```bash
# Run tests directly with ts-node
npm test

# Or build and run compiled tests
npm run build
npm run test:compiled
```

## Configuration Options

```typescript
interface DebuggerConfig {
  rpcUrl?: string;           // Optional RPC URL for fetching data
  abi?: ContractABI[];       // Contract ABI for decoding
  showHash?: boolean;        // Show transaction hash in output
  showTimestamp?: boolean;   // Show timestamp in output
  showGasDetails?: boolean;  // Show gas details in output
  colorize?: boolean;        // Enable colored output
  verbose?: boolean;         // Enable verbose output
}
```

## License

MIT
