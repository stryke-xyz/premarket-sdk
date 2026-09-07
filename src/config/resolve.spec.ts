/**
 * The resolver is the single point every consumer depends on for "which
 * contracts belong to this chain". If it silently falls back, resolves a
 * partially-configured chain, or hands back another chain's addresses, every
 * downstream service transacts against the wrong contracts while reporting
 * healthy. Assert the guarantees rather than the implementation.
 */
import { describe, expect, it } from "bun:test";
import { SUPPORTED_CHAIN_IDS, isSupportedChain } from "./chains.js";
import {
  getChainConfig,
  tryGetChainConfig,
  UnsupportedChainError,
} from "./resolve.js";

const ADDRESS = /^0x[0-9a-fA-F]{40}$/;

describe("getChainConfig", () => {
  for (const chainId of SUPPORTED_CHAIN_IDS) {
    it(`resolves every required address for chain ${chainId}`, () => {
      const cfg = getChainConfig(chainId);
      expect(cfg.chainId).toBe(chainId);
      expect(cfg.chain.id).toBe(chainId);
      expect(cfg.contracts.exchange).toMatch(ADDRESS);
      expect(cfg.contracts.optionMarketVault).toMatch(ADDRESS);
      expect(cfg.contracts.entryPoint).toMatch(ADDRESS);
      expect(cfg.contracts.simpleAccountFactory).toMatch(ADDRESS);
      expect(cfg.contracts.permit2).toMatch(ADDRESS);
    });

    it(`resolves a collateral asset for chain ${chainId}`, () => {
      const { collateral } = getChainConfig(chainId);
      expect(collateral.address).toMatch(ADDRESS);
      expect(collateral.symbol.length).toBeGreaterThan(0);
      expect(collateral.decimals).toBeGreaterThan(0);
    });
  }

  it("does not share contracts between distinct chains", () => {
    // A resolver bug that fell back to one chain would still satisfy every
    // per-chain assertion above; only cross-chain comparison catches it.
    const seen = new Map<string, number>();
    for (const id of SUPPORTED_CHAIN_IDS) {
      const ex = getChainConfig(id).contracts.exchange.toLowerCase();
      const prev = seen.get(ex);
      expect(
        prev,
        `chains ${prev} and ${id} share exchange ${ex}`,
      ).toBeUndefined();
      seen.set(ex, id);
    }
  });

  it("gives MegaETH and Robinhood different collateral assets", () => {
    // The concrete case that broke consumers: USDM has no Robinhood entry, so
    // anything reading USDM[chainId] got undefined instead of USDG.
    expect(getChainConfig(4326).collateral.symbol).toBe("USDm");
    expect(getChainConfig(4663).collateral.symbol).toBe("USDG");
  });

  it("throws on an unconfigured chain rather than falling back", () => {
    expect(() => getChainConfig(999_999)).toThrow(UnsupportedChainError);
    expect(tryGetChainConfig(999_999)).toBeNull();
  });

  it("names the supported chains in the error, so the fix is obvious", () => {
    expect(() => getChainConfig(1)).toThrow(/4663/);
  });
});

describe("isSupportedChain", () => {
  it("accepts every configured chain and rejects others", () => {
    for (const id of SUPPORTED_CHAIN_IDS) expect(isSupportedChain(id)).toBe(true);
    expect(isSupportedChain(1)).toBe(false);
    expect(isSupportedChain(999_999)).toBe(false);
  });
});
