import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Login from "./pages/Login";
import UserLayout from "./layouts/UserLayout";
import Dashboard from "./pages/Dashboard";
import Simulator from "./pages/Simulator";
import Products from "./pages/Products";
import Accounts from "./pages/Accounts";
import Chat from "./pages/Chat";
import AdminLayout from "./layouts/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUserDetail from "./pages/admin/AdminUserDetail";
import AdminAgentMonitor from "./pages/admin/AdminAgentMonitor";
import AdminSimulation from "./pages/admin/AdminSimulation";
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* User Protected Routes with UserLayout */}
          <Route path="/" element={<ProtectedRoute><UserLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="simulator" element={<Simulator />} />
            <Route path="products" element={<Products />} />
            <Route path="accounts" element={<Accounts />} />
            <Route path="chat" element={<Chat />} />
          </Route>

          {/* Admin Protected Routes */}
          <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="users/:userId" element={<AdminUserDetail />} />
            <Route path="agents" element={<AdminAgentMonitor />} />
            <Route path="simulation" element={<AdminSimulation />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
