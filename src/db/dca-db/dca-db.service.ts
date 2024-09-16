import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { DcaInvestEventDocument } from "../schemas/DcaInvestEventSchema";
import { DcaOperationDocument } from "../schemas/DcaOperationsSchema";

@Injectable()
export class DcaDbService {
  private readonly logger = new Logger(DcaDbService.name);

  constructor(
    @InjectModel(DcaOperationDocument.name)
    private dcaOperationsModel: Model<DcaOperationDocument>,
    @InjectModel(DcaInvestEventDocument.name)
    private investEventModel: Model<DcaInvestEventDocument>,
  ) {}

  public async getInvestEvents(portfolioAddress: string): Promise<Map<number, DcaInvestEventDocument>> {
    const investEvents = await this.investEventModel
      .find({ "metadata.portfolioAddress": portfolioAddress.toLowerCase() })
      .exec();

    const investments: Map<number, DcaInvestEventDocument> = new Map();

    for (const event of investEvents) {
      investments.set(event.metadata.investmentIndex, event);
    }

    return investments;
  }

  /**
   * Retrieves a list of all unique user addresses from the DcaOperationDocument collection
   * for a specific portfolio address.
   *
   * @param {string} portfolioAddress - The address of the DCA portfolio.
   * @returns {Promise<string[]>} An array of unique user addresses.
   */
  public async getUniqueUserAddressesByPortfolio(portfolioAddress: string): Promise<string[]> {
    try {
      const userAddresses = await this.dcaOperationsModel.distinct("metadata.userAddress", {
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
