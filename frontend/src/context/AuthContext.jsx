import { createContext, startTransition, useContext, useEffect, useState } from "react";
import { api, AUTH_INVALID_EVENT, extractApiError, TOKEN_STORAGE_KEY } from "../lib/api";

const AuthContext = createContext(null);

function withOptionalBirthDate(payload) {
  if (!("birthDate" in payload)) {
    return payload;
  }

  return {
    ...payload,
    birthDate: payload.birthDate ? payload.birthDate : null
  };
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setBootstrapping(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");
        startTransition(() => {
          setUser(response.data);
          setBootstrapping(false);
        });
      } catch {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        startTransition(() => {
          setToken(null);
          setUser(null);
          setBootstrapping(false);
        });
      }
    };

    run();
  }, [token]);

  useEffect(() => {
    const handleInvalidAuth = () => {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      startTransition(() => {
        setToken(null);
        setUser(null);
        setBootstrapping(false);
      });
    };

    window.addEventListener(AUTH_INVALID_EVENT, handleInvalidAuth);
    return () => window.removeEventListener(AUTH_INVALID_EVENT, handleInvalidAuth);
  }, []);

  const persistSession = (nextToken, nextUser) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    startTransition(() => {
      setToken(nextToken);
      setUser(nextUser);
    });
  };

  const login = async (payload) => {
    try {
      const response = await api.post("/auth/login", payload);
      persistSession(response.data.token, response.data.user);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: extractApiError(error) };
    }
  };

  const register = async (payload) => {
    try {
      const response = await api.post("/auth/register", withOptionalBirthDate(payload));
      persistSession(response.data.token, response.data.user);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: extractApiError(error) };
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    startTransition(() => {
      setToken(null);
      setUser(null);
    });
  };

  const refreshMe = async () => {
    if (!token) {
      return;
    }

    const response = await api.get("/auth/me");
    startTransition(() => {
      setUser(response.data);
    });
  };

  const updateUser = (nextUser) => {
    startTransition(() => {
      setUser(nextUser);
    });
  };

  return (
    <AuthContext.Provider
      value={{
        bootstrapping,
        login,
        logout,
        refreshMe,
        register,
        token,
        updateUser,
        user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return value;
}
