import { Search, Phone, Link2, MoreHorizontal } from 'lucide-react';

export function CallsSidebar() {
  return (
    <div className="flex h-full w-[320px] flex-col border-r border-[var(--border-light)] bg-[var(--bg-chatlist)] shrink-0 z-10">
      {/* Header */}
      <div className="flex h-[60px] items-center justify-between px-4">
        <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Calls</h1>
        <div className="flex space-x-1">
          <button className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--bg-hover)] text-[var(--foreground)] transition-colors">
            <Phone className="h-[18px] w-[18px]" strokeWidth={2} />
            <span className="absolute ml-[12px] mt-[-10px] text-[10px] font-bold">+</span>
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

      {/* Action Buttons */}
      <div className="px-2">
        <button className="flex w-full items-center space-x-4 rounded-xl px-2 py-3 hover:bg-[var(--bg-hover)] transition-colors">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--bg-hover)] text-[var(--foreground)]">
            <Link2 className="h-5 w-5" strokeWidth={2} />
          </div>
          <span className="text-[15px] font-semibold text-[var(--foreground)]">Create a Call Link</span>
        </button>
      </div>

      {/* Empty State */}
      <div className="flex flex-1 flex-col items-center justify-end pb-12 text-center text-[var(--text-muted)]">
        <h3 className="mb-1 text-[15px] font-semibold text-[var(--foreground)]">No calls</h3>
        <p className="text-[13px]">Recent calls will appear here.</p>
      </div>
    </div>
  );
}

export function CallsPane() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-[var(--background)] relative">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="mb-6 flex h-[100px] w-[100px] items-center justify-center rounded-full border-[1.5px] border-[var(--text-muted)] p-2 opacity-70">
           <Phone className="h-[35px] w-[35px] text-[var(--foreground)]" strokeWidth={2} />
        </div>
        <p className="mt-2 text-[15px] text-[var(--text-muted)] font-medium">Click <Phone className="inline h-4 w-4 mx-1" /> to start a new voice or video call.</p>
      </div>
    </div>
  );
}
