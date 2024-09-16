import { Test, TestingModule } from "@nestjs/testing";
import { CoingeckoService } from "./coingecko.service";
import { HttpModule } from "@nestjs/axios";
import { Logger } from "@nestjs/common";
import { BrokkrSnapshotConfigModule } from "../../config/brokkr-snapshot-config.module";

describe("CoingeckoService", () => {
  let service: CoingeckoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BrokkrSnapshotConfigModule, HttpModule],
      providers: [CoingeckoService, Logger],
    }).compile();

    service = module.get<CoingeckoService>(CoingeckoService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
