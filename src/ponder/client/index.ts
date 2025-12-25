import type { PonderClientConfig } from "../types.js";
import { createClient, type Client } from "../generated/index.js";
import {
  getMarkets,
  getMarket,
  getMarketData,
  getMarketPositions,
  getHourlyVolumes,
  get24hVolume,
  type MarketData,
  type MarketPositions,
} from "./queries/markets.js";
import {
  getUserCollateralPositions,
  getUserOptionPositions,
  getUserHistories,
  getAllUserOptionPositions,
  getAllUserCollateralPositions,
} from "./queries/positions.js";

export * from "./types/index.js";
export type { MarketData, MarketPositions } from "./queries/markets.js";

export class PonderClient {
  private client: Client;

  constructor(config: PonderClientConfig) {
    this.client = createClient({
      url: config.graphqlUrl,
    });
  }

  async getMarkets() {
    return getMarkets(this.client);
  }

  async getMarket(marketId: string) {
    return getMarket(this.client, marketId);
  }

  async getMarketData(marketId: string) {
    return getMarketData(this.client, marketId);
  }

  async getMarketPositions(marketId: string) {
    return getMarketPositions(this.client, marketId);
  }

  async getUserCollateralPositions(userAddress: string, marketId: string) {
    return getUserCollateralPositions(this.client, userAddress, marketId);
  }

  async getUserOptionPositions(userAddress: string, marketId: string) {
    return getUserOptionPositions(this.client, userAddress, marketId);
  }

  async getUserHistories(userAddress: string, marketId: string) {
    return getUserHistories(this.client, userAddress, marketId);
  }

  async getAllUserOptionPositions(userAddress: string) {
    return getAllUserOptionPositions(this.client, userAddress);
  }

  async getAllUserCollateralPositions(userAddress: string) {
    return getAllUserCollateralPositions(this.client, userAddress);
  }

  async getHourlyVolumes(marketId: string, startTimestamp: bigint, endTimestamp: bigint) {
    return getHourlyVolumes(this.client, marketId, startTimestamp, endTimestamp);
  }

  async get24hVolume(marketId: string, optionId: string) {
    return get24hVolume(this.client, marketId, optionId);
  }
}
