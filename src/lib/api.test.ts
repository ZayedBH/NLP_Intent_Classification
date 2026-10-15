import { afterEach, describe, expect, it, vi } from 'vitest';
import { classify } from './api';

afterEach(() => vi.unstubAllGlobals());
describe('API boundary', () => {
  it('surfaces server validation messages', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'Enter a message containing at least one word.' }), { status: 400 })));
    await expect(classify(['?'])).rejects.toThrow('Enter a message containing at least one word.');
  });
  it('handles unavailable endpoints without a JSON parser error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>Unavailable</html>', { status: 503 })));
    await expect(classify(['track order'])).rejects.toThrow('The classifier is unavailable');
  });
  it('rejects malformed successful results before rendering', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ results: [{}] }), { status: 200 })));
    await expect(classify(['track order'])).rejects.toThrow('The classifier returned an incomplete response');
  });
});
