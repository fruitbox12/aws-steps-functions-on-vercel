import { EtherscanModuleName, EtherscanModuleParams } from './types';

export const ActionParamsByModule: { [module in EtherscanModuleName]: EtherscanModuleParams } = {
    account: {
        balance: { params: ["address"] },
        balancemulti: { params: ["address"] },
        txlist: { params: ["address"] },
        txlistinternal: { params: ["address", "startblock", "endblock"] },
        tokentx: { params: ["address", "contractaddress"] },
        tokennfttx: { params: ["address", "contractaddress"] },
        token1155tx: { params: ["address", "contractaddress"] },
        getminedblocks: { params: ["address"] },
        beaconchainwithdrawal: { params: ["address"] },
        balancehistory: { params: ["address", "blockno"] }
    },
    contract: {
        getabi: { params: ["address"] },
        getsourcecode: { params: ["address"] }
        // ....
    },
    transaction: { /* actions and params */ },
    block: { /* actions and params */ },
    logs: { /* actions and params */ },
    gethParityProxy: { /* actions and params */ },
    token: { /* actions and params */ },
    gastracker: { /* actions and params */ },
    stats: { /* actions and params */ },
    proxy: { /* actions and params */ }
};

// TODO: Add additional modules, actions and params
// NOTE: Modules to be added:
// 1. Contracts: https://docs.etherscan.io/api-endpoints/contracts
// 2. Transactions: https://docs.etherscan.io/api-endpoints/stats
// 3. Blocks: https://docs.etherscan.io/api-endpoints/blocks
// 4. Logs: https://docs.etherscan.io/api-endpoints/logs
// 5. Geth/Parity Proxy: https://docs.etherscan.io/api-endpoints/geth-parity-proxy
// 6. Tokens: https://docs.etherscan.io/api-endpoints/tokens
// 7. Gas Tracker: https://docs.etherscan.io/api-endpoints/gas-tracker
// 8. Stats: https://docs.etherscan.io/api-endpoints/stats-1