import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { UserFirstInvestmentDocument } from "../schemas/UserFirstInvestment.schema";

@Injectable()
export class UserFirstInvestmentService {
  private readonly logger = new Logger(UserFirstInvestmentService.name);

  constructor(
    @InjectModel(UserFirstInvestmentDocument.name)
    private readonly userFirstInvestmentModel: Model<UserFirstInvestmentDocument>,
  ) {}

  /**
   * Retrieves all unique user addresses from the UserFirstInvestment collection.
   * @returns A promise that resolves to an array of unique user addresses.
   */
  public async getAllUniqueUserAddresses(): Promise<string[]> {
    try {
      const uniqueUserAddresses: string[] = await this.userFirstInvestmentModel.distinct("userAddress").exec();
      this.logger.log(`Fetched ${uniqueUserAddresses.length} unique user addresses.`);
      return uniqueUserAddresses;
    } catch (error) {
      this.logger.error(`Failed to fetch unique user addresses. Error: ${error.message}`, error.stack);
      throw error;
    }
  }
}
