import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Panel,
  BackgroundVariant,
  ReactFlowProvider,
  type Node
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useStore } from '../../store/useStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Import Custom Nodes
import { PlannerNode } from '../nodes/PlannerNode';
import { ResearcherNode } from '../nodes/ResearcherNode';
import { DesignerNode } from '../nodes/DesignerNode';
import { DeveloperNode } from '../nodes/DeveloperNode';
import { TesterNode } from '../nodes/TesterNode';
import { TechnicalWriterNode } from '../nodes/TechnicalWriterNode';
import { OrchestratorNode } from '../nodes/OrchestratorNode';
import { DevPlanView } from './DevPlanView';
import OrchestratorDashboard from '../../OrchestratorDashboard';
import { runResearcherAgent } from '../../agents/ResearcherAgent';
import { runDesignerAgent } from '../../agents/DesignerAgent';
import { runDeveloperAgent } from '../../agents/DeveloperAgent';
import { runPlannerAgent } from '../../agents/PlannerAgent';
import { runTesterAgent } from '../../agents/TesterAgent';
import { runOrchestratorAudit } from '../../agents/OrchestratorAgent';

import {
  Plus,
  Trash2,
  Play,
  ArrowLeft,
  FileText,
  Activity,
  MonitorPlay,
  Square,
} from 'lucide-react';

const nodeTypes = {
  planner: PlannerNode,
  researcher: ResearcherNode,
  designer: DesignerNode,
  developer: DeveloperNode,
  tester: TesterNode,
  writer: TechnicalWriterNode,
  orchestrator: OrchestratorNode,
};

const FlowInner = () => {
  const activeProjectId = useStore((state) => state.activeProjectId);
  const projects = useStore((state) => state.projects);
  const activeProject = useMemo(() =>
    projects.find(p => p.id === activeProjectId),
    [projects, activeProjectId]
  );

  const onNodesChange = useStore((state) => state.onNodesChange);
  const onEdgesChange = useStore((state) => state.onEdgesChange);
  const onConnect = useStore((state) => state.onConnect);
  const updateNodeData = useStore((state) => state.updateNodeData);
  const updateBlackboard = useStore((state) => state.updateBlackboard);
  const addNode = useStore((state) => state.addNode);
  const deleteNode = useStore((state) => state.deleteNode);
  const clearCanvas = useStore((state) => state.clearCanvas);
  const setActiveProject = useStore((state) => state.setActiveProject);
  const setSelectedNodeId = useStore((state) => state.setSelectedNodeId);

  const [isSimulating, setIsSimulating] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'workflow' | 'devplan' | 'warroom'>('workflow');
  const [menu, setMenu] = useState<{ id: string; top: number; left: number } | null>(null);

  const terminationRef = useRef(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: any) => {
      // Prevent native context menu from showing
      event.preventDefault();

      // Calculate position of the context menu. 
      // We want it slightly to the right of the click for better ergonomics.
      setMenu({
        id: node.id,
        top: event.clientY,
        left: event.clientX,
      });
    },
    [setMenu]
  );

  const onPaneClick = useCallback(() => setMenu(null), [setMenu]);
  const onPaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setMenu(null);
  }, [setMenu]);

  const onNodeDragStop = useCallback(
    (event: React.MouseEvent, node: any) => {
      const dustbin = document.getElementById('dustbin-zone');
      if (!dustbin) return;

      const rect = dustbin.getBoundingClientRect();
      const isOverDustbin = (
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom
      );

      if (isOverDustbin) {
        deleteNode(node.id);
      }
    },
    [deleteNode]
  );

  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id);
      setActiveTab('devplan');
    },
    [setSelectedNodeId]
  );

  useEffect(() => {
    if (activeProject?.simulationStatus === 'running' && !isSimulating) {
      runSimulation(true);
    }
  }, [activeProject?.simulationStatus]);

  // Blackboard-aware simulation orchestrator
  const runSimulation = async (isResume = false) => {
    if (!activeProject || activeProject.nodes.length === 0) return;

    const setSimulationState = useStore.getState().setSimulationState;
    const setSimulationIndex = useStore.getState().setSimulationIndex;

    setSimulationState(activeProject.id, 'running');
    setIsSimulating(true);

    if (!isResume) {
      // Reset only on fresh start
      activeProject.nodes.forEach(node => {
        updateNodeData(node.id, { status: 'idle' });
      });
      setSimulationIndex(activeProject.id, 0);
    }

    const sortedNodes = [...activeProject.nodes].sort((a, b) => a.position.x - b.position.x);
    const startIndex = isResume ? activeProject.simulationIndex : 0;
    let testIterationCount = 0;
    terminationRef.current = false;

    for (let i = startIndex; i < sortedNodes.length; i++) {
      if (terminationRef.current) {
        console.log("Simulation terminated by user.");
        setIsSimulating(false);
        setSimulationState(activeProject.id, 'idle');
        return;
      }
      const node = sortedNodes[i];
      if (node.data?.status === 'done') continue;

      setSimulationIndex(activeProject.id, i);
      updateNodeData(node.id, { status: 'processing' });

      try {
        if (node.type === 'orchestrator') {
          // Orchestrator just validates input and sets the "base" of the project
          await new Promise(resolve => setTimeout(resolve, 800));
          // Input is already in blackboard thanks to controlled component
        }
        else if (node.type === 'researcher') {
          const coreGoal = activeProject.blackboard.core_goal;
          if (!coreGoal.description) throw new Error("Missing project description in Orchestrator.");

          const research = await runResearcherAgent(coreGoal);
          updateBlackboard('research_data', research);
        }
        else if (node.type === 'planner') {
          const coreGoal = activeProject.blackboard.core_goal;
          const plan = await runPlannerAgent(coreGoal);
          updateBlackboard('planning_data', plan);

          // PAUSE FOR HUMAN IN THE LOOP (User Approves Plan)
          updateNodeData(node.id, { status: 'waiting' });
          setSimulationState(activeProject.id, 'waiting');
          setIsSimulating(false);
          return;
        }
        else if (node.type === 'designer') {
          const coreGoal = activeProject.blackboard.core_goal;
          const planningDataStr = activeProject.blackboard.planning_data;

          let selectedFeatures = '';
          try {
            if (planningDataStr) {
              const plan = JSON.parse(planningDataStr);
              selectedFeatures = plan.mvp_features?.map((f: any) => `- ${f.feature}: ${f.description}`).join('\n') || '';
            }
          } catch (e) {
            console.error("Failed to parse planning data for Designer:", e);
          }

          const design = await runDesignerAgent(coreGoal.description, undefined, selectedFeatures);
          updateBlackboard('ui_specs', design);
        }
        else if (node.type === 'developer') {
          const coreGoal = activeProject.blackboard.core_goal;
          const research = activeProject.blackboard.research_data;
          const design = activeProject.blackboard.ui_specs;
          const planningDataStr = activeProject.blackboard.planning_data;

          let selectedFeatures = '';
          try {
            if (planningDataStr) {
              const plan = JSON.parse(planningDataStr);
              selectedFeatures = plan.mvp_features?.map((f: any) => `- ${f.feature}: ${f.description}`).join('\n') || '';
            }
          } catch (e) {
            console.error("Failed to parse planning data for Developer:", e);
          }

          if (!research || research.includes('Note:')) {
            console.warn("Developer node running with fallback or missing research data.");
          }

          const testFeedback = activeProject.blackboard.test_feedback;
          const code = await runDeveloperAgent(coreGoal, research, design, selectedFeatures, testFeedback);
          updateBlackboard('implementation_tasks', code);
        }
        else if (node.type === 'tester') {
          const coreGoal = activeProject.blackboard.core_goal;
          const repoJson = activeProject.blackboard.implementation_tasks;

          if (!repoJson) throw new Error("No repository code found for testing.");

          const results = await runTesterAgent(repoJson, JSON.stringify(coreGoal));
          updateBlackboard('test_results', results);

          try {
            const parsedResults = JSON.parse(results);
            if (parsedResults.has_errors && testIterationCount < 2) {
              updateBlackboard('test_feedback', parsedResults.feedback_for_developer);

              // FIND DEVELOPER NODE TO JUMP BACK
              const devNodeIndex = sortedNodes.findIndex(n => n.type === 'developer');
              if (devNodeIndex !== -1) {
                // RESET DEVELOPER NODE
                updateNodeData(sortedNodes[devNodeIndex].id, { status: 'idle' });
                updateNodeData(node.id, { status: 'idle' }); // Reset self too for clarity

                testIterationCount++;
                i = devNodeIndex - 1; // Subtract 1 because the loop increment will move it to devNodeIndex
                console.log(`[TESTER] Errors found. Jumping back to Developer. Iteration: ${testIterationCount}`);
                continue;
              }
            }
          } catch (e) {
            console.error("Failed to parse tester results:", e);
          }
        }
        else {
          // Fallback for other nodes
          await new Promise(resolve => setTimeout(resolve, 800));
        }

        updateNodeData(node.id, { status: 'done' });

        // THROTTLING: 2s pause between agent calls for Groq stability and UI feel
        if (i < sortedNodes.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (err: any) {
        console.error(`Error in ${node.type}:`, err);
        updateNodeData(node.id, { status: 'error' });
        setIsSimulating(false);
        return;
      }
    }

    // FINAL AUDIT BY ORCHESTRATOR
    try {
      const orchestratorNode = sortedNodes.find(n => n.type === 'orchestrator');
      if (orchestratorNode) {
        updateNodeData(orchestratorNode.id, { status: 'processing' });
        const latestBlackboard = useStore.getState().projects.find(p => p.id === activeProject.id)?.blackboard;
        if (latestBlackboard) {
          const audit = await runOrchestratorAudit(latestBlackboard);
          updateBlackboard('orchestrator_notes', audit);
          updateNodeData(orchestratorNode.id, { status: 'done' });
        }
      }
    } catch (err) {
      console.error("Final Audit Error:", err);
    }

    setIsSimulating(false);
    setSimulationState(activeProject.id, 'idle');
  };

  if (!activeProject) return null;

  return (
    <div className="flex flex-col w-full h-screen bg-black overflow-hidden font-sans">
      {/* Top Navigation Bar */}
      <div className="h-16 px-6 border-b border-white/5 bg-black/40 backdrop-blur-3xl flex items-center justify-between z-[100]">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveProject(null)}
            className="p-2 hover:bg-white/5 rounded-xl text-zinc-500 hover:text-white transition-all border border-transparent hover:border-white/10"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex flex-col">
            <h2 className="text-sm font-bold text-white leading-tight">{activeProject.name}</h2>
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Drafting Workflow</span>
            </div>
          </div>
        </div>

        <div className="flex items-center p-1 bg-zinc-900/50 border border-white/5 rounded-xl">
          <button
            onClick={() => setActiveTab('workflow')}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
              activeTab === 'workflow' ? "bg-white/10 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Activity size={14} />
            Workflow
          </button>
          <button
            onClick={() => setActiveTab('devplan')}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
              activeTab === 'devplan' ? "bg-white/10 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <FileText size={14} />
            DevPlan
          </button>
          <button
            onClick={() => setActiveTab('warroom')}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
              activeTab === 'warroom' ? "bg-white/10 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <MonitorPlay size={14} />
            War Room
          </button>
        </div>

        <div className="w-24" /> {/* Spacer for balance */}
      </div>

      <div className="flex-grow relative h-full group" ref={reactFlowWrapper}>
        {activeTab === 'workflow' ? (
          <>
            {/* Floating Add Node Button */}
            <div className="absolute top-6 right-6 z-[60]">
              <button
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="w-12 h-12 bg-white text-black hover:bg-zinc-200 rounded-2xl shadow-2xl flex items-center justify-center transition-all active:scale-95 group"
              >
                <Plus size={24} className={cn("transition-transform duration-300", showAddMenu && "rotate-45")} />
              </button>

              {showAddMenu && (
                <div className="absolute top-14 right-0 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-600 p-2 border-b border-white/5 mb-1">New Node</p>
                  {[
                    { type: 'planner', name: 'Planner' },
                    { type: 'researcher', name: 'Researcher' },
                    { type: 'designer', name: 'Designer' },
                    { type: 'developer', name: 'Developer' },
                    { type: 'tester', name: 'Tester' },
                    { type: 'writer', name: 'Writer' },
                    { type: 'orchestrator', name: 'Orchestrator' },
                  ].map((node) => (
                    <button
                      key={node.type}
                      onClick={() => {
                        addNode(node.type, { x: 100, y: 100 });
                        setShowAddMenu(false);
                      }}
                      className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white transition-all text-left"
                    >
                      {node.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dustbin Zone */}
            <div
              id="dustbin-zone"
              onDragOver={onDragOver}
              className="absolute bottom-10 right-10 z-[50] w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-red-500 hover:bg-red-500/20 hover:scale-110 transition-all shadow-2xl backdrop-blur-sm"
            >
              <Trash2 size={24} />
            </div>

            <ReactFlow
              nodes={activeProject.nodes}
              edges={activeProject.edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              onNodeDragStop={onNodeDragStop}
              onNodeDoubleClick={onNodeDoubleClick}
              onNodeContextMenu={onNodeContextMenu}
              onPaneClick={onPaneClick}
              onPaneContextMenu={onPaneContextMenu}
              onDragOver={onDragOver}
              autoPanOnNodeDrag={false}
              fitView
              className="bg-black"
            >
              <Background variant={BackgroundVariant.Dots} gap={80} size={6} color="#333" />
              <Controls position="bottom-left" className="!bg-zinc-900 !border-white/10 !shadow-2xl" style={{ marginBottom: '80px' }} />

              <Panel position="bottom-left" className="mb-[160px] ml-6">
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to clear the entire canvas? This cannot be undone.")) {
                      clearCanvas();
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-xl transition-all font-bold text-xs shadow-2xl backdrop-blur-md group"
                >
                  <Trash2 size={14} className="group-hover:scale-110 transition-transform" />
                  Clear Canvas
                </button>
              </Panel>

              {menu && (
                <div
                  style={{ top: menu.top, left: menu.left }}
                  className="fixed z-[100] bg-zinc-900/90 backdrop-blur-xl border border-white/5 p-1 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                >
                  <button
                    onClick={() => {
                      deleteNode(menu.id);
                      setMenu(null);
                    }}
                    className="flex items-center gap-3 px-4 py-2.5 w-48 text-left text-xs font-bold text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all group"
                  >
                    <Trash2 size={14} className="group-hover:scale-110 transition-transform" />
                    <span>Delete Node</span>
                  </button>
                </div>
              )}
            </ReactFlow>

            {/* Bottom Actions Bar */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[60]">
              <button
                onClick={() => isSimulating ? (terminationRef.current = true) : runSimulation()}
                className={cn(
                  "flex items-center gap-3 px-10 py-4 rounded-full text-sm font-bold shadow-[0_20px_50px_rgba(255,255,255,0.1)] transition-all active:scale-95 group",
                  isSimulating
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-white hover:bg-zinc-200 text-black"
                )}
              >
                {isSimulating ? (
                  <>
                    <Square size={16} fill="white" className="group-hover:scale-110 transition-transform" />
                    Terminate Simulation
                  </>
                ) : (
                  <>
                    <Play size={16} fill="currentColor" className="group-hover:scale-110 transition-transform" />
                    Start Simulation
                  </>
                )}
              </button>
            </div>
          </>
        ) : activeTab === 'devplan' ? (
          <DevPlanView />
        ) : (
          <div className="w-full h-full overflow-y-auto bg-black">
            <OrchestratorDashboard />
          </div>
        )}
      </div>
    </div>
  );
};

export const FlowEditor: React.FC = () => {
  return (
    <ReactFlowProvider>
      <FlowInner />
    </ReactFlowProvider>
  );
};
