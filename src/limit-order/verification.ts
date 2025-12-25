import { Extension } from "./extensions/extension";

/**
 * Validate maker traits - require:
 * - HAS_EXTENSION_FLAG (bit 249) must be set
 * - ALLOW_MULTIPLE_FILLS_FLAG (bit 254) must be set
 * - NO_PARTIAL_FILLS_FLAG (bit 255) must NOT be set (partial fills must be allowed)
 * - Nonce is required
 * - Expiration is optional
 * - All other flags must be unset
 */
export function validateMakerTraits(makerTraitsHex: string): void {
  const traits = BigInt(makerTraitsHex);

  // Bit masks for allowed features
  const HAS_EXTENSION_FLAG = 1n << 249n;
  const NONCE_MASK = (1n << 40n) - 1n; // bits 120-160 (40 bits)
  const ALLOWED_SENDER_MASK = (1n << 80n) - 1n; // bits 0-80 (80 bits)

  // Extract low 200 bits (allowed sender, expiration, nonce, series)
  const lowBits = traits & ((1n << 200n) - 1n);

  // Check that HAS_EXTENSION_FLAG is set (required)
  if ((traits & HAS_EXTENSION_FLAG) === 0n) {
    throw new Error(
      "Invalid maker traits: HAS_EXTENSION_FLAG (bit 249) is required"
    );
  }

  // Check that ALLOW_MULTIPLE_FILLS_FLAG is set (bit 254 = 1)
  const ALLOW_MULTIPLE_FILLS_FLAG = 1n << 254n;
  if ((traits & ALLOW_MULTIPLE_FILLS_FLAG) === 0n) {
    throw new Error(
      "Invalid maker traits: ALLOW_MULTIPLE_FILLS_FLAG (bit 254) must be set"
    );
  }

  // Check that NO_PARTIAL_FILLS_FLAG is NOT set (bit 255 = 0)
  const NO_PARTIAL_FILLS_FLAG = 1n << 255n;
  if ((traits & NO_PARTIAL_FILLS_FLAG) !== 0n) {
    throw new Error(
      "Invalid maker traits: NO_PARTIAL_FILLS_FLAG (bit 255) must not be set (partial fills must be allowed)"
    );
  }

  // Check that no other forbidden high bits are set (bits 247-253, except 249 and 254)
  const forbiddenFlags =
    (1n << 253n) | // unused
    (1n << 252n) | // PRE_INTERACTION_CALL_FLAG
    (1n << 251n) | // POST_INTERACTION_CALL_FLAG
    (1n << 250n) | // NEED_CHECK_EPOCH_MANAGER_FLAG
    (1n << 248n) | // USE_PERMIT2_FLAG
    (1n << 247n); // UNWRAP_WETH_FLAG

  if ((traits & forbiddenFlags) !== 0n) {
    throw new Error(
      `Invalid maker traits: forbidden flags detected. Only HAS_EXTENSION_FLAG (bit 249) and ALLOW_MULTIPLE_FILLS_FLAG (bit 254) are allowed in high bits`
    );
  }

  // Low 200 bits can have: allowedSender (must be 0), expiration (optional), nonce (required), series (must be 0)
  const series = (lowBits >> 160n) & ((1n << 40n) - 1n);
  if (series !== 0n) {
    throw new Error("Invalid maker traits: series must be 0");
  }

  const nonce = (lowBits >> 120n) & NONCE_MASK;
  if (nonce === 0n) {
    throw new Error("Invalid maker traits: nonce is required");
  }

  // Expiration is optional (can be 0)
  // Allowed sender must be 0
  const allowedSender = lowBits & ALLOWED_SENDER_MASK;
  if (allowedSender !== 0n) {
    throw new Error("Invalid maker traits: allowedSender must be 0");
  }
}

/**
 * Validate extension - for ERC6909 orders:
 * - Sell orders (SELL_OPTIONS): makerAssetSuffix required, takerAssetSuffix must be empty
 * - Buy orders (BUY_OPTIONS): takerAssetSuffix required, makerAssetSuffix must be empty
 */
export function validateExtension(
  extensionEncoded: string,
  orderType: "SELL_OPTIONS" | "BUY_OPTIONS"
): void {
  const extension = Extension.decode(extensionEncoded);

  // Check that forbidden fields are empty
  if (extension.makingAmountData !== "0x") {
    throw new Error("Invalid extension: makingAmountData must be empty");
  }
  if (extension.takingAmountData !== "0x") {
    throw new Error("Invalid extension: takingAmountData must be empty");
  }
  if (extension.predicate !== "0x") {
    throw new Error("Invalid extension: predicate must be empty");
  }
  if (extension.makerPermit !== "0x") {
    throw new Error("Invalid extension: makerPermit must be empty");
  }
  if (extension.preInteraction !== "0x") {
    throw new Error("Invalid extension: preInteraction must be empty");
  }
  if (extension.postInteraction !== "0x") {
    throw new Error("Invalid extension: postInteraction must be empty");
  }
  if (extension.customData !== "0x") {
    throw new Error("Invalid extension: customData must be empty");
  }

  const hasMakerSuffix = extension.makerAssetSuffix !== "0x";
  const hasTakerSuffix = extension.takerAssetSuffix !== "0x";

  if (orderType === "SELL_OPTIONS") {
    // Sell: maker gives options, so makerAssetSuffix required
    if (!hasMakerSuffix) {
      throw new Error(
        "Invalid extension for SELL_OPTIONS: makerAssetSuffix is required"
      );
    }
    if (hasTakerSuffix) {
      throw new Error(
        "Invalid extension for SELL_OPTIONS: takerAssetSuffix must be empty"
      );
    }
  } else {
    // Buy: taker gives options, so takerAssetSuffix required
    if (!hasTakerSuffix) {
      throw new Error(
        "Invalid extension for BUY_OPTIONS: takerAssetSuffix is required"
      );
    }
    if (hasMakerSuffix) {
      throw new Error(
        "Invalid extension for BUY_OPTIONS: makerAssetSuffix must be empty"
      );
    }
  }
}
