import React, { useState, useEffect } from 'react';
import { statusService } from '../services/api';

const StatusTray = ({ onSelectStatus }) => {
    const [statuses, setStatuses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStatuses();
    }, []);

    const loadStatuses = async () => {
        try {
            const res = await statusService.fetchStatuses();
            const responseData = Array.isArray(res.data) ? res.data : [];
            // Group statuses by user
            const grouped = responseData.reduce((acc, status) => {
                const userId = status.user?.id || status.user;
                if (!userId) return acc;
                
                if (!acc[userId]) {
                    acc[userId] = {
                        username: status.username,
                        avatar: status.user_avatar,
                        items: []
                    };
                }
                acc[userId].items.push(status);
                return acc;
            }, {});
            setStatuses(Object.values(grouped));
        } catch (err) {
            console.error('Failed to load statuses', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('media', file);
        try {
            await statusService.createStatus(formData);
            loadStatuses(); // Refresh
        } catch (err) {
            console.error('Failed to upload status', err);
        }
    };

    if (loading) return null;

    return (
        <div className="flex space-x-4 p-4 overflow-x-auto no-scrollbar bg-white border-b border-slate-100 min-h-[100px] items-center">
            {/* Add Status Button */}
            <label className="flex-shrink-0 cursor-pointer group">
                <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center group-hover:border-emerald-500 group-hover:bg-emerald-50 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 text-slate-400 group-hover:text-emerald-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </div>
                </div>
                <p className="text-[10px] font-bold text-slate-500 mt-1.5 text-center uppercase tracking-tighter">My Status</p>
                <input type="file" className="hidden" onChange={handleFileChange} accept="image/*,video/*" />
            </label>

            {statuses.map((group, i) => (
                <div 
                    key={i} 
                    className="flex-shrink-0 cursor-pointer group"
                    onClick={() => onSelectStatus(group.items)}
                >
                    <div className="relative p-0.5 rounded-full border-2 border-emerald-500 group-hover:scale-105 transition-transform">
                        {group.avatar ? (
                            <img src={group.avatar} alt={group.username} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-lg border-2 border-white shadow-sm">
                                {group.username?.charAt(0).toUpperCase() || '?'}
                            </div>
                        )}
                        {/* More than one story indicator */}
                        {group.items.length > 1 && (
                            <div className="absolute -top-1 -right-1 bg-emerald-600 text-[8px] text-white px-1 rounded-full border border-white font-black">{group.items.length}</div>
                        )}
                    </div>
                    <p className="text-[10px] font-bold text-slate-700 mt-1.5 text-center truncate w-14 tracking-tight">
                        {group.username}
                    </p>
                </div>
            ))}
        </div>
    );
};

export default StatusTray;
