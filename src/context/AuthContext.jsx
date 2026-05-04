import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi, loginWithPassword, tokenStorage, usersApi } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!tokenStorage.getAccess());

  const fetchMe = useCallback(async () => {
    if (!tokenStorage.getAccess()) {
      setUser(null);
      setLoading(false);
      return null;
    }
    try {
      const { data } = await usersApi.me();
      setUser(data);
      return data;
    } catch {
      tokenStorage.clear();
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = useCallback(async (email, password) => {
    const data = await loginWithPassword(email, password);
    tokenStorage.setAccess(data.access_token);
    await fetchMe();
    return data;
  }, [fetchMe]);

  const register = useCallback(async (payload) => {
    const { data } = await authApi.register(payload);
    return data;
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAdmin: user?.role === "admin",
      login,
      register,
      logout,
      refreshUser: fetchMe,
    }),
    [user, loading, login, register, logout, fetchMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
