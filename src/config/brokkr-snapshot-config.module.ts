import { Logger, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { BrokkrSnapshotConfigService } from "./brokkr-snapshot-config.service";
import configuration from "./configuration";

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      load: [configuration],
    }),
  ],
  providers: [BrokkrSnapshotConfigService, Logger],
  exports: [BrokkrSnapshotConfigService],
})
export class BrokkrSnapshotConfigModule {}
