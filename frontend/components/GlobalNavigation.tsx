'use client';

import { MessageCircle, Phone, Settings, User, CircleDot } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { useToast } from '@/components/Toast';
import { useState } from 'react';
import SettingsModal from './SettingsModal';

interface GlobalNavigationProps {
  activeView: 'chats' | 'calls' | 'stories';
  setActiveView: (view: 'chats' | 'calls' | 'stories') => void;
  hideOnMobile?: boolean;
}

export default function GlobalNavigation({ activeView, setActiveView, hideOnMobile }: GlobalNavigationProps) {
  const { user } = useAuthStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className={`${hideOnMobile ? 'hidden md:flex' : 'flex'} w-full h-[60px] md:h-full md:w-[64px] flex-row md:flex-col items-center justify-around md:justify-between py-2 md:py-4 bg-[var(--bg-sidebar)] shrink-0 relative z-20 border-t md:border-t-0 md:border-r border-[var(--border-light)]`}>
      {/* Top Icons */}
      <div className="flex flex-row md:flex-col items-center space-x-4 md:space-x-0 md:space-y-4 w-full md:w-auto justify-around md:justify-start">
        {/* Profile Avatar */}
        <div className="relative md:mb-2 flex h-9 w-9">
          <button className="flex h-full w-full items-center justify-center rounded-full bg-gray-300 overflow-hidden hover:opacity-80 transition-opacity">
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile" className="h-full w-full object-cover" />
            ) : (
               <div className="flex h-full w-full items-center justify-center bg-[#E5BEC3] text-white font-bold text-sm">
                 {user?.display_name?.[0] || 'U'}
               </div>
            )}
          </button>
          <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 translate-x-1/4 translate-y-1/4 rounded-full ring-2 ring-[var(--bg-sidebar)] bg-[var(--signal-green)]"></span>
        </div>

        {/* Chats (Active) */}
        <button 
          onClick={() => setActiveView('chats')}
          className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
            activeView === 'chats' ? 'bg-[var(--bg-hover)] text-[var(--foreground)]' : 'hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--foreground)]'
          }`}
        >
          <MessageCircle className="h-[22px] w-[22px]" strokeWidth={2} />
        </button>

        {/* Calls */}
        <button 
          onClick={() => setActiveView('calls')}
          className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
            activeView === 'calls' ? 'bg-[var(--bg-hover)] text-[var(--foreground)]' : 'hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--foreground)]'
          }`}
        >
          <Phone className="h-[22px] w-[22px]" strokeWidth={2} />
        </button>

        {/* Stories */}
        <button 
          onClick={() => setActiveView('stories')}
          className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
            activeView === 'stories' ? 'bg-[var(--bg-hover)] text-[var(--foreground)]' : 'hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--foreground)]'
          }`}
        >
          <CircleDot className="h-[22px] w-[22px]" strokeWidth={2} />
        </button>
      </div>

      {/* Bottom Icons */}
      <div className="flex flex-row md:flex-col items-center space-x-4 md:space-x-0 md:space-y-2 w-auto md:w-full">
        <button onClick={() => setIsSettingsOpen(true)} className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors">
          <Settings className="h-[22px] w-[22px]" strokeWidth={2} />
        </button>
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
