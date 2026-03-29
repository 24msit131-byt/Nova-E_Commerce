import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize user from localStorage on mount
  useEffect(() => {
    const initializeAuth = () => {
      const token = localStorage.getItem("authToken");
      const storedUser = localStorage.getItem("authUser");

      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (err) {
          console.error("Error parsing stored user:", err);
          localStorage.removeItem("authToken");
          localStorage.removeItem("authUser");
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Login function
  const login = (userData, token) => {
    localStorage.setItem("authToken", token);
    localStorage.setItem("authUser", JSON.stringify(userData));
    setUser(userData);
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
