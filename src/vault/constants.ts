/**
 * Constants for OptionMarketVault
 */

export const VAULT_TOKEN_PRECISION = 10n ** 18n;
export const FEE_BPS_PRECISION = 10n ** 6n;
export const PNL_PRECISION = 10n ** 18n;

/**
 * Role enum matching the Solidity contract
 */
export enum Role {
    RedeemKeeper = 0,
    WithdrawKeeper = 1,
    FinalTickKeeper = 2,
    MarketFinalizer = 3,
    MarketCreator = 4,
    DeliverySupplier = 5,
}

export const ROLE_NAMES: Record<number, string> = {
    [Role.MarketCreator]: "MarketCreator",
    [Role.FinalTickKeeper]: "FinalTickKeeper",
    [Role.RedeemKeeper]: "RedeemKeeper",
    [Role.WithdrawKeeper]: "WithdrawKeeper",
    [Role.MarketFinalizer]: "MarketFinalizer",
    [Role.DeliverySupplier]: "DeliverySupplier",
};
