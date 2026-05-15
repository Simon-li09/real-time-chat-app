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



    const filteredChats = users.filter(u => {
        const name = u.username || u.name || '';
        return name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <aside className="flex h-full w-full flex-col border-r border-gray-100 md:w-96 bg-white text-slate-800 antialiased">
            <header className="flex items-center justify-between px-6 py-4">
                <h1 className="text-2xl font-bold text-emerald-600">Chats</h1>
                <div className="flex gap-4 text-emerald-600">
                    <button className="p-1 hover:bg-emerald-50 rounded-full">🔍</button>
                    <button className="p-1 hover:bg-emerald-50 rounded-full" onClick={() => window.location.href = '/settings'}>⚙️</button>
                </div>
            </header>

            <div className="px-6 py-2 relative">
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search names or find users" 
                    className="w-full rounded-xl bg-gray-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                {isSearching && (
                    <div className="absolute inset-y-0 right-8 flex items-center pointer-events-none">
                        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
                {searchError && <p className="text-red-500 text-[10px] mt-2 font-bold px-1 uppercase tracking-tight">{searchError}</p>}
            </div>

            {!searchQuery && (
                <div className="flex items-center gap-4 px-6 py-6 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => window.location.href = '/status'}>
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-gray-300 text-2xl text-gray-400">
                        +
                    </div>
                    <span className="font-medium text-gray-700">My Status</span>
                </div>
            )}

            <div className="px-6 py-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {searchQuery ? `MATCHING CHATS (${filteredChats.length})` : 'Your Conversations'}
                </p>
            </div>

            <div className="flex-1 overflow-y-auto">
                {searchResults.length > 0 && (
                    <div className="mb-4">
                        <h3 className="text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-2 px-6">Global Results</h3>
                        <div className="divide-y divide-slate-50">
                            {searchResults.map(result => (
                                <div
                                    key={result.id}
                                    onClick={() => onSelectUser(result)}
                                    className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-gray-50 cursor-pointer"
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 font-bold text-emerald-600 flex-shrink-0">
                                        {result.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold capitalize text-gray-900">{result.username}</h3>
                                    </div>
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                                        Chat
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}


                {filteredChats.length === 0 && searchResults.length === 0 ? (
                    <div className="p-10 flex flex-col items-center justify-center text-center opacity-50">
                        <p className="text-sm text-slate-500">No conversations yet.</p>
                    </div>
                ) : (
                    <div>
                        {filteredChats.map(user => {
                            const isSelected = selectedUserId === user.id;
                            const isOnline = onlineUsers.includes(user.id.toString());
                            
                            return (
                                <div 
                                    key={user.id}
                                    onClick={() => onSelectUser(user)}
                                    className={`flex items-center gap-4 px-6 py-4 transition-colors cursor-pointer ${isSelected ? 'bg-emerald-50/50 hover:bg-emerald-50' : 'hover:bg-gray-50'}`}
                                >
                                    {user.is_group ? (
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700 relative flex-shrink-0">
                                            {user.name?.charAt(0).toUpperCase()}
                                            {isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>}
                                        </div>
                                    ) : user.profile_picture ? (
                                        <div className="relative flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-full">
                                            <img src={user.profile_picture} alt={user.username} className="h-12 w-12 rounded-full object-cover" />
                                            {isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>}
                                        </div>
                                    ) : (
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700 relative flex-shrink-0">
                                            {user.username?.charAt(0).toUpperCase()}
                                            {isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-bold capitalize text-gray-900 truncate pr-2">
                                                {user.is_group ? user.name : user.username}
                                            </h3>
                                            {user.last_message && (
                                                <span className="text-xs text-gray-400 flex-shrink-0">
                                                    {new Date(user.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-gray-500 truncate pr-2 flex-1">
                                                {user.last_message ? (
                                                    user.last_message.text
                                                ) : (
                                                    'Tap to chat'
                                                )}
                                            </p>


                                            {user.unread_count > 0 && (
                                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] text-white flex-shrink-0">
                                                    {user.unread_count}
                                                </span>
                                            )}


                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <nav className="flex justify-around border-t border-gray-100 py-3 text-center text-xs text-gray-400 mt-auto">
                <div className="text-emerald-600 cursor-pointer">
                    <div className="text-lg">💬</div>
                    <span className="font-medium">Chats</span>
                </div>
                <div className="cursor-pointer hover:text-gray-600 transition-colors">
                    <div className="text-lg">⭐</div>
                    <span>Starred</span>
                </div>
                <div onClick={() => window.location.href = '/settings'} className="cursor-pointer hover:text-gray-600 transition-colors">
                    <div className="text-lg">⚙️</div>
                    <span>Settings</span>
                </div>
            </nav>
        </aside>
    );
};

export default UserList;
