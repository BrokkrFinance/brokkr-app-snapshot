import { Injectable, Logger } from "@nestjs/common";
import { TokenIndexSnapshotService } from "./helper-services/token-index-snapshot.service";
import { TokenBasedSnapshotService } from "./helper-services/token-based-snapshot.service";
import { ArrakisVaultSnapshotService } from "./helper-services/arrakis-vault-snapshot.service";
import { DcaSnapshotService } from "./helper-services/dca-snapshot.service";
import { QaService } from "./qa/qa.service";

@Injectable()
export class SnapshotService {
  constructor(
    private tokenIndexSnapshotService: TokenIndexSnapshotService,
    private tokenBasedSnapshotService: TokenBasedSnapshotService,
    private arrakisVaultSnapshotService: ArrakisVaultSnapshotService,
    private dcaSnapshotService: DcaSnapshotService,
    private qaService: QaService,
    private logger: Logger,
  ) {}

  async getTotalSnapshotWithChecks(snapshotBlock: number, usdThreshold: number) {
    this.logger.debug(`Starting total snapshot with checks at block: ${snapshotBlock}`);

    const [tokenIndex, tokenBased, arrakisVault, dca] = await Promise.all([
      this.tokenIndexSnapshotService.getSnapshot(snapshotBlock, usdThreshold),
      this.tokenBasedSnapshotService.getSnapshot(snapshotBlock, usdThreshold),
      this.arrakisVaultSnapshotService.getSnapshot(snapshotBlock, usdThreshold),
      this.dcaSnapshotService.getSnapshot(snapshotBlock, usdThreshold),
    ]);

    const snapshot = [tokenIndex, tokenBased, arrakisVault, dca];

    // Collect QA check results
    const errors: string[] = [];
    const checks = await Promise.all([
      this.qaService.checkUsdEquivalentMatchesTvl(snapshot, usdThreshold),
      this.qaService.checkTotalTokenSupply(snapshot),
      this.qaService.checkUniqueHolders(snapshot),
      this.qaService.checkInvalidUsdEquivalents(snapshot),
    ]);

    checks.forEach((check) => {
      if (!check.isValid) errors.push(...check.errors);
    });

    if (errors.length < 0) {
      this.logger.debug("All QA checks passed without errors.");
    }

    return {
      snapshot,
      isValid: errors.length === 0,
      errors,
    };
  }
}
