const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

class SupabaseRequestError extends Error {
  constructor(message, { status, code, details, hint, path } = {}) {
    super(message || 'Supabase request failed');
    this.name = 'SupabaseRequestError';
    this.status = status || 500;
    this.code = code || null;
    this.details = details || null;
    this.hint = hint || null;
    this.path = path || null;
  }
}

function assertConfig() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY server environment variable');
  }
}

async function supabaseFetch(path, options = {}) {
  assertConfig();
  const cleanPath = String(path || '').replace(/^\/+/, '');
  if (!cleanPath || cleanPath.includes('..')) throw new Error('Invalid Supabase REST path');

  const response = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${cleanPath}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const raw = await response.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }

  if (!response.ok) {
    const error = new SupabaseRequestError(
      data?.message || data?.hint || 'Supabase request failed',
      { status: response.status, code: data?.code, details: data?.details, hint: data?.hint, path: cleanPath }
    );
    // Do not log request bodies, authorization headers, or secret answers.
    console.error('[Supabase REST error]', {
      path: error.path,
      status: error.status,
      code: error.code,
      message: error.message,
      hint: error.hint
    });
    throw error;
  }
  return data;
}

function logApiError(route, error) {
  console.error('[Global Shefu API error]', {
    route,
    name: error?.name || 'Error',
    status: error?.status || null,
    code: error?.code || null,
    message: error?.message || 'Unknown error'
  });
}

module.exports = { supabaseFetch, logApiError };
