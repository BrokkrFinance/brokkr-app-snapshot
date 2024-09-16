import { Test, TestingModule } from "@nestjs/testing";
import { SnapshotService } from "./snapshot.service";
import { BrokkrSnapshotConfigModule } from "../config/brokkr-snapshot-config.module";
import { MockDatabaseModule } from "../db/mock-database.module.spec";
import { MockContractConnectorsModule } from "../contract-connectors/mock-contract-connectors.module";
import { QaService } from "./qa/qa.service";
import { TokenIndexSnapshotService } from "./helper-services/token-index-snapshot.service";
import { TokenBasedSnapshotService } from "./helper-services/token-based-snapshot.service";
import { ArrakisVaultSnapshotService } from "./helper-services/arrakis-vault-snapshot.service";
import { DcaSnapshotService } from "./helper-services/dca-snapshot.service";
import { Logger } from "@nestjs/common";
import { PriceOraclesModule } from "../price-oracles/price-oracles.module";

describe("SnapshotService", () => {
  let service: SnapshotService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [MockDatabaseModule, BrokkrSnapshotConfigModule, MockContractConnectorsModule, PriceOraclesModule],
      providers: [
        SnapshotService,
        QaService,
        TokenIndexSnapshotService,
        TokenBasedSnapshotService,
        ArrakisVaultSnapshotService,
        DcaSnapshotService,
        Logger,
      ],
    }).compile();

    service = module.get<SnapshotService>(SnapshotService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
