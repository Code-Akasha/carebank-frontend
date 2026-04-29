import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    WalletCards,
    LineChart,
    MessageSquare,
    Workflow,
    LogOut,
    User as UserIcon,
    ShoppingBag,
    PieChart,
    Target,
    Receipt,
    Bell
} from 'lucide-react';
import { api } from '../lib/api';

interface NotificationItem {
    id: number;
    title: string;
    body: string;
    read_at: string | null;
    created_at: string | null;
}

export default function UserLayout() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notificationsError, setNotificationsError] = useState<string | null>(null);
    const [notificationsLoading, setNotificationsLoading] = useState(false);

    const unreadCount = useMemo(
        () => notifications.filter((item) => !item.read_at).length,
        [notifications]
    );

    const fetchNotifications = async (silent = false) => {
        if (!silent) {
            setNotificationsLoading(true);
        }
        setNotificationsError(null);
        try {
            const response = await api.get('/api/notifications', {
                params: { limit: 12 },
            });
            setNotifications(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            setNotificationsError('Unable to load notifications.');
        } finally {
            if (!silent) {
                setNotificationsLoading(false);
            }
        }
    };

    const markNotificationRead = async (notificationId: number) => {
        try {
            await api.patch(`/api/notifications/${notificationId}`, { read: true });
            setNotifications((prev) => prev.map((item) => (
                item.id === notificationId
                    ? { ...item, read_at: new Date().toISOString() }
                    : item
            )));
        } catch (err) {
            setNotificationsError('Failed to update notification.');
        }
    };

    useEffect(() => {
        fetchNotifications(true);
    }, []);

    useEffect(() => {
        if (notificationsOpen) {
            fetchNotifications();
        }
    }, [notificationsOpen]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/accounts', label: 'Accounts', icon: WalletCards },
        { path: '/analytics', label: 'Analytics', icon: PieChart },
        { path: '/planning', label: 'Planning', icon: Target },
        { path: '/bills', label: 'Bill Discovery', icon: Receipt },
        { path: '/simulator', label: 'Simulator', icon: LineChart },
        { path: '/products', label: 'Products', icon: ShoppingBag },
        { path: '/chat', label: 'Agent Chat', icon: MessageSquare },
        { path: '/integration', label: 'Integration Lab', icon: Workflow },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full z-20">
                <div className="h-16 flex items-center px-6 border-b border-slate-100">
                    <div className="font-bold text-xl text-blue-600 tracking-tight">CareBank</div>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${isActive
                                    ? 'bg-blue-50 text-blue-600 font-medium'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <div className="flex items-center space-x-3 p-3 mb-2 rounded-xl bg-slate-50">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <UserIcon className="w-5 h-5 text-blue-600" />
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

            {/* Main Content Area */}
            <div className="flex-1 ml-64 flex flex-col min-h-screen">
                <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-100">
                    <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-end">
                        <div className="relative">
                            <button
                                onClick={() => setNotificationsOpen((prev) => !prev)}
                                className="relative w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50"
                                aria-label="Notifications"
                            >
                                <Bell className="w-5 h-5 text-slate-600" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-rose-600 text-white text-[10px] font-semibold flex items-center justify-center px-1">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {notificationsOpen && (
                                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                                        <div>
                                            <div className="text-sm font-semibold text-slate-900">Notifications</div>
                                            <div className="text-xs text-slate-500">{unreadCount} unread</div>
                                        </div>
                                        <button
                                            onClick={() => fetchNotifications()}
                                            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                                        >
                                            Refresh
                                        </button>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto">
                                        {notificationsLoading && (
                                            <div className="px-4 py-3 text-sm text-slate-500">Loading...</div>
                                        )}
                                        {notificationsError && (
                                            <div className="px-4 py-3 text-sm text-rose-600">{notificationsError}</div>
                                        )}
                                        {!notificationsLoading && notifications.length === 0 && (
                                            <div className="px-4 py-6 text-sm text-slate-500">No notifications yet.</div>
                                        )}
                                        {notifications.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => markNotificationRead(item.id)}
                                                className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 ${item.read_at ? 'bg-white' : 'bg-blue-50/40'}`}
                                            >
                                                <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                                                <div className="text-xs text-slate-500 mt-1 line-clamp-2">{item.body}</div>
                                                <div className="text-[10px] text-slate-400 mt-2">
                                                    {item.created_at ? new Date(item.created_at).toLocaleString() : 'Just now'}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
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
