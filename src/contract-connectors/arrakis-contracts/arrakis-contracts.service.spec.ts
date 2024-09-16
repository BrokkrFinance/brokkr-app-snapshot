import { Test, TestingModule } from "@nestjs/testing";
import { ArrakisContractsService } from "./arrakis-contracts.service";
import { BlockchainConnectorsModule } from "../../blockchain-connectors/blockchain-connectors.module";
import { Erc20Service } from "../erc20/erc20.service";
import { PriceOraclesModule } from "../../price-oracles/price-oracles.module";
import { Logger } from "@nestjs/common";
import { BrokkrSnapshotConfigModule } from "../../config/brokkr-snapshot-config.module";

describe("ArrakisVaultContractService", () => {
  let service: ArrakisContractsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BlockchainConnectorsModule, BrokkrSnapshotConfigModule, PriceOraclesModule],
      providers: [Logger, ArrakisContractsService, Erc20Service],
    }).compile();

    service = module.get<ArrakisContractsService>(ArrakisContractsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
