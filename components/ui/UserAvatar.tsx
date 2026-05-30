"use client";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return "U";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

type Props = {
  name: string;
  avatarUrl: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

export default function UserAvatar({ name, avatarUrl, size = "md", className }: Props) {
  const sizeClasses = {
    sm: "h-8 w-8 text-[10px]",
    md: "h-11 w-11 text-[12px]",
    lg: "h-16 w-16 text-[16px]",
    xl: "h-24 w-24 text-[22px]",
  }[size];

  return (
    <div
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#f26a1b]/15 to-[#0f3d3e]/10 font-extrabold text-[#0f3d3e] ring-1 ring-outline-variant/60 ${sizeClasses} ${className ?? ""}`}
    >
      {avatarUrl ? (
        <img alt={name} className="h-full w-full object-cover" src={avatarUrl} />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
}
