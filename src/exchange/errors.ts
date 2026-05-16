import { decodeErrorResult, type Abi, type Hex } from "viem";
import ExchangeAbi from "../abi/Exchange.abi.json" with { type: "json" };
import OptionMarketVaultAbi from "../abi/OptionMarketVault.abi.json" with { type: "json" };
import MarketsRegistryAbi from "../abi/MarketsRegistry.abi.json" with { type: "json" };

export type CoreContractName = "exchange" | "optionMarketVault" | "marketsRegistry";

export interface DecodedContractError {
  contract: CoreContractName;
  name: string;
  signature: string;
  args: readonly unknown[];
}

const abis: Record<CoreContractName, Abi> = {
  exchange: ExchangeAbi as Abi,
  optionMarketVault: OptionMarketVaultAbi as Abi,
  marketsRegistry: MarketsRegistryAbi as Abi,
};

export function decodeContractError(data: Hex): DecodedContractError | null {
  for (const [contract, abi] of Object.entries(abis) as Array<
    [CoreContractName, Abi]
  >) {
    try {
      const decoded = decodeErrorResult({
        abi,
        data,
      });
      if (decoded.errorName) {
        const abiError = abi.find(
          (item) =>
            item.type === "error" &&
            "name" in item &&
            item.name === decoded.errorName
        );
        const signature =
          abiError && "inputs" in abiError
            ? `${decoded.errorName}(${abiError.inputs
                .map((input) => input.type)
                .join(",")})`
            : `${decoded.errorName}()`;

        return {
          contract,
          name: decoded.errorName,
          signature,
          args: decoded.args ?? [],
        };
      }
    } catch {
      // Ignore parse failures and try the next ABI.
    }
  }

  return null;
}
