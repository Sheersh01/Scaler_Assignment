import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Lock, Bell, Palette, Smartphone, LogOut, Info } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

export default function SettingsModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [activeTab, setActiveTab] = useState('account');
  const { user, logout } = useAuthStore();
  const router = useRouter();

  if (!isOpen) return null;

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'privacy', label: 'Privacy', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'linked_devices', label: 'Linked Devices', icon: Smartphone },
  ];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex h-[80vh] w-[90vw] max-w-4xl overflow-hidden rounded-2xl bg-[var(--background)] shadow-2xl"
          >
            {/* Sidebar */}
            <div className="w-[280px] shrink-0 border-r border-[var(--border-light)] bg-[var(--bg-chatlist)] flex flex-col">
              <div className="p-6 pb-2">
                <h2 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Settings</h2>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-[var(--signal-blue)] text-white'
                        : 'text-[var(--foreground)] hover:bg-[var(--bg-hover)]'
                    }`}
                  >
                    <tab.icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="p-3 border-t border-[var(--border-light)]">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="relative flex-1 flex flex-col bg-[var(--background)]">
              {/* Header */}
              <div className="flex h-[60px] shrink-0 items-center justify-between border-b border-[var(--border-light)] px-6">
                <h3 className="text-lg font-semibold text-[var(--foreground)]">
                  {tabs.find(t => t.id === activeTab)?.label}
                </h3>
                <button
                  onClick={onClose}
                  className="rounded-full p-2 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Content Placeholder */}
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-[var(--text-muted)]">
                <Info className="mb-4 h-12 w-12 opacity-50" />
                <h4 className="mb-2 text-xl font-semibold text-[var(--foreground)]">Coming Soon</h4>
                <p className="max-w-sm text-sm leading-relaxed">
                  The {tabs.find(t => t.id === activeTab)?.label?.toLowerCase()} settings page is currently under development. Please check back in a future update!
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
