import { encodeErrorResult, type Abi } from "viem";
import OptionMarketVaultAbi from "../abi/OptionMarketVault.abi.json" with {
  type: "json",
};
import MarketsRegistryAbi from "../abi/MarketsRegistry.abi.json" with {
  type: "json",
};
import { decodeContractError } from "./errors.js";

describe("decodeContractError", () => {
  it("decodes DeliveryNotFilled from OptionMarketVault ABI", () => {
    const data = encodeErrorResult({
      abi: OptionMarketVaultAbi as Abi,
      errorName: "DeliveryNotFilled",
    });

    const decoded = decodeContractError(data);
    expect(decoded).not.toBeNull();
    expect(decoded?.contract).toBe("optionMarketVault");
    expect(decoded?.name).toBe("DeliveryNotFilled");
    expect(decoded?.signature).toBe("DeliveryNotFilled()");
    expect(decoded?.args).toEqual([]);
  });

  it("decodes MarketNotExpired from MarketsRegistry ABI", () => {
    const data = encodeErrorResult({
      abi: MarketsRegistryAbi as Abi,
      errorName: "MarketNotExpired",
      args: [7n, 1_900_000_000n],
    });

    const decoded = decodeContractError(data);
    expect(decoded).not.toBeNull();
    expect(decoded?.contract).toBe("marketsRegistry");
    expect(decoded?.name).toBe("MarketNotExpired");
    expect(decoded?.signature).toBe("MarketNotExpired(uint256,uint256)");
    expect(decoded?.args).toEqual([7n, 1_900_000_000n]);
  });
});
