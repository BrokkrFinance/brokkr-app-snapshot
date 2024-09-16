import { Injectable, Logger } from "@nestjs/common";
import { BrokkrSnapshotConfigService } from "../../config/brokkr-snapshot-config.service";
import { SingleTokenHoldingData, SnapshotData, TokenBasedSnapshot } from "../../shared/models/ISnapshot";
import { Address } from "viem";
import { TokenBasedDbService } from "../../db/token-based-db/token-based-db.service";
import { TokenBasedContractService } from "../../contract-connectors/token-based-contract/token-based-contract.service";
import { UserFirstInvestmentService } from "../../db/user-first-investment-db/user-first-investment-db.service";

@Injectable()
export class TokenBasedSnapshotService {
  constructor(
    private tokenBasedDbService: TokenBasedDbService,
    private userFirstInvestmentService: UserFirstInvestmentService,
    private tokenBasedContractService: TokenBasedContractService,
    private configService: BrokkrSnapshotConfigService,
    private logger: Logger,
  ) {}

  async getSnapshot(snapshotBlock: number, usdThreshold: number): Promise<TokenBasedSnapshot> {
    const addresses = this.configService.tokenBasedPortfolioAddresses;

    const tokenBasedSnapshot: SnapshotData<SingleTokenHoldingData>[] = [];

    for (const address of addresses) {
      this.logger.debug(`Starting TokenBased snapshot for address: ${address}`);
      try {
        const [tvlUsd, tokenName, totalTokenSupply, userAddresses] = await Promise.all([
          this.tokenBasedContractService.getEquityValuationForPortfolio(address, snapshotBlock),
          this.tokenBasedContractService.getTokenName(address),
          this.tokenBasedContractService.getTotalTokenSupply(address, snapshotBlock),
          this.tokenBasedDbService.getUniqueUserAddressesByPortfolio(address),
        ]);

        const holdingData: SingleTokenHoldingData[] = [];

        for (const userAddress of userAddresses) {
          try {
            const [tokenAmount, usdEquivalent] = await Promise.all([
              this.tokenBasedContractService.getInvestmentTokenBalance(address, userAddress, snapshotBlock),
              this.tokenBasedContractService.getEquityValuationForUserAndPortfolio(
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
        tokenBasedSnapshot.push(snapshotData);
        this.logger.debug(`Completed TokenBased snapshot for address: ${address}`);
      } catch (error) {
        this.logger.error(`Error building TokenBased snapshot for address ${address}:`, error);
      }
    }

    return {
      snapshotData: tokenBasedSnapshot,
    };
  }
}
