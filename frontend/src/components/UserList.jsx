import React, { useState, useEffect } from 'react';
import { userService } from '../services/api';

const UserList = ({ users, onlineUsers, onSelectUser, selectedUserId, onFollowToggle }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchError, setSearchError] = useState('');
    const [isSearching, setIsSearching] = useState(false);


    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchQuery.trim().length >= 2) {
                performGlobalSearch(searchQuery);
            } else {
                setSearchResults([]);
                setSearchError('');
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const performGlobalSearch = async (query) => {
        setSearchError('');
        setIsSearching(true);
        console.log('DEBUG: Performing Global Search for:', query);
        try {
            const response = await userService.searchUsers(query);
            console.log('DEBUG: Global Search Results:', response.data);
            setSearchResults(response.data);
            if (response.data.length === 0) {
                setSearchError('No new users found');
            }
        } catch (err) {
            const status = err.response?.status;
            const detail = err.response?.data?.detail || err.message;
            setSearchError(`Search failed: ${status || 'Network Error'} (${detail})`);
            console.error('DEBUG: Global Search Error:', err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleFollowClick = async (userId) => {
        try {
            await userService.followUser(userId);
            if (onFollowToggle) onFollowToggle();
            // Optional: don't clear results, just let the followed list refresh
            // But let's clear found user to give visual feedback that search is "done"
            setSearchResults(prev => prev.filter(u => u.id !== userId));
            if (searchResults.length <= 1) setSearchQuery('');
        } catch (err) {
            console.error('Failed to follow user');
        }
    };

    const filteredChats = users.filter(u => {
        const name = u.username || u.name || '';
        return name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header Section */}
            <div className="p-4 flex justify-between items-center bg-white">
                <h2 className="text-xl font-black text-emerald-600 tracking-tight">Chats</h2>
                <div className="flex space-x-2">
                    <button 
                        onClick={() => window.location.href = '/status'}
                        className="p-2.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-slate-100 shadow-sm"
                        title="Status"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                        </svg>
                    </button>
                    <button 
                        onClick={() => window.location.href = '/settings'}
                        className="p-2.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-slate-100 shadow-sm"
                        title="Settings"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Unified Search Section */}
            <div className="p-4 pt-0 border-b border-slate-100 bg-slate-50/50">
                <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Search names or find new people..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-black font-medium shadow-sm"
                        />
                        {searchQuery && (
                            <button 
                                type="button"
                                onClick={() => { setSearchQuery(''); setSearchResults([]); setSearchError(''); }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                </svg>
                            </button>
                        )}
                    </div>
                    <div 
                        className="p-2.5 bg-slate-100 text-slate-400 rounded-xl transition-all flex items-center justify-center min-w-[44px]"
                        title="Searching..."
                    >
                        {isSearching ? (
                            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                        )}
                    </div>
                </form>

                {searchError && <p className="text-red-500 text-[10px] mt-2 font-bold px-1 uppercase tracking-tight">{searchError}</p>}
                
                {/* Global Search Results Section */}
                {searchResults.length > 0 && (
                    <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Global Results</h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                            {searchResults.map(result => (
                                <div key={result.id} className="p-2.5 bg-white border border-emerald-100 rounded-xl flex justify-between items-center transition-all hover:shadow-md ring-1 ring-emerald-50/50">
                                    <div className="flex items-center min-w-0">
                                        <div className="w-8 h-8 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0 animate-pulse">
                                            {result.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-bold text-black truncate">{result.username}</span>
                                            <span className="text-[10px] text-slate-400 truncate">Tap to follow</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleFollowClick(result.id)}
                                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all shadow-sm active:scale-95"
                                    >
                                        Follow
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Chat List Section */}
            <div className="flex-1 overflow-y-auto w-full custom-scrollbar">
                <div className="px-4 py-3 bg-white sticky top-0 z-10">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {searchQuery ? `Matching Chats (${filteredChats.length})` : 'Your Conversations'}
                    </h3>
                </div>
                {filteredChats.length === 0 ? (
                    <div className="p-10 flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-slate-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                            </svg>
                        </div>
                        <p className="text-sm text-slate-500 italic">No matches found.<br/>Try searching globally above!</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-50">
                        {filteredChats.map(user => {
                            const isSelected = selectedUserId === user.id;
                            const isOnline = onlineUsers.includes(user.id.toString());
                            
                            return (
                                <li
                                    key={user.id}
                                    onClick={() => onSelectUser(user)}
                                    className={`
                                        p-4 cursor-pointer transition-all flex items-center group relative
                                        ${isSelected 
                                            ? 'bg-emerald-50/50 border-l-4 border-l-emerald-500' 
                                            : 'hover:bg-slate-50 border-l-4 border-l-transparent'}
                                    `}
                                >
                                    <div className="relative mr-3 text-black">
                                        {user.is_group ? (
                                            <div className="w-11 h-11 rounded-2xl bg-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                                {user.name?.charAt(0).toUpperCase()}
                                            </div>
                                        ) : user.profile_picture ? (
                                            <img src={user.profile_picture} alt={user.username} className="w-11 h-11 rounded-full object-cover shadow-sm" />
                                        ) : (
                                            <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg shadow-sm
                                                ${isSelected ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'}
                                            `}>
                                                {user.username?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        {user.is_group && (
                                            <div className="absolute -top-1 -right-1 bg-indigo-600 text-[8px] font-black text-white px-1 py-0.5 rounded border border-white uppercase tracking-tighter">GRP</div>
                                        )}
                                        {isOnline && (
                                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm"></div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <h3 className={`text-sm font-black truncate ${isSelected ? 'text-emerald-900' : 'text-black'}`}>
                                                {user.is_group ? user.name : user.username}
                                            </h3>
                                            {user.last_message && (
                                                <span className="text-[10px] text-slate-400 ml-2">
                                                    {new Date(user.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs text-slate-500 truncate mr-2 flex-1">
                                                {user.is_followed_by && !user.is_following ? (
                                                    <span className="text-emerald-600 font-bold">Follows you</span>
                                                ) : user.last_message ? (
                                                    user.last_message.text
                                                ) : (
                                                    isOnline ? 'Online' : 'Offline'
                                                )}
                                            </p>
                                            
                                            {user.is_followed_by && !user.is_following && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleFollowClick(user.id);
                                                    }}
                                                    className="px-2 py-1 bg-emerald-500 text-white text-[9px] font-black uppercase rounded shadow-sm hover:bg-emerald-600 transition-all"
                                                >
                                                    Follow Back
                                                </button>
                                            )}

                                            {user.unread_count > 0 && !(!user.is_following && user.is_followed_by) && (
                                                <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow-sm">
                                                    {user.unread_count}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default UserList;
