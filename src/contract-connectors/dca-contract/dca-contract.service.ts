import { Injectable } from "@nestjs/common";
import { Memoize } from "typescript-memoize";
import { Address, getContract, GetContractReturnType, PublicClient } from "viem";
import { dcaAbi } from "../../abis/abi";
import { EvmConnectorService } from "../../blockchain-connectors/evm-connector/evm-connector.service";
import { Erc20Service } from "../erc20/erc20.service";
import Big from "big.js";
import { CoingeckoService } from "../../price-oracles/coingecko/coingecko.service";
import { DcaDbService } from "../../db/dca-db/dca-db.service";
import { BrokkrSnapshotConfigService } from "../../config/brokkr-snapshot-config.service";
import { range } from "../../shared/utils/common-utils";
import { IDcaPosition } from "../../shared/models/IDcaPosition";
import { DcaPortfolioConfig } from "../../shared/class/BrokkrSnapshotConfig";
import { DCA_DEPOSIT_COIN_COINGECKO_NAME } from "../../shared/constants";

@Injectable()
export class DcaContractService {
  constructor(
    private evmConnector: EvmConnectorService,
    private erc20Service: Erc20Service,
    private dcaDbService: DcaDbService,
    private coingeckoService: CoingeckoService,
    private configService: BrokkrSnapshotConfigService,
  ) {}

  public async getUsersEquityValuation(
    usersAddress: Address,
    portfolioAddress: Address,
    blocknumber: number | bigint,
  ): Promise<number> {
    const contract = this.getDcaContract(portfolioAddress);

    const [[depositorInfo, expectedHistoryIndexAtTimestamp], timestamp, investments] = await Promise.all([
      await this.evmConnector.client.multicall({
        blockNumber: BigInt(blocknumber),
        allowFailure: false,
        contracts: [
          {
            ...contract,
            functionName: "depositorInfo",
            args: [usersAddress],
          },
          {
            ...contract,
            functionName: "currentDCAHistoryIndex",
          },
        ],
        multicallAddress: this.configService.multicallV3Address,
      }),
      this.evmConnector.getBlockTimestamp(BigInt(blocknumber)),
      this.dcaDbService.getInvestEvents(portfolioAddress),
    ]);

    let historyIndexAtTimestamp = 0;
    if (expectedHistoryIndexAtTimestamp > 0n) {
      historyIndexAtTimestamp = Math.max(
        ...Array.from(investments.keys()).filter((k) => k <= Number(expectedHistoryIndexAtTimestamp)),
      );
    }

    const positions: IDcaPosition[] = depositorInfo.positions as IDcaPosition[];
    let totalUsdcBalance = Big(0);
    let totalBluechipBalance = Big(0);

    for (const position of positions) {
      const depositedUsdc = await this.denominateDcaDepositToken(position.depositAmount, portfolioAddress);
      const userInvestedAtIndex = Number(position.investedAtHistoricalIndex);
      const amountSplit = Number(position.amountSplit);
      const perPeriodInvestment = Big(depositedUsdc).div(amountSplit);
      let notInvestedUsdc = Big(userInvestedAtIndex + amountSplit - historyIndexAtTimestamp).mul(perPeriodInvestment);

      if (notInvestedUsdc.lt(0)) {
        notInvestedUsdc = Big(0);
      }

      let investmentCount = 0;
      let boughtBluechip = Big(0);
      let usdcStillToInvestDueToInvestFailed = Big(0);

      for (const period of range(userInvestedAtIndex + 1, +historyIndexAtTimestamp + 1)) {
        const investment = investments.get(period);
        if (investmentCount >= amountSplit && usdcStillToInvestDueToInvestFailed.lte(0)) {
          break;
        }

        if (investment && investment.metadata.bluechipPrice > 0) {
          boughtBluechip = boughtBluechip.plus(perPeriodInvestment.div(investment.metadata.bluechipPrice));
          if (usdcStillToInvestDueToInvestFailed.gt(0)) {
            boughtBluechip = boughtBluechip.plus(
              usdcStillToInvestDueToInvestFailed.div(investment.metadata.bluechipPrice),
            );
            usdcStillToInvestDueToInvestFailed = Big(0);
          }
        } else {
          usdcStillToInvestDueToInvestFailed = usdcStillToInvestDueToInvestFailed.plus(perPeriodInvestment);
        }

        investmentCount++;
      }

      totalUsdcBalance = totalUsdcBalance.plus(notInvestedUsdc).plus(usdcStillToInvestDueToInvestFailed);
      totalBluechipBalance = totalBluechipBalance.plus(boughtBluechip);
    }

    const bluechipPriceUsd = await this.coingeckoService.getTokenUsdPrice(
      this.configService.getDcaBlueChipTokenCoingeckoId(portfolioAddress),
      Number(timestamp),
    );

    return totalUsdcBalance.plus(totalBluechipBalance.mul(Big(bluechipPriceUsd))).toNumber();
  }

  public async getUsersDepositAndBluechipTokenHoldings(
    usersAddress: Address,
    portfolioAddress: Address,
    blocknumber: number | bigint,
  ): Promise<[Big, Big]> {
    const contract = this.getDcaContract(portfolioAddress);

    const [[depositorInfo, expectedHistoryIndexAtTimestamp], investments] = await Promise.all([
      await this.evmConnector.client.multicall({
        blockNumber: BigInt(blocknumber),
        allowFailure: false,
        contracts: [
          {
            ...contract,
            functionName: "depositorInfo",
            args: [usersAddress],
          },
          {
            ...contract,
            functionName: "currentDCAHistoryIndex",
          },
        ],
        multicallAddress: this.configService.multicallV3Address,
      }),
      this.dcaDbService.getInvestEvents(portfolioAddress),
    ]);

    let historyIndexAtTimestamp = 0;
    if (expectedHistoryIndexAtTimestamp > 0n) {
      historyIndexAtTimestamp = Math.max(
        ...Array.from(investments.keys()).filter((k) => k <= Number(expectedHistoryIndexAtTimestamp)),
      );
    }

    const positions: IDcaPosition[] = depositorInfo.positions as IDcaPosition[];
    let totalUsdcBalance = Big(0);
    let totalBluechipBalance = Big(0);

    for (const position of positions) {
      const depositedUsdc = await this.denominateDcaDepositToken(position.depositAmount, portfolioAddress);
      const userInvestedAtIndex = Number(position.investedAtHistoricalIndex);
      const amountSplit = Number(position.amountSplit);
      const perPeriodInvestment = Big(depositedUsdc).div(amountSplit);
      let notInvestedUsdc = Big(userInvestedAtIndex + amountSplit - historyIndexAtTimestamp).mul(perPeriodInvestment);

      if (notInvestedUsdc.lt(0)) {
        notInvestedUsdc = Big(0);
      }

      let investmentCount = 0;
      let boughtBluechip = Big(0);
      let usdcStillToInvestDueToInvestFailed = Big(0);

      for (const period of range(userInvestedAtIndex + 1, +historyIndexAtTimestamp + 1)) {
        const investment = investments.get(period);
        if (investmentCount >= amountSplit && usdcStillToInvestDueToInvestFailed.lte(0)) {
          break;
        }

        if (investment && investment.metadata.bluechipPrice > 0) {
          boughtBluechip = boughtBluechip.plus(perPeriodInvestment.div(investment.metadata.bluechipPrice));
          if (usdcStillToInvestDueToInvestFailed.gt(0)) {
            boughtBluechip = boughtBluechip.plus(
              usdcStillToInvestDueToInvestFailed.div(investment.metadata.bluechipPrice),
            );
            usdcStillToInvestDueToInvestFailed = Big(0);
          }
        } else {
          usdcStillToInvestDueToInvestFailed = usdcStillToInvestDueToInvestFailed.plus(perPeriodInvestment);
        }

        investmentCount++;
      }

      totalUsdcBalance = totalUsdcBalance.plus(notInvestedUsdc).plus(usdcStillToInvestDueToInvestFailed);
      totalBluechipBalance = totalBluechipBalance.plus(boughtBluechip);
    }
    return [totalUsdcBalance, totalBluechipBalance];
  }

  public async denominateDcaDepositToken(amount: bigint, contractAddress: Address): Promise<string> {
    if (amount == 0n) {
      return "0";
    }

    try {
      const depositTokensDecimals = await this.getDcaDepositTokensDecimals(contractAddress);

      const amountDenominated = Big(amount.toString()).div(Math.pow(10, depositTokensDecimals));

      return amountDenominated.toFixed(depositTokensDecimals);
    } catch (e) {
      console.log(e);
      return "8";
    }
  }

  @Memoize()
  public async getDcaDepositTokensDecimals(strategyContractAddress: Address): Promise<number> {
    const contract = this.getDcaContract(strategyContractAddress);
    const [, decimals] = await contract.read.depositTokenInfo();

    return decimals;
  }

  @Memoize()
  public async getDcaBluechipTokensDecimals(strategyContractAddress: Address): Promise<number> {
    const contract = this.getDcaContract(strategyContractAddress);

    const equityValuation = await contract.read.equityValuation();

    const bluechipTokenAddress = equityValuation[0].bluechipToken;

    return this.erc20Service.getErc20TokenDecimals(bluechipTokenAddress);
  }

  public async getUnderlyingTokenAmounts(
    strategyContractAddress: Address,
    blocknumber: number | bigint,
  ): Promise<{ depositToken: number; bluechipToken: number }> {
    const contract = this.getDcaContract(strategyContractAddress);
    const equityValuation = await contract.read.equityValuation({ blockNumber: BigInt(blocknumber) });
    const depositTokenDecimals = await this.getDcaDepositTokensDecimals(strategyContractAddress);
    const bluechipTokenDecimals = await this.getDcaBluechipTokensDecimals(strategyContractAddress);

    return {
      depositToken: Number(equityValuation[0].totalDepositToken) / Math.pow(10, +depositTokenDecimals),
      bluechipToken: Number(equityValuation[0].totalBluechipToken) / Math.pow(10, +bluechipTokenDecimals),
    };
  }

  public async getTvlUsd(dcaPortfolioConfig: DcaPortfolioConfig, blocknumber: number | bigint): Promise<number> {
    const blockTimestamp = await this.evmConnector.getBlockTimestamp(BigInt(blocknumber));
    const tokenAmounts = await this.getUnderlyingTokenAmounts(dcaPortfolioConfig.address, blocknumber);

    const depositTokenPrice = await this.coingeckoService.getTokenUsdPrice(
      DCA_DEPOSIT_COIN_COINGECKO_NAME,
      Number(blockTimestamp),
    );

    const bluechipTokenPrice = await this.coingeckoService.getTokenUsdPrice(
      dcaPortfolioConfig.bluechipTokenCoingeckoId,
      Number(blockTimestamp),
    );

    return tokenAmounts.depositToken * +depositTokenPrice + tokenAmounts.bluechipToken * +bluechipTokenPrice;
  }

  public async getBluechipTokenPrice(
    dcaPortfolioConfig: DcaPortfolioConfig,
    blocknumber: number | bigint,
  ): Promise<string> {
    const blockTimestamp = await this.evmConnector.getBlockTimestamp(BigInt(blocknumber));
    return await this.coingeckoService.getTokenUsdPrice(
      dcaPortfolioConfig.bluechipTokenCoingeckoId,
      Number(blockTimestamp),
    );
  }

  /**
   * Construct DCA contract instance
   * @param address - DCA contract address
   * @private
   */
  @Memoize()
  private getDcaContract(address: Address): GetContractReturnType<typeof dcaAbi, PublicClient> {
    return getContract({
      address,
      abi: dcaAbi,
      client: this.evmConnector.client,
    });
  }
}
