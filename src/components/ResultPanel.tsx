import { useState } from 'react';
import { ArrowUpRight, Check, CircleHelp, ScanText, Sparkles } from 'lucide-react';
import type { Analysis } from '../lib/types';

export function ResultPanel({ result, loading }: { result: Analysis | null; loading: boolean }) {
  const [detail, setDetail] = useState<'evidence' | 'pipeline'>('evidence');
  const uncertain = result?.status === 'uncertain';
  const percentage = result ? result.score * 100 : 0;
  return <section className={`result-panel ${uncertain ? 'uncertain' : ''}`} aria-label="Analysis result" aria-busy={loading}>
    <div className="panel-heading"><span><Sparkles size={17} /> Intent analysis</span><span className="small-muted">{result ? `v${result.version}` : 'Ready when you are'}</span></div>
    {!result ? <div className="result-empty">
      <div className={`empty-instrument ${loading ? 'is-loading' : ''}`} aria-hidden="true"><div className="instrument-inner"><ScanText size={32} /></div><span className="orbit-dot" /></div>
      <h2>{loading ? 'Reading between the words…' : 'There’s meaning in every message.'}</h2>
      <p>{loading ? 'Tokenizing your text and comparing intent patterns.' : 'Analyze a message to see its intent, the alternatives, and the words behind the prediction.'}</p>
      <div className="empty-legend"><span /> Prediction <span /> Explanation <span /> Transparency</div>
    </div> : <>
      <div className="result-summary" aria-live="polite">
        <span className={`status-pill ${uncertain ? 'warning' : 'success'}`}>{uncertain ? <CircleHelp size={13} /> : <Check size={13} />}{uncertain ? 'More context needed' : 'Intent identified'}</span>
        <div className="result-main"><div><p className="small-muted">{uncertain ? 'The model needs a little help' : 'Your message is about'}</p><h2 data-testid="result-label">{result.label}</h2><p className="intent-code">{uncertain ? 'uncertain' : result.intent}</p></div>
          <div className="score-instrument" role="img" aria-label={`Top model score ${percentage.toFixed(1)} percent`}>
            <svg viewBox="0 0 100 100" aria-hidden="true"><circle className="score-track" cx="50" cy="50" r="43" /><circle className="score-fill" cx="50" cy="50" r="43" strokeDasharray={`${percentage * 2.702} 270.2`} /></svg>
            <div><strong>{percentage.toFixed(0)}<small>%</small></strong><span>model score</span></div>
          </div>
        </div>
        {result.reason ? <p className="uncertainty-note">{result.reason}</p> : <p className="score-disclaimer">Model estimate, not a guarantee of correctness.</p>}
      </div>
      <div className="predictions"><div className="section-heading"><h3>Other possibilities</h3><span>Top 3 intents</span></div>{result.predictions.map((prediction, i) => <div className="prediction" key={prediction.intent}>
        <div><span className={i === 0 ? 'best-prediction' : ''}>{prediction.label}{i === 0 ? <ArrowUpRight size={13} /> : null}</span><strong>{(prediction.score * 100).toFixed(1)}%</strong></div>
        <div className="bar-track"><div className={i === 0 ? 'bar-fill primary' : 'bar-fill'} style={{ width: `${prediction.score * 100}%` }} /></div>
      </div>)}</div>
    </>}
    {result ? <div className="result-details">
      <div className="detail-tabs" aria-label="Result details"><button className={detail === 'evidence' ? 'active' : ''} onClick={() => setDetail('evidence')} aria-pressed={detail === 'evidence'}>Why this intent?</button><button className={detail === 'pipeline' ? 'active' : ''} onClick={() => setDetail('pipeline')} aria-pressed={detail === 'pipeline'}>NLP pipeline</button></div>
      {detail === 'evidence' ? <div className="evidence"><h3>Words that made a difference</h3><p>Evidence for {result.predictions[0].label.toLowerCase()}{uncertain ? ', the top candidate' : ''}. Positive values support it; negative values weigh against it.</p>
        <div className="evidence-tokens">{result.evidence.length ? result.evidence.slice(0, 6).map(item => <span className={item.contribution > 0 ? 'positive' : 'negative'} key={item.term}>{item.term}<small>{item.contribution > 0 ? '+' : ''}{item.contribution.toFixed(2)}</small></span>) : <span>No recognized features</span>}</div>
        <details><summary>How is this calculated?</summary><p>{result.explanation_method}. These are feature contributions, not percentages or proof of causation.</p></details>
      </div> : <div className="pipeline-details"><h3>A look inside the pipeline</h3><div className="pipeline-step"><b>1</b><div><strong>NLTK tokenization</strong><div className="token-list">{result.tokens.map((token, i) => <span key={`${token}-${i}`}>{token}</span>)}</div></div></div><div className="pipeline-step"><b>2</b><div><strong>Normalize and vectorize</strong><p>{result.normalized}</p><small>Word + bigram TF-IDF. Negation is preserved.</small></div></div><div className="pipeline-step"><b>3</b><div><strong>{result.model}</strong><p>Compare learned intent patterns, then check uncertainty.</p><small>Content vocabulary overlap: {(result.coverage * 100).toFixed(0)}%</small></div></div></div>}
      <div className="result-footnote"><span><span className="live-dot" /> Actual model inference</span><span>{result.elapsed_ms.toFixed(0)} ms server processing</span></div>
    </div> : <div className="empty-bottom"><ScanText size={15} /><span>NLTK preprocessing. Explainable predictions.</span></div>}
  </section>;
}
