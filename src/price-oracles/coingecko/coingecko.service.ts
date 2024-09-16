import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { DateTime } from "luxon";
import SortedSet from "collections/sorted-set";
import { AxiosResponse } from "axios";
import { MemoizeExpiring } from "typescript-memoize";
import { BrokkrSnapshotConfigService } from "../../config/brokkr-snapshot-config.service";
import {
  COINGECKO_MAX_DAYS_FOR_HOURLY_DATA,
  DAY_IN_MS,
  DAY_IN_S,
  FIVE_MIN_IN_MS,
  HOUR_IN_MS,
} from "../../shared/constants";
import { IPriceEntity } from "../../shared/models/IPriceEntity";
import { ICoingeckoDataResponse } from "../../shared/models/ICoingeckoData";
import { cacheCoingeckoResponse, getHourlyTokenPriceFromCache } from "../../shared/utils/coingecko-utils";

@Injectable()
export class CoingeckoService {
  // Map from coingecko token id to Set of timestamped prices
  private readonly tokenPriceHourlyCache = new Map<string, SortedSet.SortedSet<IPriceEntity>>();

  // track ongoing requests in order to not query same coinId for overlapping time range
  private ongoingRequests: Map<
    string,
    { request: Promise<AxiosResponse<ICoingeckoDataResponse>>; range: [number, number] }[]
  > = new Map();

  constructor(
    private configService: BrokkrSnapshotConfigService,
    private readonly logger: Logger,
    private readonly httpService: HttpService,
  ) {}

  @MemoizeExpiring(FIVE_MIN_IN_MS, (coinId, fromTimestampMs) => coinId + fromTimestampMs)
  public async getTokenUsdPrice(coinId: string, fromTimestampMs: number): Promise<string> {
    // ensure timestamp set to start of an hour
    const timestampHourStart = DateTime.fromMillis(fromTimestampMs).startOf("hour");
    const fromTimestampSeconds = Math.floor(timestampHourStart.startOf("day").toSeconds());

    // eagerly try to get hourly price precision first
    const tokenPrice = getHourlyTokenPriceFromCache(
      timestampHourStart.toMillis(),
      this.tokenPriceHourlyCache.get(coinId),
      HOUR_IN_MS,
    );

    if (tokenPrice) {
      // we found tokenPrice in cache, return it
      return tokenPrice;
    } else {
      // we did not find token price in cache, query coingecko api or ongoing request, save in cache and return nearest price
      const res: AxiosResponse<ICoingeckoDataResponse> = await this.queryCoingeckoApi(coinId, fromTimestampSeconds);

      // cache response
      cacheCoingeckoResponse(coinId, res, this.tokenPriceHourlyCache);

      // cache and try to get at least daily price points (some tokens might not have hourly precision)
      const tokenPrice = getHourlyTokenPriceFromCache(
        timestampHourStart.toMillis(),
        this.tokenPriceHourlyCache.get(coinId),
        DAY_IN_MS,
      );

      if (tokenPrice) {
        return tokenPrice;
      } else {
        this.logger.warn(`[getTokenUsdPrice] coinId=${coinId} Returning first price found...`);

        return res.data.prices[0][0].toString();
      }
    }
  }

  private async queryCoingeckoApi(
    coinId: string,
    fromTimestampSeconds: number,
  ): Promise<AxiosResponse<ICoingeckoDataResponse>> {
    // we did not find token price in cache, query coingecko api, save in cache and return nearest price
    const maxToTimestampSeconds = DateTime.fromSeconds(
      fromTimestampSeconds + COINGECKO_MAX_DAYS_FOR_HOURLY_DATA * DAY_IN_S,
    )
      .startOf("day")
      .toSeconds();
    const hourStartNowInSeconds = DateTime.now().startOf("hour").toSeconds();
    const toTimestampSeconds = Math.floor(
      maxToTimestampSeconds > hourStartNowInSeconds ? hourStartNowInSeconds : maxToTimestampSeconds,
    );

    const url = `https://pro-api.coingecko.com/api/v3/coins/${coinId}/market_chart/range?vs_currency=usd&from=${fromTimestampSeconds}&to=${toTimestampSeconds}`;
    this.logger.log(`Coingecko url: ${url}`);

    const request = this.httpService.axiosRef.get<ICoingeckoDataResponse>(url, {
      headers: { "x-cg-pro-api-key": this.configService.coingeckoApiKey },
    });

    const onGoingRequestsForCoinId = this.ongoingRequests.get(coinId);

    // save request in ongoing requests
    if (!onGoingRequestsForCoinId) {
      this.ongoingRequests.set(coinId, []);
    }

    onGoingRequestsForCoinId?.push({ request: request, range: [fromTimestampSeconds, toTimestampSeconds] });

    const response = await request;

    // clear request from ongoing requests if it still exists
    const i = this.ongoingRequests
      .get(coinId)
      ?.findIndex((v) => v.range[0] == fromTimestampSeconds && v.range[1] == toTimestampSeconds);

    if (i && i > 0) {
      onGoingRequestsForCoinId?.splice(i, 1);
    }

    return response;
  }
}
