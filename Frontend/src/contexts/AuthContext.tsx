import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import api from "@/lib/api";

export type UserRole = "student" | "teacher" | "admin" | "super_admin" | "franchise_admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
  bio?: string;
  franchise_id?: string | null;
  franchise?: {
    id: string;
    name: string;
    lms_name?: string;
    logo_url?: string | null;
    primary_color?: string;
  } | null;
}

const TOKEN_KEY = "lms_token";
const REMEMBER_KEY = "lms_remember";

/** Reads the token from whichever storage currently holds it. */
function readToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

/** Persists the token. If rememberMe=true → localStorage (survives browser close). */
function saveToken(token: string, rememberMe: boolean) {
  if (rememberMe) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REMEMBER_KEY, "true");
    sessionStorage.removeItem(TOKEN_KEY);
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REMEMBER_KEY);
  }
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REMEMBER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => void;
  signup: (email: string, password: string, name: string, role: string) => Promise<boolean>;
  updateUser: (data: Partial<User>) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(readToken);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = readToken();
      if (storedToken) {
        try {
          // Verify token and get user profile
          const response = await api.get("/auth/profile");
          setUser(response.data);
          setToken(storedToken);
        } catch (error) {
          console.error("Session expired or invalid", error);
          clearToken();
          setToken(null);
          setUser(null);
        }
      } else {
        setToken(null);
      }

      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string, rememberMe = false): Promise<boolean> => {
    try {
      // Clear any stale token before a fresh login
      clearToken();

      const response = await api.post("/auth/login", { email, password, rememberMe });
      const { access_token, user } = response.data;

      saveToken(access_token, rememberMe);
      setToken(access_token);
      setUser(user);
      return true;
    } catch (error) {
      console.error("Login failed", error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    clearToken();
    window.location.href = "/login"; // Force redirect to clear any state
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
    role: string
  ): Promise<boolean> => {
    try {
      const backendRole = role === 'teacher' ? 'INSTRUCTOR' : role.toUpperCase();

      const response = await api.post("/auth/register", {
        email,
        password,
        name,
        role: backendRole
      });

      if (response.data) {
        // Auto-login after signup (no remember me on fresh sign-up)
        return await login(email, password, false);
      }
      return true;
    } catch (error) {
      console.error("Signup failed", error);
      throw error;
    }
  };

  const updateUser = (data: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        login,
        logout,
        signup,
        updateUser,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
