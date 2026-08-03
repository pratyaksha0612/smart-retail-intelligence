import React, { useState, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  ScanFace, 
  MessageSquareHeart, 
  Bot, 
  BarChart3, 
  BookOpen, 
  Settings,
  LogOut,
  User as UserIcon,
  ChevronUp
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { api, API_URL } from '../../lib/api';

const navItems = [
  { label: 'Overview', icon: LayoutDashboard, path: '/' },
  { label: 'Customer Intelligence', icon: Users, path: '/customers' },
  { label: 'Vision', icon: ScanFace, path: '/vision' },
  { label: 'Sentiment', icon: MessageSquareHeart, path: '/sentiment' },
  { label: 'Chatbot', icon: Bot, path: '/chatbot' },
  { label: 'Analytics', icon: BarChart3, path: '/analytics' },
  { label: 'API Docs', icon: BookOpen, path: '/api-docs' },
  { label: 'Settings', icon: Settings, path: '/settings' },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, token } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const formData = new FormData();
      formData.append('file', e.target.files[0]);
      try {
        const response = await api.post('/auth/upload-profile-picture', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.status === 200) {
          window.location.reload();
        } else {
          alert("Failed to upload photo.");
        }
      } catch (err) {
        console.error(err);
        alert("Network error while uploading photo.");
      }
    }
  };

  return (
    <aside className="w-64 h-screen bg-surface/30 backdrop-blur-xl border-r border-white/5 flex flex-col fixed left-0 top-0 z-40">
      <div className="h-24 flex items-center px-6">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-xl object-cover shadow-[0_0_15px_rgba(99,102,241,0.4)]" />
          <span className="font-bold text-[17px] tracking-tight text-primary dark:text-white">
            Smart Retail AI
          </span>
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "relative flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors group",
                isActive 
                  ? "text-indigo-900 dark:text-white" 
                  : "text-secondary hover:text-primary dark:hover:text-white"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <item.icon className={cn(
                "w-5 h-5 relative z-10 transition-transform group-hover:scale-110", 
                isActive 
                  ? "text-indigo-600 dark:text-indigo-400" 
                  : "text-secondary group-hover:text-primary dark:group-hover:text-white"
              )} />
              <span className="relative z-10">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-border/50 relative">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handlePhotoUpload} 
          accept="image/*" 
          className="hidden" 
        />
        
        <AnimatePresence>
          {showProfileMenu && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-full left-4 mb-2 w-[calc(100%-2rem)] bg-surface/95 backdrop-blur-xl border border-border/80 rounded-2xl shadow-xl py-2 z-50 overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-border/50 bg-black/5 dark:bg-white/5">
                <p className="text-sm font-bold text-primary truncate">{user?.full_name || 'Admin User'}</p>
                <p className="text-xs text-secondary truncate mt-0.5">{user?.email || 'admin@smartretail.com'}</p>
              </div>
              <div className="p-2 space-y-1">
                <button
                  onClick={() => {
                    navigate('/settings');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-3 py-2.5 text-sm font-medium text-secondary hover:text-primary hover:bg-black/5 dark:hover:bg-white/5 rounded-xl flex items-center gap-2 transition-colors"
                >
                  <UserIcon className="w-4 h-4" />
                  Profile
                </button>
                <button
                  onClick={logout}
                  className="w-full text-left px-3 py-2.5 text-sm font-medium text-error hover:bg-error/10 rounded-xl flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Log out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 border border-transparent hover:border-border/50 transition-all text-left"
        >
          <div className="flex items-center gap-3 truncate">
            {user?.profile_picture_path ? (
              <img src={`${API_URL}/${user.profile_picture_path}?t=${new Date().getTime()}`} alt="Profile" className="w-9 h-9 rounded-full object-cover shadow-sm border border-border shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-medium text-sm shadow-sm shrink-0">
                {user?.full_name?.charAt(0) || 'A'}
              </div>
            )}
            <div className="truncate">
              <span className="text-sm font-semibold text-primary block truncate">{user?.full_name || 'Admin'}</span>
              <span className="text-[10px] text-secondary font-medium uppercase tracking-wider">{user?.role || 'Admin'}</span>
            </div>
          </div>
          <ChevronUp className={cn("w-4 h-4 text-secondary shrink-0 transition-transform duration-200", showProfileMenu && "rotate-180")} />
        </button>
      </div>
    </aside>
  );
}
