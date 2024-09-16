import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Address } from "viem";
import { EnvType } from "../shared/enum/EnvType";
import {
  ArrakisVaultConfig,
  BrokkrSnapshotConfig,
  DcaPortfolioConfig,
  PortfolioConfig,
  TokenIndexConfig,
} from "../shared/class/BrokkrSnapshotConfig";
import { MongoConfig } from "../shared/class/MongoConfig";

@Injectable()
export class BrokkrSnapshotConfigService {
  private readonly _config: BrokkrSnapshotConfig;

  constructor(
    private configService: ConfigService,
    private readonly logger: Logger,
  ) {
    const config = this.configService.get<BrokkrSnapshotConfig>("config");

    if (!config) throw new Error("this.configService.get<IConfig>(config); is UNDEFINED!!!");

    this._config = config;

    this.logger.warn(`Starting up with the following configuration:\n ${JSON.stringify(this.config, null, 2)}`);
  }

  public isTest(): boolean {
    return this._config.env === EnvType.TEST;
  }

  get arrakisHelperAddress(): Address {
    return this._config.arrakisHelperAddress as Address;
  }

  get multicallV3Address(): Address {
    return this._config.multicallV3Address;
  }

  get coingeckoApiKey(): string {
    return this._config.coingeckoApiKey;
  }

  get mongoConfig(): MongoConfig {
    return this._config.mongoConfig;
  }

  get nodeUrlRpc(): string {
    return this._config.nodeUrlRpc;
  }

  get config(): BrokkrSnapshotConfig {
    return this._config;
  }

  get allPortfolioAddresses(): Address[] {
    return [
      ...this.tokenBasedPortfolioAddresses,
      ...this.dcaPortfolioAddresses,
      ...this.tokenIndexPortfolioAddresses,
      ...this.arrakisVaultsAddresses,
    ];
  }

  getArrakisVaultToken0CoingeckoId(vault: Address): string {
    const coingeckoId = this.config.arrakisVaults.find(
      (v) => v.address.toLowerCase() == vault.toLowerCase(),
    )?.token0CoingeckoName;

    if (!coingeckoId) {
      throw new Error(
        `Unable to find token0 coingecko id for vault=${vault}. Make sure token0CoingeckoName is added in config!`,
      );
    }

    return coingeckoId;
  }

  getArrakisVaultToken1CoingeckoId(vault: Address): string {
    const coingeckoId = this.config.arrakisVaults.find(
      (v) => v.address.toLowerCase() == vault.toLowerCase(),
    )?.token1CoingeckoName;

    if (!coingeckoId) {
      throw new Error(
        `Unable to find token1 coingecko id for vault=${vault}. Make sure token1CoingeckoName is added in config!`,
      );
    }

    return coingeckoId;
  }

  getDcaBlueChipTokenCoingeckoId(portfolio: Address | string): string {
    const coingeckoId = this.config.dcaPortfolios.find(
      (v) => v.address.toLowerCase() == portfolio.toLowerCase(),
    )?.bluechipTokenCoingeckoId;

    if (!coingeckoId) {
      throw new Error(
        `Unable to find bluechip token coingecko id for dca portfolio=${portfolio}. Make sure bluechipTokenCoingeckoId is added in config!`,
      );
    }

    return coingeckoId;
  }

  get tokenBasedPortfolioConfigs(): PortfolioConfig[] {
    return this.config.tokenBasedPortfolios;
  }

  get dcaPortfolioConfigs(): DcaPortfolioConfig[] {
    return this.config.dcaPortfolios;
  }

  get tokenIndexPortfolioConfigs(): TokenIndexConfig[] {
    return this.config.tokenIndexPortfolios;
  }

  get arrakisVaultConfigs(): ArrakisVaultConfig[] {
    return this.config.arrakisVaults;
  }

  getArrakisVaultConfig(vaultAddress: string | Address): ArrakisVaultConfig {
    const config = this.arrakisVaultConfigs.find((v) => v.address.toLowerCase() == vaultAddress.toLowerCase());

    if (!config) {
      throw new Error(`ArrakisVaultConfig not found for vaultAddress=${vaultAddress}, make sure it is added in env!`);
    }

    return config;
  }

  get tokenBasedPortfolioAddresses(): Address[] {
    return this.config.tokenBasedPortfolios.map((v) => v.address);
  }

  get dcaPortfolioAddresses(): Address[] {
    return this.config.dcaPortfolios.map((v) => v.address);
  }

  get tokenIndexPortfolioAddresses(): Address[] {
    return this.config.tokenIndexPortfolios.map((v) => v.address);
  }

  get arrakisVaultsAddresses(): Address[] {
    return this.config.arrakisVaults.map((v) => v.address);
  }
}
