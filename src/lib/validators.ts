import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Blocked file-extension pattern — catches .php, .js in text inputs */
const blockedExt = /\.(php|js)\b/i;

/**
 * Safe text validator for free-text fields (name, address, etc.).
 * Trims → strips HTML → enforces length → blocks dangerous extensions.
 * Do NOT use this on email or phone — they have their own validators.
 */
const safeText = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .transform((v) => v.replace(/<[^>]*>/g, ""))
    .pipe(
      z
        .string()
        .min(min, `${label} is required`)
        .max(max, `${label} is too long`)
        .refine((v) => !blockedExt.test(v), `${label} cannot contain .php or .js`)
    );

/**
 * Strict email — must look like name@domain.tld (TLD ≥ 2 chars).
 * Trims & lowercases.
 */
const strictEmail = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email like name@gmail.com")
  .refine(
    (val) => {
      if (val.endsWith("@gmai.com") || val.endsWith("@gmal.com") || val.endsWith("@gmail.co")) return false;
      return true;
    },
    "Did you mean @gmail.com?"
  );

/**
 * Strict phone — allows digits, spaces, and an optional leading +.
 * After stripping spaces, must be 10–15 digits (with optional +).
 */
const strictPhone = z
  .string()
  .trim()
  .regex(/^\d{10}$/, "Phone must be exactly 10 digits");

// ---------------------------------------------------------------------------
// Booking schemas
// ---------------------------------------------------------------------------

/**
 * Step-2 "details" validation — used when advancing from step 2 to step 3
 * and also for the large-group inquiry flow.
 * Does NOT include peopleCount/date/time so it works for both paths.
 */
export const bookingDetailsSchema = z.object({
  fullName: safeText("Name", 2, 100),
  email: strictEmail,
  phone: strictPhone,
  address: safeText("Address", 1, 500),
});

/**
 * Full booking submit schema — used on final step for normal bookings.
 * Caps peopleCount at 6; groups >6 use the inquiry flow instead.
 */
export const bookingSchema = z.object({
  serviceId: z.string().min(1, "Please select a service"),
  fullName: safeText("Name", 2, 100),
  email: strictEmail,
  phone: strictPhone,
  address: safeText("Address", 1, 500),
  peopleCount: z.coerce
    .number()
    .int()
    .min(1, "At least 1 person")
    .max(4, "Groups of 5 or more must use the inquiry flow"),
  bookingDate: z.string().min(1, "Please select a date"),
  startTime: z.string().min(1, "Please select a time"),
});

// ---------------------------------------------------------------------------
// Inquiry schemas
// ---------------------------------------------------------------------------

export const contactInquirySchema = z.object({
  subject: z.string().trim().min(1, "Please fill all required fields").max(200),
  category: z.string().trim().min(1, "Please fill all required fields").max(100),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(2000),
});

export const classInquirySchema = z.object({
  subject: z.string().trim().min(1, "Please fill all required fields").max(200),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(2000),
  category: z.string().min(1, "Please select a category").max(100),
});

export const largeGroupInquirySchema = z.object({
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(2000),
  category: z.string().min(1, "Please select a category").max(100),
  peopleCount: z.coerce
    .number()
    .int()
    .min(5, "Minimum 5 people for large group")
    .max(100),
  subject: z.string().max(200).optional(),
});

export const reviewSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.coerce.number().int().min(1, "Please select a rating").max(5),
  reviewText: z.string().max(1000).optional(),
});

// ---------------------------------------------------------------------------
// Exported types
// ---------------------------------------------------------------------------

export type BookingDetailsData = z.infer<typeof bookingDetailsSchema>;
export type BookingFormData = z.infer<typeof bookingSchema>;
export type ContactFormData = z.infer<typeof contactInquirySchema>;
export type ClassFormData = z.infer<typeof classInquirySchema>;
export type LargeGroupFormData = z.infer<typeof largeGroupInquirySchema>;
export type ReviewFormData = z.infer<typeof reviewSchema>;

