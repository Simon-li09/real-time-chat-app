import React from 'react';

const MessageBubble = ({ message, isMe }) => {
  const time = message.created_at ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  const renderContent = () => {
    if (message.message_type === 'voice') {
      const audioUrl = message.file_url || message.message_text;
      const fullUrl = audioUrl?.startsWith('http') ? audioUrl : `http://127.0.0.1:8000${audioUrl}`;
      return (
        <div className="min-w-[220px] max-w-full py-1">
          <audio 
            src={fullUrl}
            controls
            className="w-full h-8 opacity-90 brightness-110 accent-emerald-500"
          />
        </div>
      );
    }
    
    if (message.message_type === 'image') {
      return (
        <div className="max-w-sm overflow-hidden rounded-lg">
          <img 
            src={message.file_url || message.message_text} 
            alt="Message attachment"
            className="w-full h-auto object-cover hover:opacity-90 transition-opacity"
          />
        </div>
      );
    }

    return <p className="leading-relaxed whitespace-pre-wrap break-words">{message.message_text || message.text}</p>;
  };

  return (
    <div className={`flex w-full mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-lg px-2.5 py-1.5 shadow-sm relative ${
          isMe
            ? 'bg-[#d9fdd3] text-slate-800 rounded-tr-none'
            : 'bg-white text-slate-800 rounded-tl-none'
        }`}
      >
        <div className="text-sm md:text-[14.5px] pr-8">{renderContent()}</div>
        <div className={`flex items-center justify-end gap-1 mt-0.5 absolute bottom-1 right-2`}>
          <span className="text-[10px] text-slate-500/80">{time}</span>
          {isMe && (
            <span className={`text-[10px] ${message.is_read ? 'text-blue-500' : 'text-slate-400'}`}>
              {message.is_read ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
