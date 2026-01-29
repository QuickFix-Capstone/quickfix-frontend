// contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import {
  getCurrentUser,
  fetchAuthSession,
  signOut as amplifySignOut,
} from "aws-amplify/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Decode JWT to extract user info and roles
  const decodeToken = (token) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };

  const loadUser = async () => {
    try {
      setLoading(true);

      // Get current user
      const currentUser = await getCurrentUser();

      // Get auth session with tokens
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();

      if (idToken) {
        const decoded = decodeToken(idToken);

        // Organize user data
        setUser({
          userId: currentUser.userId,
          username: currentUser.username,
          email: decoded?.email || "",
          role: decoded["custom:role"] || decoded?.role || "customer", // Extract role from custom attribute
          groups: decoded["cognito:groups"] || [], // If using Cognito Groups
          attributes: decoded,
          tokens: {
            idToken,
            accessToken: session.tokens?.accessToken?.toString(),
          },
        });
      }
    } catch (error) {
      console.error("Error loading user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await amplifySignOut();
      setUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const hasRole = (requiredRole) => {
    if (!user) return false;
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(user.role);
    }
    return user.role === requiredRole;
  };

  const hasPermission = (permission) => {
    // Define role-based permissions
    const rolePermissions = {
      admin: [
        "view_dashboard",
        "manage_users",
        "manage_services",
        "view_bookings",
      ],
      service_provider: ["view_dashboard", "manage_services", "view_bookings"],
      customer: ["book_service", "view_bookings"],
    };

    return rolePermissions[user?.role]?.includes(permission) || false;
  };

  useEffect(() => {
    loadUser();
  }, []);

  const value = {
    user,
    loading,
    signOut,
    hasRole,
    hasPermission,
    refreshUser: loadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
