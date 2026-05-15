import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { userService } from '../services/api';

const ChatSidebar = ({
  chats,
  onlineUsers,
  selectedUserId,
  onSelectUser,
  isOpen,
  onClose,
  onOpenStatus,
  onOpenSettings,
  onOpenCallHistory,
  onFollowClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchError('');
      return;
    }

    const timeout = setTimeout(async () => {
      setIsSearching(true);
      setSearchError('');
      try {
        const response = await userService.searchUsers(searchQuery.trim());
        setSearchResults(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        setSearchError('Search unavailable.');
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const results = searchQuery.trim() ? searchResults : chats;

  return (
    <AnimatePresence>
      {(isOpen || window.innerWidth >= 768) && (
        <motion.aside
          initial={{ x: -320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -320, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          className="fixed inset-y-0 left-0 z-40 w-full max-w-sm border-r border-slate-200 bg-white/95 backdrop-blur-xl shadow-2xl md:static md:translate-x-0 md:w-[400px] lg:w-[450px] md:max-w-none md:shadow-none"
        >
          <div className="flex h-full flex-col overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 bg-white/90 backdrop-blur">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">Chats</p>
                <h2 className="text-xl font-semibold text-slate-900">Conversations</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenStatus}
                  className="rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-200"
                >Status</button>
                <button
                  onClick={onOpenSettings}
                  className="hidden rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-200 md:inline-flex"
                >Settings</button>
                <button
                  onClick={onClose}
                  className="rounded-full bg-slate-100 p-2 text-slate-700 transition hover:bg-slate-200 md:hidden"
                  aria-label="Close sidebar"
                >✕</button>
              </div>
            </div>

            <div className="p-4">
              <div className="relative">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chats or users"
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                {isSearching && (
                  <div className="absolute inset-y-0 right-4 flex items-center text-emerald-600">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                  </div>
                )}
              </div>
              {searchError && <p className="mt-2 text-xs text-red-500">{searchError}</p>}
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-24 md:pb-6">
              <div className="mb-4 rounded-3xl bg-emerald-50 px-4 py-3 text-sm text-slate-700 shadow-sm">
                <p className="font-semibold">Quick actions</p>
                <p className="mt-1 text-xs text-slate-500">Tap a conversation to start chatting.</p>
              </div>

              {results.length === 0 ? (
                <div className="rounded-3xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500 shadow-sm">
                  No chats found. Try another search.
                </div>
              ) : (
                <div className="space-y-3">
                  {results.map((chat) => {
                    const id = chat.id;
                    const name = chat.is_group ? chat.name : chat.username;
                    const lastMessage = chat.last_message?.message_text || chat.last_message?.text || 'Tap to start chatting';
                    const time = chat.last_message?.created_at ? new Date(chat.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                    const unread = chat.unread_count || 0;
                    const isSelected = String(selectedUserId) === String(id);
                    const isOnline = onlineUsers.includes(String(id));

                    return (
                      <div
                        key={`chat-${id}`}
                        onClick={() => onSelectUser(chat)}
                        className={`group flex w-full cursor-pointer items-start gap-3 rounded-3xl px-4 py-3 text-left transition ${
                          isSelected ? 'bg-emerald-50 shadow-sm' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-3xl bg-emerald-100 text-xl font-bold text-emerald-700">
                          {name?.charAt(0).toUpperCase()}
                          {isOnline && <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="truncate text-sm font-semibold text-slate-900">{name}</h3>
                            {time && <span className="text-[11px] text-slate-400">{time}</span>}
                          </div>
                          
                          {chat.is_followed_by && !chat.is_following && !chat.is_group ? (
                            <div className="mt-1 flex items-center justify-between gap-2">
                              <p className="truncate text-sm text-emerald-600">{name} followed you</p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onFollowClick && onFollowClick(chat.id);
                                }}
                                className="rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-emerald-700 shadow-sm"
                              >
                                Follow back
                              </button>
                            </div>
                          ) : !chat.is_followed_by && !chat.is_following && !chat.is_group ? (
                            <div className="mt-1 flex items-center justify-between gap-2">
                              <p className="truncate text-sm text-slate-500">{lastMessage}</p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onFollowClick && onFollowClick(chat.id);
                                }}
                                className="rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-emerald-700 shadow-sm"
                              >
                                Follow
                              </button>
                            </div>
                          ) : (
                            <p className="mt-1 truncate text-sm text-slate-500">{lastMessage}</p>
                          )}
                          <div className="mt-3 flex items-center justify-between gap-3">
                            <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{chat.is_group ? 'Group' : 'Direct'}</span>
                            {unread > 0 && (
                              <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-emerald-600 px-2 text-[11px] font-semibold text-white">
                                {unread > 9 ? '9+' : unread}
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

            <div className="sticky bottom-0 border-t border-slate-200 bg-white/90 px-4 py-4 backdrop-blur md:hidden">
              <div className="grid grid-cols-3 gap-2">
                <button onClick={onOpenStatus} className="rounded-3xl bg-slate-100 px-3 py-3 text-sm font-semibold text-slate-700">Status</button>
                <button onClick={onOpenCallHistory} className="rounded-3xl bg-slate-100 px-3 py-3 text-sm font-semibold text-slate-700">Calls</button>
                <button onClick={onOpenSettings} className="rounded-3xl bg-slate-100 px-3 py-3 text-sm font-semibold text-slate-700">Settings</button>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default ChatSidebar;
