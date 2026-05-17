import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Users,
    Activity,
    LogOut,
    ShieldAlert,
    Webhook,
    Zap
} from 'lucide-react';

export default function AdminLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/admin', icon: LayoutDashboard, label: 'Overview', end: true },
        { path: '/admin/users', icon: Users, label: 'Users' },
        { path: '/admin/agents', icon: Activity, label: 'Agent Monitor' },
        { path: '/admin/webhooks', icon: Webhook, label: 'Webhooks' },
        { path: '/admin/llm-config', icon: Zap, label: 'LLM Configuration' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Dark Sidebar with sharp edges */}
            <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col border-r border-slate-800">
                <div className="h-16 flex items-center px-6 border-b border-slate-800">
                    <ShieldAlert className="w-6 h-6 text-red-500 mr-3" />
                    <span className="text-xl font-bold tracking-tight text-white">CareBank<span className="text-red-500">Ops</span></span>
                </div>

                <div className="flex-1 overflow-y-auto py-6">
                    <div className="px-4 mb-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                        System Controls
                    </div>
                    <nav className="space-y-1 px-3">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.end}
                                className={({ isActive }) =>
                                    `flex items-center px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                                        ? 'bg-slate-800 text-white border-l-2 border-red-500'
                                        : 'hover:bg-slate-900 hover:text-white border-l-2 border-transparent'
                                    }`
                                }
                            >
                                <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>
                </div>

                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center px-3 py-2.5 bg-slate-900 text-sm mb-3">
                        <div className="w-8 h-8 bg-slate-800 flex items-center justify-center font-bold text-slate-300 mr-3">
                            {user?.full_name?.charAt(0) || 'A'}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="font-medium text-white truncate">{user?.full_name}</p>
                            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-3 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 shadow-sm justify-between">
                    <h1 className="text-lg font-semibold text-slate-800">Admin Control Center</h1>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-medium text-slate-600">System Online</span>
                        </div>
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
