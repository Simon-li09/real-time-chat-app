import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { statusService } from '../services/api';
import { 
    ArrowLeft, Plus, Camera, X, Check, 
    MoreVertical, Play, Image as ImageIcon 
} from 'lucide-react';

const Status = () => {
    const navigate = useNavigate();
    const [statuses, setStatuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [caption, setCaption] = useState('');
    const fileInputRef = useRef(null);

    const currentUser = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        fetchStatuses();
    }, []);

    const fetchStatuses = async () => {
        try {
            const response = await statusService.fetchStatuses();
            setStatuses(response.data);
        } catch (error) {
            console.error('Failed to fetch statuses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('media', file);
        formData.append('caption', caption);

        setUploading(true);
        try {
            await statusService.createStatus(formData);
            fetchStatuses();
            setCaption('');
        } catch (error) {
            console.error('Failed to post status:', error);
            alert('Failed to post status');
        } finally {
            setUploading(false);
        }
    };

    // Group statuses by user
    const groupedStatuses = statuses.reduce((acc, status) => {
        if (!acc[status.user]) {
            acc[status.user] = {
                username: status.username,
                avatar: status.user_avatar,
                items: []
            };
        }
        acc[status.user].items.push(status);
        return acc;
    }, {});

    const myStatuses = groupedStatuses[currentUser?.id] || null;
    const otherStatuses = Object.entries(groupedStatuses)
        .filter(([id]) => parseInt(id) !== currentUser?.id)
        .map(([id, data]) => ({ id, ...data }));

    return (
        <div className="min-h-screen bg-slate-900 text-white overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-white/10 bg-slate-900/50 backdrop-blur-lg">
                <div className="flex items-center space-x-4">
                    <button onClick={() => navigate('/chat')} className="hover:bg-white/10 p-2 rounded-full transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold">Status</h1>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto w-full max-w-2xl mx-auto custom-scrollbar p-4 space-y-6">
                {/* My Status */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">My Status</h3>
                    <div className="flex items-center space-x-4 p-3 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all cursor-pointer">
                        <div className="relative" onClick={() => myStatuses && setSelectedStatus(myStatuses.items[0])}>
                            <div className={`w-14 h-14 rounded-full border-2 p-0.5 ${myStatuses ? 'border-emerald-500' : 'border-slate-600 border-dashed'}`}>
                                {currentUser?.profile_picture ? (
                                    <img 
                                        src={currentUser.profile_picture.startsWith('http') ? currentUser.profile_picture : `http://127.0.0.1:8000${currentUser.profile_picture}`} 
                                        className="w-full h-full rounded-full object-cover" 
                                        alt="Me"
                                    />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                                        <Plus size={24} />
                                    </div>
                                )}
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); fileInputRef.current.click(); }}
                                className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 text-white rounded-full border-2 border-slate-900 shadow-xl"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                        <div className="flex-1" onClick={() => myStatuses && setSelectedStatus(myStatuses.items[0])}>
                            <h4 className="font-bold">My Status</h4>
                            <p className="text-sm text-slate-400">
                                {myStatuses ? `Tap to view ${myStatuses.items.length} updates` : 'Tap to add a new update'}
                            </p>
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*,video/*"
                            onChange={handleFileChange}
                        />
                    </div>
                </div>

                {/* Others Statuses */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Recent Updates</h3>
                    {otherStatuses.length === 0 ? (
                        <div className="py-12 text-center opacity-30 italic">
                            <ImageIcon size={48} className="mx-auto mb-4" />
                            <p>No status updates from your contacts yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {otherStatuses.map(userStatus => (
                                <div 
                                    key={userStatus.id}
                                    onClick={() => setSelectedStatus(userStatus.items[0])}
                                    className="flex items-center space-x-4 p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer"
                                >
                                    <div className="w-14 h-14 rounded-full border-2 border-emerald-500 p-0.5">
                                        <img 
                                            src={userStatus.avatar ? (userStatus.avatar.startsWith('http') ? userStatus.avatar : `http://127.0.0.1:8000${userStatus.avatar}`) : '/placeholder.png'} 
                                            className="w-full h-full rounded-full object-cover"
                                            alt={userStatus.username}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold">{userStatus.username}</h4>
                                        <p className="text-sm text-slate-400">{new Date(userStatus.items[0].created_at).toLocaleTimeString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Status Viewer Overlay */}
            {selectedStatus && (
                <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center animate-in fade-in duration-300">
                    {/* Progress Bar */}
                    <div className="absolute top-4 left-4 right-4 flex space-x-1">
                        <div className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                            <div className="h-full bg-white animate-shrink-width duration-[5000ms] ease-linear" onAnimationEnd={() => setSelectedStatus(null)} />
                        </div>
                    </div>

                    <button 
                        onClick={() => setSelectedStatus(null)}
                        className="absolute top-8 right-8 p-2 bg-black/50 text-white rounded-full z-10 hover:bg-black/70 transition-colors"
                    >
                        <X size={24} />
                    </button>

                    <div className="relative w-full h-full max-w-4xl flex items-center justify-center">
                        {/* Media Display */}
                        {selectedStatus.media.toLowerCase().match(/\.(mp4|webm|ogg)$/) ? (
                            <video 
                                src={selectedStatus.media.startsWith('http') ? selectedStatus.media : `http://127.0.0.1:8000${selectedStatus.media}`} 
                                autoPlay 
                                className="max-w-full max-h-full"
                            />
                        ) : (
                            <img 
                                src={selectedStatus.media.startsWith('http') ? selectedStatus.media : `http://127.0.0.1:8000${selectedStatus.media}`} 
                                className="max-w-full max-h-full object-contain"
                                alt="Status content"
                            />
                        )}
                        
                        {/* Caption */}
                        {selectedStatus.caption && (
                            <div className="absolute bottom-12 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent text-center">
                                <p className="text-lg font-medium">{selectedStatus.caption}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {uploading && (
                <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center space-y-4">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="font-bold animate-pulse">Posting Status...</p>
                </div>
            )}
        </div>
    );
};

export default Status;
