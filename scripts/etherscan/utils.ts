import { EtherscanModuleName } from './types';
import { ActionParamsByModule } from './params';

export const getActionsByModule = (module: EtherscanModuleName): string[] => {
    return Object.keys(ActionParamsByModule[module]);
}