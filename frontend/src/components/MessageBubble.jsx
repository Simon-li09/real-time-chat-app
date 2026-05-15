import React from 'react';

const MessageBubble = ({ message, isMe }) => {
  const time = message.created_at ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  const renderContent = () => {
    if (message.message_type === 'voice') {
      const audioUrl = message.file_url || message.message_text;
      const fullUrl = audioUrl?.startsWith('http') ? audioUrl : `http://127.0.0.1:8000${audioUrl}`;
      
      return (
        <div className="flex items-center gap-2 min-w-[240px] py-1">
          {/* Profile Circle inside the bubble */}
          {isMe && (
            <div className="relative h-10 w-10 flex-shrink-0">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-800/20 text-sm font-bold">
                {message.sender?.username?.charAt(0).toUpperCase() || 'E'}
              </div>
              <span className="absolute -bottom-1 -right-1 text-[10px]">🎙️</span>
            </div>
          )}

          <button className="flex h-10 w-10 items-center justify-center text-2xl text-slate-600 transition hover:scale-110">
            ▶️
          </button>

          <div className="flex-1 flex flex-col gap-1">
            {/* Waveform Visualization (Simulated) */}
            <div className="flex items-end gap-[2px] h-6 px-1">
              {[30, 60, 40, 80, 50, 70, 40, 90, 60, 30, 50, 80, 40, 60, 30, 70, 50, 40].map((h, i) => (
                <div 
                  key={i} 
                  className={`w-[2px] rounded-full ${i < 5 ? 'bg-slate-500' : 'bg-slate-300'}`} 
                  style={{ height: `${h}%` }} 
                />
              ))}
            </div>
            <div className="text-[10px] text-slate-500">0:27</div>
          </div>

          {!isMe && (
            <div className="relative h-10 w-10 flex-shrink-0">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-800/20 text-sm font-bold overflow-hidden">
                {message.sender?.profile_picture ? (
                  <img src={message.sender.profile_picture} className="w-full h-full object-cover" />
                ) : (
                  message.sender?.username?.charAt(0).toUpperCase() || 'P'
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 text-[10px]">🎙️</span>
            </div>
          )}
          
          <audio src={fullUrl} className="hidden" />
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
