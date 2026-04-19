import { useMemo } from 'react';
import { useStore } from './store/useStore';

const styles = `
  .orch-dash {
    --bg-main: #09090B;
    --bg-surface: #18181B;
    --bg-panel: #27272A;
    --border: #3F3F46;
    --text-main: #FAFAFA;
    --text-muted: #A1A1AA;
    
    --color-orchestrator: #6366F1; 
    --color-researcher: #10B981;
    --color-designer: #EC4899;
    --color-developer: #3B82F6;
    --color-qa: #F59E0B;
    --color-docs: #F97316;

    background-color: var(--bg-main);
    color: var(--text-main);
    font-family: 'Inter', sans-serif;
    min-height: 100vh;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .sect-top { display: grid; grid-template-columns: 1fr 350px; gap: 2rem; }
  
  .monitor-panel {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 24px;
    padding: 2rem;
    position: relative;
    overflow: hidden;
  }

  .monitor-panel::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, var(--color-orchestrator), transparent);
  }

  .grid-agents {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .agent-tile {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .agent-tile:hover {
    border-color: var(--text-muted);
    transform: translateY(-2px);
  }

  .agent-badge {
    padding: 4px 12px;
    border-radius: 100px;
    font-size: 0.65rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .badge-done { background: #10B98120; color: #10B981; }
  .badge-working { background: #3B82F620; color: #3B82F6; border: 1px solid #3B82F640; animation: pulse 2s infinite; }
  .badge-idle { background: #27272A; color: #71717A; }

  @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }

  .snippet-box {
    background: #00000040;
    padding: 1rem;
    border-radius: 12px;
    font-size: 0.75rem;
    color: var(--text-muted);
    line-height: 1.6;
    height: 100px;
    overflow: hidden;
    position: relative;
  }

  .snippet-box::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0; height: 40px;
    background: linear-gradient(transparent, var(--bg-surface));
  }

  .audit-item {
    padding: 1rem;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .audit-item:last-child { border: none; }
`;

export default function OrchestratorDashboard() {
  const activeProjectId = useStore((state) => state.activeProjectId);
  const projects = useStore((state) => state.projects);
  const activeProject = useMemo(() => projects.find(p => p.id === activeProjectId), [projects, activeProjectId]);

  if (!activeProject) {
    return (
      <div className="orch-dash items-center justify-center">
        <style dangerouslySetInnerHTML={{ __html: styles }} />
        <div className="text-zinc-500 font-bold">SELECT A PROJECT TO ENTER WAR ROOM</div>
      </div>
    );
  }

  const bb = activeProject.blackboard;
  const nodes = activeProject.nodes;

  const getStatus = (type: string): string => {
    const node = nodes.find(n => n.type === type);
    const status = (node?.data as any)?.status;
    return typeof status === 'string' ? status : 'idle';
  };

  const truncate = (val: any, len: number = 180) => {
    const str = typeof val === 'string' ? val : '';
    if (!str) return 'Awaiting data...';
    return str.length > len ? str.substring(0, len) + '...' : str;
  };

  const auditData = (() => {
    try {
      if (!bb.orchestrator_notes) return null;
      const jsonStr = bb.orchestrator_notes.match(/\{[\s\S]*\}/)?.[0] || bb.orchestrator_notes;
      return JSON.parse(jsonStr);
    } catch {
      return null;
    }
  })();

  return (
    <div className="orch-dash">
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      {/* TOP MONITOR SECTION */}
      <div className="sect-top">
        <div className="monitor-panel">
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-black tracking-widest text-indigo-500 uppercase">Live Operations Command</span>
                <h1 className="text-3xl font-black text-white">{activeProject.name}</h1>
                <p className="text-sm text-zinc-500 max-w-xl italic">"{truncate(bb.core_goal.description, 300)}"</p>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Simulation Status</div>
                <div className="text-xl font-mono font-bold text-indigo-400 capitalize">{activeProject.simulationStatus}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/5">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Execution Index</span>
                <div className="text-2xl font-black">0{activeProject.simulationIndex + 1} <span className="text-xs text-zinc-600">/ 0{nodes.length}</span></div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Audit Records</span>
                <div className="text-2xl font-black">{auditData?.audit_results?.length || 0} <span className="text-xs text-zinc-600">Logs Found</span></div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Health Score</span>
                <div className="text-2xl font-black text-emerald-500">POOLED <span className="text-xs text-zinc-600 italic">OPTIMAL</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-white/5 rounded-[24px] p-6 flex flex-col gap-4 overflow-hidden h-[340px]">
          <h3 className="text-[10px] font-black tracking-tighter text-zinc-500 uppercase">Compliance Feed</h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {auditData?.audit_results ? auditData.audit_results.map((log: any, i: number) => (
              <div key={i} className="p-3 bg-black/40 rounded-xl border border-white/5 text-[11px] leading-relaxed">
                <div className="flex justify-between mb-1">
                  <span className="font-bold text-indigo-400">{log.node_type}</span>
                  <span className={`font-black ${log.compliance === 'compliant' ? 'text-emerald-500' : 'text-red-500'}`}>{log.compliance}</span>
                </div>
                <span className="text-zinc-400 italic">"{log.note}"</span>
              </div>
            )) : (
              <div className="h-full flex items-center justify-center text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                Awaiting Final Audit...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CORE AGENT GRID */}
      <div className="grid-agents">
        {[
          { id: 'researcher', name: 'Researcher', color: 'var(--color-researcher)', data: bb.research_data },
          { id: 'planner', name: 'Strategy Planner', color: 'var(--color-orchestrator)', data: bb.planning_data },
          { id: 'designer', name: 'Interface Designer', color: 'var(--color-designer)', data: bb.ui_specs },
          { id: 'developer', name: 'Lead Developer', color: 'var(--color-developer)', data: bb.implementation_tasks },
          { id: 'tester', name: 'QA Engineer', color: 'var(--color-qa)', data: bb.test_results },
          { id: 'writer', name: 'Technical Writer', color: 'var(--color-docs)', data: bb.tech_docs },
        ].map(ag => {
          const status = getStatus(ag.id);
          return (
            <div key={ag.id} className="agent-tile">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-white tracking-tight">{ag.name}</h4>
                <div className={`agent-badge ${status === 'done' ? 'badge-done' : status === 'processing' ? 'badge-working' : 'badge-idle'}`}>
                  {status}
                </div>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${status === 'done' ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                  style={{ width: status === 'done' ? '100%' : status === 'processing' ? '60%' : '0%' }}
                />
              </div>
              <div className="snippet-box">
                {truncate(ag.data)}
              </div>
              <div className="flex justify-between items-center text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                <span>Operation Stream</span>
                <span>Active Link</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
