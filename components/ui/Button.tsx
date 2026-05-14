import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function PrimaryButton({ className = "", children, ...props }: Props) {
  return (
    <button className={`gyc-button-primary px-6 py-3 text-sm ${className}`} {...props}>
      {children}
    </button>
  );
}

export function SecondaryButton({ className = "", children, ...props }: Props) {
  return (
    <button className={`gyc-button-secondary px-6 py-3 text-sm ${className}`} {...props}>
      {children}
    </button>
  );
}

export function GhostButton({ className = "", children, ...props }: Props) {
  return (
    <button className={`rounded-full px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-[#F2F0E9] ${className}`} {...props}>
      {children}
    </button>
  );
}

