const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/i;

export function isErc20TokenId(tokenId: string | undefined | null): boolean {
  return tokenId === "erc20" || ADDRESS_RE.test(tokenId ?? "");
}

export function isOprmTokenId(tokenId: string | undefined | null): boolean {
  if (!tokenId || isErc20TokenId(tokenId)) return false;
  try { return (BigInt(tokenId) & 1n) !== 0n; } catch { return false; }
}

/** Collapse oPRM (odd) → PRM (even). ERC20 address tokenIds are returned unchanged. */
export function canonTokenId(tokenId: string): string {
  if (!tokenId || isErc20TokenId(tokenId)) return tokenId;
  try { return (BigInt(tokenId) & ~1n).toString(); } catch { return tokenId; }
}
