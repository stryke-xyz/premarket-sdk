export function randBigInt(max: number | bigint): bigint {
    let bytesCount = 0
    max = BigInt(max) + 1n
    let rest = max
    while (rest) {
        rest = rest >> 8n
        bytesCount += 1
    }

    const cryptoApi = globalThis.crypto
    if (!cryptoApi?.getRandomValues) {
        throw new Error("Secure random source is not available")
    }

    const bytes = cryptoApi.getRandomValues(new Uint8Array(bytesCount))

    const val = bytes.reduce(
        (acc, val, i) => acc + (BigInt(val) << BigInt(i * 8)),
        0n
    )

    return val % max
}
