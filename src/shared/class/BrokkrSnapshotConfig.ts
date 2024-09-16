import {
  IsArray,
  IsDefined,
  IsEnum,
  IsEthereumAddress,
  IsNotEmpty,
  IsObject,
  IsString,
  IsUrl,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { MongoConfig } from "./MongoConfig";
import { Transform, Type } from "class-transformer";
import { Address } from "viem";
import { EnvType } from "../enum/EnvType";

export class ArrakisVaultConfig {
  @Transform(({ value }) => value.toLowerCase() as Address, {
    toClassOnly: true,
  })
  @IsEthereumAddress()
  address: Address;

  @IsString()
  @IsNotEmpty()
  token0CoingeckoName: string;

  @IsString()
  @IsNotEmpty()
  token1CoingeckoName: string;

  constructor(address: Address, token0CoingeckoName: string, token1CoingeckoName: string) {
    this.address = address;
    this.token0CoingeckoName = token0CoingeckoName;
    this.token1CoingeckoName = token1CoingeckoName;
  }
}

export class TokenConfig {
  @Transform(({ value }) => value.toLowerCase() as Address, {
    toClassOnly: true,
  })
  @IsEthereumAddress()
  address: Address;

  @IsString()
  @IsNotEmpty()
  coingeckoId: string;

  constructor(address: Address, coingeckoId: string) {
    this.address = address;
    this.coingeckoId = coingeckoId;
  }
}

export class TokenIndexConfig {
  @Transform(({ value }) => value.toLowerCase() as Address, {
    toClassOnly: true,
  })
  @IsEthereumAddress()
  address: Address;

  constructor(address: Address) {
    this.address = address;
  }
}

export class PortfolioConfig {
  @Transform(({ value }) => value.toLowerCase() as Address, {
    toClassOnly: true,
  })
  @IsEthereumAddress()
  address: Address;

  constructor(address: Address) {
    this.address = address;
  }
}

export class DcaPortfolioConfig extends PortfolioConfig {
  @IsString()
  @IsNotEmpty()
  bluechipTokenCoingeckoId: string;

  constructor(address: Address, bluechipTokenCoingeckoId: string) {
    super(address);
    this.bluechipTokenCoingeckoId = bluechipTokenCoingeckoId;
  }
}

export class DnsVaultConfig {
  @Transform(({ value }) => value.toLowerCase(), { toClassOnly: true })
  @IsString()
  @IsNotEmpty()
  @IsEthereumAddress()
  address: Address;

  @IsString()
  @IsNotEmpty()
  token0CoingeckoName: string;

  @IsString()
  @IsNotEmpty()
  token1CoingeckoName: string;

  constructor(address: Address, token0CoingeckoName: string, token1CoingeckoName: string) {
    this.address = address;
    this.token0CoingeckoName = token0CoingeckoName;
    this.token1CoingeckoName = token1CoingeckoName;
  }
}

export class BrokkrSnapshotConfig {
  @IsEnum(EnvType)
  env: EnvType;

  @IsString()
  @IsNotEmpty()
  coingeckoApiKey: string;

  @IsNotEmpty()
  @IsEthereumAddress()
  @Transform(({ value }) => value as Address)
  multicallV3Address: Address;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PortfolioConfig)
  tokenBasedPortfolios: PortfolioConfig[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TokenIndexConfig)
  tokenIndexPortfolios: TokenIndexConfig[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DcaPortfolioConfig)
  dcaPortfolios: DcaPortfolioConfig[];

  @IsUrl()
  @IsNotEmpty()
  nodeUrlRpc: string;

  @IsObject()
  @IsDefined()
  @Type(() => MongoConfig)
  mongoConfig: MongoConfig;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ArrakisVaultConfig)
  arrakisVaults: ArrakisVaultConfig[];

  @ValidateIf((o) => o.arrakisVaults && o.arrakisVaults.length > 0)
  @IsString()
  @IsEthereumAddress({ each: true })
  arrakisHelperAddress: string;

  constructor(
    env: EnvType,
    tokenBasedPortfolios: PortfolioConfig[],
    tokenIndexPortfolios: TokenIndexConfig[],
    dcaPortfolios: DcaPortfolioConfig[],
    nodeUrlRpc: string,
    mongoConfig: MongoConfig,
    arrakisVaults: ArrakisVaultConfig[],
    arrakisHelperAddress: string,
  ) {
    this.tokenBasedPortfolios = tokenBasedPortfolios;
    this.tokenIndexPortfolios = tokenIndexPortfolios;
    this.dcaPortfolios = dcaPortfolios;
    this.nodeUrlRpc = nodeUrlRpc;
    this.mongoConfig = mongoConfig;
    this.arrakisVaults = arrakisVaults;
    this.arrakisHelperAddress = arrakisHelperAddress;
  }
}
