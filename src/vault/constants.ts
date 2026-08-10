/**
 * Constants for OptionMarketVault
 */

export const VAULT_TOKEN_PRECISION = 10n ** 18n;
export const FEE_BPS_PRECISION = 10n ** 6n;
export const PNL_PRECISION = 10n ** 18n;

/** Role enum matching the deployed OptionMarketVault contract. */
export enum Role {
  RedeemKeeper = 0,
  WithdrawKeeper = 1,
  DeliverySupplier = 2,
  RolloverKeeper = 3,
}

export const ROLE_NAMES: Record<number, string> = {
  [Role.RedeemKeeper]: "RedeemKeeper",
  [Role.WithdrawKeeper]: "WithdrawKeeper",
  [Role.DeliverySupplier]: "DeliverySupplier",
  [Role.RolloverKeeper]: "RolloverKeeper",
};
