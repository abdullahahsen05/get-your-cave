export function normalizeInternalPath(path: string | null | undefined) {
  if (!path || typeof path !== "string") {
    return null;
  }

  if (!path.startsWith("/") || path.startsWith("//") || path.includes("://")) {
    return null;
  }

  if (path === "/login" || path === "/signup") {
    return null;
  }

  return path;
}

export function getDashboardPath(role: "ADMIN" | "OWNER" | "RENTER") {
  if (role === "ADMIN") {
    return "/admin/dashboard";
  }

  if (role === "OWNER") {
    return "/owner/dashboard";
  }

  return "/renter/dashboard";
}

