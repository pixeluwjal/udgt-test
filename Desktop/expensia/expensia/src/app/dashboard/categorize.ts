export function categorizeItem(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("milk") || lower.includes("bread")) return "Groceries";
  if (lower.includes("shirt") || lower.includes("jeans")) return "Clothing";
  if (lower.includes("phone") || lower.includes("laptop")) return "Electronics";
  return "Other";
}
