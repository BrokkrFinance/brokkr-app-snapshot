import { Injectable, Logger } from "@nestjs/common";
import { HoldingData, SnapshotType } from "../../shared/models/ISnapshot";

@Injectable()
export class QaService {
  private readonly logger = new Logger(QaService.name);

  // Check if there is holdingData availabe and if the sum of usdEquivalent matches the tvlUsd
  checkUsdEquivalentMatchesTvl(
    snapshots: SnapshotType[],
    usdThreshold: number,
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    let isValid = true; // Initialize as true

    snapshots.forEach((snapshot) => {
      snapshot.snapshotData.forEach((product) => {
        if ((!product.holdingData || product.holdingData.length === 0) && product.tvlUsd > 0.1) {
          // Error if no holding data is present
          const error = `No holding data found for product ${product.tokenName}: TVL=${product.tvlUsd}`;
          errors.push(error);
          this.logger.error(error);
          isValid = false; // Set isValid to false if an error is found
          return;
        }

        const totalUsdEquivalent = product.holdingData.reduce(
          (sum: number, holding: HoldingData) => sum + holding.usdEquivalent,
          0,
        );

        if (Math.abs(totalUsdEquivalent - product.tvlUsd) >= usdThreshold) {
          const error = `Mismatch for product ${product.tokenName}: TVL=${product.tvlUsd}, USD Equivalent Sum=${totalUsdEquivalent}`;
          errors.push(error);
          this.logger.error(error);
          isValid = false; // Set isValid to false if an error is found
        }
      });
    });

    return { isValid, errors };
  }

  // Check if the sum of tokenAmount matches the totalTokenSupply
  checkTotalTokenSupply(snapshots: SnapshotType[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    let isValid = true; // Initialize as true

    snapshots.forEach((snapshot) => {
      snapshot.snapshotData.forEach((product) => {
        const totalTokenAmounts = product.holdingData.reduce(
          (sum: number, holding: HoldingData) => sum + holding.tokenAmount,
          0,
        );

        if (Math.abs(totalTokenAmounts - product.totalTokenSupply) > 0.001) {
          const error = `Mismatch for product ${product.tokenName}: Total Supply=${product.totalTokenSupply}, Token Amount Sum=${totalTokenAmounts}`;
          errors.push(error);
          this.logger.error(error);
          isValid = false; // Set isValid to false if an error is found
        }
      });
    });

    return { isValid, errors };
  }

  // Check for unique holders addresses within each product
  checkUniqueHolders(snapshots: SnapshotType[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    let isValid = true;

    snapshots.forEach((snapshot) => {
      snapshot.snapshotData.forEach((product) => {
        const uniqueAddresses = new Set<string>();

        product.holdingData.forEach((holding: HoldingData) => {
          if (uniqueAddresses.has(holding.userAddress)) {
            const error = `Duplicate address ${holding.userAddress} found in product ${product.tokenName}.`;
            errors.push(error);
            this.logger.error(error);
            isValid = false;
          } else {
            uniqueAddresses.add(holding.userAddress);
          }
        });
      });
    });

    return { isValid, errors };
  }

  // Check for invalid (zero or negative) USD equivalents
  checkInvalidUsdEquivalents(snapshots: SnapshotType[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    let isValid = true;

    snapshots.forEach((snapshot) => {
      snapshot.snapshotData.forEach((product) => {
        product.holdingData.forEach((holding: HoldingData) => {
          if (holding.usdEquivalent <= 0) {
            const error = `Invalid USD equivalent for address ${holding.userAddress} in product ${product.tokenName}.`;
            errors.push(error);
            this.logger.error(error);
            isValid = false;
          }
        });
      });
    });

    return { isValid, errors };
  }
}
