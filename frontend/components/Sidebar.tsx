'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuthStore, useSocketStore } from '@/lib/store';
import api from '@/lib/api';
import { Search, SquarePen, MoreHorizontal, ListFilter, User, Users } from 'lucide-react';

interface SidebarProps {
  activeConversation: number | null;
  setActiveConversation: (id: number) => void;
}

export default function Sidebar({ activeConversation, setActiveConversation }: SidebarProps) {
  const [conversations, setConversations] = useState<any[]>([]);
  const { user } = useAuthStore();
  const { ws } = useSocketStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!ws) return;
    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.event === 'NEW_MESSAGE' || data.event === 'MEMBER_ADDED' || data.event === 'CONVERSATION_CREATED') {
         fetchConversations();
      }
    };
    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws]);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/conversations/');
      setConversations(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateChat = async () => {
    const contactUsername = prompt('Enter contact username:');
    if (!contactUsername) return;
    try {
      const res = await api.post('/conversations/', {
        type: 'DIRECT',
        contact_username: contactUsername
      });
      setActiveConversation(res.data.id);
      fetchConversations();
      if (ws && ws.readyState === WebSocket.OPEN) {
         ws.send(JSON.stringify({
            event: 'CONVERSATION_CREATED',
            conversation_id: res.data.id,
            receiver_ids: res.data.members.map((m:any) => m.user_id)
         }));
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create chat');
    }
  };

  const handleCreateGroup = async () => {
    const groupName = prompt('Enter group name:');
    if (!groupName) return;
    try {
      const res = await api.post('/conversations/', {
        type: 'GROUP',
        group_name: groupName
      });
      setActiveConversation(res.data.id);
      fetchConversations();
      if (ws && ws.readyState === WebSocket.OPEN) {
         ws.send(JSON.stringify({
            event: 'CONVERSATION_CREATED',
            conversation_id: res.data.id,
            receiver_ids: res.data.members.map((m:any) => m.user_id)
         }));
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create group');
    }
  };

  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    const lowerSearch = search.toLowerCase();
    return conversations.filter(conv => {
      const title = conv.type === 'GROUP' 
        ? conv.group_info?.name 
        : conv.members.find((m: any) => m.user_id !== user?.id)?.user.display_name || `Chat ${conv.id}`;
      return title.toLowerCase().includes(lowerSearch);
    });
  }, [conversations, search, user]);

  return (
    <div className="flex h-full w-[340px] flex-col border-r border-[var(--border-light)] bg-[var(--bg-chatlist)] relative z-10 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 h-[60px] shrink-0">
        <h1 className="text-[24px] font-bold text-[var(--foreground)] tracking-tight">Chats</h1>
        <div className="flex space-x-1">
          <button onClick={handleCreateChat} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--bg-hover)] text-[var(--foreground)] transition-colors" title="New Chat">
            <SquarePen className="h-[20px] w-[20px]" strokeWidth={2} />
          </button>
          <button onClick={handleCreateGroup} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--bg-hover)] text-[var(--foreground)] transition-colors" title="More Options (New Group)">
            <MoreHorizontal className="h-[20px] w-[20px]" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="px-4 pb-3 flex space-x-2 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-[18px] w-[18px] text-[var(--text-muted)]" strokeWidth={2} />
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 rounded-[8px] bg-[var(--bg-input)] py-2 pl-9 pr-4 text-[14px] focus:outline-none focus:ring-1 focus:ring-[var(--border-light)] placeholder-[var(--text-muted)] text-[var(--foreground)]"
          />
        </div>
        <button className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--bg-hover)] text-[var(--foreground)] transition-colors">
          <ListFilter className="h-[20px] w-[20px]" strokeWidth={2} />
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-2">
        {filteredConversations.map((conv) => {
          const isGroup = conv.type === 'GROUP';
          const otherMember = conv.members.find((m: any) => m.user_id !== user?.id)?.user;
          const title = isGroup ? conv.group_info?.name : (otherMember?.display_name || `Chat ${conv.id}`);
          
          const lastMsg = conv.last_message;
          const msgPreview = lastMsg ? lastMsg.content : (isGroup ? 'Group created' : 'Start chatting');
          
          let dateStr = '';
          if (lastMsg) {
             const d = new Date(lastMsg.created_at);
             dateStr = d.toLocaleDateString([], { weekday: 'short' });
          }

          return (
            <div
              key={conv.id}
              onClick={() => setActiveConversation(conv.id)}
              className={`flex cursor-pointer items-center space-x-3 px-3 py-2.5 rounded-[12px] mb-0.5 transition-colors ${activeConversation === conv.id ? 'bg-[var(--bg-hover)]' : 'hover:bg-[var(--bg-hover)]'}`}
            >
              <div className={`flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full ${isGroup ? 'bg-[#90B3F9]' : 'bg-[#E5BEC3]'} text-white`}>
                {isGroup ? <Users className="h-6 w-6" strokeWidth={1.5} /> : <User className="h-6 w-6" strokeWidth={1.5} />}
              </div>
              <div className="flex-1 overflow-hidden flex flex-col justify-center h-full">
                <div className="flex justify-between items-baseline mb-[2px]">
                  <h3 className="truncate text-[15px] font-semibold text-[var(--foreground)]">{title}</h3>
                  <span className="text-[12px] text-[var(--text-muted)] shrink-0 ml-2">{dateStr}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="truncate text-[14px] text-[var(--text-muted)]">{msgPreview}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
