import { describe, expect, it } from 'vitest';
import { readHistory, saveHistory, toCsv } from './storage';

describe('local history', () => {
  it('recovers from invalid stored data', () => {
    localStorage.setItem('intentlab.history', '{broken');
    expect(readHistory()).toEqual([]);
  });
  it('rejects malformed records without crashing', () => {
    localStorage.setItem('intentlab.history', JSON.stringify([{ text: 'hi' }, null]));
    expect(readHistory()).toEqual([]);
  });
  it('caps history and clears it', () => {
    const records = Array.from({ length: 15 }, (_, i) => ({ id: String(i), text: `message ${i}`, label: 'Track order', score: .8, timestamp: '2026-10-14T10:00:00Z' }));
    saveHistory(records);
    expect(readHistory()).toHaveLength(10);
    saveHistory([]);
    expect(readHistory()).toEqual([]);
  });
});

describe('CSV export', () => {
  it('escapes quotation marks, newlines and formula-like input', () => {
    const csv = toCsv([{ text: '=SUM(1,2)\n"quoted"', label: 'Needs clarification', score: .25, status: 'uncertain' }]);
    expect(csv).toContain('"\'=SUM(1,2)\n""quoted"""');
    expect(csv).toContain('"25.0"');
  });
});
