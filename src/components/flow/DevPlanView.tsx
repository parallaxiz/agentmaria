import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  ClipboardList, 
  Search, 
  Palette, 
  Code2, 
  CheckSquare, 
  FileText, 
  Bot,
  CheckCircle2,
  Clock,
  AlertCircle,
  Activity,
  Layers,
  Cpu,
  Zap,
  Eye,
  FileCode
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const nodeIconMap: Record<string, any> = {
  planner: ClipboardList,
  researcher: Search,
  designer: Palette,
  developer: Code2,
  tester: CheckSquare,
  writer: FileText,
  orchestrator: Bot,
};

const extractJson = (str: string) => {
  try {
    const jsonMatch = str.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, str];
    const candidate = jsonMatch[1] || str;
    return JSON.parse(candidate.trim());
  } catch (e) {
    return null;
  }
};

const NodeRenderer = ({ node, blackboard, activeProject }: { node: any, blackboard: any, activeProject: any }) => {
  const status = node.data?.status || 'idle';
  
  // Resolve blackboard slot based on type
  let result = '';
  if (node.type === 'orchestrator') {
    const core = blackboard.core_goal;
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-zinc-900/50 border border-white/5 rounded-2xl space-y-2">
            <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Project Name</h4>
            <p className="text-xl font-bold text-white">{core.projectName || 'Undefined'}</p>
          </div>
          <div className="p-6 bg-zinc-900/50 border border-white/5 rounded-2xl space-y-2">
            <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Reference Theme</h4>
            <p className="text-sm font-medium text-zinc-400">{core.reference || 'None specified'}</p>
          </div>
        </div>
        <div className="p-8 bg-zinc-900/50 border border-white/5 rounded-2xl space-y-4">
          <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Mission Briefing</h4>
          <p className="text-zinc-300 leading-relaxed italic">"{core.description || 'Awaiting description...'}"</p>
        </div>
      </div>
    );
  }

  // Generic mapping
  const slotMap: Record<string, string> = {
    planner: 'planning_data',
    researcher: 'research_data',
    designer: 'ui_specs',
    developer: 'implementation_tasks',
    writer: 'tech_docs'
  };

  result = blackboard[slotMap[node.type]] || '';

  if (!result && status !== 'done' && status !== 'waiting') {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-zinc-500 gap-4 animate-in fade-in duration-500">
        <Clock size={48} className="opacity-20 translate-y-2" />
        <div className="text-center">
          <p className="font-bold text-lg text-zinc-400">Waiting for {node.type} implementation...</p>
          <p className="text-sm opacity-60">Run the simulation to generate output for this node.</p>
        </div>
      </div>
    );
  }

  if (node.type === 'planner') {
    let planData: any = extractJson(result) || { mvp_features: [], tech_stack: [], trade_offs: [] };

    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    useEffect(() => {
      if (planData.mvp_features && selectedIds.length === 0) {
        setSelectedIds(planData.mvp_features.map((f: any) => f.id));
      }
    }, [result, planData.mvp_features]);

    const toggleFeature = (id: number) => {
      setSelectedIds(prev => 
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
    };

    const handleConfirm = () => {
      const features = planData?.mvp_features || [];
      const filteredFeatures = features.filter((f: any) => selectedIds.includes(f.id));
      const updatedPlan = { ...planData, mvp_features: filteredFeatures };
      
      const setSimulationState = useStore.getState().setSimulationState;
      const updateBlackboard = useStore.getState().updateBlackboard;
      const updateNodeData = useStore.getState().updateNodeData;

      updateBlackboard('planning_data', JSON.stringify(updatedPlan));
      updateNodeData(node.id, { status: 'done' });
      setSimulationState(activeProject.id, 'running');
    };

    const isWaiting = node.data?.status === 'waiting';

    return (
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-24">
        {/* MVP FEATURES CHECKLIST */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Layers size={20} />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">MVP Feature Lifecycle</h3>
          </div>
          
          <div className="grid gap-4">
            {planData.mvp_features?.length > 0 ? planData.mvp_features.map((f: any, idx: number) => {
              const isSelected = selectedIds.includes(f.id);
              return (
                <div 
                  key={idx} 
                  onClick={() => isWaiting && toggleFeature(f.id)}
                  className={cn(
                    "group p-6 border rounded-2xl flex items-center gap-6 transition-all duration-300 cursor-pointer",
                    isSelected 
                      ? "bg-zinc-900/60 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.05)]" 
                      : "bg-zinc-900/20 border-white/5 opacity-40 grayscale"
                  )}
                >
                  <div className={cn(
                    "flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300",
                    isSelected ? "border-emerald-500 bg-emerald-500 text-white" : "border-zinc-700 bg-zinc-800/50"
                  )}>
                    {isSelected && <CheckCircle2 size={16} strokeWidth={3} />}
                  </div>

                  <div className="space-y-1 flex-grow">
                    <div className="flex items-center justify-between gap-4">
                      <h5 className={cn("text-lg font-bold transition-colors", isSelected ? "text-zinc-100" : "text-zinc-500")}>
                        {f.feature}
                      </h5>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-md border",
                          f.priority === 'high' ? "bg-red-500/10 text-red-400 border-red-500/20" : 
                          f.priority === 'medium' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                          "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        )}>
                          {f.priority}
                        </span>
                      </div>
                    </div>
                    <p className={cn("text-sm leading-relaxed transition-colors", isSelected ? "text-zinc-400" : "text-zinc-600")}>
                      {f.description}
                    </p>
                  </div>
                </div>
              );
            }) : (
              <div className="p-12 border border-dashed border-white/10 rounded-3xl text-center space-y-2">
                <p className="text-zinc-400 font-medium">No features generated found.</p>
                <p className="text-xs text-zinc-600">Try re-running the simulation or checking your project description.</p>
              </div>
            )}
          </div>
        </section>

        {isWaiting && (
          <div className="p-8 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl flex flex-col items-center gap-6 animate-in slide-in-from-bottom-8 duration-700">
            <div className="text-center space-y-2">
              <h4 className="text-lg font-bold text-emerald-400">Ready to build?</h4>
              <p className="text-sm text-zinc-400">Approved features will be handed off to the Designer & Developer agents.</p>
            </div>
            <button 
              onClick={handleConfirm}
              className="group relative px-12 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition-all shadow-2xl shadow-emerald-900/40 flex items-center gap-3 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <CheckCircle2 size={18} strokeWidth={3} />
              <span className="uppercase tracking-widest text-[11px]">Save & Continue Simulation</span>
            </button>
          </div>
        )}

        {/* TECH STACK */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
              <Cpu size={20} />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">Recommended Tech Stack</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {planData.tech_stack?.map((t: any, idx: number) => (
              <div key={idx} className="p-5 bg-zinc-900/40 border border-white/5 rounded-2xl space-y-3 hover:border-white/10 transition-all">
                <div className="flex items-center justify-between">
                  <h6 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{t.category}</h6>
                  <div className="px-2 py-1 bg-white/5 rounded text-xs font-bold text-white tracking-tight">{t.name}</div>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">{t.reason}</p>
              </div>
            ))}
          </div>
        </section>

        {/* TRADE OFFS */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <Zap size={20} />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">Architectural Trade-offs</h3>
          </div>
          <div className="space-y-4">
            {planData.trade_offs?.map((o: any, idx: number) => (
              <div key={idx} className="p-6 bg-zinc-950/40 border-l-2 border-amber-500/30 rounded-r-2xl space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-amber-500 font-bold">Decision:</span>
                  <span className="text-sm font-bold text-zinc-200">{o.decision}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-zinc-500 font-bold italic">Path:</span>
                  <span className="text-sm text-zinc-400">{o.chosen} — {o.reason}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (node.type === 'developer' || node.type === 'designer') {
    const [view, setView] = useState<'preview' | 'source'>('preview');

    const extractHtml = (str: string) => {
      if (!str) return '';
      
      // Try to find markdown blocks first
      const blockMatch = str.match(/```(?:html)?\s*([\s\S]*?)```/i);
      if (blockMatch) return blockMatch[1].trim();

      // Check for standalone HTML structure
      const htmlMatch = str.match(/(<!DOCTYPE html>|<html[\s\S]*?>)[\s\S]*?<\/html>/i);
      if (htmlMatch) return htmlMatch[0].trim();

      // If it looks like HTML but isn't wrapped, just return it
      if (str.trim().startsWith('<') && str.trim().endsWith('>')) {
        return str.trim();
      }

      return str.trim();
    };

    const htmlContent = extractHtml(result);
    // Developer nodes might not have HTML, so we check if it's worth previewing
    const hasPreview = node.type === 'designer' || (node.type === 'developer' && (htmlContent.includes('<html') || htmlContent.includes('<div') || htmlContent.includes('<!DOCTYPE')));

    return (
      <div className="space-y-6 animate-in fade-in duration-700">
        <div className="flex items-center justify-between p-1 bg-zinc-900/50 border border-white/5 rounded-xl w-fit">
          <button 
            onClick={() => setView('preview')}
            disabled={!hasPreview}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
              view === 'preview' ? "bg-white/10 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300",
              !hasPreview && "opacity-30 cursor-not-allowed"
            )}
          >
            <Eye size={12} />
            Live Preview
          </button>
          <button 
            onClick={() => setView('source')}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
              view === 'source' ? "bg-white/10 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <FileCode size={12} />
            Source Code
          </button>
        </div>

        {view === 'preview' && hasPreview ? (
          <div className="w-full aspect-video rounded-2xl overflow-hidden border border-white/5 bg-white shadow-2xl relative group">
            <iframe
              key={htmlContent.length} // Force remount if content changes logically
              srcDoc={htmlContent}
              title="Design Preview"
              className="w-full h-full border-none"
              sandbox="allow-scripts"
            />
            <div className="absolute inset-0 pointer-events-none border border-white/10 rounded-2xl group-hover:border-white/20 transition-colors" />
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden border border-white/5 shadow-2xl bg-black">
            <SyntaxHighlighter
              language={node.type === 'designer' ? 'xml' : 'typescript'}
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                padding: '24px',
                fontSize: '12px',
                lineHeight: '1.6',
                background: '#0a0a0a',
              }}
            >
              {result}
            </SyntaxHighlighter>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="prose prose-invert prose-zinc max-w-none animate-in fade-in duration-700">
      <ReactMarkdown>{result}</ReactMarkdown>
    </div>
  );
};

export const DevPlanView: React.FC = () => {
  const activeProjectId = useStore((state) => state.activeProjectId);
  const projects = useStore((state) => state.projects);
  const selectedNodeId = useStore((state) => state.selectedNodeId);
  const setSelectedNodeId = useStore((state) => state.setSelectedNodeId);

  const activeProject = projects.find((p) => p.id === activeProjectId);
  const nodes = activeProject?.nodes || [];
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  if (!activeProject) return null;

  return (
    <div className="flex w-full h-full bg-black overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 border-r border-white/5 flex flex-col bg-zinc-950/20">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Project Nodes</h3>
        </div>
        <div className="flex-grow overflow-y-auto p-4 space-y-1">
          {nodes.map((node) => {
            const Icon = nodeIconMap[node.type as string] || Activity;
            const isSelected = selectedNodeId === node.id;
            
            const slotMap: Record<string, string> = {
              orchestrator: 'core_goal',
              researcher: 'research_data',
              designer: 'ui_specs',
              developer: 'implementation_tasks',
              writer: 'tech_docs'
            };
            const slotValue = activeProject.blackboard[slotMap[node.type as string] || ''];
            const isDone = node.type === 'orchestrator' 
              ? (slotValue?.projectName && slotValue?.description)
              : !!slotValue;

            return (
              <button
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group",
                  isSelected 
                    ? "bg-white/10 text-white shadow-lg border border-white/10" 
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                )}
              >
                <div className={cn(
                  "p-2 rounded-lg transition-colors",
                  isSelected ? "bg-white/10 text-white" : "bg-white/5 group-hover:bg-white/10"
                )}>
                  <Icon size={16} />
                </div>
                <div className="flex-grow min-w-0">
                  <p className="text-xs font-bold truncate capitalize">{node.type}</p>
                  <p className="text-[9px] font-mono opacity-40">NODE-{node.id.slice(0, 4)}</p>
                </div>
                {isDone && (
                  <div className="text-emerald-500">
                    <CheckCircle2 size={14} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-grow overflow-y-auto bg-black scroll-smooth">
        {selectedNode ? (
          <div className="max-w-4xl mx-auto p-12 lg:p-20 space-y-12">
            <header className="space-y-4">
              <div className="flex items-center gap-3">
                <span className={cn(
                  "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border",
                  selectedNode.data?.status === 'done' 
                    ? "bg-emerald-500/5 text-emerald-500 border-emerald-500/20" 
                    : "bg-white/5 text-zinc-500 border-white/10"
                )}>
                  {String(selectedNode.data?.status || 'idle')}
                </span>
                <span className="text-zinc-600 font-mono text-[10px]">ID: {selectedNode.id}</span>
              </div>
              <h2 className="text-4xl font-black tracking-tighter text-white capitalize">
                {selectedNode.type} Output
              </h2>
            </header>

            <NodeRenderer node={selectedNode} blackboard={activeProject.blackboard} activeProject={activeProject} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-6">
            <div className="p-8 bg-zinc-900/20 border border-white/5 rounded-full opacity-20">
              <AlertCircle size={64} />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-zinc-400 mb-2">No Node Selected</h3>
              <p className="max-w-xs text-sm opacity-60">Select a node from the sidebar or double-click one in the workflow to view its detailed implementation plan.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
