# Option Market + Limit Order Protocol Spec Sheet

## 1. Scope
This document specifies the current contracts in this repository for:
- `OptionMarketVault` (`src/vaults/OptionMarketVault.sol`)
- `LimitOrderProtocol` + `OrderMixin` (`src/orderbook/LimitOrderProtocol.sol`, `src/orderbook/OrderMixin.sol`)
- `FeeRegistry` (`src/orderbook/FeeRegistry.sol`)

It is written for AI coding agents building:
- Frontend dashboards
- SDKs
- Integration contracts and automation scripts

## 2. Contract Map
- Vault side:
  - `IOptionMarketVault`: external API + structs/events/errors
  - `OptionMarketVault`: implementation
- Orderbook side:
  - `IOrderMixin`: order/match API + structs/events/errors
  - `LimitOrderProtocol`: owner/admin wrapper over `OrderMixin`
  - `OrderMixin`: all core fill/match/cancel logic
  - `OrderLib`, `MakerTraitsLib`, `TakerTraitsLib`, `ExtensionLib`, `OffsetsLib`
- Fees:
  - `IFeeRegistry` and `FeeRegistry`

## 3. Units and Precision
- Vault token amount precision: `VAULT_TOKEN_PRECISION = 1e18`
- Vault fee precision: `FEE_BPS_PRECISION = 1e6`
  - Example: `10_000 = 1%`, `1_000_000 = 100%`
- Orderbook fee precision: `_BPS_BASE = 10_000`
  - Example: `100 = 1%`, `10_000 = 100%`

Do not mix these two fee systems.

## 4. OptionMarketVault

### 4.1 Data Structures
- `Instrument`
  - `marketId`: identifies market config
  - `tick`: strike tick, must align with market tick size
  - `isCall`: true call, false put
- `Market`
  - `underlying`, `collateral`, `delivery`: ERC20 assets
  - `tickSize`: base tick unit
  - `tickSpacing`: spread width in tick units
  - `tokensPerTickSize`: collateral requirement per `tickSize`
  - `expiry`: unix timestamp, or `type(uint256).max` (deferred expiry mode)
  - `depositFeeBps`, `redeemFeeBps`: in `1e6` precision
  - `owner`: optional mint gate (if non-zero, only owner can mint)
  - `isCollateralScaled`: if true, collateral scales by strike
- `PrmInfo`
  - `marketId`, `expiry`, `tick`, `isCall`
  - `totalRedeemProfit` exists but is not used in current settlement logic

### 4.2 Core State Variables
- `marketsCounter`: auto-incremented market id
- `feeReceiver`: receives deposit and redeem fees
- `exerciseWindow`: seconds used by redeem/delivery timing
- `finalTicks[marketId][expiry]`: settlement tick
- `prmInfos[prmTokenId]`: PRM metadata
- `markets[marketId]`: market config
- `roles[address][Role]`: role assignment
- `assetApproved[token]`: whether token can be used in markets
- `isStableAsset[token]`: stable classification used by validation/settlement rules
- `totalCollateralByMarketExpiry[marketId][expiry]`: aggregate posted collateral
- `marketDeliveryFilled[marketId]`: required for physical delivery settlement

### 4.3 Roles
`Role` enum:
- `RedeemKeeper`
- `WithdrawKeeper`
- `FinalTickKeeper`
- `MarketFinalizer`
- `MarketCreator`
- `DeliverySupplier`

Role checks are hard reverts via `Forbidden(address, role)`.

### 4.4 Token ID Rules
- PRM token id is deterministic and even:
  - `prmTokenId = uint256(keccak256(abi.encode(address(this), marketId, tick, isCall, expiry, chainid))) << 1`
- oPRM token id is PRM id with LSB set:
  - `oPrmTokenId = prmTokenId | 1`
- Convert back:
  - `prm = oPrm & ~uint256(1)`

### 4.5 External Functions

#### Admin / config
- `pause()` / `unpause()`
  - Owner only
- `emergencyWithdraw(token, to, amount)`
  - Owner only, only while paused
  - Transfers arbitrary ERC20 from vault
- `updateToken(token, isStable, isDelete)`
  - Owner only
  - Adds/removes token approval and stable flag
- `setRole(addr, role, enabled)`
  - Owner only
- `setExerciseWindow(window)`
  - Owner only, `window > 0`

#### Market ops
- `createMarket(Market mkt) -> marketId`
  - Requires caller has `MarketCreator`
  - Requires token approvals and market validity
- `updateFinalTick(marketId, tick)`
  - Requires `FinalTickKeeper`
  - Fails if market already expired
  - If market expiry is `uint256.max`, expiry becomes `block.timestamp + exerciseWindow`
  - Writes `finalTicks[marketId][effectiveExpiry] = tick`
- `updateMarketExpiry(marketId, expiry)`
  - Requires `MarketFinalizer`
  - Only after current expiry has passed
  - Migrates `totalCollateralByMarketExpiry` from old expiry to new expiry
- `fillMarketDelivery(marketId, amount)`
  - Caller must be market owner or `DeliverySupplier`
  - Requires final tick set and current time in/after exercise window start
  - Requires physical market (`delivery != collateral`)
  - Requires amount >= computed required delivery
  - Sets `marketDeliveryFilled[marketId] = true`

#### Position ops
- `mint(Instrument ins, uint256 amt) -> (prmTokenId, oPrmTokenId)`
  - Preconditions:
    - Market valid
    - If market owner set, only that owner can mint
    - Instrument valid (`tick`, call constraints)
    - `amt > 0`
  - Effects:
    - Mints both PRM and oPRM to caller
    - Transfers collateral from caller to vault
    - Transfers deposit fee from caller to `feeReceiver`
    - Initializes `prmInfos[prmTokenId]` on first mint
    - Increases `totalCollateralByMarketExpiry`
- `redeem(oPrmTokenId, rec) -> profit`
  - Caller redeems their own oPRM balance
  - Must be in/after exercise window start
  - Requires final tick
  - Burns full oPRM balance of caller
  - Pays `delivery` token net of redeem fee
- `delegateRedeem(oPrmTokenId, rec) -> profit`
  - Requires `RedeemKeeper`
  - Redeems balance belonging to `rec` and sends to `rec`
- `withdraw(prmTokenId, amount, rec)`
  - If before expiry: unwind path
    - Requires caller has both PRM and matching oPRM for `amount`
    - Burns both and returns collateral
  - If after expiry: settlement path
    - Burns PRM only
    - Uses final tick to compute loss and payout
    - Requires delivery funding for physical markets
  - At exact `block.timestamp == expiry`, function reverts (`NotExpired`) in current implementation
- `delegateWithdraw(prmTokenId, amount, owner, rec)`
  - Requires `WithdrawKeeper`
  - Uses post-expiry settlement path only

#### Views and helpers
- `getPrmTokenId`, `getOptionPrmTokenId`, `prmToOptionTokenId`, `optionPrmToPrm`
- `getMarket(marketId)`
  - Reverts if market invalid or tokens not approved
- `getPrmInfo(prmTokenId)`
  - Reverts if unknown PRM

### 4.6 Vault Math
- Collateral base:
  - `ticks = max(1, tickSpacing / tickSize)`
  - `collateral = ticks * tokensPerTickSize`
  - If `isCollateralScaled`: `collateral = tick * collateral / tickSize`
  - Then scale by amount: `collateral = collateral * amt / 1e18`
- Deposit fee: `collateral * depositFeeBps / 1e6`
- Redeem fee: `profit * redeemFeeBps / 1e6`

### 4.7 Profit and Settlement Model
- `_getProfit` computes payoff in tick-space first.
- Spread market mode when `(tickSpacing / tickSize) > 1`.
- Physical or non-stable delivery uses conversion by `finalTick` and `delivery.decimals()`.
- For physical delivery (`delivery != collateral`):
  - `redeem` and post-expiry `withdraw` require `marketDeliveryFilled[marketId]`.

### 4.8 Common Reverts to Handle in Integrations
- `InvalidMarket`, `InvalidToken`, `InvalidTick`, `IsCallNotAllowed`
- `FinalTickNotSet`, `DeliveryNotFilled`, `DeliveryUnderfunded`
- `UnwindInsufficientBalance`, `NotExpired`, `Expired`

## 5. LimitOrderProtocol + OrderMixin

### 5.1 Constructors and Ownership
- `LimitOrderProtocol(address _owner)`
  - `Ownable(_owner)`
  - sets `allowedResolver[msg.sender] = true`
  - sets `feeRecipient = msg.sender`

If deployer differs from `_owner`, initial resolver and fee recipient are deployer, not owner.

### 5.2 Core Storage (`OrderMixin`)
- `_bitInvalidator[maker]`: bitmap invalidation storage
- `_remainingInvalidator[maker][orderHash]`: remaining-based invalidation storage
- `_allowedMatchers[address]`
- `_allowedResolvers[address]`
- `_feeRecipient`
- `_feeRegistry`

### 5.3 Main Types
- `Order`
  - `salt`
  - `maker`, `receiver`, `makerAsset`, `takerAsset` (AddressLib type)
  - `makingAmount`, `takingAmount`
  - `makerTraits`
- `MatchedOrder`
  - `order` (counter-order)
  - `signature`
  - `extension`
  - `taker` (must equal `order.maker` in match flow)

### 5.4 Admin Functions
- `setAllowedMatcher(matcher, allowed)` owner-only
- `setAllowedResolver(resolver, allowed)` owner-only
- `setFeeRecipient(recipient)` owner-only, rejects zero address
- `setFeeRegistry(registry)` owner-only, zero allowed (disables fees)
- `pause()` / `unpause()` owner-only

### 5.5 Cancel / Invalidation Functions
- `cancelOrder(makerTraits, orderHash)`
  - If `useBitInvalidator()`: invalidates nonce bit
  - Else: marks order as fully filled in remaining invalidator
- `cancelOrders(makerTraits[], orderHashes[])`
  - Lengths must match
- `bitsInvalidateForOrder(makerTraits, additionalMask)`
  - Requires bit invalidator mode

### 5.6 Fill Functions
- Resolver-only:
  - `fillOrder(...)`
  - `fillOrderArgs(...)`
  - `fillContractOrder(...)`
  - `fillContractOrderArgs(...)`
- Matcher-only:
  - `matchOrder(...)`
  - `matchOrderArgs(...)`
  - `matchContractOrder(...)`
  - `matchContractOrderArgs(...)`

All fill paths call shared `_fill(...)` logic (except signature handling differences).

### 5.7 Signature Rules
- EOA maker path: `(r, vs)` recovered from EIP-712 order hash
- Contract maker path: `ECDSA.isValidSignature(...)`
- Match flow counter-order: `recoverOrIsValidSignature(taker, takerOrderHash, takerOrder.signature)`

### 5.8 Fill Amount Semantics
`amount` interpretation depends on taker traits:
- If `takerTraits.isMakingAmount() == true`:
  - `makingAmount = min(amount, remainingMakingAmount)`
  - `takingAmount` derived
  - `threshold` is max taking bound
- Else:
  - `takingAmount = amount`
  - `makingAmount` derived
  - `threshold` is min making bound

### 5.9 Transfer and Fee Sequence in `_fill`
1. `verifyOrder(order, extension)`
2. compute making/taking amounts and enforce thresholds
3. update remaining/bit invalidator
4. optional maker pre-interaction callback
5. transfer maker asset to taker target (net of taker fee)
6. optional taker interaction callback
7. transfer taker asset to maker receiver (net of maker fee)
8. transfer fee amounts to `_feeRecipient`
9. optional maker post-interaction callback
10. emit `OrderFilled`

### 5.10 Fee Integration
- If `_feeRegistry == address(0)`: both fees are zero.
- Else:
  - `getFee(takerAsset, makerAsset, taker, maker, extension)`
  - `makerFee` charged from taker asset side
  - `takerFee` charged from maker asset side
- Fee denominator is `10_000`.

### 5.11 Order Validation (`verifyOrder`)
Checks:
- extension consistency and extension hash against `salt` low 160 bits when extension flag is set
- maker trait expiration
- optional predicate (staticcall expression)

### 5.12 Important Behavior Notes
- `msg.value` in `_fill` must be zero; otherwise `InvalidMsgValue`.
- `fillOrder*` and `matchOrder*` are permissioned by resolver/matcher allowlists.
- `makerTraits` helpers `isAllowedSender` and epoch checks exist in libs/helpers, but are not enforced in current `_fill` logic.
- Some error types in `IOrderMixin` are defined but unused in this implementation.

## 6. MakerTraits and TakerTraits Encoding

### 6.1 MakerTraits (`uint256`)
Bit flags:
- `255`: no partial fills
- `254`: allow multiple fills
- `252`: require pre-interaction
- `251`: require post-interaction
- `250`: need check epoch manager
- `249`: has extension
- `248`: use permit2
- `247`: unwrap WETH

Low bits:
- [0..79] allowed sender suffix
- [80..119] expiration
- [120..159] nonce/epoch
- [160..199] series

### 6.2 TakerTraits (`uint256`)
Bit flags:
- `255`: amount is making amount mode
- `254`: unwrap WETH
- `253`: skip maker permit
- `252`: use permit2
- `251`: args include explicit target

Packed lengths:
- [224..247] extension length (24 bits)
- [200..223] interaction length (24 bits)

Low [0..184]: threshold value.

## 7. Extension Encoding

### 7.1 Layout
`extension = bytes32(offsets) || concatenated_dynamic_fields`

Field order (index):
0 makerAssetSuffix
1 takerAssetSuffix
2 makingAmountData
3 takingAmountData
4 predicate
5 makerPermit
6 preInteractionData
7 postInteractionData
8 customData (trailing remainder)

`OffsetsLib` interprets each 32-bit chunk as cumulative end offsets.

### 7.2 `args` Parsing for `fillOrderArgs` / `matchOrderArgs`
`args` is parsed using `takerTraits`:
- if `argsHasTarget`: first 20 bytes are target
- next `argsExtensionLength` bytes are extension
- next `argsInteractionLength` bytes are interaction

If no target flag in `match*Args`, implementation defaults target to `takerOrder.taker`.

## 8. FeeRegistry

### 8.1 Constructor and Ownership
- `FeeRegistry(address _owner)` with `Ownable(_owner)`
- All mutating methods are `onlyOwner`.

### 8.2 Storage
- `feesByMarket[bytes32] -> FeeConfig`
- `marketMakers[address] -> bool`
- `erc6909Assets[address] -> bool`

`FeeConfig` fields:
- `makerFeeBps`
- `takerFeeBps`
- `marketMakerMakerFeeBps`
- `marketMakerTakerFeeBps`
- `isSet`

`FeeConfig` meaning:
- `makerFeeBps`: charged on maker side, deducted from taker-asset flow.
- `takerFeeBps`: charged on taker side, deducted from maker-asset flow.
- `marketMakerMakerFeeBps`: maker fee override when `marketMakers[maker] = true`.
- `marketMakerTakerFeeBps`: taker fee override when `marketMakers[taker] = true`.

### 8.3 Admin Functions
- `setMarketFees(bytes32 market, uint16 makerFeeBps, uint16 takerFeeBps, uint16 marketMakerMakerFeeBps, uint16 marketMakerTakerFeeBps)`
  - all bps must be `<= 10_000`, otherwise `InvalidFeeBps`
  - writes `feesByMarket[market]` and sets `isSet = true`
  - emits `MarketFeesSet`
- `setMarketMaker(address user, bool enabled)`
  - sets special MM tier applicability for that user
  - emits `MarketMakerSet`
- `setErc6909Asset(address asset, bool enabled)`
  - marks asset as ERC6909-like for fee logic branching
  - emits `Erc6909AssetSet`

### 8.4 Market Key Helpers
- `pairMarketId(tokenA, tokenB)`
- `pairMarketId(tokenA, tokenB, id)`
  - pair canonicalizes token order
- `vaultMarketId(vault, marketId, takerAsset, makerAsset, id)`

`pairMarketId` reverts `InvalidPair` for:
- zero address
- same token for both sides

### 8.5 `getFee` Algorithm
1. Determine whether taker/maker assets are marked ERC6909.
2. If both are ERC6909 -> `(0,0)`.
3. Parse `extension` suffixes/custom data for fee hint id and vault/tokenId.
4. Build market key:
   - ERC6909-involved: infer `marketId` from vault `getPrmInfo(canonicalPrmTokenId)` and use `vaultMarketId`
   - ERC20/ERC20: use pair key (with optional id)
5. If market fee config missing -> `(0,0)`.
6. Apply market-maker overrides for maker/taker addresses.
7. Zero-out fee side if that side asset is ERC6909:
   - `takerAssetIs6909 => makerFee = 0`
   - `makerAssetIs6909 => takerFee = 0`

### 8.6 `getFee` Inputs and Decoding Details
`getFee(takerAsset, makerAsset, taker, maker, extension)` depends heavily on `extension`:
- `makerAssetSuffix = extension.makerAssetSuffix()`
- `takerAssetSuffix = extension.takerAssetSuffix()`
- `customData = extension.customData()`

ID/hint resolution priority:
- ERC6909-involved path:
  - decode vault/tokenId/id from the 6909-side suffix
  - if id not found and `customData.length >= 32`, first 32 bytes of `customData` are used as id
  - if vault/tokenId missing, returns `(0,0)` (not revert)
- ERC20/ERC20 path:
  - first try id from taker suffix
  - else id from maker suffix
  - else first 32 bytes of `customData` if present
  - if no id, base pair market is used

Suffix structure expected by FeeRegistry for hint extraction:
- first 32 bytes: vault address (right-aligned in word)
- next 32 bytes: tokenId
- optional id segment checked using:
  - `dataOffset == 192`
  - `dataLength >= 32`
  - id read from word at offset 128

### 8.7 BPS Precision and Practical Defaults
FeeRegistry BPS base is `10_000`:
- `1 = 0.01%`
- `10 = 0.10%`
- `20 = 0.20%`
- `50 = 0.50%`
- `100 = 1.00%`
- `1000 = 10.00%`

Recommended policy presets:
- balanced retail: `maker=100`, `taker=100`, `mmMaker=20`, `mmTaker=20`
- maker-incentive: `maker=50`, `taker=100`, `mmMaker=10`, `mmTaker=20`
- zero-fee test mode: all zero

### 8.8 Settlement Impact (How LOP Uses Returned Fees)
Given `makingAmount` and `takingAmount` in LOP:
- `makerFeeAmount = takingAmount * makerFeeBps / 10_000`
- `takerFeeAmount = makingAmount * takerFeeBps / 10_000`
- maker receives `takingAmount - makerFeeAmount`
- taker receives `makingAmount - takerFeeAmount`
- both fee amounts are transferred to LOP `feeRecipient`

### 8.9 Configuration Order for Integrators
1. Deploy FeeRegistry with correct owner.
2. Mark ERC6909 assets with `setErc6909Asset`.
3. Compute market key via onchain helper (`pairMarketId` or `vaultMarketId`).
4. Set market fees for that key.
5. Optionally set market-maker addresses.
6. Wire into LOP using `LimitOrderProtocol.setFeeRegistry(feeRegistryAddress)`.

### 8.10 Failure and Zero-Fee Cases to Expect
- Missing fee config for resolved market key => returns `(0,0)`.
- Bad/missing ERC6909 suffix hint => returns `(0,0)`.
- Both assets flagged as ERC6909 => returns `(0,0)`.
- Invalid pair in helper functions => revert `InvalidPair`.
- Out-of-range bps in `setMarketFees` => revert `InvalidFeeBps`.

## 9. Practical Integration Sequences

### 9.1 Vault Lifecycle
1. Approve market assets: `updateToken`.
2. Assign roles: `setRole`.
3. Create market: `createMarket`.
4. Mint positions: `mint`.
5. Set settlement: `updateFinalTick`.
6. If physical market: `fillMarketDelivery`.
7. Users settle:
   - profit leg: `redeem(oPrmTokenId, receiver)`
   - collateral leg: `withdraw(prmTokenId, amount, receiver)`

### 9.2 Orderbook Lifecycle
1. Deploy LOP with owner.
2. Set resolver and matcher allowlists.
3. Configure fee recipient.
4. Deploy/configure FeeRegistry.
5. Wire `setFeeRegistry`.
6. Makers sign EIP-712 orders.
7. Resolver/matcher submits fills/matches.

## 10. Frontend / SDK Implementation Requirements
- Always treat vault and order fees with separate denominators (`1e6` vs `1e4`).
- Decode and display token amounts using token decimals.
- Handle full revert surface; do not collapse all errors into generic failure.
- For order signing:
  - use LOP domain separator (`EIP712 name="LOP", version="4"`)
  - hash matches `OrderLib` struct hash
- Build extension bytes exactly; invalid extension hash causes fill failure.
- When using `fillOrderArgs`/`matchOrderArgs`, keep `takerTraits` length bits synchronized with `args` payload layout.
- For FeeRegistry market keys, use contract helper methods rather than reimplementing hash packing in frontend.

## 11. Integration Contract Recommendations
- If wrapping fills in another contract:
  - ensure wrapper is allowlisted as resolver/matcher
  - pass through exact `extension` and `takerTraits` bits
  - bubble revert reasons for debugging
- For smart-account integrations:
  - approvals/operators and protocol calls must be permitted by validation modules
  - module restrictions can reject tx before protocol execution

## 12. Known Edge Cases in Current Implementation
- `withdraw` at exact `block.timestamp == expiry` reverts (`NotExpired`).
- `delegateRedeem` redeems balance owned by `rec` (no separate owner parameter).
- `SeriesEpochManager` support exists in inheritance, but epoch check is not currently enforced in `_fill`.
- `MakerTraitsLib.isAllowedSender` exists, but private-order check is not enforced in current `_fill`.
