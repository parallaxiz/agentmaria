import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { useStore } from '../../store/useStore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  FileCode,
  Folder,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  Download,
  Loader2,
  BookOpen,
  Monitor
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

const normalizeMarkdown = (str: string) => {
  if (!str) return '';
  // Fix squashed tables (e.g., "| col | col || --- | --- |")
  return str.replace(/([|])\s+([|])/g, '$1\n$2') // Fix || at row junctions
            .replace(/(\|[^\n]+\|)\s*(\| :?---)/g, '$1\n$2') // Fix header to separator
            .replace(/(\| :?---[^\n]+\|)\s*(\|)/g, '$1\n$2'); // Fix separator to data
};

const extractJson = (str: string) => {
  if (!str) return null;
  try {
    const jsonMatch = str.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, str];
    const candidate = jsonMatch[1] || str;
    return JSON.parse(candidate.trim());
  } catch (e) {
    try {
        return JSON.parse(str.trim());
    } catch (e2) {
        return null;
    }
  }
};

interface FileNode {
  path: string;
  content: string;
}

interface TreeItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children: TreeItem[];
  content?: string;
}

const buildFileTree = (files: FileNode[]): TreeItem[] => {
  const root: TreeItem[] = [];

  files.forEach((file) => {
    const parts = file.path.split('/');
    let currentLevel = root;

    parts.forEach((part, index) => {
      let existingPath = currentLevel.find((item) => item.name === part);

      if (!existingPath) {
        const fullPath = parts.slice(0, index + 1).join('/');
        existingPath = {
          name: part,
          path: fullPath,
          type: index === parts.length - 1 ? 'file' : 'folder',
          children: [],
          content: index === parts.length - 1 ? file.content : undefined,
        };
        currentLevel.push(existingPath);
      }
      currentLevel = existingPath.children;
    });
  });

  // Sort: Folders first, then alphabetically
  const sortTree = (items: TreeItem[]) => {
    items.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    items.forEach((item) => {
      if (item.children.length > 0) sortTree(item.children);
    });
  };

  sortTree(root);
  return root;
};

const RepositoryView = ({ data }: { data: any }) => {
  const [activeFilePath, setActiveFilePath] = useState<string>('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src']));
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const repoData = typeof data === 'string' ? extractJson(data) : data;
  const files = repoData?.files || [];
  const tree = buildFileTree(files);

  // Set initial file if none selected
  useEffect(() => {
    if (!activeFilePath && files.length > 0) {
      const readme = files.find((f: any) => f.path.toLowerCase().includes('readme'));
      setActiveFilePath(readme ? readme.path : files[0].path);
    }
  }, [files]);

  const activeFile = files.find((f: any) => f.path === activeFilePath);

  const toggleFolder = (path: string) => {
    const next = new Set(expandedFolders);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    setExpandedFolders(next);
  };

  const handleCopy = () => {
    if (activeFile?.content) {
      navigator.clipboard.writeText(activeFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadZip = async () => {
    if (!files.length) return;
    
    setDownloading(true);
    try {
      const zip = new JSZip();
      
      files.forEach((file: any) => {
        // Remove leading slashes if any
        const path = file.path.startsWith('/') ? file.path.slice(1) : file.path;
        zip.file(path, file.content);
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${repoData.repo_name || 'project'}-repository.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("ZIP Generation failed:", error);
    } finally {
      setDownloading(false);
    }
  };

  const renderTree = (items: TreeItem[], level = 0) => {
    return items.map((item) => {
      const isExpanded = expandedFolders.has(item.path);
      const isActive = activeFilePath === item.path;

      if (item.type === 'folder') {
        return (
          <div key={item.path}>
            <button
              onClick={() => toggleFolder(item.path)}
              className="w-full flex items-center gap-2 py-1 px-2 hover:bg-[#1f242c] rounded text-zinc-400 hover:text-white transition-colors text-xs font-medium"
              style={{ paddingLeft: `${level * 12 + 8}px` }}
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <Folder size={14} className="text-blue-400" />
              <span className="truncate">{item.name}</span>
            </button>
            {isExpanded && renderTree(item.children, level + 1)}
          </div>
        );
      }

      return (
        <button
          key={item.path}
          onClick={() => setActiveFilePath(item.path)}
          className={cn(
            "w-full flex items-center gap-2 py-1 px-2 rounded transition-colors text-xs",
            isActive ? "bg-[#1f242c] text-white font-semibold" : "text-zinc-500 hover:bg-[#1f242c] hover:text-zinc-300"
          )}
          style={{ paddingLeft: `${level * 12 + 28}px` }}
        >
          <FileCode size={14} className={cn(isActive ? "text-blue-400" : "text-zinc-600")} />
          <span className="truncate">{item.name}</span>
        </button>
      );
    });
  };

  if (!repoData || !files.length) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4 bg-[#0d1117] rounded-3xl border border-[#30363d] animate-pulse">
        <Bot size={48} className="text-zinc-700" />
        <div className="text-center">
            <h3 className="text-lg font-bold text-zinc-400">Repository Initializing...</h3>
            <p className="text-sm text-zinc-600">Lead Developer is sculpting your codebase architecture.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[700px] bg-[#0d1117] border border-[#30363d] rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-500">
      {/* Sidebar - Compacted to give code more space */}
      <div className="w-52 flex-shrink-0 bg-[#010409] border-r border-[#30363d] flex flex-col">
        <div className="p-4 border-b border-[#30363d] flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Files</h3>
          <Cpu size={14} className="text-zinc-700" />
        </div>
        <div className="flex-grow overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-[#30363d]">
          {renderTree(tree)}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow flex flex-col min-w-0">
        <header className="h-12 flex items-center justify-between px-6 bg-[#010409] border-b border-[#30363d]">
          <div className="flex items-center gap-3 min-w-0">
            <FileCode size={16} className="text-zinc-500 flex-shrink-0" />
            <span className="text-xs font-mono text-zinc-300 truncate">{activeFilePath}</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleDownloadZip}
              disabled={downloading}
              className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-zinc-300 transition-all border border-transparent hover:border-white/10 flex items-center gap-2 disabled:opacity-50"
            >
              {downloading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              <span className="text-[10px] font-bold uppercase tracking-wider">ZIP</span>
            </button>
            <button 
              onClick={handleCopy}
              className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-zinc-300 transition-all border border-transparent hover:border-white/10 flex items-center gap-2"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span className="text-[10px] font-bold uppercase tracking-wider">{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </header>
        
        <div className="flex-grow overflow-auto bg-[#0d1117]">
          <SyntaxHighlighter
            language="typescript"
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              padding: '2rem',
              fontSize: '13px',
              fontFamily: 'var(--font-mono, monospace)',
              lineHeight: '1.7',
              backgroundColor: 'transparent',
            }}
            showLineNumbers
          >
            {activeFile?.content || '// Select a file to view code'}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
};

const OrchestratorView = ({ blackboard }: { blackboard: any }) => {
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

      {blackboard.orchestrator_notes && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
              <Activity size={20} />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">LangSmith Compliance Audit</h3>
          </div>
          
          <div className="grid gap-4">
            {(() => {
              const audit = extractJson(blackboard.orchestrator_notes);
              return audit?.audit_results?.map((res: any, idx: number) => (
                <div key={idx} className="p-5 bg-zinc-900/40 border border-white/5 rounded-2xl flex items-start gap-4 hover:border-white/10 transition-all group">
                  <div className={cn(
                    "p-2 rounded-lg shrink-0",
                    res.compliance === 'compliant' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                  )}>
                    {res.compliance === 'compliant' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black uppercase tracking-widest text-white">{res.node_type}</span>
                      <span className={cn(
                        "px-2 py-0.5 text-[8px] font-black uppercase tracking-tighter rounded border",
                        res.compliance === 'compliant' ? "bg-emerald-500/5 text-emerald-500 border-emerald-500/20" : "bg-red-500/5 text-red-500 border-red-500/20"
                      )}>
                        {res.compliance}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed italic">"{res.note}"</p>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

const TesterView = ({ result }: { result: string }) => {
  const testData = extractJson(result) || { test_cases: [], summary: '', has_errors: false };
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckSquare size={20} className="text-emerald-500" />
            Test Execution Results
          </h3>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Autonomous Debugger Node</p>
        </div>
        {testData.has_errors ? (
          <div className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
            Requires Correction
          </div>
        ) : (
          <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-widest">
            Project Validated
          </div>
        )}
      </div>

      <div className="p-6 bg-zinc-900/50 border border-white/5 rounded-2xl">
        <p className="text-zinc-300 italic leading-relaxed text-sm">"{testData.summary}"</p>
      </div>

      <div className="grid gap-3">
        {testData.test_cases?.map((t: any, idx: number) => (
          <div key={idx} className="p-4 bg-zinc-950/40 border border-white/5 rounded-xl flex items-center justify-between hover:bg-zinc-900/40 transition-all group">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center border",
                t.status === 'passed' 
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
                  : "bg-red-500/10 border-red-500/20 text-red-500"
              )}>
                {t.status === 'passed' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              </div>
              <div className="space-y-0.5">
                <h5 className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">{t.test_name}</h5>
                <p className="text-xs text-zinc-500">{t.description}</p>
              </div>
            </div>
            <p className="text-[10px] font-mono text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity max-w-[300px] truncate">
              {t.feedback}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

const PlannerView = ({ node, result, activeProject }: { node: any, result: string, activeProject: any }) => {
  const planData: any = extractJson(result) || { mvp_features: [], tech_stack: [], trade_offs: [] };
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
    
    useStore.getState().updateBlackboard('planning_data', JSON.stringify(updatedPlan));
    useStore.getState().updateNodeData(node.id, { status: 'done' });
    useStore.getState().setSimulationState(activeProject.id, 'running');
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
};

const LivePreviewView = ({ node, result }: { node: any, result: string }) => {
  const [view, setView] = useState<'preview' | 'source'>('preview');

  const extractHtml = (str: string) => {
    if (!str) return '';
    const blockMatch = str.match(/```(?:html)?\s*([\s\S]*?)```/i);
    if (blockMatch) return blockMatch[1].trim();
    const htmlMatch = str.match(/(<!DOCTYPE html>|<html[\s\S]*?>)[\s\S]*?<\/html>/i);
    if (htmlMatch) return htmlMatch[0].trim();
    if (str.trim().startsWith('<') && str.trim().endsWith('>')) return str.trim();
    return str.trim();
  };

  const htmlContent = extractHtml(result);
  const hasPreview = node.type === 'designer' || (node.type === 'developer' && (htmlContent.includes('<html') || htmlContent.includes('<div') || htmlContent.includes('<!DOCTYPE')));

  const [previewScale, setPreviewScale] = useState(1);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setPreviewScale(width / 1440);
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [view]);

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
        <div ref={containerRef} className="w-full h-[600px] border border-white/5 bg-white shadow-2xl relative group overflow-hidden rounded-2xl">
          <div 
            style={{ 
              width: '1440px', 
              height: `${600 / previewScale}px`,
              transform: `scale(${previewScale})`,
              transformOrigin: '0 0'
            }}
          >
            <iframe
              key={htmlContent.length}
              srcDoc={htmlContent}
              title="Design Preview"
              className="w-full h-full border-none"
              sandbox="allow-scripts"
            />
          </div>
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
};

const ResearcherView = ({ result }: { result: string }) => {
  return (
    <div className="animate-in fade-in duration-700">
      <style dangerouslySetInnerHTML={{ __html: `
        .research-prose h1 { font-size: 2.5rem; font-weight: 900; color: #fff; margin-bottom: 2rem; border-bottom: 1px solid #333; padding-bottom: 1rem; }
        .research-prose h2 { font-size: 1.75rem; font-weight: 800; color: #fff; margin-top: 3rem; margin-bottom: 1.5rem; }
        .research-prose h3 { font-size: 1.25rem; font-weight: 700; color: #a1a1aa; margin-top: 2rem; }
        .research-prose p { line-height: 1.8; margin-bottom: 1.5rem; color: #d4d4d8; }
        .research-prose ul, .research-prose ol { margin-bottom: 2rem; margin-left: 1.5rem; }
        .research-prose li { margin-bottom: 0.75rem; color: #d4d4d8; }
        .research-prose table { width: 100%; border-collapse: collapse; margin: 2rem 0; background: #09090b; border-radius: 12px; overflow: hidden; }
        .research-prose th { background: #18181b; padding: 1rem; text-align: left; font-size: 0.75rem; font-weight: 900; text-transform: uppercase; color: #a1a1aa; border: 1px solid #27272a; }
        .research-prose td { padding: 1rem; font-size: 0.875rem; border: 1px solid #27272a; color: #d4d4d8; }
        .research-prose strong { color: #fff; }
        .research-prose blockquote { border-left: 4px solid #3f3f46; padding-left: 1.5rem; font-style: italic; color: #71717a; margin: 2rem 0; }
      `}} />
      <div className="research-prose">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{normalizeMarkdown(result)}</ReactMarkdown>
      </div>
    </div>
  );
};

const WriterView = ({ result }: { result: string }) => {
  return (
    <div className="animate-in fade-in duration-700 max-w-4xl mx-auto">
      <div className="p-12 bg-white/5 border border-white/5 rounded-[2rem] shadow-2xl backdrop-blur-3xl overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
          <BookOpen size={120} className="text-white" />
        </div>
        
        <style dangerouslySetInnerHTML={{ __html: `
          .writer-prose h1 { font-family: 'Inter', sans-serif; font-size: 3rem; font-weight: 900; color: #fff; line-height: 1.1; margin-bottom: 2rem; }
          .writer-prose h2 { font-family: 'Inter', sans-serif; font-size: 1.5rem; font-weight: 800; color: #fff; margin-top: 3rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem; }
          .writer-prose h2::before { content: ""; display: block; width: 8px; height: 8px; border-radius: 2px; background: #3b82f6; }
          .writer-prose p { font-size: 1.1rem; line-height: 1.8; color: #a1a1aa; margin-bottom: 1.5rem; }
          .writer-prose ul { space-y-4; margin-bottom: 2rem; }
          .writer-prose li { display: flex; align-items: flex-start; gap: 0.75rem; color: #d4d4d8; margin-bottom: 1rem; }
          .writer-prose li::before { content: "→"; color: #3b82f6; font-weight: 900; }
          .writer-prose pre { background: #000 !important; border: 1px solid #30363d !important; padding: 1.5rem !important; border-radius: 1rem !important; margin: 1.5rem 0 !important; }
          .writer-prose code { color: #60a5fa !important; font-family: 'JetBrains Mono', monospace !important; }
        `}} />
        <div className="writer-prose relative z-10">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{normalizeMarkdown(result)}</ReactMarkdown>
        </div>

        <div className="mt-12 p-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-start gap-4">
          <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
            <Monitor size={18} />
          </div>
          <div>
            <h5 className="text-sm font-bold text-white mb-1">Windows Deployment Ready</h5>
            <p className="text-xs text-zinc-400">This guide has been optimized for Windows 10/11 environments using PowerShell or Command Prompt.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const NodeRenderer = ({ node, blackboard, activeProject }: { node: any, blackboard: any, activeProject: any }) => {
  const status = node.data?.status || 'idle';
  
  const slotMap: Record<string, string> = {
    planner: 'planning_data',
    researcher: 'research_data',
    designer: 'ui_specs',
    developer: 'implementation_tasks',
    tester: 'test_results',
    writer: 'tech_docs'
  };

  const result = node.type === 'orchestrator' ? '' : (blackboard[slotMap[node.type]] || '');

  if (node.type === 'orchestrator') return <OrchestratorView blackboard={blackboard} />;
  
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

  switch (node.type) {
    case 'researcher': return <ResearcherView result={result} />;
    case 'planner': return <PlannerView node={node} result={result} activeProject={activeProject} />;
    case 'developer':
      // Show repository by default if not asking for preview
      if (result.includes('"repo_name"')) return <RepositoryView data={result} />;
      return <LivePreviewView node={node} result={result} />;
    case 'designer': return <LivePreviewView node={node} result={result} />;
    case 'tester': return <TesterView result={result} />;
    case 'writer': return <WriterView result={result} />;
    default:
      return (
        <div className="prose prose-invert prose-zinc max-w-none animate-in fade-in duration-700">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{normalizeMarkdown(result)}</ReactMarkdown>
        </div>
      );
  }
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
              tester: 'test_results',
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
          <div className="max-w-7xl mx-auto p-12 lg:p-20 space-y-12">
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
