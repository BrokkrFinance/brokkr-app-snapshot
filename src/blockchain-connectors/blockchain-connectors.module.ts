import { Logger, Module } from "@nestjs/common";
import { EvmConnectorService } from "./evm-connector/evm-connector.service";
import { BrokkrSnapshotConfigService } from "../config/brokkr-snapshot-config.service";
import { BrokkrSnapshotConfigModule } from "../config/brokkr-snapshot-config.module";

@Module({
  imports: [BrokkrSnapshotConfigModule],
  providers: [
    Logger,
    {
      provide: EvmConnectorService,
      inject: [Logger, BrokkrSnapshotConfigService],
      useFactory: async (logger: Logger, config: BrokkrSnapshotConfigService) => {
        const service = new EvmConnectorService(logger, config);

        if (!config.isTest()) {
          return await service.initialize();
        }
      },
    },
  ],
  exports: [EvmConnectorService],
})
export class BlockchainConnectorsModule {}
