import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  type Connection, 
  type Edge, 
  type EdgeChange, 
  type Node, 
  type NodeChange, 
  addEdge, 
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';

export interface Blackboard {
  [key: string]: any;
  core_goal: any;
  research_data: string;
  ui_specs: string;
  implementation_tasks: string;
  tech_docs: string;
  planning_data: string;
}

export interface Project {
  id: string;
  name: string;
  brief: string;
  nodes: Node[];
  edges: Edge[];
  blackboard: Blackboard;
  simulationIndex: number;
  simulationStatus: 'idle' | 'running' | 'waiting' | 'done';
  createdAt: number;
}

interface AppState {
  projects: Project[];
  activeProjectId: string | null;
  selectedNodeId: string | null;
  
  // Actions
  addProject: (name: string, brief: string) => void;
  deleteProject: (id: string) => void;
  setActiveProject: (id: string | null) => void;
  setSelectedNodeId: (id: string | null) => void;
  deleteNode: (nodeId: string) => void;
  updateBlackboard: (slot: keyof Blackboard, data: any) => void;
  clearCanvas: () => void;
  
  // Flow Actions for current active project
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (type: string, position: { x: number; y: number }) => void;
  addNodeAndConnect: (type: string, sourceNodeId: string) => void;
  updateNodeData: (nodeId: string, data: any) => void;
  setSimulationState: (projectId: string, state: 'idle' | 'running' | 'waiting' | 'done') => void;
  setSimulationIndex: (projectId: string, index: number) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: null,
      selectedNodeId: null,

      addProject: (name, brief) => {
        const id = crypto.randomUUID();
        const initialNodeId = crypto.randomUUID();
        
        const newProject: Project = {
          id,
          name,
          brief,
          nodes: [
            {
              id: initialNodeId,
              type: 'orchestrator',
              position: { x: 100, y: 100 },
              data: { status: 'idle', result: '' },
            }
          ],
          edges: [],
          blackboard: {
            core_goal: { projectName: '', description: '', reference: '' },
            research_data: '',
            ui_specs: '',
            implementation_tasks: '',
            tech_docs: '',
            planning_data: '',
          },
          simulationIndex: 0,
          simulationStatus: 'idle',
          createdAt: Date.now(),
        };
        set((state) => ({
          projects: [...state.projects, newProject],
          activeProjectId: id,
        }));
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
        }));
      },

      setActiveProject: (id) => {
        set({ activeProjectId: id });
      },
      setSelectedNodeId: (id) => {
        set({ selectedNodeId: id });
      },

      deleteNode: (nodeId) => {
        const { activeProjectId, projects } = get();
        if (!activeProjectId) return;

        set({
          projects: projects.map((p) =>
            p.id === activeProjectId
              ? {
                  ...p,
                  nodes: p.nodes.filter((n) => n.id !== nodeId),
                  edges: p.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
                }
              : p
          ),
          selectedNodeId: get().selectedNodeId === nodeId ? null : get().selectedNodeId,
        });
      },

      updateBlackboard: (slot, data) => {
        const { activeProjectId, projects } = get();
        if (!activeProjectId) return;

        set({
          projects: projects.map((p) =>
            p.id === activeProjectId
              ? {
                  ...p,
                  blackboard: {
                    ...p.blackboard,
                    [slot]: data,
                  },
                }
              : p
          ),
        });
      },

      clearCanvas: () => {
        const { activeProjectId, projects } = get();
        if (!activeProjectId) return;

        set({
          projects: projects.map((p) =>
            p.id === activeProjectId
              ? { ...p, nodes: [], edges: [] }
              : p
          ),
          selectedNodeId: null,
        });
      },

      onNodesChange: (changes) => {
        const { activeProjectId, projects } = get();
        if (!activeProjectId) return;

        set({
          projects: projects.map((p) =>
            p.id === activeProjectId
              ? { ...p, nodes: applyNodeChanges(changes, p.nodes) }
              : p
          ),
        });
      },

      onEdgesChange: (changes) => {
        const { activeProjectId, projects } = get();
        if (!activeProjectId) return;

        set({
          projects: projects.map((p) =>
            p.id === activeProjectId
              ? { ...p, edges: applyEdgeChanges(changes, p.edges) }
              : p
          ),
        });
      },

      onConnect: (connection) => {
        const { activeProjectId, projects } = get();
        if (!activeProjectId) return;

        set({
          projects: projects.map((p) =>
            p.id === activeProjectId
              ? { ...p, edges: addEdge(connection, p.edges) }
              : p
          ),
        });
      },

      addNode: (type, position) => {
        const { activeProjectId, projects } = get();
        if (!activeProjectId) return;

        const newNode = {
          id: crypto.randomUUID(),
          type,
          position,
          data: { status: 'idle', result: '' },
        };

        set({
          projects: projects.map((p) =>
            p.id === activeProjectId
              ? { ...p, nodes: [...p.nodes, newNode] }
              : p
          ),
        });
      },

      addNodeAndConnect: (type, sourceNodeId) => {
        const { activeProjectId, projects } = get();
        if (!activeProjectId) return;

        const project = projects.find(p => p.id === activeProjectId);
        if (!project) return;

        const sourceNode = project.nodes.find(n => n.id === sourceNodeId);
        if (!sourceNode) return;

        const newNodeId = crypto.randomUUID();
        const newNodeX = sourceNode.position.x + 300;
        const newNodeY = sourceNode.position.y;
        
        const newNode = {
          id: newNodeId,
          type,
          position: { 
            x: newNodeX, 
            y: newNodeY 
          },
          data: { status: 'idle', result: '' },
        };

        // 1. Identify all existing edges from this source
        const existingEdgesFromSource = project.edges.filter(e => e.source === sourceNodeId);

        // 2. Prepare new nodes array with shifting
        // We shift every node that is currently at or to the right of our new position
        const newNodes = project.nodes.map(node => {
          if (node.position.x >= newNodeX) {
            return {
              ...node,
              position: { ...node.position, x: node.position.x + 300 }
            };
          }
          return node;
        });
        newNodes.push(newNode);

        // 3. Prepare new edges array
        // Remove ALL existing outgoing edges from source to enforce linear chain
        let newEdges = project.edges.filter(e => e.source !== sourceNodeId);

        // Add edge: Source -> New Node
        newEdges.push({
          id: `e-${sourceNodeId}-${newNodeId}`,
          source: sourceNodeId,
          target: newNodeId,
        });

        // If there were existing connections, point them FROM the new node instead
        existingEdgesFromSource.forEach((edge) => {
          newEdges.push({
            id: `e-${newNodeId}-${edge.target}`,
            source: newNodeId,
            target: edge.target,
          });
        });

        set({
          projects: projects.map((p) =>
            p.id === activeProjectId
              ? { ...p, nodes: newNodes, edges: newEdges }
              : p
          ),
        });
      },

      updateNodeData: (nodeId, data) => {
        const { activeProjectId, projects } = get();
        if (!activeProjectId) return;

        set({
          projects: projects.map((p) =>
            p.id === activeProjectId
              ? {
                  ...p,
                  nodes: p.nodes.map((n) =>
                    n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
                  ),
                }
              : p
          ),
        });
      },

      setSimulationState: (projectId, state) => {
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId ? { ...p, simulationStatus: state } : p
          ),
        }));
      },

      setSimulationIndex: (projectId, index) => {
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId ? { ...p, simulationIndex: index } : p
          ),
        }));
      },
    }),
    {
      name: 'pm-dashboard-storage',
    }
  )
);
