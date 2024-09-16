import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { OperationType } from "../../shared/enum/OperationType";

@Schema({
  _id: false,
})
export class ArrakisVaultOperationMetadata extends Document {
  @Prop({
    type: String,
    isRequired: true,
    lowercase: true,
  })
  vaultAddress: string;

  @Prop({
    type: String,
    isRequired: true,
    lowercase: true,
  })
  userAddress: string;

  @Prop({
    type: String,
    isRequired: true,
  })
  amount0: string;

  @Prop({
    type: String,
    isRequired: true,
  })
  amount1: string;

  @Prop({
    type: String,
    isRequired: true,
  })
  usdcValue: string;

  @Prop({
    type: Number,
    isRequired: true,
  })
  blockNumber: number;

  @Prop({
    type: Number,
    enum: OperationType,
    isRequired: true,
  })
  operationType: OperationType;
}

export const ArrakisVaultOperationMetadataSchema = SchemaFactory.createForClass(ArrakisVaultOperationMetadata);

@Schema({
  collection: "arrakisVaultOperations",
  autoCreate: true,
  autoIndex: true,
})
export class ArrakisVaultOperationDocument extends Document {
  @Prop({
    type: String,
    isRequired: true,
    lowercase: true,
  })
  _id: string; // eventId

  @Prop({
    type: Date,
    isRequired: true,
  })
  timestamp: Date; // The primary date field for time series data

  @Prop({
    type: ArrakisVaultOperationMetadataSchema,
    isRequired: true,
  })
  metadata: ArrakisVaultOperationMetadata;
}

export const ArrakisVaultOperationSchema = SchemaFactory.createForClass(ArrakisVaultOperationDocument);
ArrakisVaultOperationSchema.index(
  { timestamp: 1, "metadata.userAddress": 1, "metadata.vaultAddress": 1 },
  { unique: true },
);
