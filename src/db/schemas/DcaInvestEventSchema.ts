import { Document } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({
  _id: false,
})
export class DcaInvestEventMetadata extends Document {
  @Prop({
    type: String,
    isRequired: true,
    lowercase: true,
  })
  portfolioAddress: string;

  @Prop({
    type: Number,
    isRequired: true,
  })
  blockNumber: number;

  @Prop({
    type: Number,
    isRequired: true,
  })
  bluechipPrice: number;

  @Prop({
    type: Number,
    isRequired: true,
  })
  investmentIndex: number;
}

export const DcaInvestEventMetadataSchema = SchemaFactory.createForClass(DcaInvestEventMetadata);

@Schema({
  collection: "investEvents",
  autoCreate: true,
  autoIndex: true,
})
export class DcaInvestEventDocument extends Document {
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
    type: DcaInvestEventMetadataSchema,
    isRequired: false,
  })
  metadata: DcaInvestEventMetadata;
}

export const DcaInvestEventDocumentSchema = SchemaFactory.createForClass(DcaInvestEventDocument);
DcaInvestEventDocumentSchema.index({ timestamp: 1, "metadata.portfolioAddress": 1 }, { unique: true });
