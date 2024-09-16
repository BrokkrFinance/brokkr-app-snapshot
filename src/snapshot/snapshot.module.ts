import { Logger, Module } from "@nestjs/common";
import { SnapshotController } from "./snapshot.controller";
import { SnapshotService } from "./snapshot.service";
import { BrokkrSnapshotConfigModule } from "../config/brokkr-snapshot-config.module";
import { ContractConnectorsModule } from "../contract-connectors/contract-connectors.module";
import { DbModule } from "../db/db.module";
import { QaService } from "./qa/qa.service";
import { TokenIndexSnapshotService } from "./helper-services/token-index-snapshot.service";
import { TokenBasedSnapshotService } from "./helper-services/token-based-snapshot.service";
import { ArrakisVaultSnapshotService } from "./helper-services/arrakis-vault-snapshot.service";
import { DcaSnapshotService } from "./helper-services/dca-snapshot.service";
import { PriceOraclesModule } from "../price-oracles/price-oracles.module";

@Module({
  imports: [DbModule, BrokkrSnapshotConfigModule, ContractConnectorsModule, PriceOraclesModule],
  providers: [
    SnapshotService,
    QaService,
    TokenIndexSnapshotService,
    TokenBasedSnapshotService,
    ArrakisVaultSnapshotService,
    DcaSnapshotService,
    Logger,
  ],
  controllers: [SnapshotController],
})
export class SnapshotModule {}
