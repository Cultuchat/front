"use client";

import { useState, useEffect, useCallback } from "react";

const AUTH_KEY = "cultuchat_auth";

interface User {
  id: string;
  name: string;
  email?: string;
  createdAt: Date;
  isGuest: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  
  useEffect(() => {
    const stored = localStorage.getItem(AUTH_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser({
          ...parsed,
          createdAt: new Date(parsed.createdAt),
        });
      } catch (error) {
        console.error("Error loading auth:", error);
      }
    }
    setIsLoading(false);
  }, []);

  
  const saveUser = useCallback((userData: User) => {
    setUser(userData);
    localStorage.setItem(AUTH_KEY, JSON.stringify(userData));
  }, []);

  
  const loginAsGuest = useCallback(() => {
    const guestUser: User = {
      id: `guest_${Date.now()}`,
      name: "Invitado",
      isGuest: true,
      createdAt: new Date(),
    };
    saveUser(guestUser);
    return guestUser;
  }, [saveUser]);

  
  const loginWithEmail = useCallback((email: string, name: string) => {
    const emailUser: User = {
      id: `user_${Date.now()}`,
      name,
      email,
      isGuest: false,
      createdAt: new Date(),
    };
    saveUser(emailUser);
    return emailUser;
  }, [saveUser]);

  
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_KEY);
  }, []);

  
  const isAuthenticated = user !== null;

  return {
    user,
    isLoading,
    isAuthenticated,
    loginAsGuest,
    loginWithEmail,
    logout,
  };
}
