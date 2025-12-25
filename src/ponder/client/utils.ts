export function convertBigIntFields<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map((item: any) =>
      typeof item === "object" && item !== null
        ? convertBigIntFields(item)
        : item
    ) as T;
  }

  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  const result = { ...obj };
  for (const key in result) {
    if (typeof result[key] === "string" && /^\d+$/.test(result[key])) {
      try {
        result[key] = BigInt(result[key]) as any;
      } catch {
        // Not a valid bigint string, leave as is
      }
    } else if (typeof result[key] === "object" && result[key] !== null) {
      if (Array.isArray(result[key])) {
        result[key] = result[key].map((item: any) =>
          typeof item === "object" && item !== null
            ? convertBigIntFields(item)
            : item
        ) as any;
      } else {
        result[key] = convertBigIntFields(result[key]);
      }
    }
  }
  return result;
}
