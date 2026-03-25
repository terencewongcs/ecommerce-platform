import { clientEnv } from './env';

// Access token lives in module memory — never written to localStorage/sessionStorage
let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

// Deduplicates concurrent refresh requests — only one in-flight at a time
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = fetch(`${clientEnv.VITE_API_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
    .then(async (res) => {
      if (!res.ok) {
        accessToken = null;
        window.dispatchEvent(new CustomEvent('session:expired'));
        return null;
      }
      const data = (await res.json()) as { accessToken: string };
      accessToken = data.accessToken;
      return data.accessToken;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(`API error ${status}`);
    this.name = 'ApiError';
  }
}

type ApiFetchOptions = RequestInit & {
  /** Skip attaching the Authorization header — use for public/auth endpoints */
  skipAuth?: boolean;
};

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { skipAuth = false, headers: rawHeaders, ...fetchOptions } = options;
  const headers = new Headers(rawHeaders);

  if (fetchOptions.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  if (!skipAuth && accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const url = `${clientEnv.VITE_API_URL}${path}`;
  let res = await fetch(url, { ...fetchOptions, headers, credentials: 'include' });

  // On 401, attempt a silent token refresh and retry once
  if (res.status === 401 && !skipAuth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`);
      res = await fetch(url, { ...fetchOptions, headers, credentials: 'include' });
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, body);
  }

  return res.json() as Promise<T>;
}
