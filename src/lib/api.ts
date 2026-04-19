import type { ApiError } from "@/types";

const BASE = "/api/v1";
const DEVICE_FINGERPRINT_KEY = "hm_device_fingerprint";

// Sent on every state-changing request for CSRF protection.
// The backend rejects POST/PUT/PATCH/DELETE without this header.
const CSRF_HEADER = { "X-Requested-With": "XMLHttpRequest" };
let cachedDeviceFingerprint: string | null = null;

function getDeviceFingerprint() {
  if (cachedDeviceFingerprint) {
    return cachedDeviceFingerprint;
  }

  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedFingerprint = window.localStorage.getItem(DEVICE_FINGERPRINT_KEY);
    if (storedFingerprint) {
      cachedDeviceFingerprint = storedFingerprint;
      return storedFingerprint;
    }

    const nextFingerprint =
      window.crypto?.randomUUID?.() ??
      `fp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    window.localStorage.setItem(DEVICE_FINGERPRINT_KEY, nextFingerprint);
    cachedDeviceFingerprint = nextFingerprint;
    return nextFingerprint;
  } catch {
    return null;
  }
}

function buildHeaders() {
  const headers: Record<string, string> = { ...CSRF_HEADER };
  const deviceFingerprint = getDeviceFingerprint();

  if (deviceFingerprint) {
    headers["X-Device-Fingerprint"] = deviceFingerprint;
  }

  return headers;
}

export function getApiErrorMessage(err: unknown, fallback: string) {
  const { error, requestId } = (err as Partial<ApiError>) ?? {};
  const message = error || fallback;
  return requestId ? `${message} (Request: ${requestId})` : message;
}

class ApiClient {
  private refreshPromise: Promise<void> | null = null;
  private authFailureHandler: (() => void) | null = null;

  // After a refresh failure, skip further refresh attempts for this many ms.
  // This prevents dead sessions from repeatedly hammering /auth/refresh.
  private static readonly REFRESH_COOLDOWN_MS = 30_000;
  private refreshFailedAt: number | null = null;

  setAuthFailureHandler(handler: (() => void) | null) {
    this.authFailureHandler = handler;
  }

  /** Call after a successful login or register to clear any cooldown. */
  clearRefreshCooldown() {
    this.refreshFailedAt = null;
  }

  private isRefreshOnCooldown(): boolean {
    if (this.refreshFailedAt === null) return false;
    if (Date.now() - this.refreshFailedAt < ApiClient.REFRESH_COOLDOWN_MS) {
      return true;
    }
    // Cooldown expired, reset
    this.refreshFailedAt = null;
    return false;
  }

  async refreshSession(): Promise<void> {
    if (this.isRefreshOnCooldown()) {
      throw { error: "Session refresh on cooldown" } as const;
    }

    if (!this.refreshPromise) {
      this.refreshPromise = this.fetchAndRefresh()
        .catch((err) => {
          this.refreshFailedAt = Date.now();
          throw err;
        })
        .finally(() => {
          this.refreshPromise = null;
        });
    }

    return this.refreshPromise;
  }

  private async fetchAndRefresh(): Promise<void> {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: buildHeaders(),
    });

    if (!res.ok) {
      throw await this.parseError(res);
    }

    await this.parseResponse<{ message: string }>(res);
  }

  private shouldRefresh(path: string) {
    return !["/auth/login", "/auth/register", "/auth/refresh"].includes(path);
  }

  private notifyAuthFailure() {
    this.authFailureHandler?.();
  }

  private async parseError(res: Response): Promise<ApiError> {
    const requestId = res.headers.get("X-Request-Id") || undefined;
    const text = await res.text().catch(() => "");

    if (!text) {
      return { error: "Something went wrong", requestId };
    }

    try {
      const parsed = JSON.parse(text) as ApiError;
      return { ...parsed, requestId };
    } catch {
      return { error: text, requestId };
    }
  }

  private async parseResponse<T>(res: Response): Promise<T> {
    if (res.status === 204) {
      return undefined as T;
    }

    const text = await res.text().catch(() => "");
    return text ? (JSON.parse(text) as T) : (undefined as T);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    isFormData = false,
    retried = false
  ): Promise<T> {
    const headers = buildHeaders();

    if (body !== undefined && !isFormData) {
      headers["Content-Type"] = "application/json";
    }

    const opts: RequestInit = {
      method,
      credentials: "include",
      headers,
      body:
        body === undefined
          ? undefined
          : isFormData
            ? (body as FormData)
            : JSON.stringify(body),
    };

    const res = await fetch(`${BASE}${path}`, opts);

    if (res.status === 401 && this.shouldRefresh(path)) {
      if (!retried) {
        try {
          await this.refreshSession();
          return this.request<T>(method, path, body, isFormData, true);
        } catch {
          this.notifyAuthFailure();
        }
      } else {
        this.notifyAuthFailure();
      }
    }

    if (!res.ok) {
      throw await this.parseError(res);
    }

    return this.parseResponse<T>(res);
  }

  get<T>(path: string) {
    return this.request<T>("GET", path);
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>("POST", path, body);
  }

  put<T>(path: string, body?: unknown) {
    return this.request<T>("PUT", path, body);
  }

  patch<T>(path: string, body?: unknown) {
    return this.request<T>("PATCH", path, body);
  }

  delete<T>(path: string) {
    return this.request<T>("DELETE", path);
  }

  postFormData<T>(path: string, formData: FormData): Promise<T> {
    return this.request<T>("POST", path, formData, true);
  }

  putFormData<T>(path: string, formData: FormData): Promise<T> {
    return this.request<T>("PUT", path, formData, true);
  }
}

export const api = new ApiClient();
