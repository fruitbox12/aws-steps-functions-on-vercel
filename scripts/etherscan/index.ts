import { EtherscanUrlConfig } from './types'
import { buildEtherscanAPIUrl } from './url';
import { ETHERSCAN_API_KEY } from './config';
import { get } from './axios';

async function main() {
    try {
        const balance: EtherscanUrlConfig = {
            network: 'mainnet',
            module: 'account',
            action: 'balance',
            params: { address: '0x889df4Cfe3f6e77ACF009ED76B733f808077A0A3' },
            apiKey: ETHERSCAN_API_KEY  // Ensure this key is secure and ideally loaded from environment variables or config
        };

        const txlist: EtherscanUrlConfig = {
            network: 'mainnet',
            module: 'account',
            action: 'txlist',
            params: { address: '0x889df4Cfe3f6e77ACF009ED76B733f808077A0A3' },
            apiKey: ETHERSCAN_API_KEY  // Ensure this key is secure and ideally loaded from environment variables or config
        };
        
        const balanceUrl = buildEtherscanAPIUrl(balance);
        const txListUrl = buildEtherscanAPIUrl(txlist);

        const getBalance = get(balanceUrl);
        const getTxList = get(txListUrl);
        
        console.log(await getBalance);
        console.log(await getTxList);
    } catch (error) {
        console.error(error);
    }
}

main()