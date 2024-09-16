import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ArrakisVaultOperationDocument } from "../schemas/ArrakisVaultOperation.schema";

@Injectable()
export class VaultDbService {
  private readonly logger = new Logger(VaultDbService.name);

  constructor(
    @InjectModel(ArrakisVaultOperationDocument.name)
    private arrakisVaultOperationsModel: Model<ArrakisVaultOperationDocument>,
  ) {}

  /**
   * Retrieves a list of all unique user addresses from the ArrakisVaultOperationDocument collection
   * for a specific vault address.
   *
   * @param {string} vaultAddress - The address of the vault.
   * @returns {Promise<string[]>} An array of unique user addresses.
   */
  public async getUniqueUserAddressesByPortfolio(vaultAddress: string): Promise<string[]> {
    try {
      const userAddresses = await this.arrakisVaultOperationsModel.distinct("metadata.userAddress", {
        "metadata.vaultAddress": vaultAddress.toLowerCase(),
      });
      this.logger.log(`Fetched ${userAddresses.length} unique user addresses for ${vaultAddress}.`);
      return userAddresses.map((address) => address.toLowerCase());
    } catch (error) {
      this.logger.error(`Failed to fetch unique user addresses. Error: ${error.message}`, error.stack);
      throw error;
    }
  }
}
