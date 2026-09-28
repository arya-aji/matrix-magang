/**
 * Minimal structured logger (PRD §58).
 *
 * Never log secrets, passwords, session tokens or connection strings — the
 * `sanitize` step strips anything that looks sensitive.
 */

type LogLevel = "info" | "warn" | "error";

export type LogContext = Record<string, unknown>;

const SENSITIVE_KEYS = [
  "password",
  "passwordhash",
  "password_hash",
  "token",
  "sessiontoken",
  "auth_secret",
  "authsecret",
  "database_url",
  "databaseurl",
  "secret",
];

function sanitize(context: LogContext): LogContext {
  const clean: LogContext = {};
  for (const [key, value] of Object.entries(context)) {
    if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
      clean[key] = "[redacted]";
      continue;
    }
    clean[key] = value;
  }
  return clean;
}

function write(level: LogLevel, message: string, context?: LogContext) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context ? sanitize(context) : {}),
  };

  const line = JSON.stringify(entry);

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  info: (message: string, context?: LogContext) => write("info", message, context),
  warn: (message: string, context?: LogContext) => write("warn", message, context),
  error: (message: string, context?: LogContext) => write("error", message, context),
};
