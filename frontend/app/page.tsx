'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useSocketStore } from '@/lib/store';
import api from '@/lib/api';
import GlobalNavigation from '@/components/GlobalNavigation';
import Sidebar from '@/components/Sidebar';
import ChatWindow from '@/components/ChatWindow';
import { CallsSidebar, CallsPane } from '@/components/CallsView';
import { StoriesSidebar, StoriesPane } from '@/components/StoriesView';

export default function Home() {
  const { user, token } = useAuthStore();
  const { connect, disconnect } = useSocketStore();
  const router = useRouter();
  const [activeConversation, setActiveConversation] = useState<number | null>(null);
  const [activeView, setActiveView] = useState<'chats' | 'calls' | 'stories'>('chats');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      if (!token) {
        router.push('/login');
      } else if (!user) {
        // Fetch user if missing from store but token exists (page reload)
        api.get('/me').then(res => {
          useAuthStore.getState().setAuth(res.data, token);
        }).catch(() => {
          useAuthStore.getState().logout();
          router.push('/login');
        });
      }
    }
  }, [token, user, router, mounted]);

  useEffect(() => {
    if (user) {
      connect(user.id);
    }
    return () => disconnect();
  }, [user, connect, disconnect]);

  if (!mounted || !token || !user) return null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--background)] text-[var(--foreground)] font-sans antialiased">
      <GlobalNavigation activeView={activeView} setActiveView={setActiveView} />
      
      {activeView === 'chats' && (
        <>
          <Sidebar 
            activeConversation={activeConversation} 
            setActiveConversation={setActiveConversation} 
          />
          {activeConversation ? (
            <ChatWindow conversationId={activeConversation} />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center bg-[var(--background)] relative">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="mb-6 flex h-[110px] w-[110px] items-center justify-center rounded-full border-[2.5px] border-dashed border-[var(--text-muted)] p-2">
                   <svg width="65" height="65" viewBox="0 0 24 24" fill="var(--foreground)" stroke="var(--foreground)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-90">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                   </svg>
                </div>
                <h2 className="text-[20px] font-semibold text-[var(--foreground)] tracking-tight">Welcome to Signal</h2>
                <p className="mt-2 text-[14px] text-[var(--signal-blue)] cursor-pointer hover:underline font-medium">See what's new in this update</p>
              </div>
              
              <div className="absolute bottom-6 text-[13px] text-[var(--text-muted)]">
                Signal is a 501c3 nonprofit
              </div>
            </div>
          )}
        </>
      )}

      {activeView === 'calls' && (
        <>
          <CallsSidebar />
          <CallsPane />
        </>
      )}

      {activeView === 'stories' && (
        <>
          <StoriesSidebar />
          <StoriesPane />
        </>
      )}
    </div>
  );
}
