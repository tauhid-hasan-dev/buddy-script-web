export type FieldErrors = Record<string, string>;

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: FieldErrors;

  constructor(message: string, status: number, fieldErrors: FieldErrors = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

// Error body shape of the Express API: { error } for HttpError, plus
// { details: [{ field, message }] } for Zod validation failures.
interface ApiErrorBody {
  error?: string;
  details?: { field: string; message: string }[];
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers: {
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
      credentials: "same-origin",
    });
  } catch {
    throw new ApiError(
      "Could not reach the server. Check your connection and try again.",
      0
    );
  }

  const body = (await response.json().catch(() => null)) as
    | (T & ApiErrorBody)
    | null;

  if (!response.ok) {
    const fieldErrors: FieldErrors = {};
    for (const issue of body?.details ?? []) {
      // Keep only the first message per field.
      if (!(issue.field in fieldErrors)) {
        fieldErrors[issue.field] = issue.message;
      }
    }
    throw new ApiError(
      body?.error ?? `Request failed (${response.status})`,
      response.status,
      fieldErrors
    );
  }

  return body as T;
}
