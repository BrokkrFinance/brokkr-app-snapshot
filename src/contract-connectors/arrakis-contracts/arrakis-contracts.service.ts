import { Injectable } from "@nestjs/common";
import { Memoize } from "typescript-memoize";
import { EvmConnectorService } from "../../blockchain-connectors/evm-connector/evm-connector.service";
import { Erc20Service } from "../erc20/erc20.service";
import { Address, getContract, GetContractReturnType, PublicClient } from "viem";
import Big from "big.js";
import { CoingeckoService } from "../../price-oracles/coingecko/coingecko.service";
import { HOUR_IN_MS } from "../../shared/constants";
import { ITokenPair } from "../../shared/models/ITokenPair";
import { BrokkrSnapshotConfigService } from "../../config/brokkr-snapshot-config.service";
import { ArrakisVaultConfig } from "../../shared/class/BrokkrSnapshotConfig";
import { arrakisHelperAbi, arrakisVaultAbi } from "../../abis/abi";

/**
 * Service responsible for connecting to Brokkr Arrakis Smart Contracts
 */
@Injectable()
export class ArrakisContractsService {
  constructor(
    private evmConnector: EvmConnectorService,
    private erc20Service: Erc20Service,
    private coingeckoService: CoingeckoService,
    private configService: BrokkrSnapshotConfigService,
  ) {}

  public async getUsersEquityValuation(
    userAddress: Address,
    vaultAddress: Address,
    blocknumber: number | bigint,
  ): Promise<number> {
    const vaultContract = this.getVaultContract(vaultAddress);
    const vaultConfig = this.configService.getArrakisVaultConfig(vaultAddress);

    const [[holdings, vaultTokenSupply], vaultTokenDecimals] = await Promise.all([
      await this.evmConnector.client.multicall({
        blockNumber: BigInt(blocknumber),
        allowFailure: false,
        contracts: [
          {
            ...vaultContract,
            functionName: "balanceOf",
            args: [userAddress],
          },
          {
            ...vaultContract,
            functionName: "totalSupply",
          },
        ],
        multicallAddress: this.configService.multicallV3Address,
      }),
      this.getVaultTokenDecimals(vaultAddress),
    ]);

    const tvlUsd = await this.getTvlUsd(vaultConfig, blocknumber);

    const tokenPrice = Big(tvlUsd).div(Big(vaultTokenSupply.toString()).div(10 ** vaultTokenDecimals));
    const tokenHoldings = Big(holdings.toString()).div(10 ** vaultTokenDecimals);

    return tokenHoldings.mul(tokenPrice).toNumber();
  }

  public async getUsersTokenAmount(
    userAddress: Address,
    vaultAddress: Address,
    blocknumber: number | bigint,
  ): Promise<number> {
    const vaultContract = this.getVaultContract(vaultAddress);

    const [holdings, vaultTokenDecimals] = await Promise.all([
      vaultContract.read.balanceOf([userAddress], { blockNumber: BigInt(blocknumber) }),
      this.getVaultTokenDecimals(vaultAddress),
    ]);

    return Big(holdings.toString())
      .div(10 ** vaultTokenDecimals)
      .toNumber();
  }

  public async getUsersToken0AndToken1Share(
    userAddress: Address,
    vaultAddress: Address,
    blocknumber: number | bigint,
  ): Promise<[number, number]> {
    const userHoldings = await this.getUsersTokenAmount(userAddress, vaultAddress, blocknumber);
    const totalSupply = await this.getVaultTokenSupply(vaultAddress, blocknumber);
    const vaultTokenDecimals = await this.getVaultTokenDecimals(vaultAddress);

    const totalSupplyWithDecimals = Big(totalSupply.toString())
      .div(10 ** vaultTokenDecimals)
      .toNumber();

    const share = userHoldings / totalSupplyWithDecimals;

    const underlyingTokenHoldings = await this.getUnderlyingTokenHoldings(vaultAddress, blocknumber);

    const token0Share = Number(underlyingTokenHoldings[0]) * share;
    const token1Share = Number(underlyingTokenHoldings[1]) * share;

    return [token0Share, token1Share];
  }

  @Memoize({
    expiring: HOUR_IN_MS,
    hashFunction: (v: ArrakisVaultConfig, t: number, b: number) => v.address + t + b,
  })
  public async getTvlUsd(vault: ArrakisVaultConfig, blockNumber: number | bigint): Promise<number> {
    const blockTimestamp = await this.evmConnector.getBlockTimestamp(BigInt(blockNumber));

    const [[holdings0, holdings1], t0Price, t1Price] = await Promise.all([
      this.getUnderlyingTokenHoldings(vault.address, Number(blockNumber)),
      this.coingeckoService.getTokenUsdPrice(vault.token0CoingeckoName, Number(blockTimestamp)),
      this.coingeckoService.getTokenUsdPrice(vault.token1CoingeckoName, Number(blockTimestamp)),
    ]);

    return holdings0
      .mul(Big(t0Price))
      .plus(holdings1.mul(Big(t1Price)))
      .toNumber();
  }

  /**
   * Fetch underlying token holdings of arrakis vault
   * @param vault - Arrakis vault config
   * @param arrakisHelperAddress - Arrakis vault address
   * @param blockNumber - Block number to be queried for underlying token holdings
   * @return Normalised amounts of token0 and token1 (divided by their decimal precision)
   */
  @Memoize({
    expiring: HOUR_IN_MS,
    hashFunction: (v: Address, b: number) => v + b,
  })
  public async getUnderlyingTokenHoldings(vaultAddress: Address, blockNumber: number | bigint): Promise<[Big, Big]> {
    const helperContract = this.getArrakisHelperContract();
    const tokenPair: ITokenPair = await this.getTokens(vaultAddress);

    const holding = await helperContract.read.totalUnderlying([vaultAddress], {
      blockNumber: BigInt(blockNumber),
    });

    return [
      Big(holding[0].toString()).div(Math.pow(10, tokenPair.token0.decimals)),
      Big(holding[1].toString()).div(Math.pow(10, tokenPair.token1.decimals)),
    ];
  }

  /**
   * @description Fetch token0 and token1 assigned to the Arrakis Vault
   * @param vaultAddress - Arrakis Vault address
   */
  @Memoize()
  public async getTokens(vaultAddress: Address): Promise<ITokenPair> {
    const vaultContract = this.getVaultContract(vaultAddress);

    const [t0Address, t1Address] = await Promise.all([
      await vaultContract.read.token0(),
      await vaultContract.read.token1(),
    ]);

    return this.erc20Service.getErc20Tokens(t0Address, t1Address);
  }

  @Memoize({
    expiring: HOUR_IN_MS,
    hashFunction: (addr: string, t: number) => addr + t,
  })
  public async getVaultTokenSupply(vaultAddress: string, blockNumber: number | bigint) {
    const vaultContract = this.getVaultContract(vaultAddress as Address);

    const [vaultTokenSupply, vaultTokenDecimals] = await Promise.all([
      vaultContract.read.totalSupply({ blockNumber: BigInt(blockNumber) }),
      this.getVaultTokenDecimals(vaultAddress as Address),
    ]);

    return Big(vaultTokenSupply.toString()).div(10 ** vaultTokenDecimals);
  }

  @Memoize()
  public async getName(vaultAddress: Address): Promise<string> {
    return await this.getVaultContract(vaultAddress).read.name();
  }

  public async getToken0Price(vault: ArrakisVaultConfig, blockNumber: number | bigint) {
    const blockTimestamp = await this.evmConnector.getBlockTimestamp(BigInt(blockNumber));
    return await this.coingeckoService.getTokenUsdPrice(vault.token0CoingeckoName, Number(blockTimestamp));
  }

  public async getToken1Price(vault: ArrakisVaultConfig, blockNumber: number | bigint) {
    const blockTimestamp = await this.evmConnector.getBlockTimestamp(BigInt(blockNumber));
    return await this.coingeckoService.getTokenUsdPrice(vault.token1CoingeckoName, Number(blockTimestamp));
  }

  @Memoize()
  private async getVaultTokenDecimals(vaultAddress: Address): Promise<number> {
    return this.getVaultContract(vaultAddress).read.decimals();
  }

  /**
   * Construct Arrakis Vault Viem Contract instance
   * @param vaultAddress - Arrakis Vault address
   * @private
   */
  @Memoize()
  private getVaultContract(vaultAddress: Address): GetContractReturnType<typeof arrakisVaultAbi, PublicClient> {
    return getContract({
      address: vaultAddress,
      abi: arrakisVaultAbi,
      client: this.evmConnector.client,
    });
  }

  /**
   * Construct Arrakis Helper Viem Contract instance
   * @param arrakisHelperAddress - Arrakis Helper address
   * @private
   */
  @Memoize()
  private getArrakisHelperContract(): GetContractReturnType<typeof arrakisHelperAbi, PublicClient> {
    return getContract({
      address: this.configService.arrakisHelperAddress,
      abi: arrakisHelperAbi,
      client: this.evmConnector.client,
    });
  }
}
