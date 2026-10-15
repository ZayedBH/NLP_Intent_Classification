import { useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, CircleAlert, CornerDownLeft, KeyRound, LifeBuoy, LoaderCircle, Package, RotateCcw, ShieldCheck, Trash2 } from 'lucide-react';
import type { Analysis, HistoryItem } from '../lib/types';
import { classify } from '../lib/api';
import { examples } from '../lib/examples';
import { ResultPanel } from './ResultPanel';

const exampleIcons = [Package, RotateCcw, KeyRound, LifeBuoy];
export function Playground({ initialText, history, onHistory, showHistory, onCloseHistory }: {
  initialText: string; history: HistoryItem[]; onHistory: (result: Analysis | null) => void;
  showHistory: boolean; onCloseHistory: () => void;
}) {
  const [text, setText] = useState(initialText);
  const [result, setResult] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const textarea = useRef<HTMLTextAreaElement>(null);
  const invalid = !text.trim() || text.length > 2000;
  const stale = result && result.text !== text.trim();
  async function analyze() {
    if (invalid || loading) return;
    setLoading(true); setError('');
    try { const [next] = await classify([text]); setResult(next); onHistory(next); }
    catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.'); }
    finally { setLoading(false); }
  }
  function chooseExample(value: string) { setText(value); setError(''); textarea.current?.focus(); }
  return <>
    <div className="page-intro"><div><div className="intro-tag"><span /> The intent playground</div><h1>A little language.<br />A lot of meaning.</h1><p>Turn everyday messages into clear intent.<br className="desktop-break" /> Explore what your words are really asking for.</p></div><div className="intro-annotation" aria-hidden="true"><span className="annotation-word">“Where’s my order?”</span><svg viewBox="0 0 180 70"><path d="M20 8C36 56 95 55 150 29M137 28l15 0-6 14" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg><span className="annotation-intent">track_order</span></div></div>
    {showHistory ? <section className="history-panel" aria-label="Recent history"><div className="section-heading"><h2>Recent history</h2><div><button className="text-button" onClick={() => onHistory(null)}><Trash2 size={14} />Clear history</button><button className="text-button" onClick={onCloseHistory}>Close</button></div></div><p className="small-muted">Last 10 analyses, saved in this browser only.</p>{history.length ? <div className="history-items">{history.map(item => <button key={item.id} onClick={() => { chooseExample(item.text); onCloseHistory(); }}><span>{item.text}</span><small>{item.label}<ArrowUpRight size={13} /></small></button>)}</div> : <p>Your next analysis starts the collection.</p>}</section> : null}
    <div className="playground-grid"><div className="composer-column"><section className="composer-panel"><div className="panel-heading"><span><span className="step-badge">1</span> Write a message</span><span className="language-pill">English</span></div>
      <div className="composer-body"><label htmlFor="message">Your message</label><textarea ref={textarea} id="message" value={text} placeholder="What would you like help with?" onChange={e => { setText(e.target.value); setError(''); }} onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); void analyze(); } }} aria-describedby="message-limit" />
        <div className="textarea-footer"><span><span className="live-dot" /> Natural language, welcome</span><span id="message-limit" className={text.length > 2000 ? 'error-text' : ''}>{text.length.toLocaleString()} / 2,000</span></div>
        <div className="composer-actions"><button className="text-button" onClick={() => { setText(''); setResult(null); setError(''); textarea.current?.focus(); }} disabled={loading}>Clear</button><button className="primary-button" onClick={() => void analyze()} disabled={invalid || loading}>{loading ? <LoaderCircle className="spin" size={17} /> : null}{loading ? 'Analyzing…' : 'Analyze intent'}{!loading ? <ArrowRight size={17} /> : null}</button></div>
        <div className="keyboard-tip"><CornerDownLeft size={12} /><span>Ctrl / ⌘ + Enter to analyze</span></div>
        {error ? <p role="alert" className="error-notice"><CircleAlert size={16} />{error}</p> : null}
        {stale && !loading ? <p className="stale-notice">You’ve changed the message. Analyze again to update the result.</p> : null}
      </div></section>
      <section className="examples-section"><div className="section-heading"><h2>A starting point</h2><span>Try an example</span></div><div className="example-grid">{examples.map((example, i) => { const Icon = exampleIcons[i]; return <button className="example-button" key={example.label} onClick={() => chooseExample(example.text)} disabled={loading}><Icon size={18} /><span>{example.label}</span><ArrowUpRight size={15} /></button>; })}</div></section>
      <div className="privacy-note"><ShieldCheck size={18} /><p>Your messages aren’t saved on our server.<br /><span>Recent history stays in your browser.</span></p></div>
    </div><ResultPanel result={result} loading={loading} /></div>
    <div className="playground-bottom"><span>Built to understand requests, one message at a time.</span><span>8 intents <span className="separator">/</span> NLTK + machine learning</span></div>
  </>;
}
