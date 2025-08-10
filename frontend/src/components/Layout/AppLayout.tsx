import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';

const AppLayout: React.FC = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const sidebarWidth = sidebarOpen ? 240 : 64;
  const marginLeft = !isMobile ? sidebarWidth : 0;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Header */}
      <AppHeader onMenuToggle={handleMenuToggle} />

      {/* Sidebar */}
      <AppSidebar
        open={sidebarOpen}
        onToggle={handleMenuToggle}
        variant={isMobile ? 'temporary' : 'persistent'}
      />

      {/* Main content area */}
      <main
        className={`
          flex-grow pt-16 px-6 py-6 min-h-screen bg-white
          transition-all duration-300 ease-sharp
        `}
        style={{
          marginLeft: `${marginLeft}px`,
        }}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
