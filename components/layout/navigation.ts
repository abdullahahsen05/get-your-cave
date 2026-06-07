import {
  Bell,
  BookOpen,
  CreditCard,
  FileSignature,
  FileText,
  FolderOpen,
  House,
  LayoutDashboard,
  MessageSquareText,
  PlusCircle,
  Search,
  ShieldCheck,
  UserPlus,
  UserRound,
  Users,
  Wallet,
  ArrowDownToLine,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavigationRole = "ADMIN" | "OWNER" | "RENTER";

export type NavigationItem = {
  href: string;
  labelKey: string;
  icon: LucideIcon;
};

export type NavigationGroup = {
  visible: NavigationItem[];
  other: NavigationItem[];
  titleKey: string;
};

export const publicNavigation = {
  center: [
    { href: "/", labelKey: "nav.home", icon: House },
    { href: "/storage", labelKey: "nav.findACave", icon: Search },
    { href: "/create-listing", labelKey: "nav.listYourCave", icon: PlusCircle },
  ],
  actions: [
    { href: "/login", labelKey: "nav.login", icon: UserRound },
    { href: "/signup", labelKey: "nav.createAccount", icon: UserPlus },
  ],
} satisfies {
  center: NavigationItem[];
  actions: NavigationItem[];
};

const sharedOtherNavigation = {
  contracts: { href: "/contracts", labelKey: "nav.contracts", icon: FileSignature },
  dashboardContracts: {
    href: "/dashboard/contracts",
    labelKey: "nav.dashboardContracts",
    icon: FolderOpen,
  },
  documents: { href: "/document", labelKey: "nav.documents", icon: FileText },
  findACave: { href: "/storage", labelKey: "nav.findACave", icon: Search },
} satisfies Record<string, NavigationItem>;

export const roleNavigation: Record<NavigationRole, NavigationGroup> = {
  RENTER: {
    titleKey: "nav.dashboard",
    visible: [
      { href: "/renter/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
      { href: "/storage", labelKey: "nav.findACave", icon: Search },
      sharedOtherNavigation.contracts,
      { href: "/invoices", labelKey: "nav.invoices", icon: FileText },
      { href: "/profile", labelKey: "nav.profile", icon: UserRound },
    ],
    other: [
      { href: "/messaging", labelKey: "nav.messages", icon: MessageSquareText },
      { href: "/notifications", labelKey: "nav.notifications", icon: Bell },
      sharedOtherNavigation.dashboardContracts,
      sharedOtherNavigation.documents,
    ],
  },
  OWNER: {
    titleKey: "nav.dashboard",
    visible: [
      { href: "/owner/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
      { href: "/create-listing", labelKey: "nav.createListing", icon: PlusCircle },
      sharedOtherNavigation.contracts,
      { href: "/owner/wallet", labelKey: "nav.wallet", icon: Wallet },
      { href: "/profile", labelKey: "nav.profile", icon: UserRound },
    ],
    other: [
      { href: "/messaging", labelKey: "nav.messages", icon: MessageSquareText },
      { href: "/notifications", labelKey: "nav.notifications", icon: Bell },
      sharedOtherNavigation.dashboardContracts,
      sharedOtherNavigation.documents,
      sharedOtherNavigation.findACave,
      { href: "/invoices", labelKey: "nav.invoices", icon: FileText },
    ],
  },
  ADMIN: {
    titleKey: "nav.overview",
    visible: [
      { href: "/admin/dashboard", labelKey: "nav.overview", icon: LayoutDashboard },
      { href: "/admin/bookings", labelKey: "nav.bookings", icon: BookOpen },
      { href: "/admin/contracts", labelKey: "nav.contracts", icon: FileSignature },
      { href: "/admin/payments", labelKey: "nav.payments", icon: CreditCard },
      { href: "/admin/withdrawals", labelKey: "nav.withdrawals", icon: ArrowDownToLine },
      { href: "/admin/users", labelKey: "nav.users", icon: Users },
    ],
    other: [
      { href: "/admin/booking-documents", labelKey: "nav.bookingDocuments", icon: ShieldCheck },
      { href: "/profile", labelKey: "nav.profile", icon: UserRound },
      { href: "/messaging", labelKey: "nav.messages", icon: MessageSquareText },
      { href: "/notifications", labelKey: "nav.notifications", icon: Bell },
      sharedOtherNavigation.documents,
      sharedOtherNavigation.findACave,
    ],
  },
};

export function normalizeNavigationRole(role: string | null | undefined): NavigationRole | null {
  if (!role) {
    return null;
  }

  const normalized = role.toUpperCase();

  if (normalized === "ADMIN" || normalized === "OWNER" || normalized === "RENTER") {
    return normalized;
  }

  if (normalized === "TENANT") {
    return "RENTER";
  }

  return null;
}

export function getRoleNavigation(role: string | null | undefined) {
  const normalizedRole = normalizeNavigationRole(role);

  if (!normalizedRole) {
    return null;
  }

  return roleNavigation[normalizedRole];
}

export function isPathActive(pathname: string | null, href: string) {
  if (!pathname) {
    return false;
  }

  if (href === "/") {
    return pathname === "/";
  }

  if (href === "/storage") {
    return pathname === "/storage" || pathname.startsWith("/storage/");
  }

  if (href === "/invoices") {
    return pathname === "/invoices" || pathname.startsWith("/invoices/");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
