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

export function truncateUrl(url: string, maxLength: number = 30): string {
  if (url.length <= maxLength) {
    return url;
  }
  return url.substring(0, maxLength) + "...";
}
