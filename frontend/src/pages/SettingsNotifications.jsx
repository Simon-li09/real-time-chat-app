import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/api';
import { ArrowLeft, Bell, Volume2, MessageSquare, Vibrate } from 'lucide-react';

const SettingsNotifications = () => {
    const navigate = useNavigate();
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await userService.getSettings();
            setSettings(response.data);
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (key) => {
        const newValue = !settings[key];
        setSettings({ ...settings, [key]: newValue });
        try {
            await userService.updateSettings({ [key]: newValue });
        } catch (error) {
            console.error('Failed to update notifications:', error);
            setSettings({ ...settings, [key]: !newValue });
        }
    };

    if (loading) return null;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <div className="bg-emerald-600 text-white px-4 py-6 sticky top-0 z-10 shadow-md">
                <div className="flex items-center space-x-4 max-w-2xl mx-auto">
                    <button onClick={() => navigate('/settings')} className="hover:bg-emerald-700 p-1 rounded-full transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold">Notifications</h1>
                </div>
            </div>

            <div className="max-w-2xl mx-auto p-4 space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 space-y-8">
                        {/* Global Notifications */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-start space-x-4">
                                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                                    <Bell size={20} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800">Push Notifications</h3>
                                    <p className="text-sm text-slate-500">Show alerts for new messages</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleToggle('notifications')}
                                className={`w-12 h-6 rounded-full transition-all duration-300 relative ${
                                    settings?.notifications ? 'bg-emerald-500' : 'bg-slate-200'
                                }`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${
                                    settings?.notifications ? 'right-1' : 'left-1'
                                }`} />
                            </button>
                        </div>

                        {/* Sound */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-start space-x-4">
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                    <Volume2 size={20} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800">Notification Sound</h3>
                                    <p className="text-sm text-slate-500">Play sound for new messages</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleToggle('sound')}
                                className={`w-12 h-6 rounded-full transition-all duration-300 relative ${
                                    settings?.sound ? 'bg-emerald-500' : 'bg-slate-200'
                                }`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${
                                    settings?.sound ? 'right-1' : 'left-1'
                                }`} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-slate-100 rounded-xl">
                    <p className="text-[10px] text-slate-500 text-center uppercase font-bold tracking-widest">
                        Browser settings may also affect these alerts
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SettingsNotifications;
