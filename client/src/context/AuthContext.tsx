import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

interface TokenPayload {
  nameid: string;
  email: string;
  given_name: string;
  family_name: string;
  role: string;
  ForcePasswordChange: string;
  exp: number;
}

interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  forcePasswordChange: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  // On app load check if token exists in cookie
  useEffect(() => {
    const token = getCookie('auth_token');
    if (token) {
      decodeAndSetUser(token);
    }
  }, []);

  function getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  }

  function decodeAndSetUser(token: string) {
    try {
      // Use jwtDecode — safe, no eval, CSP compliant
      const decoded = jwtDecode<TokenPayload>(token);

      // Check token expiry
      const isExpired = decoded.exp * 1000 < Date.now();
      if (isExpired) {
        logout();
        return;
      }

      setUser({
        id: decoded.nameid,
        email: decoded.email,
        firstName: decoded.given_name,
        lastName: decoded.family_name,
        role: decoded.role,
        forcePasswordChange: decoded.ForcePasswordChange === 'True'
      });
    } catch {
      logout();
    }
  }

  function login(token: string) {
    // Store token in secure cookie
    document.cookie = `auth_token=${token}; path=/; SameSite=Strict; max-age=${7 * 24 * 60 * 60}`;
    decodeAndSetUser(token);
  }

  function logout() {
    // Clear cookie
    document.cookie = 'auth_token=; path=/; max-age=0';
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}