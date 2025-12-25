export function log(message: string, data?: any) {
  console.log(`\n🔹 ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
}

export function success(message: string) {
  console.log(`✅ ${message}`);
}

export function error(message: string) {
  console.log(`❌ ${message}`);
}

export function divider(title: string) {
  console.log("\n" + "=".repeat(50));
  console.log(`  ${title}`);
  console.log("=".repeat(50));
}

