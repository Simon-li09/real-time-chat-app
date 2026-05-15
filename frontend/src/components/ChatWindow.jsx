import { motion } from 'framer-motion';
import { MEDIA_URL } from '../services/api';
import MessageBubble from './MessageBubble';

const ChatWindow = ({
  selectedUser,
  messages,
  currentUserId,
  newMessage,
  onMessageChange,
  onSendMessage,
  onBack,
  onOpenCall,
  typingUser,
}) => {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#e5ddd5] relative">
      {/* WhatsApp Background Pattern (Subtle Doodle) */}
      <div 
        className="absolute inset-0 opacity-[0.4] pointer-events-none mix-blend-overlay" 
        style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }}
      />

      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-[#f0f2f5] px-4 py-2 shadow-sm"
      >
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-600 md:hidden"
            >
              ←
            </button>
          )}
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-300 text-base font-semibold text-white overflow-hidden">
            {selectedUser?.profile_picture ? (
              <img src={selectedUser.profile_picture.startsWith('http') ? selectedUser.profile_picture : `${MEDIA_URL}${selectedUser.profile_picture}`} className="w-full h-full object-cover" />
            ) : (
              selectedUser?.username?.charAt(0).toUpperCase() || 'U'
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-medium text-slate-900">{selectedUser?.is_group ? selectedUser.name : selectedUser?.username}</p>
            <p className="truncate text-xs text-slate-500">
              {typingUser ? `${typingUser} is typing...` : 'online'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5 text-slate-500 mr-2">
          <button onClick={onOpenCall} className="text-xl">📹</button>
          <button onClick={onOpenCall} className="text-lg">📞</button>
          <button className="text-xl">🔍</button>
          <button className="text-xl">⋮</button>
        </div>
      </motion.header>

      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-10 relative z-10">
        <div className="space-y-1 max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className="flex min-h-[50vh] items-center justify-center p-8 text-center text-sm text-slate-500">
              Select a conversation to start chatting.
            </div>
          ) : (
            messages.map((message, index) => {
              const senderId = message.sender?.id || message.sender || message.sender_id;
              const isMe = String(senderId) === String(currentUserId);
              return <MessageBubble key={message.id || index} message={message} isMe={isMe} />;
            })
          )}
        </div>
      </div>

      <footer className="sticky bottom-0 z-20 bg-[#f0f2f5] px-2 py-2 md:px-4">
        <div className="flex items-center gap-2 max-w-5xl mx-auto">
          <div className="flex-1 flex items-center gap-2 bg-white rounded-lg px-3 py-1 shadow-sm">
            <form onSubmit={onSendMessage} className="flex-1">
              <input
                id="message-input"
                name="message"
                type="text"
                value={newMessage}
                onChange={(e) => onMessageChange(e.target.value)}
                placeholder="Type a message"
                className="w-full bg-transparent py-2 text-sm text-slate-900 outline-none"
              />
            </form>
          </div>

          <button
            onClick={onSendMessage}
            className="inline-flex h-12 w-12 items-center justify-center text-slate-500"
            type="button"
          >
            ➤
          </button>
        </div>
      </footer>
    </div>
  );
};

export default ChatWindow;
