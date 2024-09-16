import { Test, TestingModule } from "@nestjs/testing";
import { VaultDbService } from "./vault-db.service";
import { Logger } from "@nestjs/common";
import { MockDatabaseModule } from "../mock-database.module.spec";
import { BrokkrSnapshotConfigModule } from "../../config/brokkr-snapshot-config.module";

describe("VaultDbService", () => {
  let service: VaultDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BrokkrSnapshotConfigModule, MockDatabaseModule],
      providers: [Logger],
    }).compile();

    service = module.get<VaultDbService>(VaultDbService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
