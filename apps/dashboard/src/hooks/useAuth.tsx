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

export type UserRole = 'customer' | 'admin' | 'vendor';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

interface ApiUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

interface AuthApiResponse {
  accessToken: string;
  user: ApiUser;
}

interface RefreshApiResponse {
  accessToken: string;
}

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

interface VendorRegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  storeName: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  vendorRegister: (payload: VendorRegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const USER_CACHE_KEY = 'dashboard_auth_user';

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

function decodeJwtPayload(token: string): JwtPayload {
  const segment = token.split('.')[1] ?? '';
  const padded = segment.padEnd(segment.length + ((4 - (segment.length % 4)) % 4), '=');
  return JSON.parse(atob(padded.replace(/-/g, '+').replace(/_/g, '/'))) as JwtPayload;
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initRef = useRef(false);

  // Listen for session expiry events dispatched by apiClient
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
      credentials: 'include',
    })
      .then(async (res) => {
        if (!res.ok) return;
        const data = (await res.json()) as RefreshApiResponse;
        setAccessToken(data.accessToken);

        const cached = getCachedUserProfile();
        if (cached) {
          setUser(cached);
        } else {
          const payload = decodeJwtPayload(data.accessToken);
          setUser({ id: payload.sub, email: payload.email, firstName: '', lastName: '', role: payload.role });
        }
      })
      .catch(() => {
        // No valid cookie — stay logged out
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

  const vendorRegister = useCallback(async (payload: VendorRegisterPayload): Promise<void> => {
    const data = await apiFetch<AuthApiResponse>('/auth/vendor-register', {
      method: 'POST',
      body: JSON.stringify(payload),
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
      setAccessToken(null);
      clearCachedUserProfile();
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: user !== null, login, vendorRegister, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
