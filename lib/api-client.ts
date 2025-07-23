const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

function getCsrfToken(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const m = document.cookie.match(/(?:^|;\s*)csrf=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : undefined;
}

type ApiOptions = RequestInit & {
  token?: string | null;
  workspaceId?: string | null;
};

export async function apiFetch(path: string, options: ApiOptions = {}) {
  const { token, workspaceId, ...init } = options;

  // If this is a state-changing request (non-safe method) and we don’t yet
  // have a csrf cookie, perform a lightweight GET first to establish the
  // cookie before retrying the original request. This prevents the backend
  // middleware from rejecting the very first POST/PUT/PATCH/DELETE due to
  // “Missing CSRF token”.
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  const needsCsrf = !safeMethods.includes((init.method || 'GET').toUpperCase());

  if (needsCsrf && typeof document !== 'undefined' && !getCsrfToken()) {
    try {
      // Hit the lightweight /health endpoint to trigger attachCsrfCookie.
      await fetch(`${API_BASE}/health`, { credentials: 'include' });
    } catch {/* ignore – even if this fails we continue */}
  }

  const headers: Record<string,string> = {
    'Content-Type': 'application/json',
  };
  if (init.headers) Object.assign(headers, init.headers as Record<string,string>);

  const csrf = getCsrfToken();
  if (csrf) headers['X-CSRF-Token'] = csrf;
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (workspaceId) headers['X-Workspace-ID'] = workspaceId;

  return fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...init,
    headers,
  });
} 