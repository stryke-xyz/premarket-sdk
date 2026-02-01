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
    FinalTickKeeper = 1,
    MarketFinalizer = 2,
    MarketCreator = 3,
    DeliverySupplier = 4,
}

export const ROLE_NAMES: Record<number, string> = {
    [Role.MarketCreator]: "MarketCreator",
    [Role.FinalTickKeeper]: "FinalTickKeeper",
    [Role.RedeemKeeper]: "RedeemKeeper",
    [Role.MarketFinalizer]: "MarketFinalizer",
    [Role.DeliverySupplier]: "DeliverySupplier",
};
