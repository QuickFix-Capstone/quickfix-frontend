import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [userRole, setUserRole] = useState("customer");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser();
      const session = await fetchAuthSession();

      const idToken = session.tokens?.idToken?.toString();
      const role =
        session.tokens?.idToken?.payload["custom:role"] || "customer";

      console.log("Auth loaded:", {
        user: currentUser.username,
        hasToken: !!idToken,
        tokenLength: idToken?.length,
        role: role,
      });

      setUser(currentUser);
      setToken(idToken);
      setUserRole(role);
    } catch (error) {
      console.error("Auth check error:", error);
      setUser(null);
      setToken(null);
      setUserRole("customer");
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async () => {
    await checkAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        userRole,
        loading,
        refreshToken,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
