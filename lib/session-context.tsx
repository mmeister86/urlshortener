"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface SessionData {
  anonymousId?: string;
  isLoggedIn?: boolean;
  userId?: string;
  createdAt?: number;
}

interface SessionContextType {
  session: SessionData | null;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSession = async () => {
    try {
      const response = await fetch("/api/session");
      if (response.ok) {
        const sessionData = await response.json();
        setSession(sessionData);
      } else {
        setSession(null);
      }
    } catch (error) {
      console.error("Failed to fetch session:", error);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSession = async () => {
    setIsLoading(true);
    await fetchSession();
  };

  useEffect(() => {
    fetchSession();
  }, []); // Only run once on mount

  return (
    <SessionContext.Provider value={{ session, isLoading, refreshSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
