import Link from "next/link";

interface Props {
  ticker: string;
  className?: string;
}

export default function TickerLink({ ticker, className = "" }: Props) {
  return (
    <Link
      href={`/company/${ticker}`}
      className={`font-bold text-gray-100 hover:text-green-400 transition-colors underline-offset-2 hover:underline ${className}`}
    >
      {ticker}
    </Link>
  );
}
