"use client";

import { Search, Bell, Mail, Menu } from "lucide-react";

interface TopbarProps {
  storeName: string;
  storeSubdomain: string;
  isCollapsed: boolean;
  onToggleSidebar: () => void;
  isMobile?: boolean;
}

export function Topbar({
  onToggleSidebar,
  isMobile = false,
}: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 h-14 bg-white border-b border-zinc-200 flex items-center px-5 gap-4">
      {/* Mobile toggle */}
      {isMobile && (
        <button onClick={onToggleSidebar} className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 lg:hidden">
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Search — left side */}
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Search"
          className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent placeholder-zinc-400"
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right icons */}
      <div className="flex items-center gap-1">
        <button className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 transition-colors relative">
          <Bell className="w-5 h-5" />
        </button>
        <button className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 transition-colors">
          <Mail className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}


