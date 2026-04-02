import type { StoredOrder } from "../shared/types.js";

/** Lifecycle states emitted by realtime sync clients. */
export type SyncStatus =
  | "connecting"
  | "syncing"
  | "synced"
  | "recovering"
  | "disconnected"
  | "error";

/** Atomic orderbook mutation emitted by the Redis-backed sync stream. */
export interface OrderChange {
  type: "INSERT" | "UPDATE" | "DELETE";
  orderHash: string;
  order?: StoredOrder;
}

/** Ordered sync message carrying one orderbook change and sequence metadata. */
export interface SequencedMessage {
  seq: number; // currentSequenceId
  previousSeq: number; // previousSequenceId
  marketId: string;
  change: OrderChange;
  timestamp: number;
}

/** Shared configuration accepted by Redis-backed sync clients. */
export interface SyncClientConfig {
  redisUrl: string;
  gapRecoveryUrl?: string;
  marketId: string;
  snapshotUrl?: string;
  channel?: string; // Optional, will be auto-generated if not provided
}
