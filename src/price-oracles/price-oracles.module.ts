import { Logger, Module } from "@nestjs/common";
import { CoingeckoService } from "./coingecko/coingecko.service";
import { HttpModule } from "@nestjs/axios";
import { BrokkrSnapshotConfigModule } from "../config/brokkr-snapshot-config.module";

@Module({
  imports: [BrokkrSnapshotConfigModule, HttpModule],
  providers: [CoingeckoService, Logger],
  exports: [CoingeckoService],
})
export class PriceOraclesModule {}
