import clsx from "clsx";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "green" | "red" | "blue" | "default";
}

export default function StatCard({ label, value, sub, accent = "default" }: StatCardProps) {
  const accentClass = {
    green: "text-green-400",
    red: "text-red-400",
    blue: "text-blue-400",
    default: "text-gray-100",
  }[accent];

  return (
    <div className="card flex flex-col gap-1">
      <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">{label}</span>
      <span className={clsx("text-2xl font-bold", accentClass)}>{value}</span>
      {sub && <span className="text-xs text-gray-500">{sub}</span>}
    </div>
  );
}
