export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  if (Math.abs(value) >= 1_000_000)
    return `$${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000)
    return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

export function formatReturn(value: number | null | undefined): string {
  if (value == null) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function returnColor(value: number | null | undefined): string {
  if (value == null) return "text-gray-400";
  return value >= 0 ? "text-green-400" : "text-red-400";
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

export function tradeTypeBadge(type: string | null): string {
  if (!type) return "bg-gray-700 text-gray-300";
  if (type.includes("Purchase")) return "bg-green-900 text-green-300";
  if (type.includes("Sale")) return "bg-red-900 text-red-300";
  return "bg-gray-700 text-gray-300";
}
