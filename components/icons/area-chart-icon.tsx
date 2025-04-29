import { LucideProps } from "lucide-react";

export function AreaChart(props: LucideProps) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v18h18" />
      <path d="M3 18L8 12 13 9 21 16" />
      <path d="M3 18L8 12 13 9 21 16 21 19 3 19" fill="currentColor" opacity="0.2" />
    </svg>
  );
}
