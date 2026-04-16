import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService, messageService } from '../services/api';
import socketService from '../sockets/socket';
import UserList from '../components/UserList';
import ChatBox from '../components/ChatBox';
import SettingsModal from '../components/SettingsModal';
import CreateGroupModal from '../components/CreateGroupModal';
import VoiceRecorder from '../components/VoiceRecorder';
import StatusTray from '../components/StatusTray';
import StatusViewer from '../components/StatusViewer';
import CallLog from '../components/CallLog';
import CallModal from '../components/CallModal';

const Chat = () => {
    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    
    // Check if current selection is a mutual follow (for 1-to-1 chats)
    const isMutual = selectedUser && 
        (selectedUser.is_following && selectedUser.is_followed_by);

    const navigate = useNavigate();
    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem('user');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            console.error('Failed to parse user from local storage', e);
            return null;
        }
    });
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
    const [isCallHistoryOpen, setIsCallHistoryOpen] = useState(false);
    const [activeStatuses, setActiveStatuses] = useState(null);
    const [activeCall, setActiveCall] = useState(null);
    const messagesEndRef = useRef(null);

    const sounds = {
        receive: new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3'),
        send: new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3'),
        call: new Audio('https://assets.mixkit.co/active_storage/sfx/135/135-preview.mp3')
    };

    const playSound = (type) => {
        sounds[type].play().catch(e => console.log('Sound blocked by browser'));
    };

    const [typingUser, setTypingUser] = useState(null);
    const [wsStatus, setWsStatus] = useState('connecting');
    const isChatConnected = wsStatus === 'connected';
    const [callLog, setCallLog] = useState([]);
    const selectedUserRef = useRef(selectedUser);
    const userRef = useRef(user);
    const activeCallRef = useRef(activeCall);

    useEffect(() => {
        selectedUserRef.current = selectedUser;
    }, [selectedUser]);

    useEffect(() => {
        userRef.current = user;
    }, [user]);

    useEffect(() => {
        activeCallRef.current = activeCall;
    }, [activeCall]);

    const fetchCallLogs = async () => {
        try {
            const response = await messageService.getCallLogs();
            setCallLog(response.data);
        } catch (err) {
            console.error('Failed to load call logs', err);
        }
    };

    useEffect(() => {
        if (user) {
            fetchCallLogs();
        }
    }, [user]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
            return;
        }

        if (!user) {
            const loadUser = async () => {
                try {
                    const response = await userService.getCurrentUser();
                    setUser(response.data);
                    localStorage.setItem('user', JSON.stringify(response.data));
                } catch (err) {
                    console.error('Failed to load current user', err);
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    navigate('/');
                }
            };
            loadUser();
            return;
        }

        socketService.connect(user.id);
        const cleanups = [];

        cleanups.push(socketService.on('connection_status', (data) => {
            setWsStatus(data.status);
            if (data.status === 'connected') fetchUsers();
        }));

        cleanups.push(socketService.on('receive_message', (data) => {
            const msg = data.data || data;
            const currentSelected = selectedUserRef.current;
            const currentUser = userRef.current;

            console.log('📩 RECEIVED:', msg, 'Selected:', currentSelected?.id);

            const isRelevant = currentSelected && (
                (msg.sender_id == currentSelected.id || msg.sender_id == currentUser?.id) ||
                (msg.group_id && msg.group_id == currentSelected.id)
            );

            if (isRelevant) {
                setMessages(prev => {
                    if (prev.some(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
            }

            if (msg.sender_id != currentUser?.id && (!currentSelected || currentSelected.id != msg.sender_id)) {
                showNotification(msg);
            }
            playSound('receive');
        }));

        cleanups.push(socketService.on('message_sent', (data) => {
            const msg = data.data;
            console.log('📤 SENT CONFIRM:', msg);
            setMessages(prev => {
                if (prev.some(m => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
            }));

            cleanups.push(socketService.on('error', (data) => {
                console.error('❌ SOCKET ERROR:', data);
                alert(data.message || 'An error occurred');
            }));

            cleanups.push(socketService.on('typing_status', (data) => {
                const currentSelected = selectedUserRef.current;
                if (currentSelected && data.sender_id == currentSelected.id) {
                    setTypingUser(data.is_typing ? currentSelected.username : null);
                }
            }));

            cleanups.push(socketService.on('online_status', (data) => {
                console.log('🟢 STATUS:', data);
                setOnlineUsers(prev => {
                    const userId = data.user_id.toString();
                    if (data.is_online) {
                        return prev.includes(userId) ? prev : [...prev, userId];
                    } else {
                        return prev.filter(id => id !== userId);
                    }
                });
            }));
            
            cleanups.push(socketService.on('message_status', (data) => {
                console.log('✅ STATUS UPDATE:', data);
                setMessages(prev => prev.map(m => 
                    m.id === data.message_id ? { ...m, status: data.status } : m
                ));
            }));

            cleanups.push(socketService.on('relationship_update', (data) => {
                console.log('🔄 RELATIONSHIP:', data);
                fetchUsers();
            }));
            
            cleanups.push(socketService.on('rtc_signal', (data) => {
                if (data.signal.type === 'offer' && !activeCallRef.current) {
                    playSound('call');
                    const caller = users.find(u => u.id == data.from) || { id: data.from, username: `User ${data.from}` };
                    setActiveCall({ caller, isIncoming: true });
                    addCallLogEntry({
                        caller,
                        direction: 'incoming',
                        status: 'calling',
                        type: 'audio'
                    });
                }
            }));
            
            // Request notification permission
            if ("Notification" in window && Notification.permission === "default") {
                Notification.requestPermission();
            }

        return () => {
            cleanups.forEach(dispose => dispose && dispose());
            socketService.disconnect();
        };
    }, [user, navigate]);

    useEffect(() => {
        if (selectedUser) {
            fetchHistory(selectedUser.id);
        }
    }, [selectedUser]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchUsers = async () => {
        try {
            // Fetch only users the current user follows
            const response = await userService.getFollowedUsers();
            setUsers(response.data);
        } catch (err) {
            console.error('Failed to fetch users');
        }
    };

    const loadGroups = async () => {
        try {
            const response = await groupService.fetchGroups();
            const groupsList = Array.isArray(response.data) ? response.data : [];
            setGroups(groupsList.map(g => ({ ...g, is_group: true })));
        } catch (err) {
            console.error('Failed to load groups');
        }
    };

    const fetchHistory = async (targetId) => {
        try {
            const response = await messageService.getChatHistory(targetId);
            // Backend returns list directly. Ensure it's an array.
            const messagesList = Array.isArray(response.data) ? response.data : (response.data?.messages || []);
            setMessages([...messagesList].reverse());
        } catch (err) {
            console.error('Failed to fetch history');
        }
    };

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        const text = newMessage.trim();
        if (!text || !selectedUser) return;

        // Notify typing stop immediately on send
        const typingPayload = { is_typing: false };
        if (selectedUser.is_group) typingPayload.group_id = selectedUser.id;
        else typingPayload.receiver_id = selectedUser.id;
        socketService.send('typing', typingPayload);

        try {
            const payload = {
                message: text
            };
            if (selectedUser.is_group) {
                payload.group_id = selectedUser.id;
            } else {
                payload.receiver_id = selectedUser.id;
            }

            const sent = socketService.send('send_message', payload);
            if (!sent) {
                console.error('Message was not sent because the WebSocket is not open');
                alert('Unable to send message: WebSocket connection is not open. Please wait and try again.');
                return;
            }

            playSound('send');
            setNewMessage('');
        } catch (err) {
            console.error('Error sending message:', err);
        }
    };

    const handleTyping = (e) => {
        const value = e.target.value;
        setNewMessage(value);
        if (selectedUser && isChatConnected) {
            socketService.send('typing', {
                receiver_id: selectedUser.id,
                is_typing: value.length > 0
            });
        }
    };

    const showNotification = (msg) => {
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification("New Message from " + msg.sender_name || "User", {
                body: msg.message_text,
                icon: "/logo192.png" // Use your app icon
            });
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const addCallLogEntry = async ({ caller, direction, status, type = 'audio' }) => {
        try {
            const response = await messageService.createCallLog({
                other_user_id: caller.id,
                direction,
                status,
                call_type: type
            });

            setCallLog(prev => [response.data, ...prev].slice(0, 10));
        } catch (err) {
            console.error('Failed to save call log', err);
            const entry = {
                caller: {
                    id: caller?.id,
                    username: caller?.username || `User ${caller?.id}`
                },
                direction,
                status,
                type,
                created_at: new Date().toISOString()
            };
            setCallLog(prev => [entry, ...prev].slice(0, 10));
        }
    };

    return (
        <div className="flex h-screen bg-stone-50 font-sans">
            <div className="w-80 border-r border-slate-200 bg-white flex flex-col">
                <div className="p-4 border-b border-slate-200 bg-emerald-600 text-white shadow-sm z-10 flex justify-between items-center">
                    <h2 className="text-xl font-bold tracking-wide">Chats</h2>
                    <button 
                        onClick={() => setIsCallHistoryOpen(true)}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                        title="Call history"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.05 5.05a7 7 0 00-9.9 9.9l.7.7a2 2 0 002.83 0l1.06-1.06a2 2 0 00.58-1.22v-.44a2 2 0 00-1.47-1.95l-.7-.18a1 1 0 01-.73-.83 4 4 0 014.75-4.74 1 1 0 01.83.74l.18.7a2 2 0 001.95 1.47h.44a2 2 0 001.22-.58l1.06-1.06a2 2 0 000-2.83l-.7-.7z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16h.01M12 20h.01M16 16h.01" />
                        </svg>
                    </button>
                    <button 
                        onClick={() => setIsSettingsOpen(true)}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                        title="Settings"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                </div>
                <StatusTray onSelectStatus={setActiveStatuses} />
                <div className="flex-1 overflow-y-auto">
                    <UserList 
                        users={[...groups, ...users]} 
                        selectedUser={selectedUser} 
                        onSelectUser={setSelectedUser}
                        onlineUsers={onlineUsers}
                        typingUser={typingUser}
                        onFollowToggle={() => {
                            fetchUsers();
                            loadGroups();
                        }}
                    />
                    <CallLog logs={callLog} />
                </div>
            </div>

            <div className="flex-1 flex flex-col relative">
                {selectedUser ? (
                    <>
                        <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center shadow-sm z-10">
                            {selectedUser.profile_picture ? (
                                <img src={selectedUser.profile_picture} alt={selectedUser.username} className="w-10 h-10 rounded-full object-cover mr-4 shadow-sm" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-lg mr-4">
                                    {selectedUser.username.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800">{selectedUser.is_group ? selectedUser.name : selectedUser.username}</h3>
                                <div className="text-xs text-emerald-600 font-medium flex items-center">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>
                                    {onlineUsers.includes(selectedUser.id.toString()) ? 'Online' : 'Offline'}
                                    {typingUser && <span className="ml-2 text-slate-400 italic">• {typingUser} is typing...</span>}
                                </div>
                            </div>
                            
                            {!selectedUser.is_group && (
                                <div className="ml-auto flex items-center gap-2">
                                    <button 
                                        onClick={() => {
                                            addCallLogEntry({ caller: selectedUser, direction: 'outgoing', status: 'calling', type: 'audio' });
                                            setActiveCall({ caller: selectedUser, isIncoming: false });
                                        }}
                                        className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-full transition-all"
                                        title="Voice Call"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H3.75A2.25 2.25 0 001.5 4.5v2.25z" />
                                        </svg>
                                    </button>
                                    <button 
                                        onClick={() => {
                                            addCallLogEntry({ caller: selectedUser, direction: 'outgoing', status: 'calling', type: 'video' });
                                            setActiveCall({ caller: selectedUser, isIncoming: false, isVideo: true });
                                        }}
                                        className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-full transition-all"
                                        title="Video Call"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6.75L21 12l-5.25 5.25m-10.5 0L0 12l5.25-5.25m7.5-3v15" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>

                        {wsStatus !== 'connected' && (
                            <div className="px-6 py-3 bg-amber-50 text-amber-700 border-t border-amber-100 text-sm">
                                Chat connection status: <strong>{wsStatus}</strong>. Messages will send once connected.
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto bg-stone-50/50 p-4 relative" style={{ backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                            <ChatBox messages={messages} currentUserId={user.id} />
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 bg-white border-t border-slate-200">
                            <form onSubmit={handleSendMessage} className="flex max-w-4xl mx-auto items-center space-x-3 gap-2">
                                <label className="p-2.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-full transition-all cursor-pointer">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.5l-10.74 10.74a1.5 1.5 0 11-2.122-2.122l10.512-10.512" />
                                    </svg>
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        onChange={async (e) => {
                                            const file = e.target.files[0];
                                            if (!file) return;
                                            
                                            const formData = new FormData();
                                            formData.append('file', file);
                                            try {
                                                const res = await messageService.uploadMedia(formData);
                                                const type = file.type.startsWith('image/') ? 'image' : 
                                                             file.type.startsWith('video/') ? 'video' : 
                                                             file.type.startsWith('audio/') ? 'voice' : 'text';
                                                
                                                const payload = {
                                                    message: `Sent a ${type}`,
                                                    message_type: type,
                                                    file_url: res.data.file_url 
                                                };
                                                if (selectedUser.is_group) payload.group_id = selectedUser.id;
                                                else payload.receiver_id = selectedUser.id;
                                                
                                                socketService.send('send_message', payload);
                                            } catch (err) {
                                                console.error('Upload failed', err);
                                            }
                                        }}
                                    />
                                </label>

                                <button 
                                    type="button"
                                    onClick={() => setIsRecording(true)}
                                    className="p-2.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-full transition-all"
                                    title="Voice Note"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                                    </svg>
                                </button>

                                {!selectedUser.is_group && !isMutual ? (
                                    <div className="flex-1 py-3 px-6 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center text-amber-700 text-sm font-medium animate-pulse">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
                                            <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                                        </svg>
                                        Mutual follow required to send messages
                                    </div>
                                ) : isRecording ? (
                                    <VoiceRecorder 
                                        onCancel={() => setIsRecording(false)}
                                        onRecordingComplete={async (file) => {
                                            setIsRecording(false);
                                            const formData = new FormData();
                                            formData.append('file', file);
                                            try {
                                                const res = await messageService.uploadMedia(formData);
                                                const payload = {
                                                    message: 'Sent a voice note',
                                                    message_type: 'voice',
                                                    file_url: res.data.file_url
                                                };
                                                if (selectedUser.is_group) payload.group_id = selectedUser.id;
                                                else payload.receiver_id = selectedUser.id;
                                                socketService.send('send_message', payload);
                                            } catch (err) {
                                                console.error('Voice upload failed', err);
                                            }
                                        }}
                                    />
                                ) : (
                                    <>
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={handleTyping}
                                            placeholder="Type a message..."
                                            className="flex-1 py-3 px-4 bg-slate-100 border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all shadow-sm text-black font-medium"
                                            disabled={wsStatus !== 'connected'}
                                        />
                                        <button 
                                            type="submit" 
                                            disabled={!newMessage.trim() || wsStatus !== 'connected'}
                                            className="p-3 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 ml-1">
                                                <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
                                            </svg>
                                        </button>
                                    </>
                                )}
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center bg-stone-50">
                        <div className="w-24 h-24 mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-emerald-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome to SecureChat</h2>
                        <p className="text-slate-500 max-w-sm text-center">Select a user from the sidebar to start a new conversation or continue an existing one.</p>
                    </div>
                )}
            </div>

            {isSettingsOpen && (
                <SettingsModal 
                    user={user} 
                    onClose={() => setIsSettingsOpen(false)} 
                    onUpdate={setUser} 
                />
            )}

            {isCallHistoryOpen && (
                <div className="fixed inset-0 z-[400] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200">
                        <div className="flex items-center justify-between gap-3 p-4 border-b border-slate-200 bg-slate-50">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Call History</h2>
                                <p className="text-sm text-slate-500">Recent incoming, outgoing, and missed calls</p>
                            </div>
                            <button
                                onClick={() => setIsCallHistoryOpen(false)}
                                className="p-2 rounded-full text-slate-600 hover:bg-slate-200 transition-all"
                                title="Close call history"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-4 max-h-[75vh] overflow-y-auto">
                            <CallLog logs={callLog} />
                        </div>
                    </div>
                </div>
            )}
            {activeCall && (
                <CallModal 
                    caller={activeCall.caller} 
                    isIncoming={activeCall.isIncoming} 
                    onEnd={() => setActiveCall(null)} 
                />
            )}
        </div>
    );
};

export default Chat;
