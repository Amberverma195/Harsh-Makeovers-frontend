export function sanitizePhoneInput(value: string) {
  return value.replace(/\D/g, "").slice(0, 10);
}

export function formatPhoneInput(value?: string | null) {
  const digits = sanitizePhoneInput(value ?? "");

  if (!digits) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)})-${digits.slice(3)}`;

  return `(${digits.slice(0, 3)})-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function formatPhoneDisplay(value?: string | null) {
  if (!value) return "";

  const digits = value.replace(/\D/g, "");
  const normalized =
    digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;

  if (normalized.length !== 10) {
    return value;
  }

  return `(${normalized.slice(0, 3)})-${normalized.slice(3, 6)}-${normalized.slice(6)}`;
}

