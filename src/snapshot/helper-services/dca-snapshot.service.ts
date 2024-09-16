import { Address } from "viem";
import { DCA_DEPOSIT_COIN_COINGECKO_NAME } from "../../shared/constants";
import { DcaSnapshot, MultiTokenHoldingData, SnapshotData } from "../../shared/models/ISnapshot";
import { DcaContractService } from "../../contract-connectors/dca-contract/dca-contract.service";
import { DcaDbService } from "../../db/dca-db/dca-db.service";
import { Injectable, Logger } from "@nestjs/common";
import { BrokkrSnapshotConfigService } from "../../config/brokkr-snapshot-config.service";
import { UserFirstInvestmentService } from "../../db/user-first-investment-db/user-first-investment-db.service";
import { CoingeckoService } from "../../price-oracles/coingecko/coingecko.service";

@Injectable()
export class DcaSnapshotService {
  constructor(
    private dcaDbService: DcaDbService,
    private userFirstInvestmentService: UserFirstInvestmentService,
    private dcaContractService: DcaContractService,
    private configService: BrokkrSnapshotConfigService,
    private coingeckoService: CoingeckoService,
    private logger: Logger,
  ) {}

  async getSnapshot(snapshotBlock: number, usdThreshold: number): Promise<DcaSnapshot> {
    const dcaConfigs = this.configService.dcaPortfolioConfigs;
    const dcaSnapshot: SnapshotData<MultiTokenHoldingData>[] = [];

    for (const dcaConfig of dcaConfigs) {
      this.logger.debug(`Starting DCA snapshot for address: ${dcaConfig.address}`);
      try {
        const [tvlUsd, userAddresses, token1Price] = await Promise.all([
          this.dcaContractService.getTvlUsd(dcaConfig, snapshotBlock),
          this.dcaDbService.getUniqueUserAddressesByPortfolio(dcaConfig.address),
          this.dcaContractService.getBluechipTokenPrice(dcaConfig, Number(snapshotBlock)),
        ]);

        const tokenName = `DCA ${dcaConfig.bluechipTokenCoingeckoId}`;
        const totalTokenSupply = 0; //there is no token representing DCA share

        const holdingData: MultiTokenHoldingData[] = [];
        for (const userAddress of userAddresses) {
          try {
            const tokenAmount = 0; //there is no token representing DCA share

            const [usdEquivalent, depositAndBluechipTokenHoldings] = await Promise.all([
              this.dcaContractService.getUsersEquityValuation(userAddress as Address, dcaConfig.address, snapshotBlock),
              this.dcaContractService.getUsersDepositAndBluechipTokenHoldings(
                userAddress as Address,
                dcaConfig.address,
                snapshotBlock,
              ),
            ]);

            // Filter out holdings below the USD threshold (no refund needed)
            if (usdEquivalent < usdThreshold) {
              continue;
            }

            holdingData.push(
              new MultiTokenHoldingData(
                userAddress as Address,
                usdEquivalent,
                tokenAmount,
                DCA_DEPOSIT_COIN_COINGECKO_NAME,
                dcaConfig.bluechipTokenCoingeckoId,
                depositAndBluechipTokenHoldings[0].toNumber(),
                depositAndBluechipTokenHoldings[1].toNumber(),
              ),
            );
          } catch (userError) {
            this.logger.error(`Error processing user ${userAddress} in portfolio ${dcaConfig.address}:`, userError);
          }
        }
        const snapshotData = new SnapshotData(
          dcaConfig.address,
          tokenName,
          totalTokenSupply,
          tvlUsd,
          holdingData,
          "1",
          token1Price,
        );
        dcaSnapshot.push(snapshotData);
        this.logger.debug(`Completed DCA snapshot for address: ${dcaConfig.address}`);
      } catch (error) {
        this.logger.error(`Error building DCA snapshot for address ${dcaConfig.address}:`, error);
      }
    }

    return {
      snapshotData: dcaSnapshot,
    };
  }
}
