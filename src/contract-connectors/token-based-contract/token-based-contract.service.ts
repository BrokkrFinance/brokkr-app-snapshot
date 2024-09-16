import { Injectable } from "@nestjs/common";
import { EvmConnectorService } from "../../blockchain-connectors/evm-connector/evm-connector.service";
import { Erc20Service } from "../erc20/erc20.service";
import { Memoize } from "typescript-memoize";
import { Address, getContract, GetContractReturnType, PublicClient } from "viem";
import { tokenBasedPortfolioAbi } from "../../abis/abi";
import Big from "big.js";
import { BrokkrSnapshotConfigService } from "../../config/brokkr-snapshot-config.service";
import { STRATEGY_EQUITY_VALUATION_RESPONSE_DECIMALS } from "../../shared/constants";

@Injectable()
export class TokenBasedContractService {
  constructor(
    private evmConnector: EvmConnectorService,
    private erc20Service: Erc20Service,
    private configService: BrokkrSnapshotConfigService,
  ) {}

  public async getEquityValuationForUserAndPortfolio(
    userAddress: string | Address,
    portfolioAddress: string | Address,
    blocknumber: number,
  ): Promise<number> {
    const contract = this.getTokenBasedPortfolioContract(portfolioAddress as Address);

    const [investmentTokenAddress, investmentTokenBalance, equityValuation, investmentTokenSupply] =
      await this.evmConnector.client.multicall({
        blockNumber: BigInt(blocknumber),
        allowFailure: false,
        contracts: [
          {
            ...contract,
            functionName: "getInvestmentToken",
          },
          {
            ...contract,
            functionName: "getInvestmentTokenBalanceOf",
            args: [userAddress as Address],
          },
          {
            ...contract,
            functionName: "getEquityValuation",
            args: [true, false],
          },
          {
            ...contract,
            functionName: "getInvestmentTokenSupply",
          },
        ],
        multicallAddress: this.configService.multicallV3Address,
      });

    const investmentTokenDecimals = await this.erc20Service.getErc20TokenDecimals(investmentTokenAddress);
    const investmentTokenNormalisedBalance = Big(investmentTokenBalance.toString())
      .div(Math.pow(10, investmentTokenDecimals))
      .toNumber();

    const tokenPrice = Big(equityValuation.toString()).div(Big(investmentTokenSupply.toString())).toNumber();

    return investmentTokenNormalisedBalance * tokenPrice;
  }

  public async getEquityValuationForPortfolio(
    portfolioAddress: Address,
    blocknumber: number | bigint,
  ): Promise<number> {
    const indexContract = this.getTokenBasedPortfolioContract(portfolioAddress);
    const equityValuation = await indexContract.read.getEquityValuation([true, false], {
      blockNumber: BigInt(blocknumber),
    });

    const tvlUsd = Big(equityValuation.toString())
      .div(Math.pow(10, STRATEGY_EQUITY_VALUATION_RESPONSE_DECIMALS))
      .toNumber();

    return tvlUsd;
  }

  public async getInvestmentTokenBalance(
    portfolioAddress: string | Address,
    userAddress: string | Address,
    blocknumber: number | bigint,
  ): Promise<number> {
    const contract = this.getTokenBasedPortfolioContract(portfolioAddress as Address);

    const [decimals, balance] = await Promise.all([
      this.getInvestmentTokenDecimals(portfolioAddress),
      contract.read.getInvestmentTokenBalanceOf([userAddress as Address], { blockNumber: BigInt(blocknumber) }),
    ]);

    return Big(balance.toString()).div(Math.pow(10, decimals)).toNumber();
  }

  public async getTotalTokenSupply(portfolioAddress: string | Address, blocknumber: number | bigint): Promise<number> {
    const contract = this.getTokenBasedPortfolioContract(portfolioAddress as Address);
    const investmentTokenAddress = await contract.read.getInvestmentToken();
    const erc20Contract = this.erc20Service.getErc20Contract(investmentTokenAddress);

    const [investmentTokenSupply, investmentTokenDecimals] = await Promise.all([
      erc20Contract.read.totalSupply({ blockNumber: BigInt(blocknumber) }),
      this.erc20Service.getErc20TokenDecimals(investmentTokenAddress),
    ]);

    return Big(investmentTokenSupply.toString()).div(Math.pow(10, investmentTokenDecimals)).toNumber();
  }

  @Memoize()
  private async getInvestmentTokenDecimals(portfolioAddress: string | Address): Promise<number> {
    const contract = this.getTokenBasedPortfolioContract(portfolioAddress as Address);

    const investmentTokenAddress = await contract.read.getInvestmentToken();

    return this.erc20Service.getErc20TokenDecimals(investmentTokenAddress);
  }

  @Memoize()
  private getTokenBasedPortfolioContract(
    address: Address,
  ): GetContractReturnType<typeof tokenBasedPortfolioAbi, PublicClient> {
    return getContract({
      address,
      abi: tokenBasedPortfolioAbi,
      client: this.evmConnector.client,
    });
  }

  @Memoize()
  public async getTokenName(portfolioAddress: Address): Promise<string> {
    const contract = this.getTokenBasedPortfolioContract(portfolioAddress as Address);
    const investmentTokenAddress = await contract.read.getInvestmentToken();

    return this.erc20Service.getTokenSymbol(investmentTokenAddress);
  }
}
