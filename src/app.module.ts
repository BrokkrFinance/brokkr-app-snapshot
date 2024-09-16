import { Module } from "@nestjs/common";
import { AppService } from "./app.service";
import { SnapshotModule } from "./snapshot/snapshot.module";
import { BrokkrSnapshotConfigModule } from "./config/brokkr-snapshot-config.module";
import { MongooseModule } from "@nestjs/mongoose";
import { BrokkrSnapshotConfigService } from "./config/brokkr-snapshot-config.service";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "static"),
      exclude: ["/api/(.*)"],
    }),
    BrokkrSnapshotConfigModule,
    SnapshotModule,
    MongooseModule.forRootAsync({
      imports: [BrokkrSnapshotConfigModule],
      useFactory: async (configService: BrokkrSnapshotConfigService) => ({
        uri: configService.config.mongoConfig.url,
        dbName: configService.config.mongoConfig.dbName,
      }),
      inject: [BrokkrSnapshotConfigService],
    }),
  ],
  providers: [AppService],
})
export class AppModule {}
