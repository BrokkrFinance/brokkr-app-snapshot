import { Test, TestingModule } from "@nestjs/testing";
import { TokenIndexDbService } from "./token-index-db.service";
import { Logger } from "@nestjs/common";
import { MockDatabaseModule } from "../mock-database.module.spec";
import { BrokkrSnapshotConfigModule } from "../../config/brokkr-snapshot-config.module";

describe("TokenIndexDbService", () => {
  let service: TokenIndexDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BrokkrSnapshotConfigModule, MockDatabaseModule],
      providers: [Logger],
    }).compile();

    service = module.get<TokenIndexDbService>(TokenIndexDbService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
