export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: "USER" | "ADMIN";
  createdAt?: string;
}

export interface AuthResponse {
  message: string;
  user: User;
}

export interface ApiError {
  error: string;
  details?: { field: string; message: string }[];
  requestId?: string;
}

export interface AdminSessionInfo {
  id: string;
  deviceFingerprint?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
  lastSeenAt: string;
  elevatedUntil?: string | null;
  isActive: boolean;
  revokedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSessionsResponse {
  currentSessionId: string | null;
  sessions: AdminSessionInfo[];
}

export interface AdminAuditLog {
  id: string;
  adminId: string;
  sessionId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  requestMethod: string;
  requestPath: string;
  requestId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceFingerprint?: string | null;
  riskLevel?: string | null;
  details?: Record<string, unknown> | null;
  createdAt: string;
}

export interface AdminStepUpResponse {
  message: string;
  elevatedUntil: string;
}

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  durationMinutes: number;
  requiresManualQuote: boolean;
  isActive?: boolean;
}

export type ServiceCategory =
  | "BRIDAL"
  | "NON_BRIDAL"
  | "PARTY"
  | "HAIR"
  | "LASHES";

export interface BookingSlot {
  start: string;
  end: string;
  type: "SERVICE" | "BUFFER";
}

export interface BlockedSlot {
  start: string;
  end: string;
  reason?: string | null;
}

export interface HeldSlot {
  id: string;
  start: string;
  end: string;
  expiresAt: string;
}

export interface BookingHold {
  id: string;
  userId: string;
  serviceId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  peopleCount: number;
  expiresAt: string;
  status: "ACTIVE" | "RELEASED" | "EXPIRED" | "CONVERTED";
}

export interface AvailabilityResponse {
  date: string;
  serviceDurationMinutes: number;
  bookedSlots: BookingSlot[];
  blockedSlots: BlockedSlot[];
  heldSlots: HeldSlot[];
}

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED";

export interface Booking {
  id: string;
  userId: string;
  serviceId: string;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  peopleCount: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
  bufferEndTime: string;
  status: BookingStatus;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
  service: {
    name: string;
    category: ServiceCategory;
    durationMinutes: number;
  };
  slots?: BookingSlot[];
  review?: { id: string } | null;
}

export interface Review {
  id: string;
  rating: number;
  reviewText: string | null;
  reviewedAt: string;
  user: { name: string };
  booking: {
    service: { name: string; category: ServiceCategory };
  };
}

export interface PortfolioItem {
  id: string;
  modelName: string;
  makeupType: string;
  description: string;
  category: ServiceCategory;
  imageUrl: string;
  videoUrl: string | null;
  instagramUrl: string | null;
  sortOrder: number;
  isPublished?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type InquiryType = "CONTACT" | "CLASS" | "LARGE_GROUP";

export type InquiryStatus = "OPEN" | "IN_PROGRESS" | "CLOSED";

export interface Inquiry {
  id: string;
  inquiryType: InquiryType;
  message: string;
  subject?: string | null;
  category?: string | null;
  peopleCount?: number | null;
  status: InquiryStatus;
  createdAt: string;
  updatedAt: string;
}

export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface AdminReview {
  id: string;
  rating: number;
  reviewText: string | null;
  reviewedAt: string;
  status: ReviewStatus;
  user: { name: string; email: string };
  booking: {
    service: { name: string; category: ServiceCategory };
  };
}

export interface AdminBooking extends Booking {
  user?: { name: string; email: string } | null;
  adminNotesSummary?: string | null;
}

export interface AdminNote {
  id: string;
  noteText: string;
  createdAt: string;
  updatedAt: string;
  admin?: { name: string; email: string } | null;
}

export interface BookingStatusHistoryEntry {
  id: string;
  oldStatus?: BookingStatus | null;
  newStatus: BookingStatus;
  changeReason?: string | null;
  createdAt: string;
  changedBy?: { name: string; email: string } | null;
}

export interface AdminBookingDetail extends AdminBooking {
  adminNotes: AdminNote[];
  statusHistory: BookingStatusHistoryEntry[];
}

export interface AdminInquiry extends Inquiry {
  user?: { name: string; email: string } | null;
}

export interface AdminPortfolioItem extends PortfolioItem {
  createdAt?: string;
  updatedAt?: string;
  createdById?: string;
}

export interface BlockedSlotFull {
  id: string;
  blockedDate: string;
  startTime: string;
  endTime: string;
  reason?: string | null;
  createdAt: string;
}

export interface AdminUserSearchReview {
  id: string;
  rating: number;
  reviewText: string | null;
  status: ReviewStatus;
  reviewedAt?: string | null;
  moderatedAt?: string | null;
  createdAt: string;
  booking: {
    id: string;
    service: { name: string; category: ServiceCategory };
  };
}

export interface AdminUserSearchResult {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: "USER" | "ADMIN";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  bookings: Booking[];
  inquiries: Inquiry[];
  reviews: AdminUserSearchReview[];
}
