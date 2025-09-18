import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import geoip from "geoip-lite";
import { UAParser } from "ua-parser-js";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateShortCode(length: number = 6): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    return false;
  }
}

export function getLocationFromIP(ip: string) {
  if (ip === "127.0.0.1" || ip === "::1") {
    return { country: "Local", city: "Local" };
  }

  const geo = geoip.lookup(ip);
  if (!geo) return { country: "Unknown", city: "Unknown" };

  return {
    country: geo.country,
    city: geo.city || "Unknown",
  };
}

export function parseUserAgent(uaString: string) {
  const parser = new UAParser(uaString);
  const result = parser.getResult();

  return {
    device_type: result.device.type || "desktop",
    browser: result.browser.name || "Unknown",
    os: result.os.name || "Unknown",
  };
}

export function getClientIP(request: Request): string {
  // Vercel spezifische Header
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const cfIP = request.headers.get("cf-connecting-ip"); // Cloudflare

  if (cfIP) return cfIP.trim();
  if (forwarded) return forwarded.split(",")[0].trim();
  if (realIP) return realIP.trim();

  return "127.0.0.1"; // fallback
}
