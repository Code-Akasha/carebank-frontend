import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Simulator from "./pages/Simulator";
import Products from "./pages/Products";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col pt-16">
        {/* Navigation Bar */}
        <nav className="bg-white border-b border-slate-200 fixed top-0 w-full z-10 px-6 h-16 flex items-center justify-between shadow-sm">
          <div className="font-bold text-xl text-blue-600">CareBank</div>
          <div className="space-x-8 text-sm font-medium text-slate-600">
            <Link to="/" className="hover:text-blue-600 transition-colors">Dashboard</Link>
            <Link to="/simulator" className="hover:text-blue-600 transition-colors">What-If Simulator</Link>
            <Link to="/products" className="hover:text-blue-600 transition-colors">Products</Link>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 bg-slate-50">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/simulator" element={<Simulator />} />
            <Route path="/products" element={<Products />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
