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
  user: ApiUser;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  /** Update the cached user profile after a successful profile edit */
  updateProfile: (updates: Partial<Pick<AuthUser, 'firstName' | 'lastName'>>) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapApiUser(apiUser: ApiUser): AuthUser {
  return {
    id: apiUser._id,
    email: apiUser.email,
    firstName: apiUser.firstName,
    lastName: apiUser.lastName,
    role: apiUser.role,
  };
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
        setUser(mapApiUser(data.user));
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
    setUser(mapped);
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await apiFetch('/auth/logout', { method: 'POST', skipAuth: true });
    } finally {
      // Always clear local state even if the server request fails
      setAccessToken(null);
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
      setUser(mapped);
    },
    [],
  );

  const updateProfile = useCallback(
    (updates: Partial<Pick<AuthUser, 'firstName' | 'lastName'>>) => {
      setUser((prev) => {
        if (!prev) return prev;
        return { ...prev, ...updates };
      });
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
        updateProfile,
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
