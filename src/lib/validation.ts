// Client-side mirrors of the API's Zod rules (auth.validation.ts on the
// server) so users get instant feedback with the same messages. The server
// remains the authority — these only avoid a doomed round trip.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateName(label: string, value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return `${label} is required`;
  if (trimmed.length > 50) return `${label} must be at most 50 characters`;
  return undefined;
}

export function validateEmail(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return "Email is required";
  if (trimmed.length > 255) return "Email must be at most 255 characters";
  if (!EMAIL_PATTERN.test(trimmed)) return "Invalid email address";
  return undefined;
}

// bcrypt input limit caps passwords at 72 bytes on the server.
export function validateNewPassword(value: string): string | undefined {
  if (!value) return "Password is required";
  if (value.length < 8) return "Password must be at least 8 characters";
  if (value.length > 72) return "Password must be at most 72 characters";
  return undefined;
}
