import React, { useState, useEffect, useRef } from 'react';
import { Search, Sun, Moon, Bell, LogOut, User as UserIcon, Loader2, Camera } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { searchEntities, api, API_URL } from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const formData = new FormData();
      formData.append('file', e.target.files[0]);
      try {
        const response = await api.post('/auth/upload-profile-picture', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.status === 200) {
          window.location.reload(); // Reload to fetch updated user data
        } else {
          alert("Failed to upload photo.");
        }
      } catch (err) {
        console.error(err);
        alert("Network error while uploading photo.");
      }
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchEntities(debouncedQuery),
    enabled: debouncedQuery.length > 0
  });

  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Hide if scrolled down more than 10px, show if scrolled up or near top
      if (currentScrollY > lastScrollY.current + 10 && currentScrollY > 100) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY.current - 10 || currentScrollY < 50) {
        setIsVisible(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={cn(
      "h-24 flex items-center justify-between px-8 z-30 sticky top-0 bg-surface/95 backdrop-blur-xl shadow-sm border-b border-border/80 transition-transform duration-300 ease-in-out",
      isVisible ? "translate-y-0" : "-translate-y-full"
    )}>
      <div className="flex-1 max-w-xl relative">
        <motion.div 
          className={cn(
            "relative flex items-center bg-surface border rounded-full transition-all duration-300 w-full max-w-md",
            isFocused ? "border-accent shadow-[0_0_20px_rgba(16,185,129,0.15)] bg-surface" : "border-border hover:border-accent/50"
          )}
          initial={false}
          animate={{ scale: isFocused ? 1.01 : 1 }}
        >
          <Search className="absolute left-4 w-4 h-4 text-secondary" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Search anything..." 
            className="w-full h-10 pl-11 pr-16 text-sm bg-transparent border-none rounded-full focus:outline-none focus:ring-0 text-primary placeholder:text-secondary"
          />
          {isSearching && <Loader2 className="absolute right-4 w-4 h-4 text-accent animate-spin" />}
          {!isSearching && (
            <div className="absolute right-3 flex items-center gap-1">
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 font-mono text-[10px] font-medium text-secondary bg-white/5 rounded-md">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          )}
        </motion.div>
        
        <AnimatePresence>
          {searchQuery && searchResults && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              className="absolute top-full left-0 right-0 mt-4 bg-surface/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
            >
              {searchResults.length > 0 ? (
                <ul className="py-2">
                  {searchResults.map((res: any) => (
                    <li key={res.id}>
                      <button 
                        onClick={() => { navigate(res.url); setSearchQuery(''); }}
                        className="w-full text-left px-4 py-3 hover:bg-white/5 flex flex-col transition-colors group"
                      >
                        <span className="font-semibold text-sm text-primary group-hover:text-accent transition-colors">{res.title}</span>
                        <span className="text-xs text-secondary">{res.type}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-4 text-sm text-secondary text-center">No results found for "{searchQuery}"</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="flex items-center gap-4 ml-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-transform hover:scale-105 text-secondary hover:text-accent"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-transform hover:scale-105 text-secondary hover:text-accent"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-surface"></span>
            </button>
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-4 w-80 bg-surface/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                >
                  <div className="px-4 py-3 border-b border-border bg-black/5 dark:bg-white/5 flex justify-between items-center">
                    <span className="font-semibold text-sm">Notifications</span>
                    <span className="text-xs text-accent cursor-pointer hover:underline">Mark all as read</span>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    <div className="px-4 py-3 border-b border-border hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors">
                      <p className="text-sm font-medium text-primary mb-1">High Foot Traffic Alert</p>
                      <p className="text-xs text-secondary">Store visitor count has exceeded the daily average by 20% in the last hour.</p>
                      <p className="text-[10px] text-secondary mt-1 opacity-70">10 minutes ago</p>
                    </div>
                    <div className="px-4 py-3 border-b border-border hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors">
                      <p className="text-sm font-medium text-primary mb-1">New Sentiment Data</p>
                      <p className="text-xs text-secondary">Customer satisfaction score dropped slightly today. Review the dashboard.</p>
                      <p className="text-[10px] text-secondary mt-1 opacity-70">2 hours ago</p>
                    </div>
                    <div className="px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors">
                      <p className="text-sm font-medium text-primary mb-1">Weekly Report Generated</p>
                      <p className="text-xs text-secondary">Your AI-generated weekly retail performance report is ready to view.</p>
                      <p className="text-[10px] text-secondary mt-1 opacity-70">Yesterday</p>
                    </div>
                  </div>
                  <div className="p-2 border-t border-border bg-black/5 dark:bg-white/5 text-center">
                    <button className="text-xs font-medium text-accent hover:underline">View all notifications</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </header>
  );
}
