import { proxyApi } from './index';

describe('API proxy', () => {
  afterEach(() => vi.restoreAllMocks());

  it('forwards GET to the backend with path and query, adding CORS', async () => {
    const upstream = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{"parking":[]}', { status: 200, headers: { 'Content-Type': 'application/json' } }),
    );
    const res = await proxyApi(new Request('https://app.example/api/parking?lat=1&lng=2'), 'https://backend.example');
    expect(String(upstream.mock.calls[0][0])).toBe('https://backend.example/api/parking?lat=1&lng=2');
    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(await res.text()).toBe('{"parking":[]}');
  });

  it('answers CORS preflight without calling the backend', async () => {
    const upstream = vi.spyOn(globalThis, 'fetch');
    const res = await proxyApi(new Request('https://app.example/api/parking', { method: 'OPTIONS' }), 'https://backend.example');
    expect(res.status).toBe(204);
    expect(upstream).not.toHaveBeenCalled();
  });

  it('rejects writes', async () => {
    const res = await proxyApi(new Request('https://app.example/api/parking', { method: 'POST' }), 'https://backend.example');
    expect(res.status).toBe(405);
  });

  it('returns 502 when the backend is unreachable', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('down'));
    const res = await proxyApi(new Request('https://app.example/api/parking'), 'https://backend.example');
    expect(res.status).toBe(502);
  });
});
