import { BaseSyncClient } from "./base-client.js";

export interface BalanceData {
  maker: string;
  token: string;
  usableBalance: string;
  tokenId?: string; // Required for ERC6909 tokens (as string for JSON serialization)
}

export interface BalanceUpdateMessage {
  type: "balanceUpdate";
  seq: number; // Sequence number for ordering
  marketId: string;
  balances: BalanceData[];
  timestamp: number;
}

export interface BalanceSyncClientConfig {
  redisUrl: string;
  marketId: string;
  channel: string;
  gapRecoveryUrl?: string;
  snapshotUrl?: string;
}

export class BalanceSyncClient extends BaseSyncClient<
  BalanceUpdateMessage,
  BalanceData[],
  BalanceData,
  BalanceSyncClientConfig
> {
  private balanceListeners: Set<(balances: BalanceData[]) => void> = new Set();

  constructor(config: Omit<BalanceSyncClientConfig, "channel">) {
    // Build full config with channel
    const fullConfig: BalanceSyncClientConfig = {
      ...config,
      channel: `orderbook:market:${config.marketId}:balances`,
    };
    super(fullConfig);
  }

  protected async fetchSnapshot(): Promise<void> {
    try {
      // Use snapshotUrl if available, otherwise fall back to gapRecoveryUrl
      const baseUrl = this.config.snapshotUrl || this.config.gapRecoveryUrl;
      if (!baseUrl) {
        // If no URL, start from 0
        this.lastSeq = 0;
        return;
      }

      const url = `${baseUrl}/orderbook/api/sync/balance-snapshot?marketId=${this.config.marketId}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(
          `Balance snapshot fetch failed: ${response.status} ${response.statusText}`
        );
      }

      const data = (await response.json()) as any;
      if (data.success && data.data) {
        const balances: BalanceData[] = data.data.balances || [];
        const snapshotSeq = data.data.seq || 0;

        // Clear and populate balance map
        this.dataMap.clear();
        for (const balance of balances) {
          const key = balance.tokenId
            ? `${balance.maker.toLowerCase()}:${balance.token.toLowerCase()}:${balance.tokenId}`
            : `${balance.maker.toLowerCase()}:${balance.token.toLowerCase()}`;
          this.dataMap.set(key, balance);
        }

        this.lastSeq = snapshotSeq;

        // Notify snapshot listeners
        this.notifySnapshotListeners(balances);
      }
    } catch (error) {
      console.error("Error fetching balance snapshot:", error);
      // Fallback to starting from 0
      this.lastSeq = 0;
    }
  }

  protected applyMessage(message: BalanceUpdateMessage): void {
    // Update balance map
    for (const balance of message.balances) {
      // For ERC6909 tokens, include tokenId in the key
      const key = balance.tokenId
        ? `${balance.maker.toLowerCase()}:${balance.token.toLowerCase()}:${balance.tokenId}`
        : `${balance.maker.toLowerCase()}:${balance.token.toLowerCase()}`;
      this.dataMap.set(key, balance);
    }

    // Notify change listeners (from base class)
    this.changeListeners.forEach((listener) => {
      try {
        listener(message.balances);
      } catch (error) {
        console.error("Error in change listener:", error);
      }
    });

    // Notify balance-specific listeners
    this.balanceListeners.forEach((listener) => {
      try {
        listener(message.balances);
      } catch (error) {
        console.error("Error in balance listener:", error);
      }
    });
  }

  protected async recoverGap(
    fromSeq: number,
    toSeq: number
  ): Promise<BalanceUpdateMessage[]> {
    if (!this.config.gapRecoveryUrl) {
      return [];
    }

    const gapSize = toSeq - fromSeq + 1;

    if (gapSize > 1000) {
      await this.fullResync();
      return [];
    }

    this.setStatus("recovering");

    try {
      const url = `${this.config.gapRecoveryUrl}/orderbook/api/sync/balance-messages?marketId=${this.config.marketId}&fromSeq=${fromSeq}&toSeq=${toSeq}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(
          `Gap recovery failed: ${response.status} ${response.statusText}`
        );
      }

      const data = (await response.json()) as any;

      if (data.success && data.data) {
        const messages: BalanceUpdateMessage[] = data.data;
        messages.sort((a, b) => a.seq - b.seq);
        this.setStatus("synced");
        return messages;
      }

      this.setStatus("synced");
      return [];
    } catch (error) {
      console.error("Error recovering gap:", error);
      await this.fullResync();
      return [];
    }
  }

  /**
   * Get usable balance for a maker/token pair (or maker/token/tokenId for ERC6909)
   */
  getUsableBalance(
    maker: string,
    token: string,
    tokenId?: string | bigint
  ): string | undefined {
    const key = tokenId
      ? `${maker.toLowerCase()}:${token.toLowerCase()}:${tokenId.toString()}`
      : `${maker.toLowerCase()}:${token.toLowerCase()}`;
    const balanceData = this.dataMap.get(key);
    return balanceData?.usableBalance;
  }

  /**
   * Get all balances as a map of key -> balance string
   */
  getBalanceMap(): Map<string, string> {
    const map = new Map<string, string>();
    for (const [key, balanceData] of this.dataMap.entries()) {
      map.set(key, balanceData.usableBalance);
    }
    return map;
  }

  /**
   * Get all balances as BalanceData array
   */
  getBalances(): BalanceData[] {
    return Array.from(this.dataMap.values());
  }

  onBalanceUpdate(callback: (balances: BalanceData[]) => void): () => void {
    this.balanceListeners.add(callback);
    return () => this.balanceListeners.delete(callback);
  }
}
