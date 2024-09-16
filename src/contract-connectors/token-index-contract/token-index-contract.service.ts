import { Injectable } from "@nestjs/common";
import { EvmConnectorService } from "../../blockchain-connectors/evm-connector/evm-connector.service";
import { Erc20Service } from "../erc20/erc20.service";
import { Memoize } from "typescript-memoize";
import { Address, getContract, GetContractReturnType, PublicClient } from "viem";
import { tokenIndexAbi } from "../../abis/abi";
import Big from "big.js";
import { TOKEN_INDEX_EQUITY_VALUATION_RESPONSE_DECIMALS } from "../../shared/constants";
import { BrokkrSnapshotConfigService } from "../../config/brokkr-snapshot-config.service";

@Injectable()
export class TokenIndexContractService {
  constructor(
    private evmConnector: EvmConnectorService,
    private erc20Service: Erc20Service,
    private configService: BrokkrSnapshotConfigService,
  ) {}

  public async getEquityValuationForUserAndPortfolio(
    userAddress: Address,
    portfolioAddress: Address,
    blocknumber: number | bigint,
  ): Promise<number> {
    const indexContract = this.getIndexContract(portfolioAddress);
    const indexTokenAddress = await this.getIndexTokenAddress(portfolioAddress);
    const erc20Contract = this.erc20Service.getErc20Contract(indexTokenAddress);

    const [userBalance, indexTokenDecimals, equityValuation, investmentTokenSupply] =
      await this.evmConnector.client.multicall({
        blockNumber: BigInt(blocknumber),
        allowFailure: false,
        contracts: [
          {
            ...erc20Contract,
            functionName: "balanceOf",
            args: [userAddress],
          },
          {
            ...erc20Contract,
            functionName: "decimals",
          },
          {
            ...indexContract,
            functionName: "equityValuation",
            args: [true, true],
          },
          {
            ...erc20Contract,
            functionName: "totalSupply",
          },
        ],
        multicallAddress: this.configService.multicallV3Address,
      });

    const investmentTokenBalance = Big(userBalance.toString()).div(Math.pow(10, indexTokenDecimals)).toNumber();

    const tokenPrice = Big(equityValuation.toString())
      .div(Big(investmentTokenSupply.toString()))
      .div(Math.pow(10, TOKEN_INDEX_EQUITY_VALUATION_RESPONSE_DECIMALS - indexTokenDecimals))
      .toNumber();

    return investmentTokenBalance * tokenPrice;
  }

  public async getEquityValuationForPortfolio(
    portfolioAddress: Address,
    blocknumber: number | bigint,
  ): Promise<number> {
    const indexContract = this.getIndexContract(portfolioAddress);
    const equityValuation = await indexContract.read.equityValuation([true, true], {
      blockNumber: BigInt(blocknumber),
    });

    const tvlUsd = Big(equityValuation.toString())
      .div(Math.pow(10, TOKEN_INDEX_EQUITY_VALUATION_RESPONSE_DECIMALS))
      .toNumber();

    return tvlUsd;
  }

  public async getInvestmentTokenBalance(
    portfolioAddress: string | Address,
    userAddress: string | Address,
    blocknumber: number | bigint,
  ): Promise<number> {
    const indexTokenAddress = await this.getIndexTokenAddress(portfolioAddress as Address);

    const [balance, decimals] = await Promise.all([
      this.erc20Service.getBalanceOfAtBlockNumber(userAddress as Address, indexTokenAddress, BigInt(blocknumber)),
      this.erc20Service.getErc20TokenDecimals(indexTokenAddress),
    ]);

    return Big(balance.toString()).div(Math.pow(10, decimals)).toNumber();
  }

  public async getTotalTokenSupply(portfolioAddress: string | Address, blocknumber: number | bigint): Promise<number> {
    const investmentTokenAddress = await this.getIndexTokenAddress(portfolioAddress as Address);

    const erc20Contract = this.erc20Service.getErc20Contract(investmentTokenAddress);

    const [investmentTokenSupply, investmentTokenDecimals] = await Promise.all([
      erc20Contract.read.totalSupply({ blockNumber: BigInt(blocknumber) }),
      this.erc20Service.getErc20TokenDecimals(investmentTokenAddress),
    ]);

    return Big(investmentTokenSupply.toString()).div(Math.pow(10, investmentTokenDecimals)).toNumber();
  }

  @Memoize()
  public async getTokenName(portfolioAddress: Address): Promise<string> {
    const address = await this.getIndexTokenAddress(portfolioAddress);

    return this.erc20Service.getTokenSymbol(address);
  }

  @Memoize()
  private async getIndexTokenAddress(portfolioAddress: Address): Promise<Address> {
    const contract = this.getIndexContract(portfolioAddress);

    return contract.read.indexToken();
  }

  @Memoize()
  private getIndexContract(address: Address): GetContractReturnType<typeof tokenIndexAbi, PublicClient> {
    return getContract({
      address,
      abi: tokenIndexAbi,
      client: this.evmConnector.client,
    });
  }
}
