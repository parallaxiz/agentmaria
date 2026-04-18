import { useStore } from './store/useStore';
import { DashboardGrid } from './components/dashboard/DashboardGrid';
import { FlowEditor } from './components/flow/FlowEditor';

function App() {
  const activeProjectId = useStore((state) => state.activeProjectId);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {activeProjectId ? (
        <FlowEditor />
      ) : (
        <DashboardGrid />
      )}
    </div>
  );
}

export default App;
