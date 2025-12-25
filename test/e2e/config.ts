import type { Address, Hex } from "viem";
import type { Option } from "../../src";

export const CONFIG = {
  // API URL
  apiUrl: "http://localhost:3456",

  // Anvil RPC
  rpcUrl: "http://localhost:8545",

  // Chain
  chainId: 31337,

  // Contract addresses - from fresh Anvil + FullTestScenario deploy
  limitOrderProtocolAddress:
    "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512" as Address,
  optionTokenFactoryAddress:
    "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9" as Address,
  collateralTokenAddress:
    "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0" as Address, // CollateralTokenFactory
  usdcAddress: "0x84eA74d481Ee0A5332c457a4d796187F6Ba67fEB" as Address, // Mock USDC

  // Market ID
  marketId: "2",

  // Test accounts - Anvil default accounts (must match FullTestScenario.s.sol)
  account0PrivateKey:
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" as Hex,
  account1PrivateKey:
    "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d" as Hex,
  account2PrivateKey:
    "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a" as Hex,
  account3PrivateKey:
    "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6" as Hex,
  account4PrivateKey:
    "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f873d9e259c9b41f2a2de" as Hex,
  account5PrivateKey:
    "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba" as Hex,

  // ERC6909 Proxy address
  erc6909ProxyAddress: "0x7a2088a1bFc9d81c55368AE168C2C02570cB814F" as Address,
};

// Option parameters for the test market
export const TEST_OPTION: Option = {
  marketId: CONFIG.marketId,
  strikeLowerLimit: "5000000000", // 5000e6
  strikeUpperLimit: "6000000000", // 6000e6
  isPut: false,
};
