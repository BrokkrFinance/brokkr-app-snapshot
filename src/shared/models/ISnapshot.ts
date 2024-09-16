import { Address } from "viem";

// Base class for common properties
export class HoldingDataBase {
  public userAddress: Address;
  public usdEquivalent: number;

  constructor(userAddress: Address, usdEquivalent: number) {
    this.userAddress = userAddress;
    this.usdEquivalent = usdEquivalent;
  }
}

// Class for single token holdings eg. TokenIndex and TokenBased
export class SingleTokenHoldingData extends HoldingDataBase {
  public tokenAmount: number;

  constructor(userAddress: Address, tokenAmount: number, usdEquivalent: number) {
    super(userAddress, usdEquivalent);
    this.tokenAmount = tokenAmount;
  }
}

// Class for multi-token holdings (e.g., Arrakis vaults tokens or DCA)
export class MultiTokenHoldingData extends HoldingDataBase {
  public tokenAmount: number;
  public token0Name: string;
  public token1Name: string;
  public token0Amount: number;
  public token1Amount: number;

  constructor(
    userAddress: Address,
    usdEquivalent: number,
    tokenAmount: number,
    token0Name: string,
    token1Name: string,
    token0Amount: number,
    token1Amount: number,
  ) {
    super(userAddress, usdEquivalent);
    this.tokenAmount = tokenAmount;
    this.token0Name = token0Name;
    this.token1Name = token1Name;
    this.token0Amount = token0Amount;
    this.token1Amount = token1Amount;
  }
}

// Snapshot data that can include either single or multi-token holding data
export class SnapshotData<T extends HoldingDataBase> {
  address: Address;
  tokenName: string;
  totalTokenSupply: number;
  tvlUsd: number;
  holdingData: T[];
  token0Price?: string;
  token1Price?: string;

  constructor(
    address: Address,
    tokenName: string,
    totalTokenSupply: number,
    tvlUsd: number,
    holdingData: T[],
    token0Price?: string,
    token1Price?: string,
  ) {
    this.address = address;
    this.tokenName = tokenName;
    this.totalTokenSupply = totalTokenSupply;
    this.tvlUsd = tvlUsd;
    if (token0Price) this.token0Price = token0Price;
    if (token1Price) this.token1Price = token1Price;
    this.holdingData = holdingData;
  }
}

export interface HoldingData {
  userAddress: string;
  usdEquivalent: number;
  tokenAmount: number;
  token0Name?: string;
  token1Name?: string;
  token0Amount?: number;
  token1Amount?: number;
}

// Interfaces for different types of snapshots
export interface TokenIndexSnapshot {
  snapshotData: SnapshotData<SingleTokenHoldingData>[];
}

export interface TokenBasedSnapshot {
  snapshotData: SnapshotData<SingleTokenHoldingData>[];
}

export interface ArrakisVaultSnapshot {
  snapshotData: SnapshotData<MultiTokenHoldingData>[];
}

export interface DcaSnapshot {
  snapshotData: SnapshotData<MultiTokenHoldingData>[];
}

export type SnapshotType = TokenIndexSnapshot | TokenBasedSnapshot | ArrakisVaultSnapshot | DcaSnapshot;
