import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserSession {
  id?: string;
  username: string;
  role: string;
  permissions: string[];
}

interface AuthContextType {
  user: UserSession | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: UserSession) => void;
  logout: () => void;
  hasPermission: (permissionId: string) => boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<UserSession | null>(() => {
    const raw = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    let parsed: UserSession | null = null;
    if (raw) {
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = null;
      }
    }

    // Siempre sincronizar con el rol firmado en el token JWT para evitar inconsistencias
    if (storedToken) {
      try {
        const parts = storedToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload?.role) {
            return {
              id: payload.sub || parsed?.id,
              username: payload.username || parsed?.username || 'Usuario',
              role: payload.role,
              permissions: payload.permissions || parsed?.permissions || [],
            };
          }
        }
      } catch {
        // Continuar con parsed
      }
    }

    return parsed;
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      if (window.location.pathname === '/login') {
        window.history.replaceState({}, '', '/');
      }
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const login = (newToken: string, newUser: UserSession) => {
    setToken(newToken);
    setUser(newUser);
    if (window.location.pathname === '/login') {
      window.history.replaceState({}, '', '/');
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (window.location.pathname !== '/login') {
      window.history.replaceState({}, '', '/login');
    }
  };

  // Rol exacto Super Administrador (solo este rol gestiona Variables del Sistema)
  const isSuperAdmin = user?.role === 'Super Administrador';

  // Rol Administrador general (Super Admin o Administrador)
  const isAdmin = isSuperAdmin || user?.role === 'Administrador';

  const hasPermission = (permissionId: string): boolean => {
    if (!user) return false;
    if (isSuperAdmin) return true;
    return Array.isArray(user.permissions) && user.permissions.includes(permissionId);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        login,
        logout,
        hasPermission,
        isSuperAdmin,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
