import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    User, Shield, MessageCircle, Bell, 
    HardDrive, LogOut, ChevronRight, ArrowLeft 
} from 'lucide-react';

const Settings = () => {
    const navigate = useNavigate();

    const menuItems = [
        { id: 'profile', icon: <User size={20} />, title: 'Profile', desc: 'Name, About, Profile Photo', path: '/settings/profile' },
        { id: 'privacy', icon: <Shield size={20} />, title: 'Privacy', desc: 'Last seen, Read receipts', path: '/settings/privacy' },
        { id: 'chats', icon: <MessageCircle size={20} />, title: 'Chats', desc: 'Wallpaper, Font size', path: '/settings/chats' },
        { id: 'notifications', icon: <Bell size={20} />, title: 'Notifications', desc: 'Sound, Message alerts', path: '/settings/notifications' },
        { id: 'storage', icon: <HardDrive size={20} />, title: 'Storage', desc: 'Media size, Clear data', path: '/settings/storage' },
    ];

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            {/* Header */}
            <div className="bg-emerald-600 text-white px-4 py-6 sticky top-0 z-10 shadow-md">
                <div className="flex items-center space-x-4 max-w-2xl mx-auto">
                    <button onClick={() => navigate('/chat')} className="hover:bg-emerald-700 p-1 rounded-full transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold">Settings</h1>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-2xl mx-auto p-4 space-y-4">
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
                    {menuItems.map((item, index) => (
                        <button
                            key={item.id}
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors ${
                                index !== menuItems.length - 1 ? 'border-b border-slate-100' : ''
                            }`}
                        >
                            <div className="flex items-center space-x-4">
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                    {item.icon}
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold text-slate-800">{item.title}</h3>
                                    <p className="text-sm text-slate-500">{item.desc}</p>
                                </div>
                            </div>
                            <ChevronRight className="text-slate-300" size={20} />
                        </button>
                    ))}
                </div>

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-4 p-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-colors shadow-sm"
                >
                    <div className="p-2 bg-red-100 rounded-lg">
                        <LogOut size={20} />
                    </div>
                    <span className="font-bold">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Settings;
