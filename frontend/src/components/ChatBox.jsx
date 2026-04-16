import React from 'react';

const ChatBox = ({ messages, currentUserId, settings }) => {
    const fontSizeClass = 
        settings?.font_size === 'small' ? 'text-[11px]' :
        settings?.font_size === 'large' ? 'text-base' :
        'text-sm'; // default/medium

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const isSameDay = (d1, d2) => {
        const date1 = new Date(d1);
        const date2 = new Date(d2);
        return date1.toDateString() === date2.toDateString();
    };

    const getDayLabel = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
    };

    return (
        <div className="flex-1 w-full flex-shrink-0 flex flex-col space-y-1 pb-4">
            {messages.map((msg, index) => {
                const senderId = msg.sender?.id || msg.sender || msg.sender_id;
                const isMe = String(senderId) === String(currentUserId);
                const prevMsg = index > 0 ? messages[index - 1] : null;
                const prevSenderId = prevMsg ? (prevMsg.sender?.id || prevMsg.sender || prevMsg.sender_id) : null;
                const showDateSeparator = !prevMsg || !isSameDay(msg.created_at, prevMsg.created_at);
                const isGrouped = prevMsg && String(prevSenderId) === String(senderId) && isSameDay(msg.created_at, prevMsg.created_at);

                return (
                    <React.Fragment key={msg.id || index}>
                        {showDateSeparator && (
                            <div className="flex justify-center my-6">
                                <span className="px-3 py-1 bg-slate-200/50 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded-full backdrop-blur-sm">
                                    {getDayLabel(msg.created_at)}
                                </span>
                            </div>
                        )}
                        <div
                            className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} ${isGrouped ? 'mt-0.5' : 'mt-3'}`}
                        >
                            <div 
                                className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm relative transition-all duration-300 ${fontSizeClass} ${
                                    isMe 
                                    ? 'bg-emerald-500 text-black font-semibold ' + (isGrouped ? 'rounded-r-md' : 'rounded-tr-sm') 
                                    : 'bg-white text-black font-medium border border-slate-200 ' + (isGrouped ? 'rounded-l-md' : 'rounded-tl-sm')
                                }`}
                            >
                                <div className="break-words mb-1">
                                    {msg.message_type === 'image' ? (
                                        <div className="rounded-lg overflow-hidden my-1 bg-slate-100 min-h-[100px] flex items-center justify-center">
                                            <img 
                                                src={msg.file_url || msg.message_text} 
                                                alt="Shared media" 
                                                className="max-w-full h-auto max-h-72 object-contain hover:scale-105 transition-transform cursor-pointer"
                                                loading="lazy"
                                                onClick={() => window.open(msg.file_url || msg.message_text, '_blank')}
                                            />
                                        </div>
                                    ) : msg.message_type === 'video' ? (
                                        <div className="rounded-lg overflow-hidden my-1 bg-black">
                                            <video 
                                                src={msg.file_url || msg.message_text} 
                                                controls 
                                                className="max-w-full h-auto max-h-72"
                                            />
                                        </div>
                                    ) : msg.message_type === 'voice' ? (
                                        <div className="my-1 py-1">
                                            <audio 
                                                src={msg.file_url || msg.message_text} 
                                                controls 
                                                className="h-8 max-w-[200px]"
                                            />
                                        </div>
                                    ) : (
                                        msg.message_text
                                    )}
                                </div>
                                
                                <div className={`flex items-center justify-end space-x-1 mt-1 opacity-70 text-[10px] ${isMe ? 'text-black/80' : 'text-slate-400'}`}>
                                    <span>{formatTime(msg.created_at)}</span>
                                    {isMe && (
                                        <div className="flex">
                                            {msg.status === 'sent' && <span>✓</span>}
                                            {(msg.status === 'delivered' || msg.status === 'read') && (
                                                <span className={msg.status === 'read' ? 'text-blue-600' : ''}>
                                                    ✓✓
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Speech bubble tail - only for first message in group */}
                                {!isGrouped && (
                                    <div className={`absolute top-0 w-3 h-4 ${
                                        isMe 
                                        ? '-right-1.5 bg-emerald-500 clip-tail-right' 
                                        : '-left-1.5 bg-white border-l border-t border-slate-100 clip-tail-left'
                                    }`} />
                                )}
                            </div>
                        </div>
                    </React.Fragment>
                );
            })}
        </div>
    );
};

export default ChatBox;
