const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

function getCsrfToken(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const m = document.cookie.match(/(?:^|;\s*)csrf=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : undefined;
}

export async function apiFetch(path: string, {
  token,
  workspaceId,
  init = {},
}: {
  token?: string | null;
  workspaceId?: string | null;
  init?: RequestInit;
} = {}) {
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