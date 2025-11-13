import React, { useEffect, useState } from "react";
import Sidebar from "./sidebar";
import Header from "./header";

export default function DashboardLayout({ children, user }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleResize = () => {
        if (window.innerWidth < 650) {
          setSidebarOpen(false); 
        } else {
          setSidebarOpen(true); 
        }
      };

      handleResize();
      window.addEventListener("resize", handleResize);

      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);


  return (
    <div className="flex h-screen font-poppins bg-dashboardBg">
      {/* Sidebar */}
      <Sidebar user={user} isOpen={sidebarOpen} closeSidebar={closeSidebar} />

      {/* Main Content */}
      <div className="flex flex-col flex-1 transition-all duration-300">
        <Header user={user} toggleSidebar={toggleSidebar} />
        <main className="flex-1 px-5 py-7 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
