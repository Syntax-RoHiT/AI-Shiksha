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


interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  signup: (email: string, password: string, name: string, role: string) => Promise<boolean>;
  updateUser: (data: Partial<User>) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("lms_token"));
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem("lms_token");
      if (storedToken) {
        try {
          // Verify token and get user profile
          const response = await api.get("/auth/profile");
          setUser(response.data);
          setToken(storedToken);
        } catch (error) {
          console.error("Session expired or invalid", error);
          localStorage.removeItem("lms_token");
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

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const { access_token, user } = response.data;

      localStorage.setItem("lms_token", access_token);
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
    localStorage.removeItem("lms_token");
    window.location.href = "/login"; // Force redirect to clear any state
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
    role: string
  ): Promise<boolean> => {
    try {
      // Role needs to be uppercase for backend if it expects enum, 
      // but typical register might take lowercase. 
      // Let's ensure consistency. Backend expects 'role' in body.
      // Based on CreateUserDto, role is optional, defaults to STUDENT.
      const backendRole = role === 'teacher' ? 'INSTRUCTOR' : role.toUpperCase();

      const response = await api.post("/auth/register", {
        email,
        password,
        name,
        role: backendRole
      });

      // Auto-login after signup? Or just return true.
      // Usually better to auto-login.
      if (response.data) {
        // If register returns user, we might need to login separately 
        // or if register returns token.
        // Backend register returns User object, no token usually unless changed.
        // Let's try to login immediately.
        return await login(email, password);
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
