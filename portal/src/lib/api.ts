// src/lib/api.ts

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("portal_token");
}

function handleUnauthorized() {
  localStorage.removeItem("portal_token");
  if (typeof window !== "undefined") {
    sessionStorage.setItem("auth_message", "Session expired");
    window.location.href = "/login";
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const token = getToken();

  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    // Backend is unreachable
    throw new Error(
      "Cannot connect to server. Make sure backend is running on port 8000."
    );
  }

  if (res.status === 401) {
    handleUnauthorized();
    throw new Error("Unauthorized — session expired");
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let detail = `Request failed with status ${res.status}`;
    try {
      const json = JSON.parse(text);
      detail = json.detail || json.message || detail;
    } catch {
      if (text) detail = text;
    }
    const err = new Error(detail) as any;
    err.detail = detail;
    err.status = res.status;
    throw err;
  }

  // Handle empty responses
  const text = await res.text();
  if (!text) return {} as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) =>
    request<T>(path, { method: "DELETE" }),
};
