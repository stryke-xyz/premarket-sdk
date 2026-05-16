/** Lifecycle states emitted by realtime sync clients. */
export type SyncStatus =
  | "connecting"
  | "syncing"
  | "synced"
  | "recovering"
  | "disconnected"
  | "error";
