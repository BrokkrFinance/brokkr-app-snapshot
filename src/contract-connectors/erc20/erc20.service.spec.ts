import { Test, TestingModule } from "@nestjs/testing";
import { Erc20Service } from "./erc20.service";
import { BlockchainConnectorsModule } from "../../blockchain-connectors/blockchain-connectors.module";
import { Logger } from "@nestjs/common";
import { BrokkrSnapshotConfigModule } from "../../config/brokkr-snapshot-config.module";

describe("Erc20Service", () => {
  let service: Erc20Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BlockchainConnectorsModule, BrokkrSnapshotConfigModule],
      providers: [Erc20Service, Logger],
    }).compile();

    service = module.get<Erc20Service>(Erc20Service);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
