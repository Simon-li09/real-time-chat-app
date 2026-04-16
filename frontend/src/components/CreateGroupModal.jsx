import React, { useState, useEffect } from 'react';
import { groupService, userService } from '../services/api';

const CreateGroupModal = ({ onClose, onCreate }) => {
    const [groupName, setGroupName] = useState('');
    const [followedUsers, setFollowedUsers] = useState([]);
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadUsers = async () => {
            try {
                const response = await userService.getFollowedUsers();
                setFollowedUsers(response.data);
            } catch (err) {
                console.error('Failed to load users', err);
            } finally {
                setFetching(false);
            }
        };
        loadUsers();
    }, []);

    const toggleUser = (userId) => {
        setSelectedUserIds(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId) 
                : [...prev, userId]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!groupName.trim()) return setError('Group name is required');
        if (selectedUserIds.length === 0) return setError('Select at least one member');

        setLoading(true);
        try {
            const response = await groupService.createGroup({
                name: groupName,
                member_ids: selectedUserIds
            });
            onCreate(response.data);
            onClose();
        } catch (err) {
            setError('Failed to create group. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-600 text-white">
                    <h2 className="text-xl font-bold">New Group Chat</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {error && <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm font-medium italic mb-4">{error}</div>}

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 pl-1">Group Name</label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-black font-medium"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="Ex: Team Lunch 🍕"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 pl-1">Invite Friends</label>
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl max-h-48 overflow-y-auto overflow-x-hidden p-2">
                            {fetching ? (
                                <div className="py-8 text-center text-slate-400 text-sm">Loading contacts...</div>
                            ) : followedUsers.length === 0 ? (
                                <div className="py-8 text-center text-slate-400 text-sm italic">You don't follow anyone yet!</div>
                            ) : (
                                followedUsers.map(u => (
                                    <div 
                                        key={u.id}
                                        onClick={() => toggleUser(u.id)}
                                        className={`flex items-center p-2.5 rounded-xl transition-all cursor-pointer mb-1 group
                                            ${selectedUserIds.includes(u.id) ? 'bg-emerald-50' : 'hover:bg-white hover:shadow-sm'}
                                        `}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                                            ${selectedUserIds.includes(u.id) ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}
                                        `}>
                                            {u.username.charAt(0).toUpperCase()}
                                        </div>
                                        <span className={`ml-3 text-sm font-medium ${selectedUserIds.includes(u.id) ? 'text-emerald-700' : 'text-slate-700'}`}>
                                            {u.username}
                                        </span>
                                        {selectedUserIds.includes(u.id) && (
                                            <div className="ml-auto">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-emerald-500">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold text-sm transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-200 transition-all disabled:opacity-50 active:scale-95"
                        >
                            {loading ? 'Creating...' : 'Create Group'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateGroupModal;
