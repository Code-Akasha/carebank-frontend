import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    LogOut,
    User as UserIcon,
    Package,
    FileText,
    Bell,
} from 'lucide-react';

export default function BusinessLayout() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/business', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/business/plans', label: 'Service Plans', icon: Package },
        { path: '/business/bills', label: 'Issue Bills', icon: FileText },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full z-20">
                <div className="h-16 flex items-center px-6 border-b border-slate-100">
                    <div className="font-bold text-xl tracking-tight">
                        <span className="text-emerald-600">CareBank</span>
                        <span className="text-slate-400 text-sm ml-2 font-normal">Business</span>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive =
                            location.pathname === item.path ||
                            (item.path !== '/business' && location.pathname.startsWith(item.path));

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                                    isActive
                                        ? 'bg-emerald-50 text-emerald-600 font-medium'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <div className="flex items-center space-x-3 p-3 mb-2 rounded-xl bg-slate-50">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <UserIcon className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-900 truncate">
                                {user?.full_name}
                            </div>
                            <div className="text-xs text-slate-500 truncate">
                                {user?.email}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            <div className="flex-1 ml-64 flex flex-col min-h-screen">
                <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-100">
                    <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
                        <h1 className="text-lg font-semibold text-slate-900">
                            Business Portal
                        </h1>
                        <div className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center">
                            <Bell className="w-5 h-5 text-slate-600" />
                        </div>
                    </div>
                </header>
                <main className="flex-1 p-8">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
