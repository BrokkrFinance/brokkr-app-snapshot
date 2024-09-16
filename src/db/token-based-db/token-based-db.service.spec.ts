import { Test, TestingModule } from "@nestjs/testing";
import { TokenBasedDbService } from "./token-based-db.service";
import { Logger } from "@nestjs/common";
import { MockDatabaseModule } from "../mock-database.module.spec";
import { BrokkrSnapshotConfigModule } from "../../config/brokkr-snapshot-config.module";

describe("TokenBasedDbService", () => {
  let service: TokenBasedDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BrokkrSnapshotConfigModule, MockDatabaseModule],
      providers: [Logger],
    }).compile();

    service = module.get<TokenBasedDbService>(TokenBasedDbService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
