import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  AUTH_TOKEN_KEY,
  fetchMe,
  loginUser,
  logoutUser,
  registerUser,
  setAuthToken,
} from "../api/rentalClient";
import type { LoginPayload, RegisterPayload, UserPublic } from "../types";

type AuthContextValue = {
  user: UserPublic | null;
  loading: boolean;
  login: (p: LoginPayload) => Promise<void>;
  register: (p: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const me = await fetchMe();
      setUser(me);
    } catch {
      setAuthToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await refreshUser();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshUser]);

  const login = useCallback(async (p: LoginPayload) => {
    const { token, user: u } = await loginUser(p);
    setAuthToken(token);
    setUser(u);
  }, []);

  const register = useCallback(async (p: RegisterPayload) => {
    const { token, user: u } = await registerUser(p);
    setAuthToken(token);
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      setAuthToken(null);
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, loading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}
