import { isAddress } from "viem";
import assert from 'assert'

function add0x(value: string): `0x${string}` {
    return (value.startsWith("0x") ? value : `0x${value}`) as `0x${string}`
}

export class Address {
    static NATIVE_CURRENCY = new Address(
        '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
    )

    static ZERO_ADDRESS = new Address(
        '0x0000000000000000000000000000000000000000'
    )

    private readonly val: string

    constructor(val: string) {
        assert(isAddress(val), `Invalid address ${val}`)

        this.val = val.toLowerCase()
    }

    static fromBigInt(val: bigint): Address {
        return new Address(add0x(val.toString(16).padStart(40, '0')))
    }

    static fromFirstBytes(bytes: string): Address {
        return new Address(bytes.slice(0, 42))
    }

    public toString(): string {
        return this.val
    }

    public equal(other: Address): boolean {
        return this.val === other.val
    }

    public isNative(): boolean {
        return this.equal(Address.NATIVE_CURRENCY)
    }

    public isZero(): boolean {
        return this.equal(Address.ZERO_ADDRESS)
    }

    public lastHalf(): string {
        return add0x(this.val.slice(-20))
    }
}
