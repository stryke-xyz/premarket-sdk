function getDeadline(offset: number): bigint {
  return BigInt(Math.floor(new Date().getTime() / 1000) + offset);
}
