import { Test, TestingModule } from "@nestjs/testing";
import { SnapshotController } from "./snapshot.controller";
import { BrokkrSnapshotConfigModule } from "../config/brokkr-snapshot-config.module";
import { SnapshotService } from "./snapshot.service";
import { MockDatabaseModule } from "../db/mock-database.module.spec";
import { MockContractConnectorsModule } from "../contract-connectors/mock-contract-connectors.module";
import { QaService } from "./qa/qa.service";
import { TokenIndexSnapshotService } from "./helper-services/token-index-snapshot.service";
import { TokenBasedSnapshotService } from "./helper-services/token-based-snapshot.service";
import { ArrakisVaultSnapshotService } from "./helper-services/arrakis-vault-snapshot.service";
import { DcaSnapshotService } from "./helper-services/dca-snapshot.service";
import { Logger } from "@nestjs/common";

describe("SnapshotController", () => {
  let controller: SnapshotController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [MockDatabaseModule, BrokkrSnapshotConfigModule, MockContractConnectorsModule],
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
    }).compile();

    controller = module.get<SnapshotController>(SnapshotController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
