import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '../../types/api';
import { api } from '../../services/apiClient';
import { clearTokens, getAccessToken, setTokens } from '../../services/tokenStore';

type AuthContextValue = {
  user: User | null;
  isBootstrapping: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      if (!getAccessToken()) {
        setIsBootstrapping(false);
        return;
      }

      try {
        setUser(await api.me());
      } catch {
        clearTokens();
      } finally {
        setIsBootstrapping(false);
      }
    }

    void restoreSession();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isBootstrapping,
      login: async (email, password) => {
        const response = await api.login(email, password);
        setTokens({ accessToken: response.accessToken, refreshToken: response.refreshToken });
        setUser(response.user);
      },
      logout: async () => {
        await api.logout();
        setUser(null);
      },
    }),
    [isBootstrapping, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
