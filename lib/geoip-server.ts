import geoip from "geoip-lite";

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

export { default as geoip } from "geoip-lite";
