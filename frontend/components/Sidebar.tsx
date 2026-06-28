'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuthStore, useSocketStore } from '@/lib/store';
import api from '@/lib/api';
import { Search, SquarePen, MoreHorizontal, ListFilter, User, Users, Archive, FolderPlus, Moon, ChevronRight, ChevronLeft, AtSign, Hash, FileText, CheckCircle2, ChevronDown } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface SidebarProps {
  activeConversation: number | null;
  setActiveConversation: (id: number) => void;
}

export default function Sidebar({ activeConversation, setActiveConversation }: SidebarProps) {
  const [conversations, setConversations] = useState<any[]>([]);
  const { user } = useAuthStore();
  const { ws } = useSocketStore();
  const [search, setSearch] = useState('');
  const [isUnreadFilterActive, setIsUnreadFilterActive] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [activeSidebarView, setActiveSidebarView] = useState<'chats' | 'new_chat' | 'phone_search' | 'username_search' | 'choose_members'>('chats');
  const [memberSearch, setMemberSearch] = useState('');
  const [globalSearchRes, setGlobalSearchRes] = useState<any[]>([]);
  const { showToast } = useToast();

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!ws) return;
    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.event === 'NEW_MESSAGE' || data.event === 'MEMBER_ADDED' || data.event === 'CONVERSATION_CREATED' || data.event === 'MESSAGE_READ') {
         fetchConversations();
      }
    };
    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws]);

  useEffect(() => {
    if (activeSidebarView === 'username_search' || activeSidebarView === 'choose_members') {
      if (memberSearch.trim().length > 0) {
        const timer = setTimeout(async () => {
          try {
            const res = await api.get(`/contacts/search?q=${memberSearch}`);
            setGlobalSearchRes(res.data);
          } catch(e) {}
        }, 300);
        return () => clearTimeout(timer);
      } else {
        setGlobalSearchRes([]);
      }
    }
  }, [memberSearch, activeSidebarView]);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/conversations/');
      setConversations(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateChat = async (contactUsername: string) => {
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
      setActiveSidebarView('chats');
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
    let result = conversations;

    if (isUnreadFilterActive) {
      result = result.filter(conv => conv.unread_count > 0);
    }

    if (search.trim()) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(conv => {
        const title = conv.type === 'GROUP' 
          ? conv.group_info?.name 
          : conv.members.find((m: any) => m.user_id !== user?.id)?.user.display_name || `Chat ${conv.id}`;
        return title?.toLowerCase().includes(lowerSearch);
      });
    }

    return result;
  }, [conversations, search, user, isUnreadFilterActive]);

  const recentContacts = useMemo(() => {
    const contacts = new Map();
    conversations.forEach(conv => {
       if (conv.type === 'DIRECT') {
          const otherMember = conv.members.find((m: any) => m.user_id !== user?.id)?.user;
          if (otherMember) {
             contacts.set(otherMember.username, otherMember);
          }
       }
    });
    return Array.from(contacts.values());
  }, [conversations, user]);

  const filteredMemberContacts = useMemo(() => {
    if (!memberSearch.trim()) return recentContacts;
    if (globalSearchRes.length > 0) return globalSearchRes;
    
    const lower = memberSearch.toLowerCase();
    return recentContacts.filter(c => 
      c.display_name.toLowerCase().includes(lower) || 
      c.username.toLowerCase().includes(lower)
    );
  }, [recentContacts, memberSearch, globalSearchRes]);

  if (activeSidebarView === 'phone_search') {
    return (
      <div className={`${activeConversation ? 'hidden md:flex' : 'flex'} flex-1 min-h-0 md:h-full w-full md:w-[340px] flex-col border-r border-[var(--border-light)] bg-[var(--bg-chatlist)] relative z-10 shrink-0`}>
        <div className="flex items-center space-x-4 px-4 py-4 h-[60px] shrink-0">
          <button onClick={() => { setActiveSidebarView('new_chat'); setMemberSearch(''); }} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--bg-hover)] text-[var(--foreground)] transition-colors">
            <ChevronLeft className="h-[22px] w-[22px]" strokeWidth={2} />
          </button>
          <h1 className="text-[17px] font-semibold text-[var(--foreground)] tracking-tight">Find by phone number</h1>
        </div>

        <div className="px-4 pt-2 space-y-3">
          <div className="flex items-center justify-between rounded-[8px] bg-[var(--bg-input)] px-4 py-2.5 cursor-pointer hover:bg-[var(--bg-hover)] transition-colors">
             <span className="text-[14px] text-[var(--foreground)] font-medium">Country code</span>
             <div className="flex items-center space-x-2 text-[var(--foreground)] font-medium">
                <span className="text-[14px]">+91</span>
                <ChevronDown className="h-4 w-4 opacity-70" />
             </div>
          </div>
          
          <div className="flex items-center rounded-[8px] bg-[var(--bg-input)] px-4 py-2.5">
             <input type="text" placeholder="Phone number" className="bg-transparent w-full focus:outline-none text-[14px] placeholder-[var(--text-muted)] text-[var(--foreground)] font-medium" />
          </div>
        </div>
      </div>
    );
  }

  if (activeSidebarView === 'choose_members') {
    return (
      <div className={`${activeConversation ? 'hidden md:flex' : 'flex'} flex-1 min-h-0 md:h-full w-full md:w-[340px] flex-col border-r border-[var(--border-light)] bg-[var(--bg-chatlist)] relative z-10 shrink-0`}>
        <div className="flex items-center space-x-4 px-4 py-4 h-[60px] shrink-0">
          <button onClick={() => { setActiveSidebarView('new_chat'); setMemberSearch(''); }} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--bg-hover)] text-[var(--foreground)] transition-colors">
            <ChevronLeft className="h-[22px] w-[22px]" strokeWidth={2} />
          </button>
          <h1 className="text-[17px] font-semibold text-[var(--foreground)] tracking-tight">Choose members</h1>
        </div>

        <div className="px-4 pb-4 border-b border-[var(--border-light)]">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-[18px] w-[18px] text-[var(--text-muted)]" strokeWidth={2} />
            <input
              type="text"
              placeholder="Name, username, or number"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="w-full h-9 rounded-[8px] bg-[var(--bg-input)] py-2 pl-9 pr-4 text-[14px] focus:outline-none focus:ring-1 focus:ring-[var(--border-light)] placeholder-[var(--text-muted)] text-[var(--foreground)]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredMemberContacts.length > 0 ? (
            <div className="py-2">
              <div className="px-4 py-2">
                <span className="text-[13px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Recents</span>
              </div>
              {filteredMemberContacts.map(contact => (
                <div key={contact.username} onClick={() => { setActiveSidebarView('chats'); handleCreateGroup(); }} className="flex cursor-pointer items-center space-x-3 px-4 py-2.5 hover:bg-[var(--bg-hover)] transition-colors">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--border-light)] text-[var(--foreground)] overflow-hidden">
                    {contact.avatar ? <img src={contact.avatar} className="h-full w-full object-cover" /> : <User className="h-5 w-5" strokeWidth={1.5} />}
                  </div>
                  <div>
                    <h3 className="text-[15px] font-medium text-[var(--foreground)]">{contact.display_name}</h3>
                    <p className="text-[13px] text-[var(--text-muted)]">@{contact.username}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="pt-10 flex justify-center">
              <span className="text-[15px] font-semibold text-[var(--foreground)] opacity-90">No contacts found</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeSidebarView === 'username_search') {
    return (
      <div className={`${activeConversation ? 'hidden md:flex' : 'flex'} flex-1 min-h-0 md:h-full w-full md:w-[340px] flex-col border-r border-[var(--border-light)] bg-[var(--bg-chatlist)] relative z-10 shrink-0`}>
        <div className="flex items-center space-x-4 px-4 py-4 h-[60px] shrink-0">
          <button onClick={() => { setActiveSidebarView('new_chat'); setMemberSearch(''); }} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--bg-hover)] text-[var(--foreground)] transition-colors">
            <ChevronLeft className="h-[22px] w-[22px]" strokeWidth={2} />
          </button>
          <h1 className="text-[17px] font-semibold text-[var(--foreground)] tracking-tight">Find by username</h1>
        </div>

        <div className="px-4 pt-2 pb-4 border-b border-[var(--border-light)]">
          <div className="flex items-center rounded-[8px] bg-[var(--bg-input)] px-4 py-2.5">
             <input 
               type="text" 
               placeholder="Username" 
               value={memberSearch}
               onChange={(e) => setMemberSearch(e.target.value)}
               className="bg-transparent w-full focus:outline-none text-[14px] placeholder-[var(--text-muted)] text-[var(--foreground)] font-medium" 
               onKeyDown={(e) => {
                 if (e.key === 'Enter') {
                   const val = e.currentTarget.value.trim();
                   if (val) {
                     handleCreateChat(val);
                     setMemberSearch('');
                   }
                 }
               }}
             />
          </div>
          <p className="mt-3 text-[13px] text-[var(--foreground)] font-semibold opacity-90 leading-relaxed">
            Enter a username followed by a dot and its set of numbers.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredMemberContacts.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-2">
                <span className="text-[13px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Recommended</span>
              </div>
              {filteredMemberContacts.map(contact => (
                <div key={contact.username} onClick={() => { setActiveSidebarView('chats'); handleCreateChat(contact.username); setMemberSearch(''); }} className="flex cursor-pointer items-center space-x-3 px-4 py-2.5 hover:bg-[var(--bg-hover)] transition-colors">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--border-light)] text-[var(--foreground)] overflow-hidden">
                    {contact.avatar ? <img src={contact.avatar} className="h-full w-full object-cover" /> : <User className="h-5 w-5" strokeWidth={1.5} />}
                  </div>
                  <div>
                    <h3 className="text-[15px] font-medium text-[var(--foreground)]">{contact.display_name}</h3>
                    <p className="text-[13px] text-[var(--text-muted)]">@{contact.username}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeSidebarView === 'new_chat') {
    return (
      <div className={`${activeConversation ? 'hidden md:flex' : 'flex'} flex-1 min-h-0 md:h-full w-full md:w-[340px] flex-col border-r border-[var(--border-light)] bg-[var(--bg-chatlist)] relative z-10 shrink-0`}>
        {/* Header */}
        <div className="flex items-center space-x-4 px-4 py-4 h-[60px] shrink-0">
          <button onClick={() => { setActiveSidebarView('chats'); setMemberSearch(''); }} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--bg-hover)] text-[var(--foreground)] transition-colors">
            <ChevronLeft className="h-[22px] w-[22px]" strokeWidth={2} />
          </button>
          <h1 className="text-[17px] font-semibold text-[var(--foreground)] tracking-tight">New chat</h1>
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-[18px] w-[18px] text-[var(--text-muted)]" strokeWidth={2} />
            <input
              type="text"
              placeholder="Name, username, or number"
              className="w-full h-9 rounded-[8px] bg-[var(--bg-input)] py-2 pl-9 pr-4 text-[14px] focus:outline-none focus:ring-1 focus:ring-[var(--border-light)] placeholder-[var(--text-muted)] text-[var(--foreground)]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pt-2">
          <button onClick={() => setActiveSidebarView('choose_members')} className="flex w-full items-center space-x-4 px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors text-left">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--bg-hover)] text-[var(--foreground)]">
              <Users className="h-[20px] w-[20px]" strokeWidth={1.5} />
            </div>
            <span className="text-[15px] font-medium text-[var(--foreground)]">New group</span>
          </button>

          <button onClick={() => setActiveSidebarView('username_search')} className="flex w-full items-center space-x-4 px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors text-left">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--bg-hover)] text-[var(--foreground)]">
              <AtSign className="h-[20px] w-[20px]" strokeWidth={1.5} />
            </div>
            <span className="text-[15px] font-medium text-[var(--foreground)]">Find by username</span>
          </button>

          <button onClick={() => setActiveSidebarView('phone_search')} className="flex w-full items-center space-x-4 px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors text-left">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--bg-hover)] text-[var(--foreground)]">
              <Hash className="h-[20px] w-[20px]" strokeWidth={1.5} />
            </div>
            <span className="text-[15px] font-medium text-[var(--foreground)]">Find by phone number</span>
          </button>

          <div className="mt-4 px-4 pb-2">
            <span className="text-[14px] font-semibold text-[var(--foreground)] tracking-wide">Contacts</span>
          </div>

          <button onClick={() => showToast("Note to Self coming soon")} className="flex w-full items-center space-x-4 px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors text-left">
            <div className="relative">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-gray-800">
                <FileText className="h-[20px] w-[20px]" strokeWidth={2} />
              </div>
              <div className="absolute bottom-0 right-[-2px] flex items-center justify-center rounded-full bg-[var(--background)] p-[2px]">
                <CheckCircle2 className="h-4 w-4 text-[var(--signal-blue)]" strokeWidth={2} />
              </div>
            </div>
            <span className="text-[15px] font-medium text-[var(--foreground)]">Note to Self</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${activeConversation ? 'hidden md:flex' : 'flex'} flex-1 min-h-0 md:h-full w-full md:w-[340px] flex-col border-r border-[var(--border-light)] bg-[var(--bg-chatlist)] relative z-10 shrink-0`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 h-[60px] shrink-0">
        <h1 className="text-[24px] font-bold text-[var(--foreground)] tracking-tight">Chats</h1>
        <div className="flex space-x-1 relative">
          <button onClick={() => setActiveSidebarView('new_chat')} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--bg-hover)] text-[var(--foreground)] transition-colors" title="New Chat">
            <SquarePen className="h-[20px] w-[20px]" strokeWidth={2} />
          </button>
          <button onClick={() => setShowMenu(!showMenu)} className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${showMenu ? 'bg-[var(--bg-hover)]' : 'hover:bg-[var(--bg-hover)]'} text-[var(--foreground)]`} title="More Options">
            <MoreHorizontal className="h-[20px] w-[20px]" strokeWidth={2} />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-11 z-50 w-56 rounded-xl bg-[var(--bg-chatlist)] border border-[var(--border-light)] shadow-2xl py-2 flex flex-col text-[14px] text-[var(--foreground)] font-medium">
                <button onClick={() => { setShowMenu(false); showToast("Archive coming soon"); }} className="flex items-center space-x-3 px-4 py-2.5 hover:bg-[var(--bg-hover)] transition-colors text-left w-full">
                  <Archive className="h-[18px] w-[18px] text-[var(--text-muted)]" strokeWidth={2} />
                  <span>View Archive</span>
                </button>
                <button onClick={() => { setShowMenu(false); showToast("Chat folders coming soon"); }} className="flex items-center space-x-3 px-4 py-2.5 hover:bg-[var(--bg-hover)] transition-colors text-left w-full">
                  <FolderPlus className="h-[18px] w-[18px] text-[var(--text-muted)]" strokeWidth={2} />
                  <span>Add chat folder</span>
                </button>
                <button onClick={() => { setShowMenu(false); showToast("Notification profiles coming soon"); }} className="flex items-center justify-between px-4 py-2.5 hover:bg-[var(--bg-hover)] transition-colors text-left w-full">
                  <div className="flex items-center space-x-3">
                    <Moon className="h-[18px] w-[18px] text-[var(--text-muted)]" strokeWidth={2} />
                    <span>Notification profile</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Search & Filter */}
      <div className="px-4 pb-3 flex space-x-2 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-[18px] w-[18px] text-[var(--text-muted)]" strokeWidth={2} />
          <input
            type="text"
            placeholder={isUnreadFilterActive ? "Search unread chats" : "Search"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 rounded-[8px] bg-[var(--bg-input)] py-2 pl-9 pr-4 text-[14px] focus:outline-none focus:ring-1 focus:ring-[var(--border-light)] placeholder-[var(--text-muted)] text-[var(--foreground)]"
          />
        </div>
        <button 
          onClick={() => setIsUnreadFilterActive(!isUnreadFilterActive)}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
            isUnreadFilterActive ? 'bg-[var(--signal-blue)] text-white' : 'hover:bg-[var(--bg-hover)] text-[var(--foreground)]'
          }`}
        >
          <ListFilter className="h-[20px] w-[20px]" strokeWidth={2} />
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-2 relative">
        {isUnreadFilterActive && (
          <div className="px-3 pt-1 pb-2">
            <span className="text-[14px] font-semibold text-[var(--foreground)]">Filtered by unread</span>
          </div>
        )}

        {filteredConversations.length === 0 && isUnreadFilterActive && (
          <div className="flex flex-col items-center justify-center pt-20 text-center">
            <h3 className="mb-3 text-[15px] font-semibold text-[var(--foreground)]">No unread chats</h3>
            <button 
              onClick={() => setIsUnreadFilterActive(false)}
              className="rounded-full bg-[var(--bg-hover)] px-4 py-2 text-[14px] font-semibold text-[var(--foreground)] hover:bg-[var(--border-light)] transition-colors"
            >
              Clear filter
            </button>
          </div>
        )}
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
              onClick={() => {
                 setActiveConversation(conv.id);
                 setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c));
              }}
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
                  {conv.unread_count > 0 && activeConversation !== conv.id && (
                    <span className="ml-2 flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-[var(--signal-blue)] px-[6px] text-[11px] font-bold text-white shadow-sm">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
