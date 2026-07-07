type AuthCookieEnv = {
  AUTH_COOKIE_SECURE?: string;
};

export function parseAuthCookieSecure(value: string | undefined, fallback: boolean) {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "true") {
    return true;
  }
  if (normalized === "false") {
    return false;
  }

  throw new Error("AUTH_COOKIE_SECURE must be either true or false");
}

export function getAuthCookieOptions(env: AuthCookieEnv = process.env, nodeEnv = process.env.NODE_ENV) {
  const secure = parseAuthCookieSecure(env.AUTH_COOKIE_SECURE, nodeEnv === "production");

  return {
    secure,
    sameSite: secure ? ("none" as const) : ("lax" as const),
  };
}
