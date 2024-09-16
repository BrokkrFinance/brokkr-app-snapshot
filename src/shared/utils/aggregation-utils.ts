import SortedSet from "collections/sorted-set";
import { IPriceEntity } from "../models/IPriceEntity";

/**
 * @description Construct array of ascending timestamps given the start, end and interval time
 * @param startTime
 * @param endTime
 */
export function constructTimestamps(startTime: number, endTime: number, intervalInMs: number): number[] {
  const res = [];

  for (let timestamp = startTime; timestamp <= endTime; timestamp += intervalInMs) {
    res.push(timestamp);
  }

  return res;
}

export function findClosestPriceEntityOlderOrEqThan(
  timestampMs: number,
  set: SortedSet.SortedSet<IPriceEntity>,
): IPriceEntity | undefined {
  return set.findLeastGreaterThanOrEqual({ timestampMs, tokenPrice: "-1" })?.value;
}

export function findClosestPriceEntityYoungerOrEqThan(
  timestampMs: number,
  set: SortedSet.SortedSet<IPriceEntity>,
): IPriceEntity | undefined {
  return set.findGreatestLessThanOrEqual({ timestampMs, tokenPrice: "-1" })?.value;
}
