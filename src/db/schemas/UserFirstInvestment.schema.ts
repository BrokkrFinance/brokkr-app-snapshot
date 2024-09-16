import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({
  collection: "usersFirstInvestments",
  autoCreate: true,
  autoIndex: true,
})
export class UserFirstInvestmentDocument extends Document {
  @Prop({
    type: Date,
    isRequired: true,
  })
  timestamp: Date; // first investment timestamp

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
    lowercase: true,
  })
  txHash: string;
}

export const UserFirstInvestmentSchema = SchemaFactory.createForClass(UserFirstInvestmentDocument);
UserFirstInvestmentSchema.index({ portfolioAddress: 1, userAddress: 1 }, { unique: true });
