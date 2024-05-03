export type EtherscanModuleName = 
  'account' | 
  'contract' | 
  'transaction' | 
  'block' | 
  'logs' | 
  'gethParityProxy' |
  'token' |
  'proxy' | // Geth/Parity Proxy
  'stats' | // Tokens, Stats
  'gastracker'

export type EtherscanModuleParams = {
    [action: string]: {
        params: string[];  // List of required parameter names for each action
    };
}

export type ETHEREUM_NETWORK = 'mainnet' | 'goerli' | 'sepolia';

export interface EtherscanConfig {
    [key: string]: {
        API_BASE_URL: string;
    };
}

export interface EtherscanUrlConfig {
    network: ETHEREUM_NETWORK;
    module: EtherscanModuleName;  // Ensures only valid module names can be used
    action: string;
    params: { [key: string]: any };  // Loose type here, but ideally should match exact required params
    apiKey: string;
}