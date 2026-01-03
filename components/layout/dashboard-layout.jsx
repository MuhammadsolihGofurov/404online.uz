import React, { useEffect, useState } from "react";
import Sidebar from "./sidebar";
import Header from "./dashboard-header";

export default function DashboardLayout({
  children,
  user,
  hideSidebar = false,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(!hideSidebar);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  useEffect(() => {
    if (hideSidebar || typeof window === "undefined") return;

    const handleResize = () => {
      if (window.innerWidth < 1200) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const mainClass = hideSidebar
    ? "flex-1 w-full overflow-hidden"
    : "flex-1 px-5 pt-7 pb-20 overflow-y-auto w-full";

  return (
    <div className="flex h-screen font-poppins bg-dashboardBg w-full">
      {/* Sidebar */}
      {!hideSidebar && (
        <Sidebar user={user} isOpen={sidebarOpen} closeSidebar={closeSidebar} />
      )}

      {/* Main Content */}
      <div className="flex flex-col flex-1 transition-all duration-300 w-full">
        <Header user={user} toggleSidebar={toggleSidebar} />
        <main className={mainClass}>{children}</main>
      </div>
    </div>
  );
}
