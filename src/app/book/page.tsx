"use client";

import { useEffect, useState, useMemo, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { CardSkeleton } from "@/components/Skeleton";
import Spinner from "@/components/Spinner";
import EmptyState from "@/components/EmptyState";
import LuxuryHeroSubtitle from "@/components/LuxuryHeroSubtitle";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { useToast } from "@/context/ToastContext";
import { formatPhoneDisplay, formatPhoneInput, sanitizePhoneInput } from "@/lib/phone";
import { CATEGORY_ICONS, formatDurationInHours, formatTime } from "@/lib/utils";
import { bookingDetailsSchema, bookingSchema } from "@/lib/validators";
import type { Service, AvailabilityResponse, ApiError, BookingHold } from "@/types";
import {
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiClock,
  FiUser,
  FiMapPin,
} from "react-icons/fi";

const ease: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

const LARGE_GROUP_THRESHOLD = 5;
const EXTENDED_GROUP_SLOT_THRESHOLD = 4;
const ROLLING_SLOT_STEP_MINUTES = 30;
const ERROR_SCROLL_OFFSET = 96;
const AVAILABILITY_POLL_INTERVAL_MS = 10_000;
const HOLD_POLL_INTERVAL_MS = 5_000;

const TIME_SLOT_SECTIONS = [
  {
    key: "early-morning",
    title: "Early Morning",
    window: "12:00 AM - 7:00 AM",
    startMinutes: 0,
    endMinutes: 7 * 60,
  },
  {
    key: "morning",
    title: "Morning",
    window: "7:00 AM - 12:00 PM",
    startMinutes: 7 * 60,
    endMinutes: 12 * 60,
  },
  {
    key: "afternoon",
    title: "Afternoon",
    window: "12:00 PM - 4:00 PM",
    startMinutes: 12 * 60,
    endMinutes: 16 * 60,
  },
  {
    key: "evening",
    title: "Evening",
    window: "4:00 PM - 8:00 PM",
    startMinutes: 16 * 60,
    endMinutes: 20 * 60,
  },
  {
    key: "night",
    title: "Night",
    window: "8:00 PM - 12:00 AM",
    startMinutes: 20 * 60,
    endMinutes: 24 * 60,
  },
];

function formatLocalDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function minutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function addMinutesToTime(time: string, minutesToAdd: number) {
  const [hours, minutes] = time.split(":").map(Number);
  const totalMinutes = (hours * 60 + minutes + minutesToAdd) % (24 * 60);
  const nextHours = Math.floor(totalMinutes / 60);
  const nextMinutes = totalMinutes % 60;
  return `${String(nextHours).padStart(2, "0")}:${String(nextMinutes).padStart(2, "0")}`;
}

function formatSlotRange(time: string, durationMinutes: number) {
  return `${formatTime(time)} - ${formatTime(addMinutesToTime(time, durationMinutes))}`;
}

function extractDateValue(value: string) {
  return value.slice(0, 10);
}

function extractTimeValue(value: string) {
  const date = new Date(value);
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function formatDurationLabel(durationMinutes: number) {
  if (durationMinutes <= 0) {
    return "0 min";
  }

  const totalHours = durationMinutes / 60;
  if (Number.isInteger(totalHours)) {
    return `${totalHours} ${totalHours === 1 ? "hour" : "hours"}`;
  }

  const wholeHours = Math.floor(durationMinutes / 60);
  const remainingMinutes = durationMinutes % 60;

  if (wholeHours === 0) {
    return `${remainingMinutes} min`;
  }

  return `${wholeHours} hr ${remainingMinutes} min`;
}

function buildSectionSlots(startMinutes: number, endMinutes: number, slotMinutes: number) {
  if (slotMinutes <= 0 || slotMinutes > endMinutes - startMinutes) {
    return [] as string[];
  }

  const slots: string[] = [];
  for (
    let current = startMinutes;
    current + slotMinutes <= endMinutes;
    current += slotMinutes
  ) {
    slots.push(minutesToTime(current));
  }

  return slots;
}

function buildRollingSlots(
  startMinutes: number,
  endMinutes: number,
  slotMinutes: number,
  stepMinutes: number
) {
  if (slotMinutes <= 0 || slotMinutes > endMinutes - startMinutes) {
    return [] as string[];
  }

  const slots: string[] = [];
  for (
    let current = startMinutes;
    current + slotMinutes <= endMinutes;
    current += stepMinutes
  ) {
    slots.push(minutesToTime(current));
  }

  return slots;
}

function BookingContent() {
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get("serviceId") || "";
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const { showToast } = useToast();

  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [servicesError, setServicesError] = useState("");

  // Step 1: Service selection
  const [selectedServiceId, setSelectedServiceId] = useState(preselectedId);

  // Step 2: Details
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [peopleCount, setPeopleCount] = useState(1);

  // Large group inquiry
  const [isLargeGroup, setIsLargeGroup] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [inquirySubmitting, setInquirySubmitting] = useState(false);

  // Step 3: Date / Time
  const [bookingDate, setBookingDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(
    null
  );
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [selectedTimeSection, setSelectedTimeSection] = useState(
    TIME_SLOT_SECTIONS[1].key
  );
  const [activeHold, setActiveHold] = useState<BookingHold | null>(null);
  const [holdingSlot, setHoldingSlot] = useState(false);
  const [loadingActiveHold, setLoadingActiveHold] = useState(false);
  const [holdTimeRemainingMs, setHoldTimeRemainingMs] = useState(0);

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const requiresBookingContactDetails = true;
  const formTopRef = useRef<HTMLDivElement | null>(null);
  const activeHoldRef = useRef<BookingHold | null>(null);

  const loadServices = useCallback(() => {
    setLoadingServices(true);
    setServicesError("");
    api
      .get<Service[]>("/services")
      .then(setServices)
      .catch((err) => {
        const apiErr = err as ApiError;
        setServices([]);
        setServicesError(apiErr.error || "Unable to load services right now.");
      })
      .finally(() => setLoadingServices(false));
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  useEffect(() => {
    if (preselectedId && services.length) {
      const found = services.find((s) => s.id === preselectedId);
      if (found) {
        setSelectedServiceId(found.id);
        setStep(2);
      }
    }
  }, [preselectedId, services]);

  useEffect(() => {
    if (!user) {
      setActiveHold(null);
      setHoldTimeRemainingMs(0);
      return;
    }

    setFullName((current) => current.trim() || user.name || "");
    setEmail((current) => current.trim() || user.email || "");
    setPhone((current) => current.trim() || user.phone || "");
  }, [user]);

  useEffect(() => {
    activeHoldRef.current = activeHold;
  }, [activeHold]);

  useEffect(() => {
    setIsLargeGroup(peopleCount >= LARGE_GROUP_THRESHOLD);
  }, [peopleCount]);

  const loadAvailability = useCallback(
    async ({
      background = false,
      clearSelection = false,
      showErrorToast = true,
    }: {
      background?: boolean;
      clearSelection?: boolean;
      showErrorToast?: boolean;
    } = {}) => {
      if (!selectedServiceId || !bookingDate) {
        setAvailability(null);
        setAvailabilityError("");
        if (clearSelection) {
          setStartTime("");
        }
        return;
      }

      if (!background) {
        setLoadingAvailability(true);
      }
      if (!background) {
        setAvailability((current) => (clearSelection ? null : current));
      }
      setAvailabilityError("");
      if (clearSelection) {
        setStartTime("");
      }

      try {
        const nextAvailability = await api.get<AvailabilityResponse>(
          `/bookings/availability?serviceId=${selectedServiceId}&date=${bookingDate}`
        );
        setAvailability(nextAvailability);
      } catch (err) {
        const msg = getApiErrorMessage(
          err,
          "Unable to load availability. Please try again."
        );
        if (!background) {
          setAvailability(null);
          setAvailabilityError(msg);
        }
        if (!background && showErrorToast) {
          showToast(msg, "error");
        }
      } finally {
        if (!background) {
          setLoadingAvailability(false);
        }
      }
    },
    [bookingDate, selectedServiceId, showToast]
  );

  useEffect(() => {
    const preserveSelection =
      Boolean(activeHold) &&
      activeHold?.serviceId === selectedServiceId &&
      activeHold?.peopleCount === peopleCount &&
      extractDateValue(activeHold.bookingDate) === bookingDate;

    void loadAvailability({
      clearSelection: !preserveSelection,
      showErrorToast: false,
    });
  }, [activeHold, bookingDate, loadAvailability, peopleCount, selectedServiceId]);

  const selectedService = useMemo(
    () => services.find((s) => s.id === selectedServiceId),
    [services, selectedServiceId]
  );

  const requestedDurationMinutes = useMemo(
    () => (selectedService ? selectedService.durationMinutes * peopleCount : 0),
    [peopleCount, selectedService]
  );
  const requestedDurationLabel = useMemo(
    () => formatDurationLabel(requestedDurationMinutes),
    [requestedDurationMinutes]
  );
  const activeHoldStartTime = useMemo(
    () => (activeHold ? extractTimeValue(activeHold.startTime) : ""),
    [activeHold]
  );
  const hasValidActiveHold = Boolean(
    activeHold &&
      holdTimeRemainingMs > 0 &&
      activeHold.serviceId === selectedServiceId &&
      activeHold.peopleCount === peopleCount &&
      extractDateValue(activeHold.bookingDate) === bookingDate &&
      activeHoldStartTime === startTime
  );

  const usesExtendedGroupSlotPicker =
    peopleCount >= EXTENDED_GROUP_SLOT_THRESHOLD && !isLargeGroup;

  const timeSlotSections = useMemo(
    () =>
      TIME_SLOT_SECTIONS.map((section) => ({
        ...section,
        slots: buildSectionSlots(
          section.startMinutes,
          section.endMinutes,
          requestedDurationMinutes
        ),
      })),
    [requestedDurationMinutes]
  );

  const allDayRollingSlots = useMemo(
    () =>
      buildRollingSlots(
        0,
        24 * 60,
        requestedDurationMinutes,
        ROLLING_SLOT_STEP_MINUTES
      ),
    [requestedDurationMinutes]
  );

  const isSlotBlocked = useCallback(
    (time: string) => {
      if (!availability || !selectedService) return true;
      const datePrefix = bookingDate;
      const slotStart = new Date(`${datePrefix}T${time}:00`);
      const blockedRangeEnd = new Date(
        slotStart.getTime() + requestedDurationMinutes * 60000
      );

      for (const s of [...availability.bookedSlots, ...availability.blockedSlots]) {
        const bStart = new Date(s.start);
        const bEnd = new Date(s.end);
        if (slotStart < bEnd && blockedRangeEnd > bStart) return true;
      }

      for (const heldSlot of availability.heldSlots) {
        if (activeHold?.id === heldSlot.id) {
          continue;
        }

        const holdStart = new Date(heldSlot.start);
        const holdEnd = new Date(heldSlot.end);
        if (slotStart < holdEnd && blockedRangeEnd > holdStart) {
          return true;
        }
      }

      return false;
    },
    [activeHold?.id, availability, bookingDate, requestedDurationMinutes, selectedService]
  );

  useEffect(() => {
    if (usesExtendedGroupSlotPicker) {
      return;
    }

    const firstAvailableSection =
      timeSlotSections.find((section) =>
        section.slots.some((time) => !isSlotBlocked(time))
      )?.key ?? timeSlotSections[1]?.key ?? TIME_SLOT_SECTIONS[1].key;

    setSelectedTimeSection(firstAvailableSection);
  }, [isSlotBlocked, timeSlotSections, usesExtendedGroupSlotPicker]);

  const availableExtendedGroupSlots = useMemo(
    () =>
      usesExtendedGroupSlotPicker
        ? allDayRollingSlots.filter((time) => !isSlotBlocked(time))
        : [],
    [allDayRollingSlots, isSlotBlocked, usesExtendedGroupSlotPicker]
  );

  useEffect(() => {
    if (!startTime || !availability) {
      return;
    }

    const availableStarts = usesExtendedGroupSlotPicker
      ? availableExtendedGroupSlots
      : timeSlotSections.flatMap((section) => section.slots);
    if (!availableStarts.includes(startTime) || isSlotBlocked(startTime)) {
      setStartTime("");
    }
  }, [
    availableExtendedGroupSlots,
    availability,
    isSlotBlocked,
    startTime,
    timeSlotSections,
    usesExtendedGroupSlotPicker,
  ]);

  const minBookingDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return formatLocalDateInput(d);
  }, []);

  const getFieldError = (field: string) => fieldErrors[field] || "";

  const scrollToFormTop = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.requestAnimationFrame(() => {
      if (!formTopRef.current) {
        return;
      }

      const targetTop =
        formTopRef.current.getBoundingClientRect().top +
        window.scrollY -
        ERROR_SCROLL_OFFSET;

      window.scrollTo({
        top: Math.max(0, targetTop),
        behavior: "smooth",
      });
    });
  }, []);

  const showFormError = useCallback(
    (message: string) => {
      setError(message);
      scrollToFormTop();
    },
    [scrollToFormTop]
  );

  const handleInactiveHold = useCallback(
    (message: string) => {
      setActiveHold(null);
      setHoldTimeRemainingMs(0);
      setStartTime("");
      setHoldingSlot(false);
      setStep(3);
      showFormError(message);
      void loadAvailability({
        background: true,
        clearSelection: false,
        showErrorToast: false,
      });
    },
    [loadAvailability, showFormError]
  );

  const releaseHoldById = useCallback(
    async (holdId: string) => {
      try {
        await api.delete(`/bookings/holds/${holdId}`);
      } catch {
        // TTL expiry is the hard safety net; early release is best-effort.
      } finally {
        if (activeHoldRef.current?.id === holdId) {
          setActiveHold(null);
          setHoldTimeRemainingMs(0);
        }
      }
    },
    []
  );

  const restoreActiveHold = useCallback(async () => {
    if (!user) {
      return null;
    }

    setLoadingActiveHold(true);
    try {
      const response = await api.get<{ hold: BookingHold | null }>("/bookings/holds/active");
      const hold = response.hold;

      if (!hold) {
        setActiveHold(null);
        setHoldTimeRemainingMs(0);
        return null;
      }

      setActiveHold(hold);
      setSelectedServiceId(hold.serviceId);
      setPeopleCount(hold.peopleCount);
      setBookingDate(extractDateValue(hold.bookingDate));
      setStartTime(extractTimeValue(hold.startTime));
      setStep((current) => (current < 3 ? 3 : current));
      return hold;
    } catch {
      setActiveHold(null);
      setHoldTimeRemainingMs(0);
      return null;
    } finally {
      setLoadingActiveHold(false);
    }
  }, [user]);

  const createSlotHold = useCallback(
    async (time: string) => {
      if (!selectedServiceId || !bookingDate) {
        showFormError("Please select a date first");
        return;
      }

      if (!user) {
        openAuthModal(() => {
          void createSlotHold(time);
        });
        return;
      }

      if (activeHold?.id && activeHoldStartTime === time && hasValidActiveHold) {
        return;
      }

      setHoldingSlot(true);
      setError("");

      try {
        const previousHoldId = activeHoldRef.current?.id;
        if (previousHoldId) {
          await releaseHoldById(previousHoldId);
        }

        const response = await api.post<{ message: string; hold: BookingHold }>(
          "/bookings/holds",
          {
            serviceId: selectedServiceId,
            bookingDate,
            startTime: time,
            peopleCount,
          }
        );

        setActiveHold(response.hold);
        setStartTime(time);
        await loadAvailability({
          background: true,
          clearSelection: false,
          showErrorToast: false,
        });
      } catch (err) {
        setActiveHold(null);
        setHoldTimeRemainingMs(0);
        setStartTime("");
        showFormError(
          getApiErrorMessage(err, "Unable to hold that time slot. Please try another one.")
        );
        void loadAvailability({
          background: true,
          clearSelection: false,
          showErrorToast: false,
        });
      } finally {
        setHoldingSlot(false);
      }
    },
    [
      activeHold?.id,
      activeHoldStartTime,
      bookingDate,
      hasValidActiveHold,
      loadAvailability,
      openAuthModal,
      peopleCount,
      releaseHoldById,
      selectedServiceId,
      showFormError,
      user,
    ]
  );

  useEffect(() => {
    void restoreActiveHold();
  }, [restoreActiveHold]);

  useEffect(() => {
    if (!activeHold) {
      setHoldTimeRemainingMs(0);
      return;
    }

    const tick = () => {
      const remaining = new Date(activeHold.expiresAt).getTime() - Date.now();
      if (remaining <= 0) {
        handleInactiveHold("Your 2-minute slot hold expired. Please choose another time.");
        return true;
      }

      setHoldTimeRemainingMs(remaining);
      return false;
    };

    if (tick()) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (tick()) {
        window.clearInterval(intervalId);
      }
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeHold, handleInactiveHold]);

  useEffect(() => {
    if (step !== 3 || !selectedServiceId || !bookingDate) {
      return;
    }

    const refreshAvailability = () => {
      void loadAvailability({
        background: true,
        clearSelection: false,
        showErrorToast: false,
      });
    };

    const intervalId = window.setInterval(
      refreshAvailability,
      AVAILABILITY_POLL_INTERVAL_MS
    );
    const handleFocus = () => {
      if (document.visibilityState === "visible") {
        refreshAvailability();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [bookingDate, loadAvailability, selectedServiceId, step]);

  useEffect(() => {
    if (!user || !activeHold?.id) {
      return;
    }

    const pollHold = async () => {
      try {
        const response = await api.get<{ hold: BookingHold | null }>("/bookings/holds/active");
        const hold = response.hold;

        if (!hold || hold.id !== activeHoldRef.current?.id) {
          handleInactiveHold("Your slot hold is no longer active. Please choose another time.");
          return;
        }

        setActiveHold(hold);
      } catch {
        // Keep the current hold state until the next poll/focus refresh.
      }
    };

    const intervalId = window.setInterval(() => {
      void pollHold();
    }, HOLD_POLL_INTERVAL_MS);
    const handleFocus = () => {
      if (document.visibilityState === "visible") {
        void pollHold();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [activeHold?.id, handleInactiveHold, user]);

  useEffect(() => {
    return () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        const holdId = activeHoldRef.current?.id;
        if (holdId) {
          void api.delete(`/bookings/holds/${holdId}`);
        }
      }
    };
  }, []);

  const handleSubmitBooking = useCallback(async () => {
    if (!activeHold || !hasValidActiveHold) {
      handleInactiveHold("Please hold a time slot before continuing.");
      return;
    }

    const result = bookingSchema.safeParse({
      serviceId: selectedServiceId,
      fullName,
      email,
      phone,
      address,
      peopleCount,
      bookingDate,
      startTime,
    });

    if (!result.success) {
      const errs: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0]?.toString();
        if (key && !errs[key]) errs[key] = issue.message;
      }
      setFieldErrors(errs);
      showFormError(Object.values(errs)[0] || "Please fix the errors below");
      return;
    }
    setFieldErrors({});

    setError("");
    setSubmitting(true);
    try {
      await api.post("/bookings", {
        serviceId: selectedServiceId,
        holdId: activeHold.id,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        peopleCount,
        bookingDate,
        startTime,
      });
      setActiveHold(null);
      setHoldTimeRemainingMs(0);
      setSuccess(true);
      showToast("Booking submitted successfully!");
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to submit booking");
      if (
        message.toLowerCase().includes("hold") ||
        message.toLowerCase().includes("choose another time") ||
        message.toLowerCase().includes("choose the slot again") ||
        message.toLowerCase().includes("no longer available")
      ) {
        handleInactiveHold(message);
        return;
      }

      showFormError(message);
    } finally {
      setSubmitting(false);
    }
  }, [
    activeHold,
    selectedServiceId,
    handleInactiveHold,
    hasValidActiveHold,
    fullName,
    email,
    phone,
    address,
    peopleCount,
    bookingDate,
    startTime,
    showToast,
    showFormError,
  ]);

  const submitLargeGroupInquiry = useCallback(async () => {
    const detailsResult = bookingDetailsSchema.safeParse({ fullName, email, phone, address });
    if (!detailsResult.success) {
      const errs: Record<string, string> = {};
      for (const issue of detailsResult.error.issues) {
        const key = issue.path[0]?.toString();
        if (key && !errs[key]) errs[key] = issue.message;
      }
      setFieldErrors(errs);
      showFormError(Object.values(errs)[0] || "Please fix the errors below");
      return;
    }
    setFieldErrors({});

    if (!selectedServiceId || !inquiryMessage.trim()) {
      showFormError("Please fill all required fields");
      return;
    }

    if (inquiryMessage.trim().length < 10) {
      showFormError("Message must be at least 10 characters");
      return;
    }

    setError("");
    setInquirySubmitting(true);
    try {
      const composedMessage = [
        `Name: ${fullName.trim()}`,
        `Email: ${email.trim()}`,
        `Phone: ${phone.trim()}`,
        `Address: ${address.trim()}`,
        "",
        "Inquiry:",
        inquiryMessage.trim(),
      ].join("\n");

      await api.post("/inquiries/large-group", {
        inquiryType: "LARGE_GROUP",
        category: selectedService?.category || "BRIDAL",
        peopleCount,
        message: composedMessage,
      });
      setSuccess(true);
      showToast("Large group inquiry submitted!");
    } catch (err) {
      showFormError((err as ApiError).error || "Failed to submit inquiry");
    } finally {
      setInquirySubmitting(false);
    }
  }, [
    address,
    email,
    fullName,
    inquiryMessage,
    peopleCount,
    phone,
    selectedService?.category,
    selectedServiceId,
    showToast,
    showFormError,
  ]);

  const handleStep4Submit = () => {
    const result = bookingSchema.safeParse({
      serviceId: selectedServiceId,
      fullName,
      email,
      phone,
      address,
      peopleCount,
      bookingDate,
      startTime,
    });

    if (!result.success) {
      const errs: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0]?.toString();
        if (key && !errs[key]) errs[key] = issue.message;
      }
      setFieldErrors(errs);
      showFormError(Object.values(errs)[0] || "Please fix the errors below");
      return;
    }
    setFieldErrors({});

    if (!hasValidActiveHold) {
      handleInactiveHold("Please hold a time slot before continuing.");
      return;
    }

    if (!user) {
      showFormError("Please sign in again and choose your time slot.");
      setStep(3);
      return;
    }

    void handleSubmitBooking();
  };

  const handleLargeGroupSubmit = () => {
    const detailsResult = bookingDetailsSchema.safeParse({ fullName, email, phone, address });
    if (!detailsResult.success) {
      const errs: Record<string, string> = {};
      for (const issue of detailsResult.error.issues) {
        const key = issue.path[0]?.toString();
        if (key && !errs[key]) errs[key] = issue.message;
      }
      setFieldErrors(errs);
      showFormError(Object.values(errs)[0] || "Please fix the errors below");
      return;
    }
    setFieldErrors({});

    if (!selectedServiceId || !inquiryMessage.trim()) {
      showFormError("Please fill all required fields");
      return;
    }

    if (inquiryMessage.trim().length < 10) {
      showFormError("Message must be at least 10 characters");
      return;
    }

    if (!user) {
      openAuthModal(() => {
        void submitLargeGroupInquiry();
      });
      return;
    }

    void submitLargeGroupInquiry();
  };

  const handleStep2Next = () => {
    const result = bookingDetailsSchema.safeParse({ fullName, email, phone, address });
    if (!result.success) {
      const errs: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0]?.toString();
        if (key && !errs[key]) errs[key] = issue.message;
      }
      setFieldErrors(errs);
      showFormError(Object.values(errs)[0] || "Please fix the errors below");
      return;
    }

    setFieldErrors({});
    setError("");
    setStep(3);
  };

  const handleStep3Next = () => {
    if (!bookingDate || !startTime || !hasValidActiveHold) {
      showFormError("Please select and hold a time slot before continuing.");
      return;
    }

    setError("");
    setStep(4);
  };

  if (success) {
    return (
      <PageTransition>
        <div className="flex min-h-[60vh] items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease }}
            className="max-w-md text-center"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
              <FiCheck className="h-10 w-10 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold">
              {isLargeGroup ? "Inquiry Submitted!" : "Booking Submitted!"}
            </h1>
            <p className="mt-3 text-white/50">
              {isLargeGroup
                ? "We've received your large group inquiry. Harsh will get back to you soon."
                : "Booking submitted. You will receive confirmation via email."}
            </p>
          </motion.div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(249,168,201,0.06)_0%,transparent_70%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="text-4xl font-bold sm:text-5xl"
          >
            Book Your Appointment
          </motion.h1>
          <LuxuryHeroSubtitle>
            Choose a service, pick your date, and let us do the rest.
          </LuxuryHeroSubtitle>
        </div>
      </section>

      {/* Step Indicator */}
      <div className="mx-auto mb-10 flex max-w-2xl items-center justify-center gap-2 px-4">
        {["Service", "Details", "Date & Time", "Confirm"].map((label, i) => {
          const stepNum = i + 1;
          const isActive = step === stepNum;
          const isDone = step > stepNum;
          return (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition ${
                  isDone
                    ? "bg-brand-pink text-black"
                    : isActive
                      ? "border-2 border-brand-pink text-brand-pink"
                      : "border border-white/15 text-white/30"
                }`}
              >
                {isDone ? <FiCheck className="h-4 w-4" /> : stepNum}
              </div>
              <span
                className={`hidden text-xs sm:block ${isActive ? "text-white/80" : "text-white/30"}`}
              >
                {label}
              </span>
              {i < 3 && (
                <div
                  className={`h-px w-6 sm:w-10 ${isDone ? "bg-brand-pink" : "bg-white/10"}`}
                />
              )}
            </div>
          );
        })}
      </div>

      <div ref={formTopRef} className="mx-auto max-w-3xl px-4 pb-24">
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Step 1: Service Selection */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease }}
            >
              <h2 className="mb-6 text-xl font-semibold">
                Select a Service
              </h2>
              {loadingServices ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <CardSkeleton key={i} />
                  ))}
                </div>
              ) : servicesError ? (
                <EmptyState
                  title="Unable To Load Services"
                  description={servicesError}
                  action={
                    <button
                      onClick={loadServices}
                      className="rounded-full bg-linear-to-r from-brand-pink to-brand-rose px-6 py-2.5 text-sm font-semibold text-black transition hover:opacity-90"
                    >
                      Retry
                    </button>
                  }
                />
              ) : services.length === 0 ? (
                <EmptyState
                  title="No Services Available"
                  description="No active services are available to book right now."
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {services.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => {
                        setSelectedServiceId(service.id);
                        setStep(2);
                      }}
                      className={`group rounded-2xl border p-5 text-left transition ${
                        selectedServiceId === service.id
                          ? "border-brand-pink/40 bg-brand-pink/5"
                          : "border-white/6 bg-white/3 hover:border-white/15"
                      }`}
                    >
                      <span className="text-xl">
                        {CATEGORY_ICONS[service.category]}
                      </span>
                      <h3 className="mt-2 font-semibold text-white/90">
                        {service.name}
                      </h3>
                      <p className="mt-1 text-xs text-white/40 line-clamp-2">
                        {service.description}
                      </p>
                      <p className="mt-2 text-xs text-brand-pink">
                        {formatDurationInHours(service.durationMinutes)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease }}
            >
              <h2 className="mb-6 text-xl font-semibold">Your Details</h2>
              <div className="rounded-2xl border border-white/8 bg-white/4 p-6 backdrop-blur-sm">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-white/60">
                      Full Name <span className="text-brand-pink">*</span>
                    </label>
                    <div className="relative">
                      <FiUser className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          setError("");
                          setFieldErrors((prev) => ({ ...prev, fullName: "" }));
                        }}
                        placeholder="Your full name"
                        className={`w-full rounded-lg border bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white/90 placeholder-white/25 outline-none transition focus:border-brand-pink/50 focus:ring-2 focus:ring-brand-pink/20 ${getFieldError("fullName") ? "border-red-500/50" : "border-white/10"}`}
                      />
                      {getFieldError("fullName") && (
                        <p className="mt-1 text-xs text-red-400">{getFieldError("fullName")}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-white/60">
                      Email <span className="text-brand-pink">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                        setFieldErrors((prev) => ({ ...prev, email: "" }));
                      }}
                      placeholder="you@example.com"
                      className={`w-full rounded-lg border bg-white/5 px-4 py-2.5 text-sm text-white/90 placeholder-white/25 outline-none transition focus:border-brand-pink/50 focus:ring-2 focus:ring-brand-pink/20 ${getFieldError("email") ? "border-red-500/50" : "border-white/10"}`}
                    />
                    {getFieldError("email") && (
                      <p className="mt-1 text-xs text-red-400">{getFieldError("email")}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-white/60">
                      Phone <span className="text-brand-pink">*</span>
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      value={formatPhoneInput(phone)}
                      onChange={(e) => {
                        setPhone(sanitizePhoneInput(e.target.value));
                        setError("");
                        setFieldErrors((prev) => ({ ...prev, phone: "" }));
                      }}
                      placeholder="(123)-456-7890"
                      maxLength={14}
                      required={requiresBookingContactDetails}
                      className={`w-full rounded-lg border bg-white/5 px-4 py-2.5 text-sm text-white/90 placeholder-white/25 outline-none transition focus:border-brand-pink/50 focus:ring-2 focus:ring-brand-pink/20 ${getFieldError("phone") ? "border-red-500/50" : "border-white/10"}`}
                    />
                    {getFieldError("phone") && (
                      <p className="mt-1 text-xs text-red-400">{getFieldError("phone")}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-white/60">
                      Number of People
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={peopleCount}
                      onChange={(e) => {
                        setPeopleCount(
                          Math.max(1, parseInt(e.target.value) || 1)
                        );
                        setError("");
                      }}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/90 placeholder-white/25 outline-none transition focus:border-brand-pink/50 focus:ring-2 focus:ring-brand-pink/20"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="mb-1 block text-sm font-medium text-white/60">
                    Address <span className="text-brand-pink">*</span>
                  </label>
                  <div className="relative">
                    <FiMapPin className="absolute left-3 top-3 h-4 w-4 text-white/25" />
                    <textarea
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        setError("");
                        setFieldErrors((prev) => ({ ...prev, address: "" }));
                      }}
                      placeholder="Service location address"
                      rows={2}
                      required={requiresBookingContactDetails}
                      className={`w-full rounded-lg border bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white/90 placeholder-white/25 outline-none transition focus:border-brand-pink/50 focus:ring-2 focus:ring-brand-pink/20 ${getFieldError("address") ? "border-red-500/50" : "border-white/10"}`}
                    />
                    {getFieldError("address") && (
                      <p className="mt-1 text-xs text-red-400">{getFieldError("address")}</p>
                    )}
                  </div>
                </div>

                {isLargeGroup && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-6 rounded-xl border border-brand-gold/20 bg-brand-gold/5 p-4"
                  >
                    <p className="mb-3 text-sm font-medium text-brand-gold">
                      For groups of {LARGE_GROUP_THRESHOLD} or more, please
                      submit an inquiry and we&apos;ll get back to you with
                      availability and pricing.
                    </p>
                    <textarea
                      value={inquiryMessage}
                      onChange={(e) => {
                        setInquiryMessage(e.target.value);
                        setError("");
                      }}
                      placeholder="Tell us about your event, preferred dates, and any special requirements (min 10 characters)"
                      rows={4}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/90 placeholder-white/25 outline-none transition focus:border-brand-pink/50 focus:ring-2 focus:ring-brand-pink/20"
                    />
                    <button
                      onClick={handleLargeGroupSubmit}
                      disabled={inquirySubmitting}
                      className="mt-3 rounded-lg bg-linear-to-r from-brand-gold to-brand-rose px-6 py-2.5 text-sm font-semibold text-black transition hover:scale-[1.03] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {inquirySubmitting
                        ? "Submitting..."
                        : "Submit Inquiry"}
                    </button>
                  </motion.div>
                )}
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1 text-sm text-white/50 transition hover:text-white"
                >
                  <FiChevronLeft className="h-4 w-4" /> Back
                </button>
                {!isLargeGroup && (
                  <button
                    onClick={handleStep2Next}
                    className="inline-flex items-center gap-1 rounded-full bg-linear-to-r from-brand-pink to-brand-rose px-6 py-2.5 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next <FiChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 3: Date & Time */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease }}
            >
              <h2 className="mb-6 text-xl font-semibold">
                Pick Date & Time
              </h2>
              <div className="rounded-2xl border border-white/8 bg-white/4 p-6 backdrop-blur-sm">
                <div className="mb-6">
                  <label className="mb-2 block text-sm font-medium text-white/60">
                    <FiCalendar className="mr-1 inline h-4 w-4" /> Select Date
                  </label>
                  <input
                    type="date"
                    min={minBookingDate}
                    value={bookingDate}
                    onChange={(e) => {
                      const nextDate = e.target.value;
                      const previousHoldId = activeHoldRef.current?.id;
                      if (previousHoldId) {
                        void releaseHoldById(previousHoldId);
                      }
                      setActiveHold(null);
                      setHoldTimeRemainingMs(0);
                      setBookingDate(nextDate);
                      setStartTime("");
                      setError("");
                    }}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/90 outline-none transition focus:border-brand-pink/50 focus:ring-2 focus:ring-brand-pink/20 [color-scheme:dark]"
                  />
                  <p className="mt-1 text-xs text-white/30">
                    Bookings require at least 5 days advance notice.
                  </p>
                </div>

                {bookingDate && (
                  <div>
                    <div className="mb-4 rounded-xl border border-brand-pink/12 bg-brand-pink/5 px-4 py-3 text-left text-sm text-white/70">
                      {activeHold && hasValidActiveHold ? (
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-medium text-brand-pink">
                              Slot held for you
                            </p>
                            <p className="mt-1 text-white/50">
                              Finish your booking before the timer runs out.
                            </p>
                          </div>
                          <div className="inline-flex w-fit rounded-full border border-brand-pink/20 bg-black/20 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-brand-pink">
                            {formatCountdown(holdTimeRemainingMs)}
                          </div>
                        </div>
                      ) : (
                        <p className="text-white/55">
                          Pick a time slot to place a 2-minute hold on it while you finish booking.
                        </p>
                      )}
                    </div>

                    <label className="mb-2 block text-sm font-medium text-white/60">
                      <FiClock className="mr-1 inline h-4 w-4" /> Select Start
                      Time
                    </label>
                    {loadingAvailability ? (
                      <div className="flex items-center justify-center py-8">
                        <Spinner />
                      </div>
                    ) : availabilityError || !availability ? (
                      <EmptyState
                        title="Unable To Load Availability"
                        description={
                          availabilityError ||
                          "Unable to load availability. Please try again."
                        }
                        action={
                          <button
                            onClick={() => {
                              void loadAvailability();
                            }}
                            className="rounded-full bg-linear-to-r from-brand-pink to-brand-rose px-6 py-2.5 text-sm font-semibold text-black transition hover:opacity-90"
                          >
                            Retry
                          </button>
                        }
                        />
                    ) : (
                      <>
                        {usesExtendedGroupSlotPicker ? (
                          <div className="rounded-2xl border border-white/8 bg-linear-to-br from-white/[0.05] to-white/[0.02] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
                            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-pink/70">
                                  {requestedDurationLabel} Booking Options
                                </p>
                                <p className="mt-1 text-sm text-white/40">
                                  Showing only uninterrupted {requestedDurationLabel.toLowerCase()} windows for {peopleCount} people.
                                </p>
                              </div>
                              <div className="inline-flex w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/50">
                                {availableExtendedGroupSlots.length} open slot{availableExtendedGroupSlots.length === 1 ? "" : "s"}
                              </div>
                            </div>

                            {availableExtendedGroupSlots.length === 0 ? (
                              <div className="rounded-xl border border-white/8 bg-black/20 px-4 py-6 text-sm text-white/35">
                                No uninterrupted {requestedDurationLabel.toLowerCase()} windows are available on this date.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {availableExtendedGroupSlots.map((time) => {
                                  const selected = startTime === time;

                                  return (
                                    <button
                                      key={time}
                                      onClick={() => {
                                        void createSlotHold(time);
                                      }}
                                      disabled={holdingSlot || loadingActiveHold}
                                      className={`rounded-xl border px-3 py-2.5 text-sm transition ${
                                        selected
                                          ? "border-brand-pink/40 bg-linear-to-r from-brand-pink/25 to-brand-gold/20 text-white shadow-[0_0_0_1px_rgba(249,168,201,0.15)]"
                                          : "border-white/10 bg-white/5 text-white/70 hover:border-brand-pink/25 hover:bg-white/8"
                                      } ${holdingSlot || loadingActiveHold ? "cursor-wait opacity-70" : ""}`}
                                    >
                                      {formatSlotRange(time, requestedDurationMinutes)}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <>
                            <div className="mb-4 flex flex-wrap gap-2">
                              {timeSlotSections.map((section) => {
                                const openCount = section.slots.filter(
                                  (time) => !isSlotBlocked(time)
                                ).length;
                                const isActive = selectedTimeSection === section.key;

                                return (
                                  <button
                                    key={section.key}
                                    onClick={() => {
                                      setSelectedTimeSection(section.key);
                                      setError("");
                                    }}
                                    className={`rounded-full border px-4 py-2 text-sm transition ${
                                      isActive
                                        ? "border-brand-pink/40 bg-brand-pink/15 text-brand-pink"
                                        : "border-white/10 bg-white/5 text-white/60 hover:border-brand-pink/20 hover:text-white/85"
                                    }`}
                                  >
                                    <span className="font-medium">{section.title}</span>
                                    <span className="ml-2 text-xs text-white/40">
                                      {openCount}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>

                            {timeSlotSections.filter(
                              (section) => section.key === selectedTimeSection
                            ).map((section) => {
                              const openCount = section.slots.filter(
                                (time) => !isSlotBlocked(time)
                              ).length;

                              return (
                                <div
                                  key={section.key}
                                  className="rounded-2xl border border-white/8 bg-linear-to-br from-white/[0.05] to-white/[0.02] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)]"
                                >
                                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-pink/70">
                                        {section.title}
                                      </p>
                                      <p className="mt-1 text-sm text-white/40">
                                        {section.window}
                                      </p>
                                    </div>
                                    <div className="inline-flex w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/50">
                                      {openCount} open slot{openCount === 1 ? "" : "s"}
                                    </div>
                                  </div>

                                  {section.slots.length === 0 ? (
                                    <div className="rounded-xl border border-white/8 bg-black/20 px-4 py-6 text-sm text-white/35">
                                      No slots fit inside this time window for a {requestedDurationLabel.toLowerCase()} booking.
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                      {section.slots.map((time) => {
                                        const blocked = isSlotBlocked(time);
                                        const selected = startTime === time;

                                        return (
                                          <button
                                            key={time}
                                            onClick={() => {
                                              if (!blocked) {
                                                void createSlotHold(time);
                                              }
                                            }}
                                            disabled={blocked || holdingSlot || loadingActiveHold}
                                            className={`rounded-xl border px-3 py-2.5 text-sm transition ${
                                              blocked
                                                ? "cursor-not-allowed border-white/5 bg-black/20 text-white/15 line-through"
                                                : selected
                                                  ? "border-brand-pink/40 bg-linear-to-r from-brand-pink/25 to-brand-gold/20 text-white shadow-[0_0_0_1px_rgba(249,168,201,0.15)]"
                                                  : "border-white/10 bg-white/5 text-white/70 hover:border-brand-pink/25 hover:bg-white/8"
                                            }`}
                                          >
                                            {formatSlotRange(time, requestedDurationMinutes)}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </>
                        )}
                      </>
                    )}

                    {startTime && selectedService && (
                      <div className="mt-4 rounded-lg border border-white/8 bg-white/3 p-3 text-sm text-white/50">
                        Appointment duration: ~{requestedDurationLabel}
                        {" "}for {peopleCount} {peopleCount === 1 ? "person" : "people"}.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => {
                    const holdId = activeHoldRef.current?.id;
                    if (holdId) {
                      void releaseHoldById(holdId);
                    }
                    setActiveHold(null);
                    setHoldTimeRemainingMs(0);
                    setStartTime("");
                    setStep(2);
                  }}
                  className="inline-flex items-center gap-1 text-sm text-white/50 transition hover:text-white"
                >
                  <FiChevronLeft className="h-4 w-4" /> Back
                </button>
                <button
                  onClick={handleStep3Next}
                  disabled={!hasValidActiveHold || holdingSlot || loadingActiveHold}
                  className="inline-flex items-center gap-1 rounded-full bg-linear-to-r from-brand-pink to-brand-rose px-6 py-2.5 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next <FiChevronRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Review & Submit */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease }}
            >
              <h2 className="mb-6 text-xl font-semibold">
                Confirm Your Booking
              </h2>
              <div className="rounded-2xl border border-white/8 bg-white/4 p-6 backdrop-blur-sm">
                {activeHold && (
                  <div className="mb-6 rounded-xl border border-brand-pink/12 bg-brand-pink/5 px-4 py-3 text-sm text-white/70">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-brand-pink">
                          Hold expires in {formatCountdown(holdTimeRemainingMs)}
                        </p>
                        <p className="mt-1 text-white/50">
                          Submit before the timer ends to keep this appointment window.
                        </p>
                      </div>
                      <div className="inline-flex w-fit rounded-full border border-brand-pink/20 bg-black/20 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-brand-pink">
                        {formatCountdown(holdTimeRemainingMs)}
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <SummaryRow
                    label="Service"
                    value={selectedService?.name || ""}
                  />
                  <SummaryRow label="Name" value={fullName} />
                  <SummaryRow label="Email" value={email} />
                  {phone && (
                    <SummaryRow
                      label="Phone"
                      value={formatPhoneDisplay(phone)}
                    />
                  )}
                  {address && <SummaryRow label="Address" value={address} />}
                  <SummaryRow
                    label="People"
                    value={String(peopleCount)}
                  />
                  <SummaryRow
                    label="Date"
                    value={new Date(bookingDate + "T00:00:00").toLocaleDateString(
                      "en-US",
                      {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  />
                  <SummaryRow
                    label="Start Time"
                    value={formatSlotRange(startTime, requestedDurationMinutes)}
                  />
                  {selectedService && (
                    <SummaryRow
                      label="Est. Duration"
                      value={requestedDurationLabel}
                    />
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-1 text-sm text-white/50 transition hover:text-white"
                >
                  <FiChevronLeft className="h-4 w-4" /> Back
                </button>
                <button
                  onClick={handleStep4Submit}
                  disabled={submitting || !hasValidActiveHold}
                  className="rounded-full bg-linear-to-r from-brand-pink to-brand-rose px-8 py-3 text-sm font-semibold text-black transition hover:scale-[1.03] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                >
                  {submitting ? "Submitting..." : "Book Appointment"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-white/40">{label}</span>
      <span className="text-sm font-medium text-white/80">{value}</span>
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <BookingContent />
    </Suspense>
  );
}

