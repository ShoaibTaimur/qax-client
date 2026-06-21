// Lightweight typed API client for the QAX Express backend.
// Reads token from localStorage on the client; SSR-safe.
// Supports multiple signed-in accounts with instant switching.

const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "";

const TOKEN_KEY = "qax_token";
const USER_KEY = "qax_user";
const ACCOUNTS_KEY = "qax_accounts";

export type StoredAccount<U = unknown> = {
  token: string;
  user: U;
};

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export function getStoredUser<T = unknown>(): T | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setStoredUser(user: unknown | null) {
  if (typeof window === "undefined") return;
  if (user) window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  else window.localStorage.removeItem(USER_KEY);
}

export function getStoredAccounts<U = { id: string }>(): StoredAccount<U>[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(ACCOUNTS_KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as StoredAccount<U>[]) : [];
  } catch {
    return [];
  }
}

export function setStoredAccounts(accounts: StoredAccount[]) {
  if (typeof window === "undefined") return;
  if (accounts.length === 0) window.localStorage.removeItem(ACCOUNTS_KEY);
  else window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function api<T = unknown>(
  path: string,
  opts: RequestInit & { json?: unknown } = {},
): Promise<T> {
  if (!BASE) throw new ApiError(0, "VITE_API_URL is not configured");

  const headers = new Headers(opts.headers);
  headers.set("Accept", "application/json");
  if (opts.json !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers,
    body: opts.json !== undefined ? JSON.stringify(opts.json) : opts.body,
  });

  const ct = res.headers.get("content-type") ?? "";
  const isJson = ct.includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : await res.text();

  if (!res.ok) {
    let msg =
      (isJson && payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: unknown }).error)
        : null) || res.statusText || "Request failed";
    if (
      isJson &&
      payload &&
      typeof payload === "object" &&
      "details" in payload
    ) {
      const d = (payload as { details?: unknown }).details as
        | { fieldErrors?: Record<string, string[]>; formErrors?: string[] }
        | undefined;
      const parts: string[] = [];
      if (d?.formErrors?.length) parts.push(...d.formErrors);
      if (d?.fieldErrors) {
        for (const [field, errs] of Object.entries(d.fieldErrors)) {
          if (errs?.length) parts.push(`${field}: ${errs.join(", ")}`);
        }
      }
      if (parts.length) msg = `${msg} — ${parts.join("; ")}`;
    }
    throw new ApiError(res.status, msg, payload);
  }
  return payload as T;
}

export function downloadUrl(path: string) {
  return `${BASE}${path}`;
}

export const API_BASE = BASE;
