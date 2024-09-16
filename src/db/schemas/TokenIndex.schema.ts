import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { OperationType } from "../../shared/enum/OperationType";

@Schema({
  _id: false,
})
export class TokenIndexOperationMetadata extends Document {
  @Prop({
    type: String,
    isRequired: true,
    lowercase: true,
  })
  portfolioAddress: string;

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
  tokenAmount: string;

  @Prop({
    type: String,
    isRequired: true,
  })
  usdcAmount: string;

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

export const TokenIndexOperationMetadataSchema = SchemaFactory.createForClass(TokenIndexOperationMetadata);

@Schema({
  collection: "tokenIndexOperations",
  autoCreate: true,
  autoIndex: true,
})
export class TokenIndexOperationDocument extends Document {
  @Prop({
    type: String,
    isRequired: true,
    lowercase: true,
  })
  _id: string;

  @Prop({
    type: Date,
    isRequired: true,
  })
  timestamp: Date; // The primary date field for time series data

  @Prop({
    type: TokenIndexOperationMetadataSchema,
    isRequired: true,
  })
  metadata: TokenIndexOperationMetadata;
}

export const TokenIndexOperationSchema = SchemaFactory.createForClass(TokenIndexOperationDocument);
TokenIndexOperationSchema.index(
  { timestamp: 1, "metadata.userAddress": 1, "metadata.portfolioAddress": 1 },
  { unique: true },
);
