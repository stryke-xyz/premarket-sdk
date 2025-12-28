import { LIMIT_ORDER_PROTOCOL } from "./config";
import { SUPPORTED_CHAINS } from "./config/markets";

export const ZX = "0x";

const NATIVE_ORDER_FACTORY = "0xe12e0f117d23a5ccc57f8935cd8c4e80cd91ff01";
const NATIVE_ORDER_FACTORY_ZK_SYNC =
  "0xfd1d18173d2f179a45bf21f755a261aae7c2d769";

const NATIVE_ORDER_IMPL = "0xf3eaf3c54f1ef887914b9c19e1ab9d3e581557eb";
const NATIVE_ORDER_IMPL_ZK_SYNC = "0xf850a926554fc7898d1bda051bc206942909b8f2";

export const getLimitOrderContract = (chainId: number): string => {
  return LIMIT_ORDER_PROTOCOL[chainId as SUPPORTED_CHAINS];
};

export const getNativeOrderFactoryContract = (chainId: number): string => {
  if (chainId === 324 /*ZkSync*/) {
    return NATIVE_ORDER_FACTORY_ZK_SYNC;
  }

  return NATIVE_ORDER_FACTORY;
};

export const getNativeOrderImplContract = (chainId: number): string => {
  if (chainId === 324 /*ZkSync*/) {
    return NATIVE_ORDER_IMPL_ZK_SYNC;
  }

  return NATIVE_ORDER_IMPL;
};
