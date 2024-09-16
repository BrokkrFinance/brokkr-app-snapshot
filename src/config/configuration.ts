import "dotenv-flow/config";
import { registerAs } from "@nestjs/config";
import { BrokkrSnapshotConfig } from "../shared/class/BrokkrSnapshotConfig";
import { EnvType } from "../shared/enum/EnvType";
import { ConfigUtils } from "../shared/utils/config-utils";
import { validateUtil } from "../shared/utils/validate-util";

// define ENV and LOG_LEVEL globally to be consumed at any time (even before app bootstrap)
export const ENV: EnvType = ConfigUtils.loadEnvFileName(process.env.NODE_ENV);
export const LOG_LEVEL = ConfigUtils.loadLogLevelEnv(process.env.LOG_LEVEL);

const config: Record<string, unknown> = {
  env: ENV,
  coingeckoApiKey: process.env.COINGECKO_API_KEY,
  multicallV3Address: process.env.MULTICALL_V3_ADDRESS,
  tokenBasedPortfolios: ConfigUtils.loadEnvStringArray(process.env.TOKEN_BASED_PORTFOLIOS),
  tokenIndexPortfolios: ConfigUtils.loadEnvStringArray(process.env.TOKEN_INDEX_PORTFOLIOS),
  dcaPortfolios: ConfigUtils.loadEnvStringArray(process.env.DCA_PORTFOLIOS),
  nodeUrlRpc: process.env.NODE_URL_RPC,
  mongoConfig: JSON.parse(process.env.MONGO_CONFIG ?? ""),
  arrakisVaults: JSON.parse(process.env.ARRAKIS_VAULTS ?? ""),
  arrakisHelperAddress: process.env.ARRAKIS_HELPER_ADDRESS,
};

export default registerAs("config", () => {
  return validateUtil(config, BrokkrSnapshotConfig);
});
