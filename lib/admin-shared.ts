export type AdminRevenuePoint = {
  label: string;
  value: number;
};

export type AdminMarketInsight = {
  label: string;
  value: string;
  note?: string;
};

export type AdminActivityRow = {
  id: string;
  name: string;
  entityId: string;
  type: string;
  typeClass: string;
  status: string;
  statusDot: string;
  date: string;
  action: string;
  entityType: string;
};

export type AdminActivityPage = {
  rows: AdminActivityRow[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

export type AdminDashboardResponse = {
  totalUsers: number;
  totalOwners: number;
  totalRenters: number;
  totalAdmins: number;
  activeUsers: number;
  pendingVerificationUsers: number;
  totalListings: number;
  activeListings: number;
  pendingListings: number;
  rejectedListings: number;
  totalBookings: number;
  pendingBookings: number;
  activeBookings: number;
  completedBookings: number;
  totalRevenue: string;
  monthlyRevenue: string;
  paidPaymentsCount: number;
  failedPaymentsCount: number;
  totalInvoices: number;
  outstandingInvoices: number;
  signedContracts: number;
  unsignedContracts: number;
  unreadOrRecentMessagesCount: number;
  recentActivity: AdminActivityRow[];
  revenueSeries: AdminRevenuePoint[];
  marketInsights: AdminMarketInsight[];
};
