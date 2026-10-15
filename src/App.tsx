import { useEffect, useState } from 'react';
import { Activity, ArrowUpRight, BookOpen, ChevronRight, FlaskConical, History, Layers, MessageSquare, PanelLeftClose, Radio, RotateCcw } from 'lucide-react';
import { Playground } from './components/Playground';
import { Batch } from './components/Batch';
import { Insights } from './components/Insights';
import { Methodology } from './components/Methodology';
import { readHistory, saveHistory } from './lib/storage';
import { examples } from './lib/examples';
import type { Analysis, ModelReport } from './lib/types';

type View = 'playground' | 'batch' | 'insights' | 'methodology';
const navigation = [
  { id: 'playground' as const, label: 'Playground', icon: MessageSquare },
  { id: 'batch' as const, label: 'Batch analysis', icon: Layers },
  { id: 'insights' as const, label: 'Model insights', icon: FlaskConical },
  { id: 'methodology' as const, label: 'How it works', icon: BookOpen },
];

export default function App() {
  const [view, setView] = useState<View>('playground');
  const [report, setReport] = useState<ModelReport | null>(null);
  const [reportError, setReportError] = useState(false);
  const [history, setHistory] = useState(readHistory);
  const [showHistory, setShowHistory] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [apiState, setApiState] = useState<'connecting' | 'ready' | 'offline'>('connecting');

  useEffect(() => {
    const controller = new AbortController();
    setReportError(false);
    fetch('/model-report.json', { signal: controller.signal }).then(r => {
      if (!r.ok) throw new Error('Report unavailable'); return r.json();
    }).then(setReport).catch(e => { if (e.name !== 'AbortError') setReportError(true); });
    setApiState('connecting');
    fetch('/api/health', { signal: controller.signal }).then(r => { if (!r.ok) throw new Error('API unavailable'); return r.json(); })
      .then(r => setApiState(r.status === 'ready' ? 'ready' : 'offline')).catch(e => { if (e.name !== 'AbortError') setApiState('offline'); });
    return () => controller.abort();
  }, [retry]);

  function updateHistory(result: Analysis | null) {
    const next = result ? [{ id: crypto.randomUUID(), text: result.text, label: result.label, score: result.score, timestamp: new Date().toISOString() }, ...history].slice(0, 10) : [];
    setHistory(next); setStorageError(!saveHistory(next));
    if (result) setApiState('ready');
  }

  function changeView(next: View) { setView(next); setShowHistory(false); window.scrollTo({ top: 0, behavior: 'instant' }); }

  return <div className="app-shell"><a className="skip-link" href="#main">Skip to content</a><aside className="sidebar"><button className="brand" onClick={() => changeView('playground')} aria-label="IntentLab home"><span className="brand-mark"><MessageSquare size={21} strokeWidth={2.2} /><span /></span><span>intent<span className="brand-light">lab</span><small>Language, understood.</small></span></button>
    <div className="sidebar-nav-label">Workspace</div><nav aria-label="Main navigation">{navigation.map(item => <button key={item.id} className={`nav-button ${view === item.id ? 'active' : ''}`} onClick={() => changeView(item.id)} aria-current={view === item.id ? 'page' : undefined}><item.icon size={18} /><span>{item.label}</span>{view === item.id ? <ChevronRight size={15} /> : null}</button>)}</nav>
    <div className="sidebar-project"><span className="project-icon"><Radio size={19} /></span><h2>Small words.<br />Useful signals.</h2><p>An experiment in understanding what people ask for.</p><button onClick={() => changeView('methodology')}>Explore the process<ArrowUpRight size={14} /></button></div>
    <div className="sidebar-bottom"><span className="avatar">Z</span><div><strong>Zayed’s project</strong><span>NLP intent classification</span></div><PanelLeftClose size={17} aria-hidden="true" /></div>
  </aside><div className="main-shell"><header className="topbar"><div className="breadcrumb">Workspace<ChevronRight size={13} /><strong>{navigation.find(item => item.id === view)?.label}</strong></div><div className="topbar-actions"><button className={`api-status ${apiState}`} onClick={() => setRetry(r => r + 1)} title="Check classifier connection"><span className="live-dot" />{apiState === 'ready' ? 'Classifier ready' : apiState === 'offline' ? 'Reconnect classifier' : 'Connecting…'}</button><button className="history-button" onClick={() => { setView('playground'); setShowHistory(s => !s); }} aria-expanded={showHistory}><History size={17} /><span>Recent history</span>{history.length ? <span className="history-count">{history.length}</span> : null}</button></div></header>
    <main id="main" tabIndex={-1}><div className="main-content">{storageError ? <p className="storage-warning" role="status">History is available for this session, but this browser could not save it.</p> : null}
      <div hidden={view !== 'playground'}><Playground initialText={examples[0].text} history={history} onHistory={updateHistory} showHistory={showHistory} onCloseHistory={() => setShowHistory(false)} /></div>
      <div hidden={view !== 'batch'}><Batch /></div>
      {view === 'insights' || view === 'methodology' ? report ? view === 'insights' ? <Insights report={report} /> : <Methodology report={report} /> : <div className="report-loading" role="status">{reportError ? <><h1>The model report couldn’t load.</h1><p>Check your connection and try again.</p><button className="secondary-button" onClick={() => setRetry(r => r + 1)}><RotateCcw size={15} />Retry</button></> : <><Activity className="spin" size={24} /><p>Loading the experiment…</p></>}</div> : null}
    </div></main><footer className="site-footer"><span><MessageSquare size={13} /> IntentLab</span><span>Language has intent. Let’s find it.</span><span>NLP course project <span className="footer-year">2026</span></span></footer>
  </div></div>;
}
