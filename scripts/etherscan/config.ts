import { EtherscanConfig, ETHEREUM_NETWORK } from './types';

const ETHERSCAN_URL_CONFIG: EtherscanConfig = {
  'mainnet': {
    API_BASE_URL: 'https://api.etherscan.io/api',
  },
  'goerli': {
    API_BASE_URL: 'https://api-goerli.etherscan.io/api',
  },
  'sepolia': {
    API_BASE_URL: 'https://api-sepolia.etherscan.io/api',
  },
};

export const ETHERSCAN_API_KEY = process.env['ETHERSCAN_API_KEY'] || "NYUA39QGEIHHH3VNB3DK4UFYX1NP3FTW3E"

export function getEtherScanAPIBaseURL(network: ETHEREUM_NETWORK): string {
  return ETHERSCAN_URL_CONFIG[network]?.API_BASE_URL || ETHERSCAN_URL_CONFIG['mainnet'].API_BASE_URL;
}