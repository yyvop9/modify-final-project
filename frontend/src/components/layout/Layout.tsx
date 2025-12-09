import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    // 🚨 [핵심 수정] 여기에 배경 그라데이션을 넣는다!
    <div
      className="min-h-screen transition-colors duration-300
      bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-slate-900
    "
    >
      <Header onMenuClick={() => setIsSidebarOpen(true)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* 헤더가 fixed라서 내용이 가려지지 않게 pt-16 (padding-top)을 줌.
         배경은 이미 Layout에 깔려있으니 걱정 NO!
      */}
      <main className="pt-16 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
