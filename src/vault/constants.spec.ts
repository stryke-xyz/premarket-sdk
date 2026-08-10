import { ROLE_NAMES, Role } from "./constants.js";

describe("OptionMarketVault roles", () => {
  it("matches the deployed vault role enum", () => {
    expect(Role.RedeemKeeper).toBe(0);
    expect(Role.WithdrawKeeper).toBe(1);
    expect(Role.DeliverySupplier).toBe(2);
    expect(Role.RolloverKeeper).toBe(3);
    expect(ROLE_NAMES).toEqual({
      [Role.RedeemKeeper]: "RedeemKeeper",
      [Role.WithdrawKeeper]: "WithdrawKeeper",
      [Role.DeliverySupplier]: "DeliverySupplier",
      [Role.RolloverKeeper]: "RolloverKeeper",
    });
  });
});
