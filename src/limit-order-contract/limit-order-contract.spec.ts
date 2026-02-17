import { Interface } from "ethers";
import { LimitOrderContract } from "./limit-order-contract.js";
import { TakerTraits, type LimitOrderV4Struct } from "../limit-order/index.js";
import LOP_V4_ABI from "../abi/limitOrderProtocol.json" with { type: "json" };

describe("LimitOrderContract", () => {
  it("encodes fillContractOrder with 4 parameters (no args)", () => {
    const iface = new Interface(LOP_V4_ABI);

    const order: LimitOrderV4Struct = {
      salt: "1",
      maker: "0x1111111111111111111111111111111111111111",
      receiver: "0x0000000000000000000000000000000000000000",
      makerAsset: "0x2222222222222222222222222222222222222222",
      takerAsset: "0x3333333333333333333333333333333333333333",
      makingAmount: "1000",
      takingAmount: "2000",
      makerTraits: "0",
    };

    const signature = "0x1234";
    const takerTraits = TakerTraits.default();

    const calldata = LimitOrderContract.getFillContractOrderCalldata(
      order,
      signature,
      takerTraits,
      1000n
    );

    const decoded = iface.decodeFunctionData("fillContractOrder", calldata);
    expect(decoded.length).toBe(4);
    expect(decoded[1]).toBe(signature);
    expect(decoded[2]).toBe(1000n);
  });
});

