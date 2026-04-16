import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/api';
import { ArrowLeft, MessageCircle, Type, ImageIcon, Check } from 'lucide-react';

const SettingsChats = () => {
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

    const handleUpdate = async (update) => {
        setSettings({ ...settings, ...update });
        try {
            await userService.updateSettings(update);
        } catch (error) {
            console.error('Failed to update chats:', error);
            fetchSettings(); // Refresh on failure
        }
    };

    if (loading) return null;

    const wallpapers = [
        { id: 'default', color: 'bg-slate-200' },
        { id: 'emerald', color: 'bg-emerald-100' },
        { id: 'blue', color: 'bg-blue-100' },
        { id: 'purple', color: 'bg-purple-100' },
        { id: 'amber', color: 'bg-amber-100' },
        { id: 'rose', color: 'bg-rose-100' },
    ];

    const fontSizes = ['small', 'medium', 'large'];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <div className="bg-emerald-600 text-white px-4 py-6 sticky top-0 z-10 shadow-md">
                <div className="flex items-center space-x-4 max-w-2xl mx-auto">
                    <button onClick={() => navigate('/settings')} className="hover:bg-emerald-700 p-1 rounded-full transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold">Chats</h1>
                </div>
            </div>

            <div className="max-w-2xl mx-auto p-4 space-y-6">
                {/* Font Size */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6">
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
                                <Type size={20} />
                            </div>
                            <h3 className="font-semibold text-slate-800">Font Size</h3>
                        </div>
                        <div className="flex space-x-3">
                            {fontSizes.map(size => (
                                <button
                                    key={size}
                                    onClick={() => handleUpdate({ font_size: size })}
                                    className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all capitalize font-medium ${
                                        settings?.font_size === size 
                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                                        : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                                    }`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Wallpaper */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6">
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
                                <ImageIcon size={20} />
                            </div>
                            <h3 className="font-semibold text-slate-800">Chat Wallpaper</h3>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                            {wallpapers.map(wp => (
                                <button
                                    key={wp.id}
                                    onClick={() => handleUpdate({ wallpaper: wp.id })}
                                    className={`aspect-square rounded-xl relative transition-all border-2 overflow-hidden ${
                                        settings?.wallpaper === wp.id 
                                        ? 'border-emerald-500 ring-2 ring-emerald-500/20' 
                                        : 'border-transparent'
                                    }`}
                                >
                                    <div className={`w-full h-full ${wp.color} opacity-60`} />
                                    {settings?.wallpaper === wp.id && (
                                        <div className="absolute inset-0 flex items-center justify-center text-emerald-600">
                                            <Check size={20} strokeWidth={3} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsChats;
