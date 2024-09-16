import { Test, TestingModule } from "@nestjs/testing";
import { BrokkrSnapshotConfigService } from "./brokkr-snapshot-config.service";
import { ConfigModule } from "@nestjs/config";
import configuration from "./configuration";
import { Logger } from "@nestjs/common";

describe("BrokkrSnapshotConfigService", () => {
  let service: BrokkrSnapshotConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          cache: true,
          isGlobal: true,
          load: [configuration],
        }),
      ],
      providers: [BrokkrSnapshotConfigService, Logger],
    }).compile();

    service = module.get<BrokkrSnapshotConfigService>(BrokkrSnapshotConfigService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
