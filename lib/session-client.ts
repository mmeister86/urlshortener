"use client";

/**
 * Client-side session utilities
 * Provides access to session data from cookies via API calls
 */

export interface ClientSessionData {
  anonymousId?: string;
  isLoggedIn?: boolean;
  userId?: string;
}

// Simple cache to prevent excessive API calls
let sessionCache: {
  data: ClientSessionData | null;
  timestamp: number;
} | null = null;

const CACHE_DURATION = 5000; // 5 seconds cache

/**
 * Get current session from server (with caching)
 */
export async function getClientSession(): Promise<ClientSessionData | null> {
  // Return cached result if still fresh
  if (sessionCache && Date.now() - sessionCache.timestamp < CACHE_DURATION) {
    return sessionCache.data;
  }

  try {
    const response = await fetch("/api/session");
    if (!response.ok) {
      sessionCache = { data: null, timestamp: Date.now() };
      return null;
    }

    const data = await response.json();
    sessionCache = { data, timestamp: Date.now() };
    return data;
  } catch (error) {
    console.error("Failed to get session:", error);
    sessionCache = { data: null, timestamp: Date.now() };
    return null;
  }
}

/**
 * Clear session cache (call after login/logout)
 */
export function clearSessionCache() {
  sessionCache = null;
}
