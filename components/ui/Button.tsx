import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function PrimaryButton({ className = "", children, ...props }: Props) {
  return (
    <button className={`gyc-button-primary inline-flex min-h-11 items-center justify-center whitespace-nowrap px-4 py-3 text-sm sm:px-6 ${className}`} {...props}>
      {children}
    </button>
  );
}

export function SecondaryButton({ className = "", children, ...props }: Props) {
  return (
    <button className={`gyc-button-secondary inline-flex min-h-11 items-center justify-center whitespace-nowrap px-4 py-3 text-sm sm:px-6 ${className}`} {...props}>
      {children}
    </button>
  );
}

export function GhostButton({ className = "", children, ...props }: Props) {
  return (
    <button className={`inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-[#F2F0E9] sm:px-6 ${className}`} {...props}>
      {children}
    </button>
  );
}
