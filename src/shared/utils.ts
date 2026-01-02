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

// PRM_PRECISION = 1e18
const PRM_PRECISION = 10n ** 18n;

interface CollateralConversionParams {
  strikeLowerLimit: bigint;
  strikeUpperLimit: bigint;
  bandPrecision: bigint;
  collateralPerBandPrecision: bigint;
}

/**
 * Calculate the width of a band in terms of band precision units
 */
export function calculateBandWidth(params: CollateralConversionParams): bigint {
  const { strikeLowerLimit, strikeUpperLimit, bandPrecision } = params;
  if (bandPrecision === 0n) return 0n;
  return (strikeUpperLimit - strikeLowerLimit) / bandPrecision;
}

/**
 * Calculate the collateral amount required for a given PRM token amount
 * collateralAmount = (amount * width * collateralPerBandPrecision) / PRM_PRECISION
 */
export function calculateCollateralAmount(
  prmAmount: bigint,
  params: CollateralConversionParams
): bigint {
  const width = calculateBandWidth(params);
  if (width === 0n) return 0n;

  const { collateralPerBandPrecision } = params;
  return (prmAmount * width * collateralPerBandPrecision) / PRM_PRECISION;
}

/**
 * Calculate the PRM token amount from a given collateral amount
 * amount = (collateralAmount * PRM_PRECISION) / (width * collateralPerBandPrecision)
 */
export function calculatePrmAmount(
  collateralAmount: bigint,
  params: CollateralConversionParams
): bigint {
  const width = calculateBandWidth(params);
  if (width === 0n) return 0n;

  const { collateralPerBandPrecision } = params;
  const denominator = width * collateralPerBandPrecision;
  if (denominator === 0n) return 0n;

  return (collateralAmount * PRM_PRECISION) / denominator;
}
