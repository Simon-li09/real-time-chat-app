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
  const [activeFilter, setActiveFilter] = useState('All');

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
          className="fixed inset-y-0 left-0 z-40 flex w-full max-w-sm border-r border-slate-200 bg-[#f0f2f5] md:static md:translate-x-0 md:w-[450px] md:max-w-none md:shadow-none"
        >
          {/* WhatsApp Vertical Icon Bar (Desktop Only) */}
          <div className="hidden w-16 flex-col items-center border-r border-slate-200 bg-[#eae6df] py-4 md:flex">
            <div className="flex flex-col gap-6 text-slate-600">
              <button className="text-xl hover:text-slate-900 transition" title="Chats">💬</button>
              <button onClick={onOpenCallHistory} className="text-xl hover:text-slate-900 transition" title="Calls">📞</button>
              <button onClick={onOpenStatus} className="text-xl hover:text-slate-900 transition" title="Status">⭕</button>
              <button className="text-xl hover:text-slate-900 transition" title="Communities">👥</button>
              <button onClick={onOpenSettings} className="text-xl hover:text-slate-900 transition" title="Settings">⚙️</button>
            </div>
            <button className="mt-auto text-xl hover:text-slate-900 transition" onClick={onOpenSettings} title="Profile">👤</button>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden bg-white">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between px-4 py-3">
              <h2 className="text-xl font-bold text-slate-800">Chats</h2>
              <div className="flex items-center gap-4 text-slate-500">
                <button className="text-lg">➕</button>
                <button className="text-lg">⋮</button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="px-3 py-2">
              <div className="relative mb-3">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search or start new chat"
                  className="w-full rounded-lg bg-[#f0f2f5] px-10 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-500"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
              </div>
              
              <div className="flex gap-2 pb-1 overflow-x-auto">
                {['All', 'Unread', 'Favorites', 'Groups'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition ${
                      activeFilter === filter ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {results.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-slate-400">
                  No chats found.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {results.map((chat) => {
                    const id = chat.id;
                    const name = chat.is_group ? chat.name : chat.username;
                    
                    let lastMessage = 'Tap to start chatting';
                    if (chat.last_message) {
                      if (chat.last_message.message_type === 'voice') lastMessage = '🎤 Voice Note';
                      else if (chat.last_message.message_type === 'image') lastMessage = '📷 Photo';
                      else lastMessage = chat.last_message.message_text || chat.last_message.text || lastMessage;
                    }

                    const time = chat.last_message?.created_at ? new Date(chat.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                    const unread = chat.unread_count || 0;
                    const isSelected = String(selectedUserId) === String(id);
                    const isOnline = onlineUsers.includes(String(id));

                    return (
                      <div
                        key={`chat-${id}`}
                        onClick={() => onSelectUser(chat)}
                        className={`group flex w-full cursor-pointer items-center gap-3 px-3 py-3 transition ${
                          isSelected ? 'bg-[#f0f2f5]' : 'hover:bg-[#f5f6f6]'
                        }`}
                      >
                        <div className="relative h-12 w-12 flex-shrink-0">
                          <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-200 text-lg font-bold text-slate-400">
                            {name?.charAt(0).toUpperCase()}
                          </div>
                          {isOnline && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />}
                        </div>
                        <div className="flex-1 min-w-0 border-b border-slate-100 pb-2 group-last:border-none">
                          <div className="flex items-center justify-between">
                            <h3 className="truncate text-base font-normal text-slate-900">{name}</h3>
                            <span className={`text-[11px] ${unread > 0 ? 'text-emerald-500 font-semibold' : 'text-slate-500'}`}>{time}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-0.5">
                            <p className="truncate text-sm text-slate-500 flex-1">{lastMessage}</p>
                            {unread > 0 && (
                              <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold text-white">
                                {unread}
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

            {/* Mobile Bottom Navigation */}
            <div className="sticky bottom-0 border-t border-slate-200 bg-white px-4 py-3 md:hidden">
              <div className="grid grid-cols-4 gap-2 text-center text-xs text-slate-500">
                <button className="flex flex-col items-center gap-1 text-emerald-600 font-bold">
                  <span className="text-xl">💬</span>
                  <span>Chats</span>
                </button>
                <button 
                  onClick={onOpenCallHistory}
                  className="flex flex-col items-center gap-1 hover:text-emerald-600 transition"
                >
                  <span className="text-xl">📞</span>
                  <span>Calls</span>
                </button>
                <button 
                  onClick={onOpenStatus}
                  className="flex flex-col items-center gap-1 hover:text-emerald-600 transition"
                >
                  <span className="text-xl">⭕</span>
                  <span>Status</span>
                </button>
                <button 
                  onClick={onOpenSettings}
                  className="flex flex-col items-center gap-1 hover:text-emerald-600 transition"
                >
                  <span className="text-xl">⚙️</span>
                  <span>Settings</span>
                </button>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default ChatSidebar;
