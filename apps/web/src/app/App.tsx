import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { AuditPage } from '../features/audit/AuditPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { ExecutionDetailPage } from '../features/executions/ExecutionDetailPage';
import { ExecutionsPage } from '../features/executions/ExecutionsPage';
import { LoginPage } from '../features/auth/LoginPage';
import { SystemPage } from '../features/system/SystemPage';
import { TasksPage } from '../features/tasks/TasksPage';
import { WorkflowDetailPage } from '../features/workflows/WorkflowDetailPage';
import { WorkflowEditorPage } from '../features/workflows/WorkflowEditorPage';
import { WorkflowsPage } from '../features/workflows/WorkflowsPage';
import { useAuth } from '../features/auth/AuthProvider';

function ProtectedApp() {
  const { user, isBootstrapping } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return <div className="boot-screen">Loading FlowPilot AI...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <AppLayout />;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedApp />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/workflows" element={<WorkflowsPage />} />
        <Route path="/workflows/new" element={<WorkflowEditorPage />} />
        <Route path="/workflows/:id" element={<WorkflowDetailPage />} />
        <Route path="/workflows/:id/edit" element={<WorkflowEditorPage />} />
        <Route path="/executions" element={<ExecutionsPage />} />
        <Route path="/executions/:id" element={<ExecutionDetailPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/audit" element={<AuditPage />} />
        <Route path="/system" element={<SystemPage />} />
      </Route>
    </Routes>
  );
}
