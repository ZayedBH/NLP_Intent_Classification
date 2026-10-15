import type { HistoryItem } from './types';
const KEY = 'intentlab.history';

export function readHistory(): HistoryItem[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    if (!Array.isArray(data)) return [];
    return data.filter((value): value is HistoryItem => Boolean(value && typeof value === 'object'
      && typeof value.id === 'string' && typeof value.text === 'string' && typeof value.label === 'string'
      && typeof value.score === 'number' && Number.isFinite(value.score) && value.score >= 0 && value.score <= 1
      && typeof value.timestamp === 'string' && Number.isFinite(Date.parse(value.timestamp)))).slice(0, 10);
  } catch { return []; }
}

export function saveHistory(records: HistoryItem[]): boolean {
  try { localStorage.setItem(KEY, JSON.stringify(records.slice(0, 10))); return true; }
  catch { return false; }
}

export function toCsv(rows: { text: string; label: string; score: number; status: string }[]): string {
  const cell = (value: string) => {
    const safe = /^[\s]*[=+@\-]/.test(value) || /^[\t\r\n]/.test(value) ? `'${value}` : value;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  return ['Message,Intent,Model score (%),Status', ...rows.map(r =>
    [r.text, r.label, (r.score * 100).toFixed(1), r.status].map(cell).join(','))].join('\r\n');
}

export function downloadCsv(rows: Parameters<typeof toCsv>[0]): void {
  const url = URL.createObjectURL(new Blob(['\uFEFF', toCsv(rows)], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a'); link.href = url; link.download = 'intentlab-results.csv';
  link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
