import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { apiFetch, setAccessToken } from '../lib/apiClient';
import { clientEnv } from '../lib/env';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;        // mapped from Mongoose _id
  email: string;
  firstName: string;
  lastName: string;
  role: 'customer' | 'admin';
}

/** Raw shape returned by the API (Mongoose serializes _id, not id) */
interface ApiUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'customer' | 'admin';
}

interface AuthApiResponse {
  accessToken: string;
  user: ApiUser;
}

interface RefreshApiResponse {
  accessToken: string;
}

/** Minimal info decoded from the JWT payload — server already verified the signature */
interface JwtPayload {
  sub: string;
  email: string;
  role: 'customer' | 'admin';
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const USER_CACHE_KEY = 'auth_user_profile';

/** Stores the user profile in sessionStorage so it survives page refreshes.
 *  Only display info (name, role) — NOT the access token. */
function cacheUserProfile(user: AuthUser): void {
  sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
}

function getCachedUserProfile(): AuthUser | null {
  const raw = sessionStorage.getItem(USER_CACHE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function clearCachedUserProfile(): void {
  sessionStorage.removeItem(USER_CACHE_KEY);
}

function mapApiUser(apiUser: ApiUser): AuthUser {
  return {
    id: apiUser._id,
    email: apiUser.email,
    firstName: apiUser.firstName,
    lastName: apiUser.lastName,
    role: apiUser.role,
  };
}

/** Base64url -> Base64 -> JSON decode, without signature verification.
 *  Safe to use client-side: the server already validated the signature. */
function decodeJwtPayload(token: string): JwtPayload {
  const segment = token.split('.')[1] ?? '';
  // Pad to a multiple of 4 as required by atob
  const padded = segment.padEnd(segment.length + ((4 - (segment.length % 4)) % 4), '=');
  return JSON.parse(atob(padded.replace(/-/g, '+').replace(/_/g, '/'))) as JwtPayload;
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Prevents the silent refresh from running twice in React StrictMode (dev only)
  const initRef = useRef(false);

  // Listen for session expiry events dispatched by apiClient when refresh fails mid-session
  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      clearCachedUserProfile();
    };
    window.addEventListener('session:expired', handleExpired);
    return () => window.removeEventListener('session:expired', handleExpired);
  }, []);

  // Attempt a silent refresh on mount — restores the session from the HttpOnly cookie
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    fetch(`${clientEnv.VITE_API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include', // sends the HttpOnly cookie automatically
    })
      .then(async (res) => {
        if (!res.ok) return; // no valid session — stay logged out

        const data = (await res.json()) as RefreshApiResponse;
        setAccessToken(data.accessToken);

        // Prefer the cached profile (has firstName/lastName) over JWT payload (has only sub/email/role)
        const cached = getCachedUserProfile();
        if (cached) {
          setUser(cached);
        } else {
          const payload = decodeJwtPayload(data.accessToken);
          setUser({ id: payload.sub, email: payload.email, firstName: '', lastName: '', role: payload.role });
        }
      })
      .catch(() => {
        // Network error or no cookie — stay logged out, no action needed
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    const data = await apiFetch<AuthApiResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    });
    const mapped = mapApiUser(data.user);
    setAccessToken(data.accessToken);
    cacheUserProfile(mapped);
    setUser(mapped);
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await apiFetch('/auth/logout', { method: 'POST', skipAuth: true });
    } finally {
      // Always clear local state even if the server request fails
      setAccessToken(null);
      clearCachedUserProfile();
      setUser(null);
    }
  }, []);

  const signup = useCallback(
    async (email: string, password: string, firstName: string, lastName: string): Promise<void> => {
      const data = await apiFetch<AuthApiResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, firstName, lastName }),
        skipAuth: true,
      });
      const mapped = mapApiUser(data.user);
      setAccessToken(data.accessToken);
      cacheUserProfile(mapped);
      setUser(mapped);
    },
    [],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        login,
        logout,
        signup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/** Must be used inside AuthProvider */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
