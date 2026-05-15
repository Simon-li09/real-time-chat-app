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
                            <div className="flex justify-center my-4">
                                <span className="rounded bg-white px-3 py-1 text-[10px] font-semibold text-gray-400 shadow-sm uppercase tracking-wider">
                                    {getDayLabel(msg.created_at)}
                                </span>
                            </div>
                        )}
                        <div
                            className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} ${isGrouped ? 'mt-1' : 'mt-2'}`}
                        >
                            <div 
                                className={`max-w-[70%] p-3 shadow-sm transition-all duration-300 ${
                                    isMe 
                                    ? 'bg-emerald-600 text-white rounded-2xl rounded-tr-none' 
                                    : 'bg-white text-gray-800 rounded-2xl rounded-tl-none'
                                }`}
                            >
                                <div className={`text-sm break-words`}>
                                    {msg.message_type === 'image' ? (
                                        <div className="rounded-lg overflow-hidden my-1 bg-gray-100 min-h-[100px] flex items-center justify-center">
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
                                
                                <div className={`flex items-center space-x-1 mt-1 text-[9px] ${isMe ? 'text-emerald-100 justify-end' : 'text-gray-400 justify-end'}`}>
                                    <span>{formatTime(msg.created_at)}</span>
                                    {isMe && (
                                        <div className="flex ml-1">
                                            {msg.status === 'sent' && <span>✓</span>}
                                            {(msg.status === 'delivered' || msg.status === 'read') && (
                                                <span className={msg.status === 'read' ? 'text-white font-bold' : ''}>
                                                    ✓✓
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </React.Fragment>
                );
            })}
        </div>
    );
};

export default ChatBox;
