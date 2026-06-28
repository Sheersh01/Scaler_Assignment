import React, { useState } from 'react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { X, UserPlus, UserMinus, ShieldAlert, Users, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GroupSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: any;
  onUpdate: () => void;
}

export default function GroupSettingsModal({ isOpen, onClose, conversation, onUpdate }: GroupSettingsModalProps) {
  const { user } = useAuthStore();
  const [newMemberUsername, setNewMemberUsername] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen || !conversation || conversation.type !== 'GROUP') return null;

  const isAdmin = conversation.members.some(
    (m: any) => m.user_id === user?.id && m.role === 'ADMIN'
  );

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberUsername.trim()) return;
    setIsAdding(true);
    try {
      await api.post(`/conversations/${conversation.id}/members`, null, { 
        params: { username: newMemberUsername } 
      });
      setNewMemberUsername('');
      onUpdate();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to add member');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveMember = async (userId: number, displayName: string) => {
    if (!confirm(`Are you sure you want to remove ${displayName}?`)) return;
    try {
      await api.delete(`/conversations/${conversation.id}/members/${userId}`);
      onUpdate();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to remove member');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md overflow-hidden rounded-2xl bg-[var(--background)] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-light)] px-6 py-4">
              <div className="flex items-center space-x-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#90B3F9] text-white">
                  <Users className="h-7 w-7" strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--foreground)] leading-tight">{conversation.group_info?.name}</h2>
                  <p className="text-sm text-[var(--text-muted)]">{conversation.members.length} members</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Group Members
              </h3>

              <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3">
                {conversation.members.map((member: any) => {
                  const isMe = member.user_id === user?.id;
                  const isMemberAdmin = member.role === 'ADMIN';

                  return (
                    <div key={member.id} className="flex items-center justify-between rounded-xl bg-[var(--bg-hover)] px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--border-light)] overflow-hidden text-[var(--text-muted)]">
                          {member.user?.avatar ? (
                            <img src={member.user.avatar} className="h-full w-full object-cover" />
                          ) : (
                            <User className="h-5 w-5" strokeWidth={2} />
                          )}
                        </div>
                        <div>
                          <p className="text-[15px] font-semibold text-[var(--foreground)]">
                            {member.user.display_name} {isMe && <span className="text-sm font-normal text-[var(--text-muted)]">(You)</span>}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">@{member.user.username}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        {isMemberAdmin && (
                          <span className="flex items-center space-x-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                            <ShieldAlert className="h-3 w-3" />
                            <span>Admin</span>
                          </span>
                        )}

                        {isAdmin && !isMe && (
                          <button
                            onClick={() => handleRemoveMember(member.user_id, member.user.display_name)}
                            className="rounded-full p-1.5 text-red-500 hover:bg-red-100 transition-colors"
                            title="Remove Member"
                          >
                            <UserMinus className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Member Form for Admins */}
              {isAdmin && (
                <div className="mt-6 border-t border-[var(--border-light)] pt-6">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Add New Member
                  </h3>
                  <form onSubmit={handleAddMember} className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Username"
                      value={newMemberUsername}
                      onChange={(e) => setNewMemberUsername(e.target.value)}
                      className="flex-1 rounded-xl bg-[var(--bg-input)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--signal-blue)]"
                    />
                    <button
                      type="submit"
                      disabled={isAdding || !newMemberUsername.trim()}
                      className="flex items-center justify-center rounded-xl bg-[var(--signal-blue)] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add
                    </button>
                  </form>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
