import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Lock, Bell, Palette, Smartphone, LogOut, Info, Settings as SettingsIcon, MessageCircle, Phone, PieChart, History, Heart, Pen, AtSign, ChevronLeft } from 'lucide-react';
import { useAuthStore, useThemeStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

export default function SettingsModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [showMobileContent, setShowMobileContent] = useState(false);
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const router = useRouter();

  if (!isOpen) return null;

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'chats', label: 'Chats', icon: MessageCircle },
    { id: 'calls', label: 'Calls', icon: Phone },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Lock },
    { id: 'data', label: 'Data usage', icon: PieChart },
    { id: 'backups', label: 'Backups', icon: History },
    { id: 'donate', label: 'Donate to Signal', icon: Heart },
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
            className="flex h-full w-full overflow-hidden bg-[var(--background)] shadow-2xl"
          >
            {/* Sidebar */}
            <div className={`shrink-0 border-r border-[var(--border-light)] bg-[var(--background)] flex-col pt-4 md:pt-12 ${!showMobileContent ? 'flex w-full md:w-[320px]' : 'hidden md:flex md:w-[320px]'}`}>
              <div className="px-6 pb-4 flex items-center justify-between">
                <h2 className="text-[22px] font-semibold text-[var(--foreground)] tracking-tight">Settings</h2>
                <button onClick={onClose} className="md:hidden rounded-full p-2 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition-colors">
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto px-4 space-y-1 pb-4">
                {/* Profile Card Button */}
                <button
                  onClick={() => { setActiveTab('profile'); setShowMobileContent(true); }}
                  className={`mb-4 flex w-full items-center space-x-4 rounded-2xl p-4 text-left transition-colors ${
                    activeTab === 'profile'
                      ? 'bg-[var(--bg-hover)]'
                      : 'hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-lg font-medium text-gray-800">
                    {user?.display_name?.[0] || 'U'}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-[15px] font-semibold text-[var(--foreground)]">{user?.display_name}</p>
                    <p className="truncate text-[13px] text-[var(--text-muted)]">{user?.phone || 'No phone number'}</p>
                  </div>
                </button>

                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setShowMobileContent(true); }}
                    className={`flex w-full items-center space-x-4 rounded-xl px-4 py-2.5 text-[14px] font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-[var(--bg-hover)] text-[var(--foreground)]'
                        : 'text-[var(--foreground)] hover:bg-[var(--bg-hover)]'
                    }`}
                  >
                    <tab.icon className="h-5 w-5 text-[var(--text-muted)]" strokeWidth={2} />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="p-4 border-t border-[var(--border-light)]">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center space-x-4 rounded-xl px-4 py-2.5 text-[14px] font-medium text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="h-5 w-5" strokeWidth={2} />
                  <span>Log Out</span>
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className={`relative flex-1 flex-col bg-[var(--background)] pt-12 ${showMobileContent ? 'flex' : 'hidden md:flex'}`}>
              <button
                onClick={() => setShowMobileContent(false)}
                className="absolute left-4 top-4 md:hidden rounded-full p-2 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition-colors"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={onClose}
                className="absolute right-4 md:right-6 top-4 md:top-6 rounded-full p-2 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition-colors hidden md:block"
              >
                <X className="h-6 w-6" />
              </button>

              {activeTab === 'profile' ? (
                <div className="flex h-full flex-col items-center pt-8">
                  <h3 className="text-lg font-semibold text-[var(--foreground)] mb-10">Profile</h3>
                  
                  <div className="flex flex-col items-center mb-10">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-3xl font-medium text-gray-800 shadow-sm mb-4">
                      {user?.display_name?.[0] || 'U'}
                    </div>
                    <button className="rounded-full bg-[var(--bg-hover)] px-4 py-1.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--border-light)] transition-colors">
                      Edit photo
                    </button>
                  </div>

                  <div className="w-full max-w-lg space-y-6 px-8">
                    {/* Name */}
                    <div className="flex items-start space-x-4 border-b border-[var(--border-light)] pb-6">
                      <User className="mt-1 h-5 w-5 text-[var(--text-muted)]" />
                      <div>
                        <p className="text-[15px] font-medium text-[var(--foreground)]">{user?.display_name}</p>
                      </div>
                    </div>

                    {/* About */}
                    <div className="flex items-start space-x-4 border-b border-[var(--border-light)] pb-6">
                      <Pen className="mt-1 h-5 w-5 text-[var(--text-muted)]" />
                      <div>
                        <p className="text-[15px] font-medium text-[var(--foreground)] mb-1">About</p>
                        <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
                          Your profile and changes to it will be visible to people you message, contacts and groups.
                        </p>
                      </div>
                    </div>

                    {/* Username */}
                    <div className="flex items-start space-x-4 border-b border-[var(--border-light)] pb-6">
                      <AtSign className="mt-1 h-5 w-5 text-[var(--text-muted)]" />
                      <div>
                        <p className="text-[15px] font-medium text-[var(--foreground)] mb-1">Username</p>
                        <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
                          People can now message you using your optional username so you don't have to give out your phone number.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : activeTab === 'appearance' ? (
                <div className="flex h-full flex-col pt-8 px-8">
                  <h3 className="text-lg font-semibold text-[var(--foreground)] mb-10 text-center">Appearance</h3>
                  
                  <div className="w-full max-w-lg mx-auto space-y-6">
                    <div className="flex items-start space-x-4 border-b border-[var(--border-light)] pb-6">
                      <Palette className="mt-1 h-5 w-5 text-[var(--text-muted)]" />
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-[15px] font-medium text-[var(--foreground)]">Theme</p>
                        </div>
                        <p className="text-[13px] text-[var(--text-muted)] leading-relaxed mb-4">
                          Choose how Signal looks to you.
                        </p>
                        
                        <div className="flex bg-[var(--bg-hover)] p-1 rounded-xl">
                          <button
                            onClick={() => setTheme('light')}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${theme === 'light' ? 'bg-[var(--background)] shadow-sm text-[var(--foreground)]' : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'}`}
                          >
                            Light
                          </button>
                          <button
                            onClick={() => setTheme('dark')}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${theme === 'dark' ? 'bg-[var(--background)] shadow-sm text-[var(--foreground)]' : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'}`}
                          >
                            Dark
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-[var(--text-muted)]">
                  <Info className="mb-4 h-12 w-12 opacity-50" />
                  <h4 className="mb-2 text-xl font-semibold text-[var(--foreground)]">Coming Soon</h4>
                  <p className="max-w-sm text-sm leading-relaxed">
                    The {tabs.find(t => t.id === activeTab)?.label?.toLowerCase()} settings page is currently under development. Please check back in a future update!
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
