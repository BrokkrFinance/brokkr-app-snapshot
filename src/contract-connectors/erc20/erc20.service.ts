import { Injectable, Logger } from "@nestjs/common";
import { EvmConnectorService } from "../../blockchain-connectors/evm-connector/evm-connector.service";
import { Address, getContract, GetContractReturnType, PublicClient } from "viem";
import { erc20Abi } from "viem";
import { Memoize, MemoizeExpiring } from "typescript-memoize";
import { HOUR_IN_MS, NATIVE_TOKEN_CONTRACT_ADDRESS } from "../../shared/constants";
import { ITokenPair } from "../../shared/models/ITokenPair";
import { BrokkrSnapshotConfigService } from "../../config/brokkr-snapshot-config.service";

@Injectable()
export class Erc20Service {
  constructor(
    private readonly logger: Logger,
    private readonly evmConnector: EvmConnectorService,
    private configService: BrokkrSnapshotConfigService,
  ) {}

  /**
   * @description Fetch token0 and token1 assigned to the Arrakis Vault
   * @param t0Address
   * @param t1Address
   */
  @Memoize({
    hashFunction: (t0Address, t1Address) => t0Address + t1Address,
  })
  public async getErc20Tokens(t0Address: Address, t1Address: Address): Promise<ITokenPair> {
    const [t0Symbol, t1Symbol, t0Decimals, t1Decimals] = await this.evmConnector.client.multicall({
      allowFailure: false,
      contracts: [
        {
          ...this.getErc20Contract(t0Address),
          functionName: "symbol",
        },
        {
          ...this.getErc20Contract(t1Address),
          functionName: "symbol",
        },
        {
          ...this.getErc20Contract(t0Address),
          functionName: "decimals",
        },
        {
          ...this.getErc20Contract(t1Address),
          functionName: "decimals",
        },
      ],
      multicallAddress: this.configService.multicallV3Address,
    });

    return {
      token0: { address: t0Address, ticker: t0Symbol, decimals: t0Decimals },
      token1: { address: t1Address, ticker: t1Symbol, decimals: t1Decimals },
    };
  }

  @Memoize()
  public async getTokenSymbol(tokenAddress: Address): Promise<Address> {
    const contract = this.getErc20Contract(tokenAddress);

    return (await contract.read.symbol()) as Address;
  }

  @MemoizeExpiring(HOUR_IN_MS, (userAddress: string, token: string, blocknumber: number | bigint) => {
    return userAddress + token + blocknumber.toString();
  })
  public async getBalanceOfAtBlockNumber(
    userAddress: Address,
    tokenAddress: Address,
    blockNumber: bigint,
  ): Promise<bigint> {
    const contract = this.getErc20Contract(tokenAddress);

    return contract.read.balanceOf([userAddress], { blockNumber });
  }

  @Memoize()
  public async getErc20TokenDecimals(tokenAddress: Address): Promise<number> {
    // handle native token
    if (tokenAddress.toLowerCase() == NATIVE_TOKEN_CONTRACT_ADDRESS) {
      return 18;
    }

    try {
      const contract = getContract({
        address: tokenAddress,
        abi: erc20Abi,
        client: this.evmConnector.client,
      });

      return contract.read.decimals();
    } catch (e: unknown) {
      this.logger.error(`Can't get decimals for a token ${tokenAddress}`);
      throw new Error(`Can't get decimals for a token ${tokenAddress}`);
    }
  }

  @Memoize()
  public getErc20Contract(tokenAddress: Address): GetContractReturnType<typeof erc20Abi, PublicClient> {
    return getContract({
      address: tokenAddress,
      abi: erc20Abi,
      client: this.evmConnector.client,
    });
  }
}
