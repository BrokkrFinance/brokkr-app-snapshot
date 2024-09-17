import { Address } from "viem";
import { ArrakisVaultSnapshot, MultiTokenHoldingData, SnapshotData } from "../../shared/models/ISnapshot";
import { VaultDbService } from "../../db/vault-db/vault-db.service";
import { Injectable, Logger } from "@nestjs/common";
import { ArrakisContractsService } from "../../contract-connectors/arrakis-contracts/arrakis-contracts.service";
import { BrokkrSnapshotConfigService } from "../../config/brokkr-snapshot-config.service";
import addressesData from "../addresses.json";
import { AddressEntry } from "../../shared/types/addressEntry";

@Injectable()
export class ArrakisVaultSnapshotService {
  private additionalUserAddresses: AddressEntry[] = addressesData;

  constructor(
    private arrakisVaultDbService: VaultDbService,
    private arrakisVaultContractService: ArrakisContractsService,
    private configService: BrokkrSnapshotConfigService,
    private logger: Logger,
  ) {}

  async getSnapshot(snapshotBlock: number, usdThreshold: number): Promise<ArrakisVaultSnapshot> {
    const arrakisVaultConfigs = this.configService.arrakisVaultConfigs;
    const arrakisVaultSnapshot: SnapshotData<MultiTokenHoldingData>[] = [];

    for (const arrakisVaultConfig of arrakisVaultConfigs) {
      this.logger.debug(`Starting Arrakis Vault snapshot for address: ${arrakisVaultConfig.address}`);
      try {
        const [tvlUsd, tokenName, totalTokenSupply, tokenPair, userAddressesFromDb, token0Price, token1Price] =
          await Promise.all([
            this.arrakisVaultContractService.getTvlUsd(arrakisVaultConfig, snapshotBlock),
            this.arrakisVaultContractService.getName(arrakisVaultConfig.address),
            this.arrakisVaultContractService.getVaultTokenSupply(arrakisVaultConfig.address, snapshotBlock),
            this.arrakisVaultContractService.getTokens(arrakisVaultConfig.address),
            this.arrakisVaultDbService.getUniqueUserAddressesByPortfolio(arrakisVaultConfig.address),
            this.arrakisVaultContractService.getToken0Price(arrakisVaultConfig, Number(snapshotBlock)),
            this.arrakisVaultContractService.getToken1Price(arrakisVaultConfig, Number(snapshotBlock)),
          ]);

        // Find additional user addresses from addresses.json based on matching productAddress
        const additionalEntry = this.additionalUserAddresses.find(
          (entry) => entry.productAddress.toLowerCase() === arrakisVaultConfig.address.toLowerCase(),
        );

        // Merge user addresses from DB and JSON
        let userAddresses: string[] = [...userAddressesFromDb];
        if (additionalEntry) {
          userAddresses = [...userAddresses, ...additionalEntry.userAddresses];
          this.logger.debug(
            `Added ${additionalEntry.userAddresses.length} userAddresses from addresses.json for productAddress: ${arrakisVaultConfig.address}`,
          );
        }

        const holdingData: MultiTokenHoldingData[] = [];
        for (const userAddress of userAddresses) {
          try {
            const [tokenAmount, usdEquivalent, token0Andtoken1Share] = await Promise.all([
              this.arrakisVaultContractService.getUsersTokenAmount(
                userAddress as Address,
                arrakisVaultConfig.address,
                snapshotBlock,
              ),
              this.arrakisVaultContractService.getUsersEquityValuation(
                userAddress as Address,
                arrakisVaultConfig.address,
                snapshotBlock,
              ),
              this.arrakisVaultContractService.getUsersToken0AndToken1Share(
                userAddress as Address,
                arrakisVaultConfig.address,
                snapshotBlock,
              ),
            ]);

            // Filter out holdings with zero token amount or below the USD threshold (no refund needed)
            if (tokenAmount === 0 || usdEquivalent < usdThreshold) {
              continue;
            }

            holdingData.push(
              new MultiTokenHoldingData(
                userAddress as Address,
                usdEquivalent,
                tokenAmount,
                tokenPair.token0.ticker,
                tokenPair.token1.ticker,
                token0Andtoken1Share[0],
                token0Andtoken1Share[1],
              ),
            );
          } catch (userError) {
            this.logger.error(
              `Error processing user ${userAddress} in portfolio ${arrakisVaultConfig.address}:`,
              userError,
            );
          }
        }
        const snapshotData = new SnapshotData(
          arrakisVaultConfig.address,
          tokenName,
          totalTokenSupply.toNumber(),
          tvlUsd,
          holdingData,
          token0Price,
          token1Price,
        );
        arrakisVaultSnapshot.push(snapshotData);
        this.logger.debug(`Completed Arrakis Vault snapshot for address: ${arrakisVaultConfig.address}`);
      } catch (error) {
        this.logger.error(`Error building Arrakis Vault snapshot for address ${arrakisVaultConfig.address}:`, error);
      }
    }

    return {
      snapshotData: arrakisVaultSnapshot,
    };
  }
}
