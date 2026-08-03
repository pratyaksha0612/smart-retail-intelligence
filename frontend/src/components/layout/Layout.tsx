import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { ReactLenis } from 'lenis/react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ThemeProvider } from '../../contexts/ThemeContext';

export function Layout() {
  return (
    <ReactLenis root>
      {/* Animated Mesh Background */}
      <div className="animated-mesh-bg" />
      
      <div className="flex min-h-screen text-primary selection:bg-accent/20 relative z-10">
        <Sidebar />
        <div className="flex-1 ml-64 flex flex-col">
          <Header />
          <main className="flex-1 p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </ReactLenis>
  );
}
