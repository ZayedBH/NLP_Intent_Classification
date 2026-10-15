import { useState } from 'react';
import { ArrowRight, CircleAlert, Download, Layers, LoaderCircle } from 'lucide-react';
import { classify } from '../lib/api';
import { downloadCsv } from '../lib/storage';
import type { Analysis } from '../lib/types';

export function Batch() {
  const [text, setText] = useState('');
  const [results, setResults] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  const invalid = !lines.length || lines.length > 25 || lines.some(line => line.length > 2000);
  async function run() {
    if (invalid || loading) return;
    setLoading(true); setError(''); setResults([]);
    try { setResults(await classify(lines)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not analyze these messages. Try again.'); }
    finally { setLoading(false); }
  }
  return <><div className="page-intro compact"><div><div className="intro-tag"><Layers size={14} /> A bigger picture</div><h1>Many messages.<br />One clear view.</h1><p>Compare a collection of requests. One message per line,<br className="desktop-break" /> each with its own intent and model score.</p></div><span className="large-outline-number" aria-hidden="true">25</span></div>
    <section className="batch-composer"><div className="panel-heading"><span><Layers size={17} /> Your message collection</span><span className="small-muted">Up to 25 messages</span></div><div className="composer-body"><label htmlFor="batch">Messages, one per line</label><textarea id="batch" value={text} disabled={loading} onChange={e => { setText(e.target.value); setError(''); setResults([]); }} placeholder={'Where is my order?\nI forgot my password\nCan I get a copy of my invoice?'} /><div className="composer-actions"><span className={lines.length > 25 ? 'error-text' : 'small-muted'}>{lines.length} / 25 messages · 2,000 characters each</span><button className="primary-button" disabled={invalid || loading} onClick={() => void run()}>{loading ? <LoaderCircle size={17} className="spin" /> : null}{loading ? 'Analyzing…' : 'Analyze messages'}<ArrowRight size={17} /></button></div>{invalid && text.trim() ? <p className="error-notice">Keep the batch to 25 messages and each message to 2,000 characters.</p> : null}{error ? <p role="alert" className="error-notice"><CircleAlert size={16} />{error}</p> : null}</div></section>
    {results.length ? <section className="batch-results" aria-live="polite"><div className="section-heading"><h2>{results.length} messages, analyzed</h2><button className="secondary-button" onClick={() => downloadCsv(results)}><Download size={15} />Export CSV</button></div><div className="table-scroll" tabIndex={0}><table><thead><tr><th>Message</th><th>Intent</th><th>Model score</th></tr></thead><tbody>{results.map((r, i) => <tr key={i} data-testid="batch-row"><td>{r.text}</td><td><span className={`status-pill ${r.status === 'uncertain' ? 'warning' : 'neutral'}`}>{r.label}</span>{r.reason ? <small className="batch-reason">{r.reason}</small> : null}</td><td>{(r.score * 100).toFixed(1)}%</td></tr>)}</tbody></table></div><p className="small-muted">Scores are model estimates. Batch messages are not added to local history.</p></section> : <div className="batch-empty"><Layers size={28} /><h2>Find the pattern in the pile.</h2><p>Paste a few messages above to explore their intent side by side.</p></div>}
  </>;
}
