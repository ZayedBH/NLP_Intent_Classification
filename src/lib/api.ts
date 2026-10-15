import type { Analysis } from './types';

const probability = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
function validAnalysis(value: unknown): value is Analysis {
  if (!value || typeof value !== 'object') return false;
  const v = value as Analysis;
  return typeof v.text === 'string' && typeof v.label === 'string'
    && (v.status === 'classified' || v.status === 'uncertain')
    && (v.intent === null || typeof v.intent === 'string') && (v.reason === null || typeof v.reason === 'string')
    && probability(v.score) && probability(v.coverage) && probability(v.margin)
    && typeof v.normalized === 'string' && typeof v.model === 'string' && typeof v.version === 'string'
    && typeof v.explanation_method === 'string' && Number.isFinite(v.elapsed_ms) && v.elapsed_ms >= 0
    && Array.isArray(v.tokens) && v.tokens.every(t => typeof t === 'string')
    && Array.isArray(v.evidence) && v.evidence.every(e => e && typeof e.term === 'string' && Number.isFinite(e.contribution))
    && Array.isArray(v.predictions) && v.predictions.length === 3
    && v.predictions.every(p => p && typeof p.intent === 'string' && typeof p.label === 'string' && probability(p.score));
}

export async function classify(texts: string[], signal?: AbortSignal): Promise<Analysis[]> {
  let response: Response;
  try {
    response = await fetch('/api/classify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ texts }),
      signal: signal ?? AbortSignal.timeout(45000),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new Error('The classifier could not be reached. Check your connection and try again.');
  }
  let body;
  try { body = await response.json(); }
  catch { throw new Error('The classifier is unavailable. Try again shortly.'); }
  if (!response.ok) throw new Error(typeof body?.error === 'string' ? body.error : 'The classifier is unavailable. Try again shortly.');
  if (!Array.isArray(body?.results) || body.results.length !== texts.length || !body.results.every(validAnalysis)) throw new Error('The classifier returned an incomplete response. Try again.');
  return body.results;
}
