import { useState, useEffect, useRef, useMemo } from 'react';
import { runDesignerAgent } from './agents/DesignerAgent';
import { useStore } from './store/useStore';

const styles = `
  .orch-dash {
    --bg-main: #13141C;
    --bg-surface: #1E202E;
    --bg-panel: #2A2C3D;
    --border: #3A3C52;
    --text-main: #F3F4F6;
    --text-muted: #9CA3AF;
    --text-dark: #1F2937;

    --color-orchestrator: #7F77DD; 
    --color-researcher: #1D9E75;
    --color-designer: #D4537E;
    --color-developer: #378ADD;
    --color-qa: #BA7517;
    --color-docs: #D85A30;
    --color-reviewer: #888780;

    --score-very-high: #1D9E75;
    --score-high: #378ADD;
    --score-moderate: #BA7517;
    --score-low: #E24B4A;
    --score-very-low: #791F1F;

    --btn-primary: #3B82F6;
    --btn-success: #10B981;
    --btn-danger: #EF4444;

    background-color: var(--bg-main);
    color: var(--text-main);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    min-height: 100vh;
    padding: 1.5rem;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  .orch-dash * {
    box-sizing: border-box;
  }

  /* SECTION 1 - TOP */
  .sect-top { display: flex; gap: 1.5rem; }
  .input-panel {
    flex: 1;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .input-area {
    width: 100%;
    background: var(--bg-main);
    border: 1px solid var(--border);
    color: var(--text-main);
    border-radius: 6px;
    padding: 1rem;
    resize: vertical;
    min-height: 120px;
    font-size: 0.95rem;
  }
  .dash-btn {
    padding: 0.6rem 1.25rem;
    border-radius: 6px;
    border: none;
    font-weight: 600;
    cursor: pointer;
    background: var(--bg-panel);
    color: var(--text-main);
    transition: opacity 0.2s;
    font-size: 0.9rem;
  }
  .dash-btn:hover { opacity: 0.8; }
  .dash-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .dash-btn-primary { background: var(--btn-primary); color: #fff; }
  .dash-btn-success { background: var(--btn-success); color: #fff; }
  .dash-btn-danger { background: var(--btn-danger); color: #fff; }

  .orch-status-tile {
    flex: 1;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    border-left: 4px solid var(--color-orchestrator);
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .stats-row {
    display: flex;
    gap: 1.5rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border);
  }
  .stat-block { display: flex; flex-direction: column; }
  .stat-label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; }
  .stat-val { font-size: 1.1rem; font-weight: bold; font-family: monospace; }
  .total-prog-bg { width: 100%; height: 6px; background: var(--border); border-radius: 3px; margin-top: 0.5rem; }
  .total-prog-fill { height: 100%; background: var(--color-orchestrator); border-radius: 3px; transition: width 0.3s; }

  /* SECTION 2 - TILES */
  .grid-agents {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
    gap: 1.5rem;
  }
  .agent-tile {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    position: relative;
    border-left-width: 4px;
    border-left-style: solid;
    transition: opacity 0.3s, transform 0.3s;
  }
  .agent-header { display: flex; justify-content: space-between; align-items: center; }
  .agent-name { font-weight: 600; font-size: 1.1rem; }
  .agent-badge {
    padding: 0.2rem 0.6rem;
    border-radius: 12px;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    display: flex; align-items: center; gap: 0.4rem;
  }
  .agent-badge.idle { background: var(--bg-panel); color: var(--text-muted); }
  .agent-badge.waiting { background: var(--border); color: #fff; }
  .agent-badge.working { background: rgba(59, 130, 246, 0.2); color: #60A5FA; }
  .agent-badge.reviewing { background: rgba(186, 117, 23, 0.2); color: #FBBF24; }
  .agent-badge.blocked { background: rgba(226, 75, 74, 0.2); color: #F87171; }
  .agent-badge.reject { background: rgba(121, 31, 31, 0.4); color: #FCA5A5; }
  .agent-badge.done { background: rgba(29, 158, 117, 0.2); color: #34D399; }

  .agent-task { font-size: 0.85rem; height: 1.2rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-muted); }
  
  .prog-bg { width: 100%; height: 4px; background: var(--border); border-radius: 2px; }
  .prog-fill { height: 100%; border-radius: 2px; transition: width 0.1s linear; }

  .agent-meta { display: flex; justify-content: space-between; font-size: 0.75rem; font-family: monospace; color: var(--text-muted); }
  
  .output-snippet {
    background: rgba(0,0,0,0.2);
    padding: 0.5rem;
    border-radius: 4px;
    font-style: italic;
    font-size: 0.8rem;
    color: var(--text-muted);
    min-height: 2.5rem;
    display: flex; align-items: center;
  }

  /* CONFIDENCE SCALE */
  .conf-scale-wrap { margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px dashed var(--border); }
  .conf-bar {
    position: relative;
    width: 100%;
    height: 6px;
    background: var(--bg-panel);
    border-radius: 3px;
    margin: 1.2rem 0 0.5rem 0;
  }
  .conf-fill {
    height: 100%; border-radius: 3px;
    transition: width 0.5s ease-out, background-color 0.5s;
  }
  .conf-marker {
    position: absolute;
    top: -8px;
    font-size: 0.6rem;
    transform: translateX(-50%);
    transition: left 0.5s ease-out;
    color: var(--text-main);
  }
  .conf-labels { display: flex; justify-content: space-between; font-size: 0.6rem; color: var(--text-muted); margin-top: 2px; }
  .conf-action { font-size: 0.8rem; font-weight: bold; text-align: center; margin-top: 0.4rem; }

  /* REVIEW PANEL & HUMAN */
  .human-panel {
    background: rgba(226, 75, 74, 0.1);
    border: 1px solid var(--score-low);
    border-radius: 8px;
    padding: 1.5rem;
    margin-top: 1rem;
    grid-column: 1 / -1;
  }
  
  /* FEED */
  .feed-box {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1.5rem;
    height: 300px;
    display: flex;
    flex-direction: column;
  }
  .feed-scroll {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column-reverse;
    gap: 0.5rem;
    margin-top: 1rem;
  }
  .feed-item {
    font-size: 0.85rem;
    display: flex;
    gap: 1rem;
    padding: 0.3rem 0;
    animation: fadein 0.3s ease;
  }
  .feed-time { color: var(--text-muted); font-family: monospace; white-space: nowrap; }
  .feed-msg { flex: 1; }

  @keyframes fadein { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
`;

// Helper Configs & Data Arrays
const AGENT_DEFS = {
  Researcher: { color: 'var(--color-researcher)', baseDur: 4000, baseTok: 1500 },
  Designer: { color: 'var(--color-designer)', baseDur: 3500, baseTok: 1100 },
  Developer: { color: 'var(--color-developer)', baseDur: 6000, baseTok: 3200 },
  QA: { color: 'var(--color-qa)', baseDur: 3500, baseTok: 1300 },
  DocsWriter: { color: 'var(--color-docs)', baseDur: 2500, baseTok: 1000 },
  Reviewer: { color: 'var(--color-reviewer)', baseDur: 2000, baseTok: 400 }
};

const getConfColor = (score: number) => {
  if (score >= 0.90) return 'var(--score-very-high)';
  if (score >= 0.75) return 'var(--score-high)';
  if (score >= 0.60) return 'var(--score-moderate)';
  if (score >= 0.40) return 'var(--score-low)';
  return 'var(--score-very-low)';
};

const getConfLabel = (score: number) => {
  if (score >= 0.90) return 'Auto-approved';
  if (score >= 0.75) return 'Approved with note';
  if (score >= 0.60) return 'Sent to reviewer';
  if (score >= 0.40) return 'Awaiting human review';
  return 'Rejected — auto-regenerating';
};

// Hardcoded explicit demonstration path
const RUN_SCRIPT = [
  // Intro
  { t: "orch", a: "Parsing project brief...", dur: 1500 },
  { t: "orch", a: "Breaking into 5 tasks...", dur: 1000 },
  
  // Researcher
  { t: "orch", a: "Dispatching task to Researcher" },
  { t: "Researcher", a: "Analysing requirements, market, competitors...", dur: 4500, snippet: "Gathered 3 primary competitor data points.", score: 0.93 },
  { t: "orch", a: "Researcher Output received. Auto-approved." },

  // Designer
  { t: "orch", a: "Routing to Designer (Live Gemini Session...)" },
  { t: "Designer", isAsync: true, a: "Querying raw HTML/CSS from Gemini 2.5 API...",  score: 0.67 },
  { t: "orch", a: "Designer Output received. Moderately low - spanning Reviewer." },
  { t: "Reviewer", a: "Reviewing Designer output...", dur: 2000, snippet: "Design meets minimum heuristics. Approved.", score: null },
  { t: "orch", a: "Reviewer Agent -> Approved. Routing to Developer." },

  // Developer (Hits human review)
  { t: "orch", a: "Routing to Developer" },
  { t: "Developer", a: "Scaffolding codebase and writing logic...", dur: 5500, snippet: "auth_module.py generated with 132 lines.", score: 0.47 },
  { t: "orch", a: "Developer Output received. Score LOW. Human review required." },
  { t: "human", action: "pause", agent: "Developer", snippetId: "dev-iter1" },
  
  // Developer Retry (after human feedback)
  { t: "orch", a: "Injecting human feedback. Re-routing to Developer (Attempt 2/3)" },
  { t: "Developer", iter: 2, a: "Implementing human feedback...", dur: 4500, snippet: "auth_module.py patched with explicit password strength checks.", score: 0.88 },
  { t: "orch", a: "Developer Output received (Iter 2). Auto-approved." },

  // QA (Outright reject)
  { t: "orch", a: "Routing to QA Agent" },
  { t: "QA", a: "Validating edge cases...", dur: 3000, snippet: "Traceback error: null pointer in token decoder.", score: 0.34 },
  { t: "orch", a: "QA Output received. Score CRITICAL. Rejecting outright." },
  
  // QA Retry 1 (Hits human review)
  { t: "orch", a: "Auto-regenerating QA Agent (Attempt 2/3)..." },
  { t: "QA", iter: 2, a: "Re-validating patched build...", dur: 3500, snippet: "All edge cases pass. Coverage 82%.", score: 0.51 },
  { t: "orch", a: "QA Output received (Iter 2). Score LOW. Human review required." },
  { t: "human", action: "pause", agent: "QA", snippetId: "qa-iter2" },

  // Docs Writer
  { t: "orch", a: "Routing to Docs Writer" },
  { t: "DocsWriter", a: "Compiling markdown documentation...", dur: 2500, snippet: "README.md and API_REF.md generated successfully.", score: 0.95 },
  { t: "orch", a: "Docs Output received. Auto-approved." },
  
  { t: "orch", a: "Pipeline complete." }
];

export default function OrchestratorDashboard() {
  const activeProjectId = useStore((state) => state.activeProjectId);
  const projects = useStore((state) => state.projects);
  
  const projectBriefRef = useRef("student management system");
  useEffect(() => {
    const activeProject = projects.find(p => p.id === activeProjectId);
    if (activeProject && activeProject.brief) {
      projectBriefRef.current = activeProject.brief;
    }
  }, [projects, activeProjectId]);

  const [playState, setPlayState] = useState<'idle' | 'running' | 'human' | 'done' | 'paused'>('idle');
  const [speed, setSpeed] = useState<number>(1);
  
  // Master Engine State
  const [scriptIdx, setScriptIdx] = useState(0);
  const [timeTotalMs, setTimeTotalMs] = useState(0); // simulation standard elapsed
  const activeStepClockRef = useRef(0);

  // Stats
  const [totalTokens, setTotalTokens] = useState(0);

  // Feed
  const [feed, setFeed] = useState<{id:number, t:string, agent:string, msg:string, c:string}[]>([]);

  // Agents State
  type AgState = { status: string, task: string, prog: number, tok: number, score: number|null, snip: string, iter: number };
  const getInitAg = (): AgState => ({ status: 'waiting', task: 'Awaiting dispatch...', prog: 0, tok: 0, score: null, snip: '', iter: 1 });
  
  const [agents, setAgents] = useState<Record<string, AgState>>({
    Orchestrator: { status: 'idle', task: 'Awaiting input...', prog: 0, tok: 0, score: null, snip: '', iter: 1 },
    Researcher: getInitAg(),
    Designer: getInitAg(),
    Developer: getInitAg(),
    QA: getInitAg(),
    DocsWriter: getInitAg(),
    Reviewer: { status: 'hidden', task: '', prog: 0, tok: 0, score: null, snip: '', iter: 1 } // dynamic
  });

  const [humanPanel, setHumanPanel] = useState<{open: boolean, agent: string, snippet: string, score: number} | null>(null);
  const [humanFeedback, setHumanFeedback] = useState("");

  const formatTime = (ms: number) => {
    const totalS = Math.floor(ms / 1000);
    const m = Math.floor(totalS / 60).toString().padStart(2, '0');
    const s = (totalS % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const addRefFeed = (agent: string, msg: string, msOverride?: number) => {
    const color = AGENT_DEFS[agent as keyof typeof AGENT_DEFS]?.color || 'var(--color-orchestrator)';
    setFeed(p => [{ id: Math.random(), t: formatTime(msOverride ?? timeTotalMs), agent, msg, c: color }, ...p]);
  };

  const setAg = (id: string, obj: Partial<AgState>) => {
    setAgents(p => ({ ...p, [id]: { ...p[id], ...obj } }));
  };

  const engineInterval = useRef<any>(null);
  const isApiInFlight = useRef(false);

  useEffect(() => {
    if (playState !== 'running') {
      if (engineInterval.current) clearInterval(engineInterval.current);
      return;
    }

    const TICK = 50; // Engine ticks every 50ms real time
    
    engineInterval.current = setInterval(() => {
      if (playState !== 'running') return;
      
      const realPace = TICK * speed;
      setTimeTotalMs(p => p + realPace);
      activeStepClockRef.current += realPace;
      
      const step = RUN_SCRIPT[scriptIdx];
      if (!step) return;

      // Handle Immediate Transitions (0s duration implies logic block)
      if (!step.dur) {
        if (step.t === "orch") {
          setAg("Orchestrator", { task: step.a || '' });
          if ((step.a||"").includes("complete")) setPlayState("done");
          else addRefFeed("Orchestrator", step.a || "");
        } else if (step.t === "human") {
          setPlayState('human');
          const targAg = agents[step.agent || ""];
          setHumanPanel({ open: true, agent: step.agent || "Unknown", snippet: targAg.snip || 'Output...', score: targAg.score || 0 });
        }
        setScriptIdx(p => p + 1);
        activeStepClockRef.current = 0;
        return;
      }

      // Handle Running Agents
      const dur = step.dur || 1000; // default 1s for async boundaries
      const progress = step.isAsync ? (isApiInFlight.current ? 50 : 100) : Math.min(100, Math.max(0, (activeStepClockRef.current / dur) * 100));
      
      if (step.t === "orch") {
        setAg("Orchestrator", { status: 'working', task: step.a || '', prog: progress });
      } else {
        const aName = step.t;
        const basetok = AGENT_DEFS[aName as keyof typeof AGENT_DEFS]?.baseTok || 1000;
        const tokGain = Math.floor(basetok * (realPace / dur));
        
        // ensure tile visible
        if (aName === 'Reviewer') setAg(aName, { status: 'reviewing' });
        
        let localStatus = 'working';
        if (step.score && step.score < 0.40 && progress > 99) localStatus = 'reject';
        else if (progress > 99) localStatus = 'done';

        setAg(aName, { 
          status: localStatus, 
          task: step.a || '', 
          prog: progress, 
          snip: step.isAsync ? agents[aName].snip || 'Connecting to GenAI API...' : (progress > 50 ? step.snippet : 'Processing...'), 
          tok: agents[aName].tok + (step.isAsync ? 0 : tokGain),
          iter: step.iter || agents[aName].iter
        });
        if (!step.isAsync) setTotalTokens(p => p + tokGain);
        
        // Handle actual async dispatch natively
        if (step.isAsync && !isApiInFlight.current) {
          isApiInFlight.current = true;
          // Spawn external network layer
          runDesignerAgent(projectBriefRef.current).then((result) => {
             // Trim massive result to fit nicely in snippet UI safely
             const resStr = result.substring(0, 140) + '...';
             setAg("Designer", { snip: resStr });
             
             // Unlock state
             activeStepClockRef.current = dur; 
             isApiInFlight.current = false;
          }).catch(err => {
             setAg("Designer", { snip: "API Failed: " + err.message });
             activeStepClockRef.current = dur;
             isApiInFlight.current = false;
          });
        }
      }

      if (activeStepClockRef.current >= dur && !isApiInFlight.current) {
        // Complete Step
        activeStepClockRef.current = 0;
        
        if (step.t !== "orch" && step.score !== undefined) {
           setAg(step.t, { score: step.score });
           if (step.score !== null) {
              const label = getConfLabel(step.score);
              addRefFeed(step.t, `Output generated. Score: ${step.score.toFixed(2)} — ${label}`);
           }
        }
        
        setScriptIdx(p => p + 1);
      }

    }, TICK);

    return () => clearInterval(engineInterval.current);
  }, [playState, speed, scriptIdx, agents]);


  const startSim = () => {
    setPlayState('running');
    setAg("Orchestrator", { status: 'working' });
    addRefFeed("System", "Run Pipeline requested.");
  };

  const handleHumanApprove = () => {
    addRefFeed("Human", "Approved override.");
    setHumanPanel(null);
    setPlayState('running');
  };

  const handleHumanReject = () => {
    addRefFeed("Human", `Rejected with feedback: "${humanFeedback || 'Please fix issues.'}"`);
    setHumanPanel(null);
    setHumanFeedback("");
    setPlayState('running');
  };

  useEffect(() => {
    // Auto-start on mount!
    startSim();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // derived metrics
  const avgConf = useMemo(() => {
    const scores = Object.values(agents).map(a => a.score).filter(s => s !== null) as number[];
    if (!scores.length) return 0;
    return (scores.reduce((a,b) => a+b, 0) / scores.length).toFixed(2);
  }, [agents]);


  return (
    <div className="orch-dash">
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      
      {/* SECTION 1: TOP */}
      <div className="sect-top">
        <div className="orch-status-tile">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, color: 'var(--color-orchestrator)', fontSize: '1.2rem' }}>Orchestrator Agent</span>
              
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button className="dash-btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => setPlayState(p => p==='running' ? 'paused' : 'running')} disabled={playState==='idle' || playState==='done' || playState==='human'}>
                  {playState === 'running' ? 'Pause' : 'Resume'}
                </button>
                <select className="dash-btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} value={speed} onChange={e => setSpeed(Number(e.target.value))}>
                  <option value={1}>1x Speed</option>
                  <option value={2}>2x Speed</option>
                  <option value={3}>3x Speed</option>
                </select>
                <span className={`agent-badge ${playState==='paused' ? 'idle' : playState==='done' ? 'done' : 'working'}`}>
                  {playState === 'paused' ? 'PAUSED' : playState === 'done' ? 'COMPLETE' : 'ACTIVE'}
                </span>
              </div>
            </div>
            <div style={{ marginTop: '0.5rem', color: 'var(--text-main)' }}>{agents.Orchestrator.task}</div>
          </div>

          <div style={{ marginTop: 'auto' }}>
            <div className="total-prog-bg">
              <div className="total-prog-fill" style={{ width: `${(scriptIdx / RUN_SCRIPT.length) * 100}%` }} />
            </div>
            <div className="stats-row">
              <div className="stat-block"><span className="stat-label">Elapsed Time</span><span className="stat-val">{formatTime(timeTotalMs)}</span></div>
              <div className="stat-block"><span className="stat-label">Total Tokens</span><span className="stat-val">{totalTokens.toLocaleString()}</span></div>
              <div className="stat-block"><span className="stat-label">Avg Confidence</span><span className="stat-val">{avgConf}</span></div>
              <div className="stat-block"><span className="stat-label">Est. Cost</span><span className="stat-val">${(totalTokens * 0.000003).toFixed(4)}</span></div>
            </div>
          </div>
        </div>
      </div>

      <>
        {/* HUMAN REVIEW PANEL */}
          {humanPanel && (
            <div className="human-panel">
              <div style={{ color: 'var(--score-low)', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '0.5rem' }}>⚠️ Human Review Required</div>
              <div style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>The <strong>{humanPanel.agent}</strong> returned a confidence score of {humanPanel.score.toFixed(2)}, which falls below the safe threshold (0.60).</div>
              
              <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {humanPanel.snippet}
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <button className="dash-btn dash-btn-success" onClick={handleHumanApprove}>Force Approve</button>
                <div style={{ borderLeft: '1px solid var(--border)', height: '2rem' }}></div>
                <input 
                  type="text" 
                  placeholder="Add feedback for retry..." 
                  style={{ flex: 1, padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
                  value={humanFeedback}
                  onChange={e => setHumanFeedback(e.target.value)}
                />
                <button className="dash-btn dash-btn-danger" onClick={handleHumanReject}>Reject & Retry</button>
              </div>
            </div>
          )}

          {/* SECTION 2: GRID */}
          <div className="grid-agents">
            {['Researcher', 'Designer', 'Developer', 'QA', 'DocsWriter', 'Reviewer'].map(agName => {
              const ag = agents[agName];
              if (agName === 'Reviewer' && ag.status === 'hidden') return null;
              
              const color = AGENT_DEFS[agName as keyof typeof AGENT_DEFS]?.color;

              return (
                <div key={agName} className="agent-tile" style={{ borderLeftColor: color }}>
                  <div className="agent-header">
                    <span className="agent-name" style={{ color: color }}>
                      {agName === 'DocsWriter' ? 'Docs Writer' : agName}
                      {ag.iter > 1 && <span style={{ fontSize: '0.7rem', marginLeft: '0.5rem', color: 'var(--text-muted)' }}>(Attempt {ag.iter}/3)</span>}
                    </span>
                    <span className={`agent-badge ${ag.status}`}>
                      {ag.status}
                    </span>
                  </div>

                  <div className="agent-task">{ag.task}</div>

                  <div>
                    <div className="prog-bg">
                      <div className="prog-fill" style={{ width: `${ag.prog}%`, backgroundColor: color }} />
                    </div>
                  </div>

                  <div className="agent-meta">
                    <span>{ag.tok.toLocaleString()} tokens</span>
                  </div>

                  <div className="output-snippet">{ag.snip || '...'}</div>

                  {/* Confidence Scale Render */}
                  {(ag.score !== null) && (
                    <div className="conf-scale-wrap">
                      <div className="conf-bar">
                        <div className="conf-fill" style={{ width: `${ag.score * 100}%`, backgroundColor: getConfColor(ag.score) }} />
                        <div className="conf-marker" style={{ left: `${ag.score * 100}%` }}>▼ {ag.score.toFixed(2)}</div>
                      </div>
                      <div className="conf-labels">
                        <span>0.0</span>
                        <span>0.4 (Low)</span>
                        <span>0.6 (Mod)</span>
                        <span>0.75 (High)</span>
                        <span>1.0</span>
                      </div>
                      <div className="conf-action" style={{ color: getConfColor(ag.score) }}>
                        {getConfLabel(ag.score)}
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>

          {/* SECTION 3: FEED */}
          <div className="feed-box">
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Activity Feed</h3>
            <div className="feed-scroll">
              {feed.slice(0, 30).map((f) => (
                <div key={f.id} className="feed-item">
                  <span className="feed-time">[{f.t}]</span>
                  <span style={{ color: f.c, fontWeight: 600, minWidth: '100px' }}>{f.agent}: </span>
                  <span className="feed-msg" style={{ color: f.agent === 'Human' ? 'var(--btn-danger)' : 'var(--text-main)' }}>{f.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </>
    </div>
  );
}
