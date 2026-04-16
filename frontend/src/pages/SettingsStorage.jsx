import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HardDrive, Trash2, PieChart, Database } from 'lucide-react';

const SettingsStorage = () => {
    const navigate = useNavigate();
    const [mediaSize, setMediaSize] = useState('0.0');
    const [clearing, setClearing] = useState(false);

    useEffect(() => {
        // Random usage for MVP demo
        setMediaSize((Math.random() * 50).toFixed(1));
    }, []);

    const handleClearMedia = () => {
        setClearing(true);
        setTimeout(() => {
            setMediaSize('0.0');
            setClearing(false);
            alert('Media cache cleared!');
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <div className="bg-emerald-600 text-white px-4 py-6 sticky top-0 z-10 shadow-md">
                <div className="flex items-center space-x-4 max-w-2xl mx-auto">
                    <button onClick={() => navigate('/settings')} className="hover:bg-emerald-700 p-1 rounded-full transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold">Storage</h1>
                </div>
            </div>

            <div className="max-w-2xl mx-auto p-4 space-y-6">
                {/* Storage usage */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-8 text-center space-y-4">
                        <div className="mx-auto w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                            <PieChart size={40} />
                        </div>
                        <div>
                            <h2 className="text-4xl font-black text-slate-800">{mediaSize} MB</h2>
                            <p className="text-slate-500 font-medium">Used in RealTime Chat</p>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div 
                                className="bg-emerald-500 h-full transition-all duration-1000" 
                                style={{ width: `${Math.min(100, (parseFloat(mediaSize)/50)*100)}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-4">
                    <button
                        onClick={handleClearMedia}
                        disabled={clearing}
                        className="w-full bg-white border border-slate-200 text-slate-700 p-5 rounded-2xl flex items-center justify-between hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
                    >
                        <div className="flex items-center space-x-4">
                            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                                <Trash2 size={20} />
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold">Clear Media Cache</h3>
                                <p className="text-xs text-slate-500">Free up space by deleting cached images and voice notes</p>
                            </div>
                        </div>
                        {clearing && <span className="text-xs font-bold text-emerald-600 animate-pulse">Clearing...</span>}
                    </button>

                    <div className="flex items-center space-x-3 p-4 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
                        <Database size={16} />
                        <p className="text-xs font-medium">Messages are stored locally for instant access.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsStorage;
