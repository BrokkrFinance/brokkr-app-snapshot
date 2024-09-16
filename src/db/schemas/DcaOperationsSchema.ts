import { Document } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { OperationType } from "../../shared/enum/OperationType";

@Schema({
  _id: false,
})
export class DcaOperationMetadata extends Document {
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

  // Optional fields, based on the operation type

  @Prop({
    type: String,
    isRequired: function () {
      return this.operationType == OperationType.Deposit;
    },
  })
  usdcDeposited: string;

  @Prop({
    type: Number,
    isRequired: function () {
      return this.operationType == OperationType.Deposit;
    },
  })
  amountSplit: number;

  @Prop({
    type: String,
    isRequired: function () {
      return this.operationType == OperationType.Withdrawal;
    },
  })
  usdcWithdrawn: string;

  @Prop({
    type: String,
    isRequired: function () {
      return this.operationType == OperationType.Withdrawal;
    },
  })
  bluechipWithdrawn: string;
}

export const DcaOperationMetadataSchema = SchemaFactory.createForClass(DcaOperationMetadata);

@Schema({
  collection: "dcaOperations",
  autoCreate: true,
  autoIndex: true,
})
export class DcaOperationDocument extends Document {
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
  timestamp: Date;

  @Prop({
    type: DcaOperationMetadataSchema,
    isRequired: false,
  })
  metadata: DcaOperationMetadata;
}

export const DcaOperationSchema = SchemaFactory.createForClass(DcaOperationDocument);
DcaOperationSchema.index({ timestamp: 1, "metadata.userAddress": 1, "metadata.portfolioAddress": 1 }, { unique: true });
