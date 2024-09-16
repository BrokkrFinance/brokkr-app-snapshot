import { Injectable, Logger } from "@nestjs/common";
import { TokenIndexDbService } from "../../db/token-index-db/token-index-db.service";
import { TokenIndexContractService } from "../../contract-connectors/token-index-contract/token-index-contract.service";
import { BrokkrSnapshotConfigService } from "../../config/brokkr-snapshot-config.service";
import { SingleTokenHoldingData, SnapshotData, TokenIndexSnapshot } from "../../shared/models/ISnapshot";
import { Address } from "viem";
import { UserFirstInvestmentService } from "../../db/user-first-investment-db/user-first-investment-db.service";

@Injectable()
export class TokenIndexSnapshotService {
  constructor(
    private tokenIndexDbService: TokenIndexDbService,
    private userFirstInvestmentService: UserFirstInvestmentService,
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
        const [tvlUsd, tokenName, totalTokenSupply, userAddresses] = await Promise.all([
          this.tokenIndexContractService.getEquityValuationForPortfolio(address, snapshotBlock),
          this.tokenIndexContractService.getTokenName(address),
          this.tokenIndexContractService.getTotalTokenSupply(address, snapshotBlock),
          this.tokenIndexDbService.getUniqueUserAddressesByPortfolio(address),
        ]);

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
