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
        <div className="flex h-screen w-full bg-white text-slate-800 antialiased relative overflow-hidden">
            <div className={`${selectedUser ? 'hidden md:flex' : 'flex'} w-full md:w-96 flex-col border-r border-gray-100`}>
                <div className="flex-1 overflow-y-hidden h-full relative">
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
                    <StatusTray onSelectStatus={setActiveStatuses} />
                    <CallLog logs={callLog} />
                </div>
            </div>

            <main className={`${!selectedUser ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-[#F8F9FA] relative w-full h-full`}>
                {selectedUser ? (
                    <>
                        <header className="flex items-center justify-between bg-white px-6 py-3 shadow-sm z-10">
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => setSelectedUser(null)}
                                    className="md:hidden mr-2 p-1 text-emerald-600 hover:bg-emerald-50 rounded-full"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                                    </svg>
                                </button>
                                {selectedUser.profile_picture ? (
                                    <img src={selectedUser.profile_picture} alt={selectedUser.username} className="flex h-10 w-10 items-center justify-center rounded-full object-cover" />
                                ) : (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700">
                                        {selectedUser.username.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-sm font-bold capitalize">{selectedUser.is_group ? selectedUser.name : selectedUser.username}</h3>
                                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-500">
                                        {onlineUsers.includes(selectedUser.id.toString()) ? (
                                            <><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Online</>
                                        ) : (
                                            <span className="text-gray-400">Offline</span>
                                        )}
                                        {typingUser && <span className="text-emerald-500 italic ml-1">• typing...</span>}
                                    </div>
                                </div>
                            </div>
                            
                            {!selectedUser.is_group && (
                                <div className="flex gap-5 text-emerald-600 items-center">
                                    <button 
                                        className="hover:opacity-70 text-lg"
                                        onClick={() => {
                                            addCallLogEntry({ caller: selectedUser, direction: 'outgoing', status: 'calling', type: 'audio' });
                                            setActiveCall({ caller: selectedUser, isIncoming: false });
                                        }}
                                        title="Voice Call"
                                    >📞</button>
                                    <button className="hover:opacity-70 font-bold text-lg" title="Code">&lt;/&gt;</button>
                                    <button className="hover:opacity-70 text-2xl" title="More options">⋮</button>
                                </div>
                            )}
                        </header>

                        {wsStatus !== 'connected' && (
                            <div className="px-6 py-2 bg-amber-50 text-amber-700 border-b border-amber-100 text-xs text-center font-medium shadow-sm">
                                Chat connection status: <strong>{wsStatus}</strong>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto p-4 md:p-6 relative">
                            <ChatBox messages={messages} currentUserId={user.id} />
                            <div ref={messagesEndRef} />
                        </div>

                        <footer className="flex items-center gap-4 bg-white px-4 py-3 md:px-6 md:py-4 shadow-[0_-1px_10px_rgba(0,0,0,0.02)] z-10 pb-safe">
                            <label className="text-xl text-gray-400 hover:text-gray-600 cursor-pointer p-1">
                                📎
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
                            
                            {!selectedUser.is_group && !isMutual ? (
                                <div className="flex-1 py-3 px-6 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center text-amber-700 text-xs font-medium animate-pulse">
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
                                <form onSubmit={handleSendMessage} className="relative flex-1 flex items-center">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={handleTyping}
                                        placeholder="Type a message..."
                                        className="w-full rounded-full bg-gray-100 px-5 py-3 text-sm outline-none focus:bg-gray-200 transition-colors"
                                        disabled={wsStatus !== 'connected'}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setIsRecording(true)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-500 text-lg"
                                        title="Voice Note"
                                    >🎙️</button>
                                </form>
                            )}
                            
                            <button 
                                onClick={handleSendMessage}
                                disabled={!newMessage.trim() || wsStatus !== 'connected'}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex-shrink-0"
                            >
                                ➤
                            </button>
                        </footer>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center bg-[#F8F9FA]">
                        <div className="w-20 h-20 mb-4 rounded-full bg-emerald-100 flex items-center justify-center text-3xl">
                            💬
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">SecureChat Web</h2>
                        <p className="text-gray-500 text-sm max-w-xs text-center">Select a user to view your conversations and send messages securely.</p>
                    </div>
                )}
            </main>

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
