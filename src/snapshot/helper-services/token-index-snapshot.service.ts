import { Injectable, Logger } from "@nestjs/common";
import { TokenIndexDbService } from "../../db/token-index-db/token-index-db.service";
import { TokenIndexContractService } from "../../contract-connectors/token-index-contract/token-index-contract.service";
import { BrokkrSnapshotConfigService } from "../../config/brokkr-snapshot-config.service";
import { SingleTokenHoldingData, SnapshotData, TokenIndexSnapshot } from "../../shared/models/ISnapshot";
import { Address } from "viem";
import addressesData from "../addresses.json";
import { AddressEntry } from "../../shared/types/addressEntry";

@Injectable()
export class TokenIndexSnapshotService {
  private additionalUserAddresses: AddressEntry[] = addressesData;

  constructor(
    private tokenIndexDbService: TokenIndexDbService,
    private tokenIndexContractService: TokenIndexContractService,
    private configService: BrokkrSnapshotConfigService,
    private logger: Logger,
  ) {}

  async getSnapshot(snapshotBlock: number, usdThreshold: number): Promise<TokenIndexSnapshot> {
    const addresses = this.configService.tokenIndexPortfolioAddresses;

    const tokenIndexSnapshot: SnapshotData<SingleTokenHoldingData>[] = [];

    for (const address of addresses) {
      this.logger.debug(`Starting TokenIndex snapshot for address: ${address}`);
      try {
        const [tvlUsd, tokenName, totalTokenSupply, userAddressesFromDb] = await Promise.all([
          this.tokenIndexContractService.getEquityValuationForPortfolio(address, snapshotBlock),
          this.tokenIndexContractService.getTokenName(address),
          this.tokenIndexContractService.getTotalTokenSupply(address, snapshotBlock),
          this.tokenIndexDbService.getUniqueUserAddressesByPortfolio(address),
        ]);

        // Find additional user addresses from addresses.json based on matching productAddress
        const additionalEntry = this.additionalUserAddresses.find(
          (entry) => entry.productAddress.toLowerCase() === address.toLowerCase(),
        );

        // Merge user addresses from DB and JSON
        let userAddresses: string[] = [...userAddressesFromDb];
        if (additionalEntry) {
          userAddresses = [...userAddresses, ...additionalEntry.userAddresses];
          this.logger.debug(
            `Added ${additionalEntry.userAddresses.length} userAddresses from addresses.json for productAddress: ${address}`,
          );
        }

        const holdingData: SingleTokenHoldingData[] = [];

        for (const userAddress of userAddresses) {
          try {
            const [tokenAmount, usdEquivalent] = await Promise.all([
              this.tokenIndexContractService.getInvestmentTokenBalance(address, userAddress, snapshotBlock),
              this.tokenIndexContractService.getEquityValuationForUserAndPortfolio(
                userAddress as Address,
                address,
                snapshotBlock,
              ),
            ]);

            // Filter out holdings with zero token amount or below the USD threshold (no refund needed)
            if (tokenAmount === 0 || usdEquivalent < usdThreshold) {
              continue;
            }

            holdingData.push(new SingleTokenHoldingData(userAddress as Address, tokenAmount, usdEquivalent));
          } catch (userError) {
            this.logger.error(`Error processing user ${userAddress} in portfolio ${address}:`, userError);
          }
        }

        const snapshotData = new SnapshotData(address, tokenName, totalTokenSupply, tvlUsd, holdingData);
        tokenIndexSnapshot.push(snapshotData);
        this.logger.debug(`Completed TokenIndex snapshot for address: ${address}`);
      } catch (error) {
        this.logger.error(`Error building TokenIndex snapshot for address ${address}:`, error);
      }
    }

    return {
      snapshotData: tokenIndexSnapshot,
    };
  }
}
