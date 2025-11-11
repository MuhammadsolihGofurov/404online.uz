import React, { useEffect, useState } from "react";
import Sidebar from "./sidebar";
import Header from "./header";

export default function DashboardLayout({ children, user }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 640) {
        setSidebarOpen(false); // mobile default close
      } else {
        setSidebarOpen(true); // desktop default open
      }
    }
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex min-h-screen font-poppins bg-dashboardBg">
      {/* Sidebar */}
      <Sidebar user={user} isOpen={sidebarOpen} closeSidebar={closeSidebar} />

      {/* Main Content */}
      <div className="flex flex-col flex-1 transition-all duration-300">
        <Header user={user} toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
