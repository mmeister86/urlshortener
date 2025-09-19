// Server-only utilities that use Node.js modules
import { UAParser } from "ua-parser-js";

export async function getLocationFromIP(ip: string) {
  console.log("🌍 GeoIP Debug - Processing IP:", ip);

  // Check for local/private IPs
  if (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.")
  ) {
    console.log("🏠 Local/Private IP detected, using fallback location");
    return { country: "Germany", city: "Local" }; // Fallback für lokale Entwicklung
  }

  try {
    // Dynamically import geoip-lite to handle potential missing data files
    const geoip = await import("geoip-lite");
    console.log("📍 GeoIP module loaded, looking up:", ip);

    const geo = geoip.default.lookup(ip);
    console.log("🔍 GeoIP result:", geo);

    if (!geo) {
      console.warn("❌ No GeoIP data found for IP:", ip);
      return { country: "Unknown", city: "Unknown" };
    }

    const result = {
      country: geo.country,
      city: geo.city || "Unknown",
    };

    console.log("✅ GeoIP success:", result);
    return result;
  } catch (error) {
    console.error("❌ GeoIP lookup failed for IP:", ip);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    } else {
      console.error("Error details:", error);
    }

    // Fallback: Try simple external API for public IPs
    if (
      !ip.startsWith("127.") &&
      !ip.startsWith("192.168.") &&
      !ip.startsWith("10.")
    ) {
      try {
        console.log("🌐 Trying fallback geolocation API for:", ip);
        const response = await fetch(
          `http://ip-api.com/json/${ip}?fields=country,city`
        );
        const data = await response.json();

        if (data.country) {
          console.log("✅ Fallback API success:", data);
          return {
            country: data.country,
            city: data.city || "Unknown",
          };
        }
      } catch (fallbackError) {
        console.error("❌ Fallback API also failed:", fallbackError);
      }
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
