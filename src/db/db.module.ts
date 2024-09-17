import { Module, Logger } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DcaInvestEventDocument, DcaInvestEventDocumentSchema } from "./schemas/DcaInvestEventSchema";
import { TokenBasedOperationDocument, TokenBasedOperationSchema } from "./schemas/TokenBased.schema";
import { TokenIndexOperationDocument, TokenIndexOperationSchema } from "./schemas/TokenIndex.schema";
import { ArrakisVaultOperationDocument, ArrakisVaultOperationSchema } from "./schemas/ArrakisVaultOperation.schema";
import { VaultDbService } from "./vault-db/vault-db.service";
import { TokenIndexDbService } from "./token-index-db/token-index-db.service";
import { TokenBasedDbService } from "./token-based-db/token-based-db.service";
import { DcaDbService } from "./dca-db/dca-db.service";
import { BrokkrSnapshotConfigModule } from "../config/brokkr-snapshot-config.module";
import { DcaOperationDocument, DcaOperationSchema } from "./schemas/DcaOperationsSchema";

@Module({
  imports: [
    BrokkrSnapshotConfigModule,
    MongooseModule.forFeature([
      {
        name: DcaInvestEventDocument.name,
        schema: DcaInvestEventDocumentSchema,
      },
    ]),
    MongooseModule.forFeature([
      {
        name: TokenBasedOperationDocument.name,
        schema: TokenBasedOperationSchema,
      },
    ]),
    MongooseModule.forFeature([
      {
        name: TokenIndexOperationDocument.name,
        schema: TokenIndexOperationSchema,
      },
    ]),
    MongooseModule.forFeature([
      {
        name: ArrakisVaultOperationDocument.name,
        schema: ArrakisVaultOperationSchema,
      },
    ]),
    MongooseModule.forFeature([
      {
        name: DcaOperationDocument.name,
        schema: DcaOperationSchema,
      },
    ]),
  ],
  providers: [VaultDbService, TokenIndexDbService, TokenBasedDbService, DcaDbService, Logger],
  exports: [VaultDbService, TokenIndexDbService, TokenBasedDbService, DcaDbService],
})
export class DbModule {}
