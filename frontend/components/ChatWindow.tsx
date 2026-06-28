'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuthStore, useSocketStore } from '@/lib/store';
import api from '@/lib/api';
import { Send, MoreVertical, Phone, Video, Plus, Check, CheckCheck, UserPlus, Users, Smile, Mic, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GroupSettingsModal from './GroupSettingsModal';
import { useToast } from '@/components/Toast';

interface ChatWindowProps {
  conversationId: number;
}

export default function ChatWindow({ conversationId }: ChatWindowProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [conversation, setConversation] = useState<any>(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { user } = useAuthStore();
  const { ws } = useSocketStore();
  const { showToast } = useToast();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchConversationDetails();
    fetchMessages();
  }, [conversationId]);

  useEffect(() => {
    if (!ws) return;
    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.event === 'NEW_MESSAGE' && data.message.conversation_id === conversationId) {
        setMessages((prev) => [...prev, data.message]);
        if (ws) {
           ws.send(JSON.stringify({ 
               event: 'MESSAGE_READ', 
               message_id: data.message.id,
               conversation_id: conversationId,
               receiver_ids: [data.message.sender_id]
           }));
        }
      } else if (data.event === 'TYPING' && data.conversation_id === conversationId && data.user_id !== user?.id) {
        setIsTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
      } else if (data.event === 'MESSAGE_READ' && data.conversation_id === conversationId) {
        setMessages((prev) => prev.map(m => m.id === data.message_id ? { ...m, status: 'READ' } : m));
      } else if ((data.event === 'MEMBER_ADDED' || data.event === 'MEMBER_REMOVED') && data.conversation_id === conversationId) {
        fetchConversationDetails();
      }
    };
    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws, conversationId, user]);

  const fetchConversationDetails = async () => {
    try {
      const res = await api.get(`/conversations/${conversationId}`);
      setConversation(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/messages/${conversationId}`);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const getReceiverIds = () => {
    if (!conversation?.members) return [];
    return conversation.members.filter((m: any) => m.user_id !== user?.id).map((m: any) => m.user_id);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ 
        event: 'TYPING', 
        conversation_id: conversationId, 
        user_id: user?.id,
        receiver_ids: getReceiverIds()
      }));
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const content = input;
    setInput('');

    try {
      const res = await api.post('/messages/', {
        content,
        conversation_id: conversationId,
        type: 'TEXT'
      });

      // Optimistically add message
      const newMessage = { ...res.data, status: 'DELIVERED' }; // Mock delivered immediately
      setMessages((prev) => [...prev, newMessage]);

      // Broadcast via WS
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          event: 'NEW_MESSAGE',
          message: newMessage,
          receiver_ids: getReceiverIds()
        }));
      }

      // Mock Read Receipt after 2 seconds
      setTimeout(() => {
        setMessages((prev) => prev.map(m => m.id === newMessage.id ? { ...m, status: 'READ' } : m));
      }, 2000);

    } catch (err) {
      console.error(err);
    }
  };



  const isGroup = conversation?.type === 'GROUP';
  const title = isGroup ? conversation?.group_info?.name : (conversation?.members.find((m: any) => m.user_id !== user?.id)?.user.display_name || `Chat ${conversationId}`);
  const memberCount = isGroup ? `${conversation?.members.length} members` : 'Online';

  return (
    <div className="flex flex-1 flex-col bg-[var(--background)] relative min-w-0">
      {/* Header */}
      <div 
         className={`flex items-center justify-between px-4 h-[60px] border-b border-[var(--border-light)] shrink-0 z-10 bg-[var(--background)]/90 backdrop-blur-sm`}
      >
        <div className="flex items-center space-x-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isGroup ? 'bg-[#90B3F9]' : 'bg-[#E5BEC3]'} text-white shrink-0`}>
             {isGroup ? <Users className="h-6 w-6" strokeWidth={1.5} /> : <UserPlus className="h-6 w-6" strokeWidth={1.5} />}
          </div>
          <div>
            <h2 className="text-[16px] font-bold text-[var(--foreground)] leading-tight">{title}</h2>
            <p className="text-[12px] text-[var(--text-muted)]">{memberCount}</p>
          </div>
        </div>
        <div className="flex space-x-2 text-[var(--text-muted)]">

          <button onClick={() => showToast("Video calling is coming soon")} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--bg-hover)] transition-colors">
            <Video className="h-[20px] w-[20px]" strokeWidth={2} />
          </button>
          <button onClick={() => showToast("Voice calling is coming soon")} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--bg-hover)] transition-colors">
            <Phone className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>
          <button 
             onClick={() => { if (isGroup) setIsSettingsOpen(true); }}
             className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--bg-hover)] transition-colors"
          >
            <MoreVertical className="h-[20px] w-[20px]" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-[10%] py-6 space-y-4 relative">
        <AnimatePresence>
          {messages.map((msg, i) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <motion.div
                key={msg.id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex w-full ${isMe ? 'justify-end' : 'justify-start items-end'} mb-1`}
              >
                {!isMe && (
                  <div className={`mr-2 h-[32px] w-[32px] shrink-0 rounded-full bg-[var(--border-light)] overflow-hidden flex items-center justify-center text-[var(--text-muted)]`}>
                     {msg.sender?.avatar ? (
                        <img src={msg.sender.avatar} className="h-full w-full object-cover" />
                     ) : (
                        <User className="h-4 w-4" strokeWidth={2.5} />
                     )}
                  </div>
                )}
                <div
                  className={`relative max-w-[65%] px-[14px] py-[8px] text-[15px] leading-[1.35] flex flex-col ${
                    isMe
                      ? 'bg-[var(--signal-blue)] text-white rounded-[20px] rounded-br-[4px]'
                      : 'bg-[#f0f2f5] text-[var(--foreground)] rounded-[20px] rounded-bl-[4px]'
                  }`}
                >
                  {!isMe && isGroup && (
                    <span className="text-[13px] font-semibold text-purple-600 mb-0.5">{msg.sender?.display_name || msg.sender?.username}</span>
                  )}
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                  <div className={`mt-0.5 flex items-center justify-end space-x-1 ${isMe ? 'text-white/80' : 'text-[var(--text-muted)]'} self-end leading-none`}>
                    <span className="text-[11px]">{new Date(msg.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                    {isMe && (
                       msg.status === 'READ' ? <CheckCheck className="h-[14px] w-[14px] text-white" strokeWidth={2.5} /> : <Check className="h-[14px] w-[14px]" strokeWidth={2.5} />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
          {isTyping && (
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex justify-start items-end mb-1">
               <div className={`mr-2 h-[32px] w-[32px] shrink-0 rounded-full bg-[var(--border-light)] flex items-center justify-center text-[var(--text-muted)]`}>
                 <User className="h-4 w-4" strokeWidth={2.5} />
               </div>
               <div className="bg-[#f0f2f5] text-[var(--text-muted)] rounded-[20px] rounded-bl-[4px] px-4 py-2 text-sm flex items-center space-x-1">
                 <span className="animate-bounce">.</span><span className="animate-bounce delay-100">.</span><span className="animate-bounce delay-200">.</span>
               </div>
             </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="p-4 bg-[var(--background)] shrink-0 z-10 flex flex-col items-center justify-center pb-6">
        <form onSubmit={sendMessage} className="flex items-end w-full max-w-[90%] space-x-2 bg-[var(--bg-input)] rounded-[24px] px-3 py-1.5 shadow-sm border border-transparent focus-within:border-[var(--border-light)] transition-colors">
          <button type="button" className="flex h-[40px] w-[32px] shrink-0 items-center justify-center text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors">
            <Smile className="h-[22px] w-[22px]" strokeWidth={2} />
          </button>
          <input
            type="text"
            value={input}
            onChange={handleTyping}
            placeholder="Message"
            className="flex-1 bg-transparent min-h-[40px] py-2 px-2 text-[15px] focus:outline-none text-[var(--foreground)] placeholder-[var(--text-muted)]"
          />
          <div className="flex items-center space-x-1 shrink-0 pb-[2px]">
            {input.trim() ? (
              <button
                type="submit"
                className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-[var(--signal-blue)] text-white transition-transform hover:scale-105 active:scale-95"
              >
                <Send className="h-[18px] w-[18px] ml-0.5" strokeWidth={2} />
              </button>
            ) : (
              <>
                <button type="button" onClick={() => showToast("Voice messages are coming soon")} className="flex h-[36px] w-[36px] items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors">
                  <Mic className="h-[20px] w-[20px]" strokeWidth={2} />
                </button>
                <button type="button" onClick={() => showToast("Media attachments are coming soon")} className="flex h-[36px] w-[36px] items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors">
                  <Plus className="h-[22px] w-[22px]" strokeWidth={2} />
                </button>
              </>
            )}
          </div>
        </form>
      </div>

      {/* Modals */}
      <GroupSettingsModal 
         isOpen={isSettingsOpen} 
         onClose={() => setIsSettingsOpen(false)} 
         conversation={conversation}
         onUpdate={() => {
            fetchConversationDetails();
            if (ws && ws.readyState === WebSocket.OPEN && conversation?.members) {
               ws.send(JSON.stringify({
                  event: 'MEMBER_REMOVED',
                  conversation_id: conversationId,
                  receiver_ids: conversation.members.map((m:any) => m.user_id)
               }));
            }
         }}
      />
    </div>
  );
}
