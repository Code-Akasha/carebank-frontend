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

          {/* Admin Protected Routes Placeholder */}
          <Route path="/admin/*" element={
            <ProtectedRoute requireAdmin={true}>
              <div className="p-8"><h1 className="text-3xl font-bold text-red-600">Admin Dashboard Placeholder</h1></div>
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
