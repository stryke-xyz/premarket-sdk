import { encodeAbiParameters, keccak256, type Hex } from "viem";
import type { Option } from "./types.js";

/**
 * Calculate option token ID from option parameters
 * This should match the getTokenId function in OptionTokenFactory
 */
export function calculateOptionTokenId(option: Option): Hex {
  const encoded = encodeAbiParameters(
    [
      { name: "marketId", type: "uint256" },
      { name: "strikeLowerLimit", type: "uint256" },
      { name: "strikeUpperLimit", type: "uint256" },
      { name: "isPut", type: "bool" },
    ],
    [
      BigInt(option.marketId),
      BigInt(option.strikeLowerLimit),
      BigInt(option.strikeUpperLimit),
      option.isPut,
    ]
  );

  return keccak256(encoded);
}
