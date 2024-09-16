import { Logger, Module } from "@nestjs/common";
import { Erc20Service } from "./erc20/erc20.service";
import { BlockchainConnectorsModule } from "../blockchain-connectors/blockchain-connectors.module";
import { ArrakisContractsService } from "./arrakis-contracts/arrakis-contracts.service";
import { PriceOraclesModule } from "../price-oracles/price-oracles.module";
import { DcaContractService } from "./dca-contract/dca-contract.service";
import { TokenIndexContractService } from "./token-index-contract/token-index-contract.service";
import { TokenBasedContractService } from "./token-based-contract/token-based-contract.service";
import { BrokkrSnapshotConfigModule } from "../config/brokkr-snapshot-config.module";
import { DbModule } from "../db/db.module";

@Module({
  imports: [BlockchainConnectorsModule, BrokkrSnapshotConfigModule, PriceOraclesModule, DbModule],
  providers: [
    Logger,
    ArrakisContractsService,
    Erc20Service,
    DcaContractService,
    TokenIndexContractService,
    TokenBasedContractService,
  ],
  exports: [
    Erc20Service,
    ArrakisContractsService,
    DcaContractService,
    TokenIndexContractService,
    TokenBasedContractService,
  ],
})
export class ContractConnectorsModule {}
