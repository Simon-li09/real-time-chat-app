import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/api';
import { ArrowLeft, Shield, Eye, FileText, CheckCircle2 } from 'lucide-react';

const SettingsPrivacy = () => {
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
            console.error('Failed to update privacy:', error);
            // Revert on failure
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
                    <h1 className="text-xl font-bold">Privacy</h1>
                </div>
            </div>

            <div className="max-w-2xl mx-auto p-4 space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 space-y-8">
                        {/* Last Seen */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-start space-x-4">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <Eye size={20} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800">Last Seen</h3>
                                    <p className="text-sm text-slate-500">Show when you were last online</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleToggle('last_seen')}
                                className={`w-12 h-6 rounded-full transition-all duration-300 relative ${
                                    settings?.last_seen ? 'bg-emerald-500' : 'bg-slate-200'
                                }`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${
                                    settings?.last_seen ? 'right-1' : 'left-1'
                                }`} />
                            </button>
                        </div>

                        {/* Read Receipts */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-start space-x-4">
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                    <CheckCircle2 size={20} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800">Read Receipts</h3>
                                    <p className="text-sm text-slate-500">Show blue ticks when messages are read</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleToggle('read_receipts')}
                                className={`w-12 h-6 rounded-full transition-all duration-300 relative ${
                                    settings?.read_receipts ? 'bg-emerald-500' : 'bg-slate-200'
                                }`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${
                                    settings?.read_receipts ? 'right-1' : 'left-1'
                                }`} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                    <p className="text-xs text-emerald-700 leading-relaxed font-medium">
                        If you turn off last seen and read receipts, you won't be able to see other people's last seen and read receipts either.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SettingsPrivacy;
