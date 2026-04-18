import React, { useState, useEffect, useRef, useCallback } from 'react';

// STYLES
const cssStyles = `
  .war-room-container {
    --bg-main: #0B0F19;
    --bg-surface: #1C2333;
    --bg-surface-hover: #262E40;
    --text-main: #F3F4F6;
    --text-muted: #9CA3AF;
    --border: #374151;

    --color-orchestrator: #8B5CF6;
    --color-researcher: #0D9488;
    --color-developer: #3B82F6;
    --color-qa: #F59E0B;
    --color-docs: #F43F5E;

    --badge-idle: #4B5563;
    --badge-thinking: #3B82F6;
    --badge-working: #10B981;
    --badge-blocked: #EF4444;
    --badge-done: #14B8A6;

    background-color: var(--bg-main);
    color: var(--text-main);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    min-height: 100vh;
    padding: 2rem;
    box-sizing: border-box;
  }

  .war-room-container * {
    box-sizing: border-box;
  }

  /* TOP BAR */
  .wr-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    border-bottom: 1px solid var(--border);
    padding-bottom: 1rem;
  }
  .wr-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
  }
  .wr-controls {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  .wr-btn {
    background-color: var(--bg-surface);
    color: var(--text-main);
    border: 1px solid var(--border);
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    transition: background-color 0.2s ease;
  }
  .wr-btn:hover {
    background-color: var(--bg-surface-hover);
  }
  .wr-btn.wr-btn-primary {
    background-color: var(--text-main);
    color: var(--bg-main);
  }
  .wr-status-pill {
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    font-size: 0.875rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .wr-status-running { background-color: rgba(16, 185, 129, 0.2); color: #34D399; }
  .wr-status-paused { background-color: rgba(245, 158, 11, 0.2); color: #FBBF24; }
  .wr-status-complete { background-color: rgba(59, 130, 246, 0.2); color: #60A5FA; }
  .wr-timer {
    font-family: monospace;
    font-size: 1.125rem;
  }

  /* SUMMARY BAR */
  .wr-summary {
    display: flex;
    gap: 2rem;
    background-color: var(--bg-surface);
    padding: 1rem 1.5rem;
    border-radius: 8px;
    margin-bottom: 2rem;
    border: 1px solid var(--border);
  }
  .wr-summary-item {
    display: flex;
    flex-direction: column;
  }
  .wr-summary-label {
    font-size: 0.75rem;
    color: var(--text-muted);
    text-transform: uppercase;
    margin-bottom: 0.25rem;
  }
  .wr-summary-value {
    font-size: 1.25rem;
    font-weight: 600;
  }

  /* GRID */
  .wr-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  /* TILE */
  .wr-tile {
    background-color: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    transition: border-color 0.2s ease;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }
  .wr-tile:hover {
    border-color: var(--text-muted);
  }
  .wr-tile.expanded {
    grid-column: 1 / -1;
  }

  .wr-tile-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .wr-agent-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .wr-agent-icon {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .wr-agent-name {
    font-weight: 600;
    font-size: 1.125rem;
  }
  
  .wr-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.6rem;
    border-radius: 999px;
    font-size: 0.75rem;
    text-transform: uppercase;
    font-weight: bold;
    color: #fff;
  }
  .wr-badge .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: currentColor;
  }
  .wr-badge.idle { background-color: var(--badge-idle); }
  .wr-badge.thinking { background-color: var(--badge-thinking); }
  .wr-badge.working { background-color: var(--badge-working); }
  .wr-badge.blocked { background-color: var(--badge-blocked); }
  .wr-badge.done { background-color: var(--badge-done); }

  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.4; }
    100% { opacity: 1; }
  }
  .wr-badge.thinking .dot, .wr-badge.working .dot {
    animation: pulse 1.5s infinite;
  }

  .wr-task-desc {
    font-size: 0.875rem;
    color: var(--text-main);
    min-height: 1.25rem;
  }
  
  .wr-progress-container {
    width: 100%;
    height: 4px;
    background-color: var(--border);
    border-radius: 2px;
    overflow: hidden;
  }
  .wr-progress-bar {
    height: 100%;
    transition: width 0.1s linear, background-color 0.2s ease;
  }

  .wr-tile-stats {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: var(--text-muted);
    font-family: monospace;
  }
  
  .wr-output-snippet {
    font-size: 0.875rem;
    font-style: italic;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    background-color: rgba(0,0,0,0.2);
    padding: 0.5rem;
    border-radius: 4px;
    min-height: 2.25rem;
  }

  .wr-expanded-content {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border);
  }

  /* FEED */
  .wr-feed {
    background-color: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1.5rem;
    height: 250px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .wr-feed-title {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 1rem 0;
  }
  .wr-feed-item {
    font-size: 0.875rem;
    display: flex;
    gap: 1rem;
    align-items: flex-start;
    animation: fadein 0.3s ease;
  }
  .wr-feed-time {
    color: var(--text-muted);
    font-family: monospace;
    min-width: 60px;
  }
  .wr-feed-msg {
    color: var(--text-main);
  }
  @keyframes fadein {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

// Helper icons
const SVG = {
  Orchestrator: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>,
  Researcher: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  Developer: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>,
  QA: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M9 12l2 2 4-4"></path></svg>,
  Docs: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z"></path><path d="M14 3v5h5M16 13H8M16 17H8M10 9H8"></path></svg>
};

const INITIAL_AGENTS = {
  Orchestrator: { id: 'Orchestrator', name: 'Orchestrator', color: 'var(--color-orchestrator)', status: 'idle', taskDesc: 'Awaiting start...', progress: 0, tokens: 0, conf: null, output: '', micro: 'idle' },
  Researcher: { id: 'Researcher', name: 'Researcher', color: 'var(--color-researcher)', status: 'idle', taskDesc: 'Awaiting start...', progress: 0, tokens: 0, conf: null, output: '', micro: 'idle' },
  Developer: { id: 'Developer', name: 'Developer', color: 'var(--color-developer)', status: 'idle', taskDesc: 'Awaiting start...', progress: 0, tokens: 0, conf: null, output: '', micro: 'idle' },
  QA: { id: 'QA', name: 'QA', color: 'var(--color-qa)', status: 'idle', taskDesc: 'Awaiting start...', progress: 0, tokens: 0, conf: null, output: '', micro: 'idle' },
  Docs: { id: 'Docs', name: 'Docs Writer', color: 'var(--color-docs)', status: 'idle', taskDesc: 'Awaiting start...', progress: 0, tokens: 0, conf: null, output: '', micro: 'idle' }
};

// Simulation constraints
const TICK_MS = 100;
const COST_PER_TOKEN = 0.000002;

export default function WarRoomDashboard() {
  const [status, setStatus] = useState('running'); // running, paused, complete
  const [tick, setTick] = useState(0);
  const [agents, setAgents] = useState(JSON.parse(JSON.stringify(INITIAL_AGENTS)));
  const [feed, setFeed] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  const prevTickRef = useRef(-1);

  // Mapped formatting helper
  const formatTime = (t) => {
    const s = ((t * TICK_MS) / 1000).toFixed(1);
    return `${s}s`;
  };

  const addFeedEvent = (msg, colorStr) => {
    setFeed(prev => {
      const nw = [{ id: Date.now() + Math.random(), time: formatTime(tick), msg, colorStr }, ...prev];
      return nw.slice(0, 8); // Keep max 8
    });
  };

  const updateAgent = (id, updates) => {
    setAgents(prev => ({
      ...prev,
      [id]: { ...prev[id], ...updates }
    }));
  };

  // Helper to calculate progress strictly based on window
  const calcProgress = (startTick, durationTicks, currentTick) => {
    const p = Math.min(100, Math.max(0, ((currentTick - startTick) / durationTicks) * 100));
    return p;
  };

  // Simulation Logic Array - processed on each tick change
  // Note: Since tick increments steadily, we look at the exact tick ranges to define state.
  useEffect(() => {
    if (tick === prevTickRef.current) return;
    prevTickRef.current = tick;

    // We define script regions here relative to CURRENT TICK
    const t = tick;

    // === ORCHESTRATOR === (0s - 3s)
    if (t === 0) {
      updateAgent('Orchestrator', { status: 'thinking', taskDesc: 'Routing workflow...', micro: 'Analysing input...' });
    } else if (t === 5) {
      updateAgent('Orchestrator', { status: 'working', taskDesc: 'Generating execution graph...', micro: 'Processing...' });
    } else if (t === 25) {
      updateAgent('Orchestrator', { micro: 'Validating...' });
    } else if (t === 29) {
      updateAgent('Orchestrator', { output: 'Graph complete: 5 nodes assigned.' });
    } else if (t === 30) {
      updateAgent('Orchestrator', { status: 'done', progress: 100, conf: 0.98, taskDesc: 'Orchestration complete.' });
      addFeedEvent('[Orchestrator → Researcher] Passing planning outline', 'var(--color-orchestrator)');
    }
    if (t > 0 && t < 30) {
      updateAgent('Orchestrator', { progress: calcProgress(0, 30, t), tokens: Math.floor(t * 12.3) });
    }

    // === RESEARCHER === (3s - 7s)
    if (t === 30) {
      updateAgent('Researcher', { status: 'thinking', taskDesc: 'Loading inputs...', micro: 'Analysing...' });
    } else if (t === 35) {
      updateAgent('Researcher', { status: 'working', taskDesc: 'Analysing 3 competitor products...', micro: 'Generating output...' });
    } else if (t === 65) {
      updateAgent('Researcher', { output: 'Found auth flow gap in competitors', micro: 'Validating...' });
    } else if (t === 70) {
      updateAgent('Researcher', { status: 'done', progress: 100, conf: 0.92, taskDesc: 'Research complete.' });
      addFeedEvent('[Researcher → Developer] Passing requirements brief', 'var(--color-researcher)');
    }
    if (t > 30 && t < 70) {
      updateAgent('Researcher', { progress: calcProgress(30, 40, t), tokens: Math.floor((t - 30) * 20.1) });
    }

    // === DEVELOPER ITERATION 1 === (7s - 12s)
    if (t === 70) {
      updateAgent('Developer', { status: 'thinking', taskDesc: 'Reviewing brief...', micro: 'Analysing input...' });
    } else if (t === 75) {
      updateAgent('Developer', { status: 'working', taskDesc: 'Scaffolding authentication module...', micro: 'Generating output...' });
      addFeedEvent('[Developer] Starting initial implementation...', 'var(--color-developer)');
    } else if (t === 110) {
      updateAgent('Developer', { output: 'auth.py: 87 lines, 4 functions', micro: 'Formatting...' });
    } else if (t === 120) {
      updateAgent('Developer', { status: 'done', progress: 100, conf: 0.88, taskDesc: 'Implementation deployed for tests.' });
      addFeedEvent('[Developer → QA] Handing off auth module for testing', 'var(--color-developer)');
    }
    if (t > 70 && t < 120) {
      updateAgent('Developer', { progress: calcProgress(70, 50, t), tokens: Math.floor((t - 70) * 35.4) });
    }

    // === QA ITERATION 1 === (12s - 16s)
    if (t === 120) {
      updateAgent('QA', { status: 'thinking', taskDesc: 'Loading test harness...', micro: 'Analysing input...' });
    } else if (t === 125) {
      updateAgent('QA', { status: 'working', taskDesc: 'Running edge case tests on auth module...', micro: 'Processing...' });
    } else if (t === 155) {
      updateAgent('QA', { output: '2 failures: token expiry, null email', micro: 'Validating...' });
    } else if (t === 160) {
      updateAgent('QA', { status: 'blocked', progress: 100, conf: 0.99, taskDesc: 'Issues found.' });
      addFeedEvent('[QA] Found 2 issues — routing back to Developer', 'var(--color-qa)');
    }
    if (t > 120 && t < 160) {
      updateAgent('QA', { progress: calcProgress(120, 40, t), tokens: Math.floor((t - 120) * 18.2) });
    }

    // === DEVELOPER ITERATION 2 === (16s - 21s)
    if (t === 160) {
      updateAgent('Developer', { status: 'thinking', taskDesc: 'Reviewing QA feedback...', micro: 'Analysing input...' });
    } else if (t === 165) {
      updateAgent('Developer', { status: 'working', taskDesc: 'Fixing token expiry and null email bugs...', micro: 'Generating output...' });
      addFeedEvent('[Developer] Iteration 2 started: Patching bugs', 'var(--color-developer)');
    } else if (t === 200) {
      updateAgent('Developer', { output: 'Both issues resolved, tests pass locally', micro: 'Formatting...' });
    } else if (t === 210) {
      updateAgent('Developer', { status: 'done', progress: 100, conf: 0.94, taskDesc: 'Patches deployed for verification.' });
      addFeedEvent('[Developer → QA] Returning fixed auth module', 'var(--color-developer)');
    }
    if (t > 160 && t < 210) {
      updateAgent('Developer', { progress: calcProgress(160, 50, t), tokens: 1770 + Math.floor((t - 160) * 15.6) }); // Accumulate over prev tokens
    }

    // === QA ITERATION 2 === (21s - 24s)
    if (t === 210) {
      updateAgent('QA', { status: 'thinking', taskDesc: 'Reloading tests...', micro: 'Analysing input...' });
    } else if (t === 215) {
      updateAgent('QA', { status: 'working', taskDesc: 'Re-running regression suite...', micro: 'Processing...' });
    } else if (t === 235) {
      updateAgent('QA', { output: 'All tests passing (14/14)', micro: 'Validating...' });
    } else if (t === 240) {
      updateAgent('QA', { status: 'done', progress: 100, conf: 0.99, taskDesc: 'Validation complete. Approved.' });
      addFeedEvent('[QA → Docs] Module validated successfully', 'var(--color-qa)');
    }
    if (t > 210 && t < 240) {
      updateAgent('QA', { progress: calcProgress(210, 30, t), tokens: 728 + Math.floor((t - 210) * 10.3) }); 
    }

    // === DOCS WRITER === (24s - 28s)
    if (t === 240) {
      updateAgent('Docs', { status: 'thinking', taskDesc: 'Analyzing module codebase...', micro: 'Analysing input...' });
    } else if (t === 245) {
      updateAgent('Docs', { status: 'working', taskDesc: 'Generating README and API reference...', micro: 'Generating output...' });
      addFeedEvent('[Docs Writer] Beginning documentation pass', 'var(--color-docs)');
    } else if (t === 275) {
      updateAgent('Docs', { output: 'README.md: 340 words, 6 sections', micro: 'Formatting...' });
    } else if (t === 280) {
      updateAgent('Docs', { status: 'done', progress: 100, conf: 0.96, taskDesc: 'Documentation complete.' });
      addFeedEvent('[Workflow] Pipeline execution finalized.', '#FFF');
      setStatus('complete');
    }
    if (t > 240 && t < 280) {
      updateAgent('Docs', { progress: calcProgress(240, 40, t), tokens: Math.floor((t - 240) * 45.2) });
    }

  }, [tick]);

  // Timer loop
  useEffect(() => {
    let intervalId;
    if (status === 'running') {
      intervalId = setInterval(() => {
        setTick(prev => prev + 1);
      }, TICK_MS);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [status]);

  const handleRestart = () => {
    setStatus('running');
    setTick(0);
    setAgents(JSON.parse(JSON.stringify(INITIAL_AGENTS)));
    setFeed([]);
    setExpandedId(null);
    prevTickRef.current = -1;
  };

  const handlePauseResume = () => {
    if (status === 'running') setStatus('paused');
    else if (status === 'paused') setStatus('running');
  };

  const handleTileClick = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const handleViewFullOutput = (e, agentName) => {
    e.stopPropagation();
    // Stub definition as requested
    const promptFunc = window.sendPrompt || alert;
    promptFunc(`Show me the full output from the ${agentName} agent`);
  };

  // Derive summary metrics
  const totalTokens = Object.values(agents).reduce((acc, curr) => acc + curr.tokens, 0);
  const totalCost = (totalTokens * COST_PER_TOKEN).toFixed(4);
  
  // Calculate average confidence for completed agents
  const confAgents = Object.values(agents).filter(a => a.conf !== null);
  const avgConf = confAgents.length > 0 
    ? (confAgents.reduce((acc, curr) => acc + curr.conf, 0) / confAgents.length).toFixed(2)
    : "0.00";

  return (
    <div className="war-room-container">
      <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
      
      {/* HEADER */}
      <header className="wr-header">
        <div>
          <h1 className="wr-title">SaaS Dashboard MVP</h1>
          <div style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.875rem' }}>AI Agent War Room</div>
        </div>
        
        <div className="wr-controls">
          <div className="wr-timer">{formatTime(tick)}</div>
          
          <div className={`wr-status-pill wr-status-${status}`}>
            {status}
          </div>
          
          {status !== 'complete' && (
            <button className="wr-btn" onClick={handlePauseResume}>
              {status === 'running' ? 'Pause' : 'Resume'}
            </button>
          )}
          
          <button className="wr-btn wr-btn-primary" onClick={handleRestart}>
            Restart
          </button>
        </div>
      </header>

      {/* SUMMARY */}
      {status === 'complete' && (
        <div className="wr-summary">
          <div className="wr-summary-item">
            <span className="wr-summary-label">Total Time</span>
            <span className="wr-summary-value">{formatTime(tick)}</span>
          </div>
          <div className="wr-summary-item">
            <span className="wr-summary-label">Total Tokens</span>
            <span className="wr-summary-value">{totalTokens.toLocaleString()}</span>
          </div>
          <div className="wr-summary-item">
            <span className="wr-summary-label">Est. Cost</span>
            <span className="wr-summary-value">${totalCost}</span>
          </div>
          <div className="wr-summary-item">
            <span className="wr-summary-label">Overall Confidence</span>
            <span className="wr-summary-value">{avgConf}</span>
          </div>
        </div>
      )}

      {/* AGENTS GRID */}
      <div className="wr-grid">
        {Object.values(agents).map(agent => {
          const isExpanded = expandedId === agent.id;
          
          return (
            <div 
              key={agent.id} 
              className={`wr-tile ${isExpanded ? 'expanded' : ''}`}
              onClick={() => handleTileClick(agent.id)}
            >
              <div className="wr-tile-header">
                <div className="wr-agent-info">
                  <div className="wr-agent-icon" style={{ backgroundColor: `color-mix(in srgb, ${agent.color} 20%, transparent)`, color: agent.color }}>
                    {SVG[agent.id]}
                  </div>
                  <span className="wr-agent-name">{agent.name}</span>
                </div>
                
                <div className={`wr-badge ${agent.status}`}>
                  <div className="dot"></div>
                  <span>{agent.status}</span>
                </div>
              </div>

              <div>
                <div className="wr-task-desc">{agent.taskDesc}</div>
                {agent.status === 'working' && (
                  <div style={{ fontSize: '0.75rem', color: agent.color, marginTop: '4px' }}>
                    {agent.micro}
                  </div>
                )}
              </div>

              <div className="wr-progress-container">
                <div 
                  className="wr-progress-bar" 
                  style={{ 
                    width: `${agent.progress}%`,
                    backgroundColor: agent.status === 'blocked' ? 'var(--badge-blocked)' : agent.color
                  }} 
                />
              </div>

              <div className="wr-tile-stats">
                <span>Tokens: {agent.tokens.toLocaleString()}</span>
                {agent.conf !== null && <span>Conf: {agent.conf}</span>}
              </div>

              {agent.output && (
                <div className="wr-output-snippet">
                  {agent.output}
                </div>
              )}

              {isExpanded && (
                <div className="wr-expanded-content" onClick={e => e.stopPropagation()}>
                  <h4 style={{ margin: '0 0 1rem 0' }}>Detailed Output</h4>
                  <div style={{ padding: '1rem', backgroundColor: 'var(--bg-main)', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    [SYSTEM_LOG] Simulation details captured for {agent.name}. 
                    <br/><br/>
                    Latest Result:<br/>
                    {agent.output || '(No significant output generated yet)'}
                  </div>
                  <button 
                    className="wr-btn wr-btn-primary" 
                    style={{ marginTop: '1rem' }}
                    onClick={(e) => handleViewFullOutput(e, agent.name)}
                  >
                    View full output
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ACTIVITY FEED */}
      <div>
        <h3 className="wr-feed-title">Live Activity Feed</h3>
        <div className="wr-feed">
          {feed.length === 0 && <div className="wr-feed-item"><span className="wr-feed-msg" style={{color: 'var(--text-muted)'}}>Waiting for pipeline execution to start...</span></div>}
          {feed.map(item => (
            <div key={item.id} className="wr-feed-item">
              <span className="wr-feed-time">[{item.time}]</span>
              <span className="wr-feed-msg" style={{ color: item.colorStr || 'var(--text-main)' }}>{item.msg}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
