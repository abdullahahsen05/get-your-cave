import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";

export function TextInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`gyc-input w-full ${className}`} {...props} />;
}

export function SearchInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`gyc-input w-full pl-10 ${className}`} {...props} />;
}

export function SelectInput({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`gyc-input w-full appearance-none ${className}`} {...props}>
      {children}
    </select>
  );
}

