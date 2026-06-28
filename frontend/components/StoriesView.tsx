import { Search, Plus, MoreHorizontal, Copy } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

export function StoriesSidebar() {
  const { user } = useAuthStore();

  return (
    <div className="flex h-full w-[320px] flex-col border-r border-[var(--border-light)] bg-[var(--bg-chatlist)] shrink-0 z-10">
      {/* Header */}
      <div className="flex h-[60px] items-center justify-between px-4">
        <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Stories</h1>
        <div className="flex space-x-1">
          <button className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--bg-hover)] text-[var(--foreground)] transition-colors">
            <Plus className="h-[22px] w-[22px]" strokeWidth={2} />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--bg-hover)] text-[var(--foreground)] transition-colors">
            <MoreHorizontal className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 pb-3">
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-[var(--text-muted)]" strokeWidth={2} />
          <input
            type="text"
            placeholder="Search"
            className="h-9 w-full rounded-full bg-[var(--bg-input)] pl-10 pr-4 text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--border-light)]"
          />
        </div>
      </div>

      {/* Profile My Story */}
      <div className="px-2">
        <button className="flex w-full items-center space-x-4 rounded-xl px-2 py-3 hover:bg-[var(--bg-hover)] transition-colors">
          <div className="relative">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-lg font-medium text-gray-800">
              {user?.display_name?.[0] || 'U'}
            </div>
            <div className="absolute bottom-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--signal-blue)] text-white border-2 border-[var(--bg-chatlist)]">
              <Plus className="h-3 w-3" strokeWidth={3} />
            </div>
          </div>
          <div className="flex flex-col items-start overflow-hidden">
            <span className="text-[15px] font-semibold text-[var(--foreground)]">My Story</span>
            <span className="text-[13px] text-[var(--signal-blue)]">Add a story</span>
          </div>
        </button>
      </div>

      {/* Empty State */}
      <div className="flex flex-1 flex-col items-center justify-end pb-12 text-center text-[var(--text-muted)]">
        <h3 className="mb-1 text-[15px] font-semibold text-[var(--foreground)]">No stories</h3>
        <p className="text-[13px]">New updates will appear here.</p>
      </div>
    </div>
  );
}

export function StoriesPane() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-[var(--background)] relative">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="mb-6 flex h-[100px] w-[100px] items-center justify-center rounded-full border-[1.5px] border-[var(--text-muted)] p-2 opacity-70">
           <Copy className="h-[35px] w-[35px] text-[var(--foreground)]" strokeWidth={2} />
        </div>
        <p className="mt-2 text-[15px] text-[var(--text-muted)] font-medium">Click + to add an update.</p>
      </div>
    </div>
  );
}
