import type { Address, Hex, WalletClient, PublicClient } from "viem";
import { encodePacked } from "viem";
import { getLimitOrderContract } from "../constants";
import type { StoredOrder } from "../shared/types.js";
import { LimitOrder, Extension } from "../limit-order";
import LIMIT_ORDER_PROTOCOL_ABI from "../abi/limitOrderProtocol.json";

export interface FillOrderWriteContractParams {
  address: Address;
  abi: typeof LIMIT_ORDER_PROTOCOL_ABI;
  functionName: "fillOrderArgs" | "fillContractOrderArgs";
  args: readonly unknown[];
}

export class OrderFiller {
  constructor(
    private config: {
      chainId: number;
    },
    private publicClient: PublicClient,
    private walletClient: WalletClient
  ) {}

  /**
   * Build writeContract parameters for filling an order from EOA maker
   * Tokens go to msg.sender
   *
   * @param storedOrder - The order fetched from the API
   * @param fillAmount - Amount to fill (in makingAmount units)
   * @returns Parameters to pass to writeContract
   */
  buildFillOrderParams(
    storedOrder: StoredOrder,
    fillAmount: bigint
  ): FillOrderWriteContractParams {
    const limitOrderProtocolAddress = getLimitOrderContract(
      this.config.chainId
    );

    const extension = Extension.decode(storedOrder.extensionEncoded);
    const limitOrder = LimitOrder.fromDataAndExtension(
      storedOrder.order,
      extension
    );
    const orderStruct = limitOrder.build();

    const extensionBytes = storedOrder.extensionEncoded;
    const extensionLength = (extensionBytes.length - 2) / 2;

    // Build args: just extension (no target address when filling for yourself)
    const args = extensionBytes as Hex;

    // Build TakerTraits: bits 224-244 = extension length (no argsHasTarget flag)
    const takerTraits = BigInt(extensionLength) << 224n;

    return {
      address: limitOrderProtocolAddress as Address,
      abi: LIMIT_ORDER_PROTOCOL_ABI,
      functionName: "fillOrderArgs",
      args: [
        {
          salt: BigInt(orderStruct.salt),
          maker: BigInt(orderStruct.maker),
          receiver: BigInt(orderStruct.receiver),
          makerAsset: BigInt(orderStruct.makerAsset),
          takerAsset: BigInt(orderStruct.takerAsset),
          makingAmount: BigInt(orderStruct.makingAmount),
          takingAmount: BigInt(orderStruct.takingAmount),
          makerTraits: BigInt(orderStruct.makerTraits),
        },
        storedOrder.signature.r as Hex,
        storedOrder.signature.vs as Hex,
        fillAmount,
        takerTraits,
        args,
      ],
    };
  }

  /**
   * Fill order from EOA maker - tokens go to msg.sender
   *
   * @param storedOrder - The order fetched from the API
   * @param fillAmount - Amount to fill (in makingAmount units)
   */
  async fillOrder(
    storedOrder: StoredOrder,
    fillAmount: bigint
  ): Promise<{
    txHash: Hex;
    makingAmount: bigint;
    takingAmount: bigint;
    orderHash: Hex;
  }> {
    const params = this.buildFillOrderParams(storedOrder, fillAmount);
    const hash = await this.walletClient.writeContract({
      chain: this.walletClient.chain,
      account: this.walletClient.account!,
      ...params,
    });

    await this.publicClient.waitForTransactionReceipt({ hash });

    // Calculate orderStruct for return value
    const extension = Extension.decode(storedOrder.extensionEncoded);
    const limitOrder = LimitOrder.fromDataAndExtension(
      storedOrder.order,
      extension
    );
    const orderStruct = limitOrder.build();

    return {
      txHash: hash,
      makingAmount: fillAmount,
      takingAmount:
        (BigInt(orderStruct.takingAmount) * fillAmount) /
        BigInt(orderStruct.makingAmount),
      orderHash: storedOrder.orderHash as Hex,
    };
  }

  /**
   * Build writeContract parameters for filling an order from EOA maker
   * Tokens go to specified target address
   *
   * @param storedOrder - The order fetched from the API
   * @param fillAmount - Amount to fill (in makingAmount units)
   * @param targetAddress - Address to receive the maker's tokens
   * @returns Parameters to pass to writeContract
   */
  buildFillOrderToParams(
    storedOrder: StoredOrder,
    fillAmount: bigint,
    targetAddress: Address
  ): FillOrderWriteContractParams {
    const limitOrderProtocolAddress = getLimitOrderContract(
      this.config.chainId
    );

    const extension = Extension.decode(storedOrder.extensionEncoded);
    const limitOrder = LimitOrder.fromDataAndExtension(
      storedOrder.order,
      extension
    );
    const orderStruct = limitOrder.build();

    const extensionBytes = storedOrder.extensionEncoded;
    const extensionLength = (extensionBytes.length - 2) / 2;

    // Build args: target (20 bytes) + extension
    const args = encodePacked(
      ["address", "bytes"],
      [targetAddress, extensionBytes as Hex]
    );

    // Build TakerTraits: bit 251 = argsHasTarget, bits 224-244 = extension length
    const takerTraits = (1n << 251n) | (BigInt(extensionLength) << 224n);

    return {
      address: limitOrderProtocolAddress as Address,
      abi: LIMIT_ORDER_PROTOCOL_ABI,
      functionName: "fillOrderArgs",
      args: [
        {
          salt: BigInt(orderStruct.salt),
          maker: BigInt(orderStruct.maker),
          receiver: BigInt(orderStruct.receiver),
          makerAsset: BigInt(orderStruct.makerAsset),
          takerAsset: BigInt(orderStruct.takerAsset),
          makingAmount: BigInt(orderStruct.makingAmount),
          takingAmount: BigInt(orderStruct.takingAmount),
          makerTraits: BigInt(orderStruct.makerTraits),
        },
        storedOrder.signature.r as Hex,
        storedOrder.signature.vs as Hex,
        fillAmount,
        takerTraits,
        args,
      ],
    };
  }

  /**
   * Fill order from EOA maker - tokens go to specified target address
   *
   * @param storedOrder - The order fetched from the API
   * @param fillAmount - Amount to fill (in makingAmount units)
   * @param targetAddress - Address to receive the maker's tokens
   */
  async fillOrderTo(
    storedOrder: StoredOrder,
    fillAmount: bigint,
    targetAddress: Address
  ): Promise<{
    txHash: Hex;
    makingAmount: bigint;
    takingAmount: bigint;
    orderHash: Hex;
  }> {
    const params = this.buildFillOrderToParams(
      storedOrder,
      fillAmount,
      targetAddress
    );
    const hash = await this.walletClient.writeContract({
      chain: this.walletClient.chain,
      account: this.walletClient.account!,
      ...params,
    });

    await this.publicClient.waitForTransactionReceipt({ hash });

    // Calculate orderStruct for return value
    const extension = Extension.decode(storedOrder.extensionEncoded);
    const limitOrder = LimitOrder.fromDataAndExtension(
      storedOrder.order,
      extension
    );
    const orderStruct = limitOrder.build();

    return {
      txHash: hash,
      makingAmount: fillAmount,
      takingAmount:
        (BigInt(orderStruct.takingAmount) * fillAmount) /
        BigInt(orderStruct.makingAmount),
      orderHash: storedOrder.orderHash as Hex,
    };
  }

  /**
   * Build writeContract parameters for filling an order from smart contract maker
   * Tokens go to msg.sender
   *
   * @param storedOrder - The order fetched from the API
   * @param fillAmount - Amount to fill (in makingAmount units)
   * @param ownerSignature - EIP-1271 signature from the smart account owner
   * @returns Parameters to pass to writeContract
   */
  buildFillContractOrderParams(
    storedOrder: StoredOrder,
    fillAmount: bigint,
    ownerSignature: Hex
  ): FillOrderWriteContractParams {
    const limitOrderProtocolAddress = getLimitOrderContract(
      this.config.chainId
    );

    const extension = Extension.decode(storedOrder.extensionEncoded);
    const limitOrder = LimitOrder.fromDataAndExtension(
      storedOrder.order,
      extension
    );
    const orderStruct = limitOrder.build();

    const extensionBytes = storedOrder.extensionEncoded;
    const extensionLength = (extensionBytes.length - 2) / 2;

    // Build args: just extension (no target address when filling for yourself)
    const args = extensionBytes as Hex;

    // Build TakerTraits: bits 224-244 = extension length (no argsHasTarget flag)
    const takerTraits = BigInt(extensionLength) << 224n;

    return {
      address: limitOrderProtocolAddress as Address,
      abi: LIMIT_ORDER_PROTOCOL_ABI,
      functionName: "fillContractOrderArgs",
      args: [
        {
          salt: BigInt(orderStruct.salt),
          maker: BigInt(orderStruct.maker),
          receiver: BigInt(orderStruct.receiver),
          makerAsset: BigInt(orderStruct.makerAsset),
          takerAsset: BigInt(orderStruct.takerAsset),
          makingAmount: BigInt(orderStruct.makingAmount),
          takingAmount: BigInt(orderStruct.takingAmount),
          makerTraits: BigInt(orderStruct.makerTraits),
        },
        ownerSignature,
        fillAmount,
        takerTraits,
        args,
      ],
    };
  }

  /**
   * Fill order from smart contract maker - tokens go to msg.sender
   *
   * @param storedOrder - The order fetched from the API
   * @param fillAmount - Amount to fill (in makingAmount units)
   * @param ownerSignature - EIP-1271 signature from the smart account owner
   */
  async fillContractOrder(
    storedOrder: StoredOrder,
    fillAmount: bigint,
    ownerSignature: Hex
  ): Promise<{
    txHash: Hex;
    makingAmount: bigint;
    takingAmount: bigint;
    orderHash: Hex;
  }> {
    const params = this.buildFillContractOrderParams(
      storedOrder,
      fillAmount,
      ownerSignature
    );
    const hash = await this.walletClient.writeContract({
      chain: this.walletClient.chain,
      account: this.walletClient.account!,
      ...params,
    });

    await this.publicClient.waitForTransactionReceipt({ hash });

    // Calculate orderStruct for return value
    const extension = Extension.decode(storedOrder.extensionEncoded);
    const limitOrder = LimitOrder.fromDataAndExtension(
      storedOrder.order,
      extension
    );
    const orderStruct = limitOrder.build();

    return {
      txHash: hash,
      makingAmount: fillAmount,
      takingAmount:
        (BigInt(orderStruct.takingAmount) * fillAmount) /
        BigInt(orderStruct.makingAmount),
      orderHash: storedOrder.orderHash as Hex,
    };
  }

  /**
   * Build writeContract parameters for filling an order from smart contract maker
   * Tokens go to specified target address
   *
   * @param storedOrder - The order fetched from the API
   * @param fillAmount - Amount to fill (in makingAmount units)
   * @param ownerSignature - EIP-1271 signature from the smart account owner
   * @param targetAddress - Address to receive the maker's tokens
   * @returns Parameters to pass to writeContract
   */
  buildFillContractOrderToParams(
    storedOrder: StoredOrder,
    fillAmount: bigint,
    ownerSignature: Hex,
    targetAddress: Address
  ): FillOrderWriteContractParams {
    const limitOrderProtocolAddress = getLimitOrderContract(
      this.config.chainId
    );

    const extension = Extension.decode(storedOrder.extensionEncoded);
    const limitOrder = LimitOrder.fromDataAndExtension(
      storedOrder.order,
      extension
    );
    const orderStruct = limitOrder.build();

    const extensionBytes = storedOrder.extensionEncoded;
    const extensionLength = (extensionBytes.length - 2) / 2;

    // Build args: target (20 bytes) + extension
    const args = encodePacked(
      ["address", "bytes"],
      [targetAddress, extensionBytes as Hex]
    );

    // Build TakerTraits: bit 251 = argsHasTarget, bits 224-244 = extension length
    const takerTraits = (1n << 251n) | (BigInt(extensionLength) << 224n);

    return {
      address: limitOrderProtocolAddress as Address,
      abi: LIMIT_ORDER_PROTOCOL_ABI,
      functionName: "fillContractOrderArgs",
      args: [
        {
          salt: BigInt(orderStruct.salt),
          maker: BigInt(orderStruct.maker),
          receiver: BigInt(orderStruct.receiver),
          makerAsset: BigInt(orderStruct.makerAsset),
          takerAsset: BigInt(orderStruct.takerAsset),
          makingAmount: BigInt(orderStruct.makingAmount),
          takingAmount: BigInt(orderStruct.takingAmount),
          makerTraits: BigInt(orderStruct.makerTraits),
        },
        ownerSignature,
        fillAmount,
        takerTraits,
        args,
      ],
    };
  }

  /**
   * Fill order from smart contract maker - tokens go to specified target address
   *
   * @param storedOrder - The order fetched from the API
   * @param fillAmount - Amount to fill (in makingAmount units)
   * @param ownerSignature - EIP-1271 signature from the smart account owner
   * @param targetAddress - Address to receive the maker's tokens
   */
  async fillContractOrderTo(
    storedOrder: StoredOrder,
    fillAmount: bigint,
    ownerSignature: Hex,
    targetAddress: Address
  ): Promise<{
    txHash: Hex;
    makingAmount: bigint;
    takingAmount: bigint;
    orderHash: Hex;
  }> {
    const params = this.buildFillContractOrderToParams(
      storedOrder,
      fillAmount,
      ownerSignature,
      targetAddress
    );
    const hash = await this.walletClient.writeContract({
      chain: this.walletClient.chain,
      account: this.walletClient.account!,
      ...params,
    });

    await this.publicClient.waitForTransactionReceipt({ hash });

    // Calculate orderStruct for return value
    const extension = Extension.decode(storedOrder.extensionEncoded);
    const limitOrder = LimitOrder.fromDataAndExtension(
      storedOrder.order,
      extension
    );
    const orderStruct = limitOrder.build();

    return {
      txHash: hash,
      makingAmount: fillAmount,
      takingAmount:
        (BigInt(orderStruct.takingAmount) * fillAmount) /
        BigInt(orderStruct.makingAmount),
      orderHash: storedOrder.orderHash as Hex,
    };
  }
}
