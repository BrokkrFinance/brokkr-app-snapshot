import { Test, TestingModule } from "@nestjs/testing";
import { DcaDbService } from "./dca-db.service";
import { MockDatabaseModule } from "../mock-database.module.spec";
import { Logger } from "@nestjs/common";
import { BrokkrSnapshotConfigModule } from "../../config/brokkr-snapshot-config.module";

describe("DcaDbService", () => {
  let service: DcaDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BrokkrSnapshotConfigModule, MockDatabaseModule],
      providers: [Logger],
    }).compile();

    service = module.get<DcaDbService>(DcaDbService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
