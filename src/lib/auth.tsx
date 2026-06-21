import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import {
  api,
  getStoredAccounts,
  getStoredUser,
  getToken,
  setStoredAccounts,
  setStoredUser,
  setToken,
  type StoredAccount,
} from "./api";

export type AuthUser = {
  id: string;
  username: string;
  role: "admin" | "tester";
  mustChangePassword?: boolean;
  avatarUrl?: string | null;
  createdAt?: string;
  lastLoginAt?: string;
};

export type AccountEntry = StoredAccount<AuthUser>;

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  accounts: AccountEntry[];
  switching: AuthUser | null;
  login: (username: string, password: string, opts?: { addAccount?: boolean }) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  switchAccount: (userId: string) => Promise<void>;
  removeAccount: (userId: string) => void;
  setUser: (u: AuthUser) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function persistAccounts(list: AccountEntry[]) {
  setStoredAccounts(list as unknown as StoredAccount[]);
}

function upsertAccount(list: AccountEntry[], entry: AccountEntry): AccountEntry[] {
  const filtered = list.filter((a) => a.user.id !== entry.user.id);
  return [entry, ...filtered];
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<AccountEntry[]>([]);
  const [switching, setSwitching] = useState<AuthUser | null>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  const syncAccounts = useCallback(() => {
    setAccounts(getStoredAccounts<AuthUser>());
  }, []);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUserState(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api<AuthUser>("/api/auth/me");
      setUserState(me);
      setStoredUser(me);
      // keep accounts in sync with latest profile data
      const token = getToken()!;
      const list = upsertAccount(getStoredAccounts<AuthUser>(), { token, user: me });
      persistAccounts(list);
      setAccounts(list);
    } catch {
      setToken(null);
      setStoredUser(null);
      setUserState(null);
      // also drop this account from the list
      const remaining = getStoredAccounts<AuthUser>().filter((a) => a.token !== getToken());
      persistAccounts(remaining);
      setAccounts(remaining);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cached = getStoredUser<AuthUser>();
    if (cached) setUserState(cached);
    syncAccounts();
    void refresh();
  }, [refresh, syncAccounts]);

  const login = useCallback(
    async (username: string, password: string, opts?: { addAccount?: boolean }) => {
      // If adding a new account, preserve existing token while doing the login request
      // by clearing it for this call only (login endpoint doesn't need auth anyway).
      const previousToken = getToken();
      if (opts?.addAccount) setToken(null);

      try {
        const res = await api<{ token: string; user: AuthUser }>("/api/auth/login", {
          method: "POST",
          json: { username, password },
        });
        setToken(res.token);
        setStoredUser(res.user);
        setUserState(res.user);
        const list = upsertAccount(getStoredAccounts<AuthUser>(), {
          token: res.token,
          user: res.user,
        });
        persistAccounts(list);
        setAccounts(list);
        return res.user;
      } catch (err) {
        // restore prior token on failure when adding
        if (opts?.addAccount && previousToken) setToken(previousToken);
        throw err;
      }
    },
    [],
  );

  const switchAccount = useCallback(
    async (userId: string) => {
      const list = getStoredAccounts<AuthUser>();
      const entry = list.find((a) => a.user.id === userId);
      if (!entry) return;
      if (user?.id === userId) return;
      setSwitching(entry.user);
      // Let the overlay animate in fully before swapping identity
      await new Promise((r) => setTimeout(r, 700));
      setToken(entry.token);
      setStoredUser(entry.user);
      setUserState(entry.user);
      const reordered = [entry, ...list.filter((a) => a.user.id !== userId)];
      persistAccounts(reordered);
      setAccounts(reordered);
      // Drop all cached data from the previous account so the new account's
      // data is fetched fresh instead of showing the prior user's data.
      await queryClient.cancelQueries();
      await queryClient.resetQueries();
      try {
        await refresh();
        await router.invalidate();
      } finally {
        // Hold a beat so the "done" state can play through smoothly
        await new Promise((r) => setTimeout(r, 1200));
        setSwitching(null);
      }
    },
    [refresh, user?.id, queryClient, router],
  );

  const removeAccount = useCallback(
    (userId: string) => {
      const list = getStoredAccounts<AuthUser>();
      const remaining = list.filter((a) => a.user.id !== userId);
      persistAccounts(remaining);
      setAccounts(remaining);
      // If we removed the active account, switch to another or sign out
      if (user?.id === userId) {
        void queryClient.cancelQueries();
        void queryClient.resetQueries();
        if (remaining.length > 0) {
          const next = remaining[0];
          setToken(next.token);
          setStoredUser(next.user);
          setUserState(next.user);
          void refresh();
          void router.invalidate();
        } else {
          setToken(null);
          setStoredUser(null);
          setUserState(null);
        }
      }
    },
    [user, refresh, queryClient, router],
  );

  const logout = useCallback(async () => {
    const currentId = user?.id;
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    // Drop current account from list and switch to next if any
    const remaining = getStoredAccounts<AuthUser>().filter((a) => a.user.id !== currentId);
    persistAccounts(remaining);
    setAccounts(remaining);
    await queryClient.cancelQueries();
    await queryClient.resetQueries();
    if (remaining.length > 0) {
      const next = remaining[0];
      setToken(next.token);
      setStoredUser(next.user);
      setUserState(next.user);
      void refresh();
      void router.invalidate();
    } else {
      setToken(null);
      setStoredUser(null);
      setUserState(null);
    }
  }, [user, refresh, queryClient, router]);

  const setUser = useCallback((u: AuthUser) => {
    setUserState(u);
    setStoredUser(u);
    const token = getToken();
    if (token) {
      const list = upsertAccount(getStoredAccounts<AuthUser>(), { token, user: u });
      persistAccounts(list);
      setAccounts(list);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        accounts,
        switching,
        login,
        logout,
        refresh,
        switchAccount,
        removeAccount,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
