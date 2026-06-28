'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useSocketStore } from '@/lib/store';
import api from '@/lib/api';
import GlobalNavigation from '@/components/GlobalNavigation';
import Sidebar from '@/components/Sidebar';
import ChatWindow from '@/components/ChatWindow';

export default function Home() {
  const { user, token } = useAuthStore();
  const { connect, disconnect } = useSocketStore();
  const router = useRouter();
  const [activeConversation, setActiveConversation] = useState<number | null>(null);
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
      <GlobalNavigation />
      <Sidebar 
        activeConversation={activeConversation} 
        setActiveConversation={setActiveConversation} 
      />
      
      {activeConversation ? (
        <ChatWindow conversationId={activeConversation} />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center bg-gray-50 dark:bg-zinc-900/50">
          <div className="text-center">
            <h2 className="text-2xl font-semibold">Signal Clone</h2>
            <p className="mt-2 text-gray-500">Select a conversation to start messaging</p>
          </div>
        </div>
      )}
    </div>
  );
}
