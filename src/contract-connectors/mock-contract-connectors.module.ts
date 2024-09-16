// mocks/mock-contract-connectors.module.ts
import { Module, Provider } from "@nestjs/common";
import { Erc20Service } from "../contract-connectors/erc20/erc20.service";
import { ArrakisContractsService } from "../contract-connectors/arrakis-contracts/arrakis-contracts.service";
import { DcaContractService } from "../contract-connectors/dca-contract/dca-contract.service";
import { TokenIndexContractService } from "../contract-connectors/token-index-contract/token-index-contract.service";
import { TokenBasedContractService } from "../contract-connectors/token-based-contract/token-based-contract.service";
import { BlockchainConnectorsModule } from "../blockchain-connectors/blockchain-connectors.module";
import { PriceOraclesModule } from "../price-oracles/price-oracles.module";
import { BrokkrSnapshotConfigModule } from "../config/brokkr-snapshot-config.module";
import { MockDatabaseModule } from "../db/mock-database.module.spec";

// Create mock implementations for each service if needed
const mockErc20Service = {};
const mockArrakisContractsService = {};
const mockDcaContractService = {};
const mockTokenIndexContractService = {};
const mockTokenBasedContractService = {};

// Define providers with mocks
const mockProviders: Provider[] = [
  {
    provide: Erc20Service,
    useValue: mockErc20Service,
  },
  {
    provide: ArrakisContractsService,
    useValue: mockArrakisContractsService,
  },
  {
    provide: DcaContractService,
    useValue: mockDcaContractService,
  },
  {
    provide: TokenIndexContractService,
    useValue: mockTokenIndexContractService,
  },
  {
    provide: TokenBasedContractService,
    useValue: mockTokenBasedContractService,
  },
  // Add other providers if necessary
];

@Module({
  imports: [
    BlockchainConnectorsModule,
    BrokkrSnapshotConfigModule,
    PriceOraclesModule,
    MockDatabaseModule, // Use the mock database module
  ],
  providers: [...mockProviders],
  exports: [
    Erc20Service,
    ArrakisContractsService,
    DcaContractService,
    TokenIndexContractService,
    TokenBasedContractService,
  ],
})
export class MockContractConnectorsModule {}
