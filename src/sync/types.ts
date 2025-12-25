import type { StoredOrder } from "../shared/types.js";

export type SyncStatus =
  | "connecting"
  | "syncing"
  | "synced"
  | "recovering"
  | "disconnected"
  | "error";

export interface OrderChange {
  type: "INSERT" | "UPDATE" | "DELETE";
  orderHash: string;
  order?: StoredOrder;
}

export interface SequencedMessage {
  seq: number;
  marketId: string;
  change: OrderChange;
  timestamp: number;
}

export interface SyncClientConfig {
  redisUrl: string;
  gapRecoveryUrl?: string;
  marketId: string;
  snapshotUrl?: string;
  channel?: string; // Optional, will be auto-generated if not provided
}
