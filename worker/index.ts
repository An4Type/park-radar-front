interface AssetsBinding {
  fetch(request: Request): Promise<Response>;
}

interface Env {
  ASSETS: AssetsBinding;
  API_ORIGIN: string;
}

const WRITABLE_PATHS = new Set(['/api/zones']);

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Accept, Content-Type',
  'Access-Control-Max-Age': '86400',
};

export async function proxyApi(request: Request, apiOrigin: string): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  const url = new URL(request.url);
  const isRead = request.method === 'GET' || request.method === 'HEAD';
  const isWrite = request.method === 'POST' && WRITABLE_PATHS.has(url.pathname);
  if (!isRead && !isWrite) {
    return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS });
  }

  const upstream = new URL(url.pathname + url.search, apiOrigin);

  try {
    const response = await fetch(upstream, {
      method: request.method,
      headers: isWrite ? { Accept: 'application/json', 'Content-Type': 'application/json' } : { Accept: 'application/json' },
      body: isWrite ? await request.text() : undefined,
    });
    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(CORS_HEADERS)) headers.set(key, value);
    headers.set('Cache-Control', 'no-store');
    return new Response(response.body, { status: response.status, headers });
  } catch {
    return new Response(JSON.stringify({ error: 'Upstream unavailable' }), {
      status: 502,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }
}

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname.startsWith('/api/')) return proxyApi(request, env.API_ORIGIN);
    return env.ASSETS.fetch(request);
  },
};
