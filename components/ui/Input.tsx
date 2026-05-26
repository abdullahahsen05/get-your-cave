import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";

export function TextInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`gyc-input w-full min-h-11 text-sm ${className}`} {...props} />;
}

export function SearchInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`gyc-input w-full min-h-11 pl-10 text-sm ${className}`} {...props} />;
}

export function SelectInput({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`gyc-input w-full min-h-11 appearance-none text-sm ${className}`} {...props}>
      {children}
    </select>
  );
}
