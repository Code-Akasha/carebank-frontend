import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Login from "./pages/Login";
import UserLayout from "./layouts/UserLayout";
import Dashboard from "./pages/Dashboard";
import Simulator from "./pages/Simulator";
import Products from "./pages/Products";
import Accounts from "./pages/Accounts";
import Chat from "./pages/Chat";
import IntegrationLab from "./pages/IntegrationLab";
import Analytics from "./pages/Analytics";
import Planning from "./pages/Planning";
import Bills from "./pages/Bills";
import AdminLayout from "./layouts/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUserDetail from "./pages/admin/AdminUserDetail";
import AdminAgentMonitor from "./pages/admin/AdminAgentMonitor";
import AdminSimulation from "./pages/admin/AdminSimulation";
import AdminWebhooks from "./pages/admin/AdminWebhooks";
export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />

            {/* User Protected Routes with UserLayout */}
            <Route path="/" element={<ProtectedRoute><UserLayout /></ProtectedRoute>}>
              <Route index element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
              <Route path="simulator" element={<ErrorBoundary><Simulator /></ErrorBoundary>} />
              <Route path="products" element={<ErrorBoundary><Products /></ErrorBoundary>} />
              <Route path="accounts" element={<ErrorBoundary><Accounts /></ErrorBoundary>} />
              <Route path="analytics" element={<ErrorBoundary><Analytics /></ErrorBoundary>} />
              <Route path="planning" element={<ErrorBoundary><Planning /></ErrorBoundary>} />
              <Route path="bills" element={<ErrorBoundary><Bills /></ErrorBoundary>} />
              <Route path="chat" element={<ErrorBoundary><Chat /></ErrorBoundary>} />
              <Route path="integration" element={<ErrorBoundary><IntegrationLab /></ErrorBoundary>} />
            </Route>

            {/* Admin Protected Routes */}
            <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminLayout /></ProtectedRoute>}>
              <Route index element={<ErrorBoundary><AdminOverview /></ErrorBoundary>} />
              <Route path="users" element={<ErrorBoundary><AdminUsers /></ErrorBoundary>} />
              <Route path="users/:userId" element={<ErrorBoundary><AdminUserDetail /></ErrorBoundary>} />
              <Route path="agents" element={<ErrorBoundary><AdminAgentMonitor /></ErrorBoundary>} />
              <Route path="simulation" element={<ErrorBoundary><AdminSimulation /></ErrorBoundary>} />
              <Route path="webhooks" element={<ErrorBoundary><AdminWebhooks /></ErrorBoundary>} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}
