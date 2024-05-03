// buildEtherscanAPIUrl.ts
import { EtherscanUrlConfig } from './types'; // Assuming types.ts exists and exports EtherscanConfig
import { getEtherScanAPIBaseURL } from './config';
import { ActionParamsByModule } from './params';

export function buildEtherscanAPIUrl(config: EtherscanUrlConfig): string {
  const baseUrl = getEtherScanAPIBaseURL(config.network);
  const queryParams = new URLSearchParams({
      module: config.module,
      action: config.action,
      apikey: config.apiKey
  });

  const requiredParams = ActionParamsByModule[config.module][config.action].params;
  requiredParams.forEach(param => {
      if (!(param in config.params)) {
          throw new Error(`Missing ${config.action} action mandatory parameter for: ${param}`);
      }
      queryParams.append(param, config.params[param]);
  });

  return `${baseUrl}?${queryParams.toString()}`;
}
