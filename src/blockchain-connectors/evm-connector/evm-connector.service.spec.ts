import { Test, TestingModule } from "@nestjs/testing";
import { EvmConnectorService } from "./evm-connector.service";
import { Logger } from "@nestjs/common";
import { BrokkrSnapshotConfigModule } from "../../config/brokkr-snapshot-config.module";

describe("EvmConnectorService", () => {
  let service: EvmConnectorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BrokkrSnapshotConfigModule],
      providers: [EvmConnectorService, Logger],
    }).compile();

    service = module.get<EvmConnectorService>(EvmConnectorService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
