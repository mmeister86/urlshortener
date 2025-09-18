// Server-only utilities that use Node.js modules
import { UAParser } from "ua-parser-js";

export async function getLocationFromIP(ip: string) {
  if (ip === "127.0.0.1" || ip === "::1") {
    return { country: "Local", city: "Local" };
  }

  try {
    // Dynamically import geoip-lite to handle potential missing data files
    const geoip = await import("geoip-lite");
    const geo = geoip.default.lookup(ip);
    if (!geo) return { country: "Unknown", city: "Unknown" };

    return {
      country: geo.country,
      city: geo.city || "Unknown",
    };
  } catch (error) {
    if (error instanceof Error) {
      console.warn("GeoIP lookup failed:", error.message);
    } else {
      console.warn("GeoIP lookup failed:", error);
    }
    return { country: "Unknown", city: "Unknown" };
  }
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
