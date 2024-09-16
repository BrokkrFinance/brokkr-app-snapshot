import { Injectable, Logger } from "@nestjs/common";
import { BlockNumber, Chain, createPublicClient, extractChain, http, PublicClient } from "viem";
import { Memoize } from "typescript-memoize";
import * as chains from "viem/chains";
import { BrokkrSnapshotConfigService } from "../../config/brokkr-snapshot-config.service";
import { ChainId, KnownChainId } from "../../shared/types/chainsIds";

@Injectable()
export class EvmConnectorService {
  public readonly client: PublicClient;
  public readonly wsClient: PublicClient;
  private chain?: Chain;

  constructor(
    private readonly logger: Logger,
    private readonly configService: BrokkrSnapshotConfigService,
  ) {
    this.client = createPublicClient({
      transport: http(this.configService.nodeUrlRpc),
    });
  }

  /**
   * Should be called when constructing this service as provider (useFactory in module)
   */
  public async initialize(): Promise<EvmConnectorService> {
    this.logger.debug("Initializing EvmConnectorService..", EvmConnectorService.name);
    this.chain = await this.getChain();
    this.logger.debug(
      `EvmConnectorService connected to: ${this.chain.name}, with id: ${this.chain.id}`,
      this.initialize.name,
    );
    return this;
  }

  @Memoize()
  public async getBlockTimestamp(blocknumber: BlockNumber): Promise<bigint> {
    const block = await this.client.getBlock({
      blockNumber: blocknumber,
    });

    return block.timestamp * 1000n; // return in millis
  }

  @Memoize()
  public async getChainId(): Promise<ChainId> {
    if (this.chain) {
      return this.chain.id;
    }
    return await this.client.getChainId();
  }

  @Memoize()
  private async getChain(): Promise<Chain> {
    if (this.chain) {
      return this.chain;
    }
    const chainId = await this.getChainId();

    try {
      this.chain = extractChain({
        chains: Object.values(chains),
        id: chainId as KnownChainId,
      });
      return this.chain;
    } catch (error) {
      this.logger.warn(`Chain with id ${chainId} not recognized by viem. Creating custom chain.`);

      // Create a custom chain object
      this.chain = {
        id: chainId,
        name: `Custom Chain ${chainId}`,
        nativeCurrency: { name: "Native Token", symbol: "TOKEN", decimals: 18 },
        rpcUrls: { default: { http: [this.configService.nodeUrlRpc] } },
      };
      return this.chain;
    }
  }
}
