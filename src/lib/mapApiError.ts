import { AxiosError } from 'axios';

/**
 * Normalize any thrown error (axios error, our `ApiResponse` envelope, a raw
 * string, or an unknown value) into a single friendly, user-facing message.
 *
 * This is the ONE place error shapes are untangled so every screen renders a
 * consistent message instead of leaking `[object Object]`, stack traces, or
 * backend field names.
 */
export function mapApiError(
  error: unknown,
  fallback = 'Something went wrong. Please try again.'
): string {
  if (!error) return fallback;

  // Plain string
  if (typeof error === 'string') return error;

  // Axios error → dig into the response body our API returns.
  const axiosErr = error as AxiosError<any>;
  if (axiosErr.isAxiosError) {
    // Network / connection failures (no response received)
    if (!axiosErr.response) {
      if (axiosErr.code === 'ECONNABORTED') {
        return 'The request timed out. Please check your connection and try again.';
      }
      return 'Unable to reach the server. Please check your internet connection.';
    }

    const status = axiosErr.response.status;
    const data = axiosErr.response.data;

    const fromBody = extractMessageFromBody(data);
    if (fromBody) return fromBody;

    // Fall back to status-based messaging.
    return messageForStatus(status, fallback);
  }

  // Our ApiResponse envelope or a bare object with message/error fields.
  if (typeof error === 'object') {
    const fromBody = extractMessageFromBody(error);
    if (fromBody) return fromBody;
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === 'string' && maybeMessage) return maybeMessage;
  }

  return fallback;
}

function extractMessageFromBody(data: unknown): string | null {
  if (!data) return null;
  if (typeof data === 'string') return data;
  if (typeof data !== 'object') return null;

  const body = data as Record<string, any>;

  // FastAPI validation errors: { detail: [{ loc, msg, ... }] }
  if (Array.isArray(body.detail)) {
    const msgs = body.detail
      .map((d: any) => (typeof d === 'string' ? d : d?.msg))
      .filter(Boolean);
    if (msgs.length) return msgs.join(', ');
  }

  // Common single-field message keys, in priority order.
  const candidate =
    body.message ?? body.error ?? body.detail ?? body.error_description;

  if (typeof candidate === 'string' && candidate) return candidate;

  return null;
}

function messageForStatus(status: number, fallback: string): string {
  switch (status) {
    case 400:
      return 'That request looks invalid. Please review and try again.';
    case 401:
      return 'Your session has expired. Please sign in again.';
    case 403:
      return "You don't have permission to do that.";
    case 404:
      return 'We couldn’t find what you were looking for.';
    case 409:
      return 'That conflicts with something that already exists.';
    case 422:
      return 'Some of the details provided are invalid.';
    case 429:
      return 'Too many requests. Please slow down and try again shortly.';
    default:
      if (status >= 500) {
        return 'The server ran into a problem. Please try again in a moment.';
      }
      return fallback;
  }
}

export default mapApiError;
