import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { TokenBasedOperationDocument } from "../schemas/TokenBased.schema";

@Injectable()
export class TokenBasedDbService {
  private readonly logger = new Logger(TokenBasedDbService.name);

  constructor(
    @InjectModel(TokenBasedOperationDocument.name)
    private tokenBasedOperationsModel: Model<TokenBasedOperationDocument>,
  ) {}

  /**
   * Retrieves a list of all unique user addresses from the TokenBasedOperationDocument collection
   * for a specific portfolio address.
   *
   * @param {string} portfolioAddress - The address of the portfolio.
   * @returns {Promise<string[]>} An array of unique user addresses.
   */
  public async getUniqueUserAddressesByPortfolio(portfolioAddress: string): Promise<string[]> {
    try {
      const userAddresses = await this.tokenBasedOperationsModel.distinct("metadata.userAddress", {
        "metadata.portfolioAddress": portfolioAddress.toLowerCase(),
      });
      this.logger.log(`Fetched ${userAddresses.length} unique user addresses for ${portfolioAddress}.`);
      return userAddresses.map((address) => address.toLowerCase());
    } catch (error) {
      this.logger.error(`Failed to fetch unique user addresses. Error: ${error.message}`, error.stack);
      throw error;
    }
  }
}
