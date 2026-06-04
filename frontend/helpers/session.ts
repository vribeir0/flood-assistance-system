const SESSION_KEYS = [
  "captcha_verified",
  "captcha_session_token",
  "captcha_session_created_at",
] as const;

export function clearSession() {
  if (typeof localStorage !== "undefined") {
    SESSION_KEYS.forEach((k) => localStorage.removeItem(k));
  }
}
