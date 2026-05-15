import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService, messageService } from '../services/api';
import socketService from '../sockets/socket';
import UserList from '../components/UserList'; // Kept for reference, though unused
import ChatBox from '../components/ChatBox'; // Kept for reference
import SettingsModal from '../components/SettingsModal';
import CreateGroupModal from '../components/CreateGroupModal';
import StatusTray from '../components/StatusTray';
import StatusViewer from '../components/StatusViewer';
import CallLog from '../components/CallLog';
import CallModal from '../components/CallModal';
import ChatSidebar from '../components/ChatSidebar';
import ChatWindow from '../components/ChatWindow';
import MobileNavbar from '../components/MobileNavbar';

const Chat = () => {
    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    
    const [typingUser, setTypingUser] = useState(null);

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

    const fetchUsers = async () => {
        try {
            const response = await userService.getUsers();
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

    const handleTyping = (value) => {
        const textValue = typeof value === 'string' ? value : value?.target?.value || '';
        setNewMessage(textValue);
        if (selectedUser && isChatConnected) {
            socketService.send('typing', {
                receiver_id: selectedUser.id,
                is_typing: textValue.length > 0
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
        <div className="flex h-screen w-screen bg-white text-slate-900 antialiased relative overflow-hidden m-0 p-0">
            {/* Sidebar - Hidden on mobile if a chat is selected */}
            <div className={`${selectedUser ? 'hidden md:block' : 'block'} w-full md:w-[450px] flex-shrink-0 h-full`}>
                <ChatSidebar 
                    chats={[...groups, ...users]} 
                    onlineUsers={onlineUsers}
                    selectedUserId={selectedUser?.id}
                    onSelectUser={setSelectedUser}
                    isOpen={!selectedUser}
                    onClose={() => setSelectedUser(null)}
                    onOpenStatus={() => setActiveStatuses(true)}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                    onOpenCallHistory={() => setIsCallHistoryOpen(true)}
                />
            </div>

            {/* Main Chat Area - Hidden on mobile if no chat is selected */}
            <main className={`${!selectedUser ? 'hidden md:flex' : 'flex'} flex-1 flex-col relative w-full h-full`}>
                {selectedUser ? (
                    <ChatWindow
                        selectedUser={selectedUser}
                        messages={messages}
                        currentUserId={user.id}
                        newMessage={newMessage}
                        onMessageChange={handleTyping}
                        onSendMessage={handleSendMessage}
                        onBack={() => setSelectedUser(null)}
                        onOpenCall={() => {
                            addCallLogEntry({ caller: selectedUser, direction: 'outgoing', status: 'calling', type: 'audio' });
                            setActiveCall({ caller: selectedUser, isIncoming: false });
                        }}
                        isMutual={isMutual}
                        typingUser={typingUser}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center bg-slate-950">
                        <div className="w-24 h-24 mb-6 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <span className="text-4xl">💬</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">SecureChat</h2>
                        <p className="text-slate-400 max-w-sm text-center text-sm">Select a user to view your conversations and send messages securely.</p>
                    </div>
                )}
            </main>

            {/* Main Modals and Overlays */}

            {isSettingsOpen && (
                <SettingsModal 
                    user={user} 
                    onClose={() => setIsSettingsOpen(false)} 
                    onUpdate={setUser} 
                />
            )}

            {isCallHistoryOpen && (
                <div className="fixed inset-0 z-[400] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="w-full max-w-3xl rounded-[2rem] bg-slate-900 shadow-2xl overflow-hidden border border-slate-800">
                        <div className="flex items-center justify-between gap-3 p-5 border-b border-slate-800 bg-slate-950/50">
                            <div>
                                <h2 className="text-lg font-semibold text-white">Call History</h2>
                                <p className="text-sm text-slate-400">Recent incoming, outgoing, and missed calls</p>
                            </div>
                            <button
                                onClick={() => setIsCallHistoryOpen(false)}
                                className="p-2 rounded-full bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-4 max-h-[70vh] overflow-y-auto">
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

            {activeStatuses === true && (
                <div className="fixed inset-0 z-[300] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="w-full max-w-lg rounded-[2rem] bg-slate-900 shadow-2xl overflow-hidden border border-slate-800">
                        <div className="flex justify-between items-center p-5 border-b border-slate-800">
                            <h2 className="text-white text-lg font-semibold">Status Updates</h2>
                            <button onClick={() => setActiveStatuses(null)} className="p-2 rounded-full bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-4 bg-slate-950">
                            <StatusTray onSelectStatus={(statuses) => setActiveStatuses(statuses)} />
                        </div>
                    </div>
                </div>
            )}

            {Array.isArray(activeStatuses) && (
                <StatusViewer statuses={activeStatuses} onClose={() => setActiveStatuses(null)} />
            )}
        </div>
    );
};

export default Chat;
