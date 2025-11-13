import React from "react";
import { Menu } from "lucide-react";

export default function Header({ user, toggleSidebar }) {
  return (
    <header className="flex items-center justify-between bg-white shadow-sm px-6 py-4">
      <div className="flex items-center gap-3">
        {/* Hamburger button */}
        <button
          onClick={toggleSidebar}
          type="button"
          className="p-2 rounded-md hover:bg-gray-100 transition-colors"
        >
          <Menu size={22} />
        </button>

        <h1 className="text-lg font-semibold text-gray-800">Dashboard</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-800">{user?.full_name}</p>
          <p className="text-xs text-gray-500">{user?.role}</p>
        </div>
        <div className="w-9 h-9 bg-main text-white rounded-full flex items-center justify-center">
          {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
        </div>
      </div>
    </header>
  );
}
