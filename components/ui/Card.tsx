import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`gyc-card p-lg ${className}`} {...props} />;
}

export function CardHeader({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`mb-4 ${className}`} {...props} />;
}

export function CardBody({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={className} {...props} />;
}

export function CardFooter({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`mt-6 ${className}`} {...props} />;
}

