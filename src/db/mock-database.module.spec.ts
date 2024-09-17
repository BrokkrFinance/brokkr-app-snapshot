import { Global, Logger, Module, Provider } from "@nestjs/common";
import { VaultDbService } from "./vault-db/vault-db.service";
import { Test, TestingModule } from "@nestjs/testing";
import { TokenIndexDbService } from "./token-index-db/token-index-db.service";
import { TokenBasedDbService } from "./token-based-db/token-based-db.service";
import { DcaDbService } from "./dca-db/dca-db.service";
import { BrokkrSnapshotConfigModule } from "../config/brokkr-snapshot-config.module";

export const dbMockRepository = {
  find: () => {
    return { exec: jest.fn(() => new Object()) };
  },
  findAll: () => {
    return { exec: jest.fn(() => new Object()) };
  },
  create: jest.fn(() => new Object()),
  findByIdAndUpdate: () => {
    return { exec: jest.fn(() => new Object()) };
  },
};

export const mockStrategyDbServiceProviders: Provider[] = [
  {
    provide: VaultDbService,
    useValue: dbMockRepository,
  },
  {
    provide: TokenIndexDbService,
    useValue: dbMockRepository,
  },
  {
    provide: TokenBasedDbService,
    useValue: dbMockRepository,
  },
  {
    provide: DcaDbService,
    useValue: dbMockRepository,
  },
];

@Global()
@Module({
  providers: [...mockStrategyDbServiceProviders, Logger],
  exports: [...mockStrategyDbServiceProviders],
})
export class MockDatabaseModule {}

describe("MockDatabaseModule", () => {
  let dbService: unknown;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [MockDatabaseModule, BrokkrSnapshotConfigModule],
    }).compile();

    dbService = module.get(VaultDbService);
  });

  it("dbService should not be defined if enabled, else it should be undefined", () => {
    expect(dbService).toBeDefined();
  });
});
