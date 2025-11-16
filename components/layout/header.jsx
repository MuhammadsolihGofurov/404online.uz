import React from "react";
import { Bell, BellRing, BellRingIcon, Menu } from "lucide-react";
import Link from "next/link";

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

        <h1 className="sm:block hidden text-lg font-semibold text-gray-800">
          Dashboard
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* <Link href={"/notifications"}>
          <Bell />
        </Link> */}
        <div className="w-9 h-9 bg-main text-white rounded-full flex items-center justify-center overflow-hidden">
          <img
            src={user?.avatar}
            alt={user?.full_name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </header>
  );
}
