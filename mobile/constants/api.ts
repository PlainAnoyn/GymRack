// Central place to configure the backend API base URL.
// Prefer setting EXPO_PUBLIC_API_URL in app config or .env.

// If EXPO_PUBLIC_API_URL is set, we use that (best option for different networks/devices).
// Fallback is your local machine's LAN IP where the backend is running.
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.18.66:4000';






