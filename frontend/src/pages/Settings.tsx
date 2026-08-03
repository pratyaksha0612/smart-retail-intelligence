import React, { useState, useRef } from 'react';
import { 
  Settings as SettingsIcon, Bell, Key, User, Shield, Monitor, ScanFace, 
  Clock, Database, Lock, LogOut, CheckCircle2, AlertCircle, HardDrive, 
  Activity, Fingerprint, Camera, Info, Server, Layers
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { api, API_URL } from '../lib/api';
import { FaceOnboarding } from '../components/biometrics/FaceOnboarding';

export function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isUploading, setIsUploading] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch biometric status
  const { data: bioStatus, refetch: refetchBio } = useQuery({
    queryKey: ['biometrics-status'],
    queryFn: async () => {
      if (!token) return null;
      const { data } = await api.get('/biometrics/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data;
    },
    enabled: !!token
  });

  const handleDeleteFace = async () => {
    if (confirm("Are you sure you want to completely remove your biometric profile? This will delete all stored facial embeddings.")) {
      await api.delete('/biometrics/delete', { headers: { Authorization: `Bearer ${token}` } });
      refetchBio();
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const formData = new FormData();
      formData.append('file', e.target.files[0]);
      setIsUploading(true);
      try {
        await api.post('/auth/upload-profile-picture', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        refetchBio();
        window.location.reload(); // Reload to reflect changes globally
      } catch (err) {
        console.error(err);
        alert("Failed to upload photo or detect face.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const tabs = [
    { id: 'profile', icon: User, label: 'General Profile', desc: 'Personal info & activity' },
    { id: 'biometric', icon: ScanFace, label: 'Biometric Profile', desc: 'Facial recognition data' },
    { id: 'permissions', icon: Shield, label: 'System Permissions', desc: 'Roles and access levels' },
    { id: 'security', icon: Lock, label: 'Security & Storage', desc: 'Passwords and disk usage' },
    { id: 'appearance', icon: Monitor, label: 'Appearance', desc: 'Theme and layout' },
    { id: 'notifications', icon: Bell, label: 'Notifications', desc: 'Alert preferences' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {isEnrolling && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <FaceOnboarding 
            onComplete={() => { setIsEnrolling(false); refetchBio(); }} 
            onCancel={() => setIsEnrolling(false)} 
          />
        </div>
      )}
      
      {/* Profile Header */}
      <div className="bg-surface/60 backdrop-blur-md p-8 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="flex items-center gap-6 relative z-10">
          <div className="relative">
            {user?.profile_picture_path ? (
              <img src={`${API_URL}/${user.profile_picture_path}?t=${new Date().getTime()}`} alt="Profile" className="w-24 h-24 rounded-2xl object-cover border-4 border-background shadow-xl" />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-accent to-purple-500 flex items-center justify-center text-white text-4xl font-bold border-4 border-background shadow-xl">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : <User className="w-10 h-10" />}
              </div>
            )}
            {bioStatus?.is_registered && (
              <div className="absolute -bottom-2 -right-2 bg-success text-white p-1.5 rounded-full border-2 border-background shadow-sm" title="Biometrically Verified">
                <ScanFace className="w-4 h-4" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">{user?.full_name || 'Administrator'}</h1>
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 bg-accent/10 text-accent text-xs font-bold rounded-lg uppercase tracking-wider">{user?.role || 'Admin'}</span>
              <span className="text-secondary font-medium text-sm flex items-center gap-1"><Lock className="w-3.5 h-3.5"/> {user?.email || 'admin@smartretail.com'}</span>
            </div>
          </div>
        </div>
        <div className="relative z-10 flex gap-3">
          <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="px-5 py-2.5 bg-background border border-border rounded-xl font-semibold text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors shadow-sm disabled:opacity-50">
            {isUploading ? 'Uploading...' : 'Update Photo'}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="w-full lg:w-72 flex-shrink-0 space-y-2">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-200 group border",
                activeTab === tab.id 
                  ? "bg-surface border-border shadow-sm ring-1 ring-accent/20" 
                  : "bg-transparent border-transparent hover:bg-surface/40 hover:border-border"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                activeTab === tab.id ? "bg-accent text-white" : "bg-background border border-border text-secondary group-hover:text-primary"
              )}>
                <tab.icon className="w-5 h-5" />
              </div>
              <div>
                <p className={cn("font-bold text-sm transition-colors", activeTab === tab.id ? "text-primary" : "text-secondary group-hover:text-primary")}>{tab.label}</p>
                <p className="text-xs text-secondary/70 mt-0.5">{tab.desc}</p>
              </div>
            </button>
          ))}
        </aside>

        {/* Content Area */}
        <div className="flex-1">
          
          {/* GENERAL PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="bg-surface/60 backdrop-blur-md border border-border rounded-2xl p-8 shadow-sm">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><User className="w-5 h-5 text-accent"/> Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-secondary uppercase tracking-wider">Full Name</label>
                    <input type="text" defaultValue={user?.full_name || ''} className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all shadow-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-secondary uppercase tracking-wider">Email Address</label>
                    <input type="email" defaultValue={user?.email || ''} className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all shadow-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-secondary uppercase tracking-wider">Account Created</label>
                    <div className="px-4 py-3 bg-background border border-border rounded-xl text-sm font-medium text-secondary flex items-center gap-2 shadow-sm">
                      <Clock className="w-4 h-4 text-accent" /> {user?.joined_date ? new Date(user.joined_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'August 15, 2023'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-secondary uppercase tracking-wider">Last Login</label>
                    <div className="px-4 py-3 bg-background border border-border rounded-xl text-sm font-medium text-secondary flex items-center gap-2 shadow-sm">
                      <Activity className="w-4 h-4 text-success" /> {user?.last_login ? new Date(user.last_login).toLocaleString() : 'Active right now'}
                    </div>
                  </div>
                </div>
                <div className="pt-8 mt-8 border-t border-border flex justify-end">
                  <button className="px-6 py-2.5 bg-accent text-white font-bold rounded-xl text-sm hover:bg-accent/90 transition-colors shadow-md hover:shadow-accent/25">
                    Save Changes
                  </button>
                </div>
              </div>

              <div className="bg-surface/60 backdrop-blur-md border border-border rounded-2xl p-8 shadow-sm">
                 <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Activity className="w-5 h-5 text-accent"/> Recent Activity</h3>
                 <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-background border border-border rounded-xl">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent"><SettingsIcon className="w-5 h-5"/></div>
                          <div>
                            <p className="font-bold text-sm">System configuration updated</p>
                            <p className="text-xs text-secondary font-medium">Modified global threshold settings</p>
                          </div>
                       </div>
                       <span className="text-xs font-bold text-secondary">2 hours ago</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-background border border-border rounded-xl">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-success"><ScanFace className="w-5 h-5"/></div>
                          <div>
                            <p className="font-bold text-sm">Biometric login successful</p>
                            <p className="text-xs text-secondary font-medium">Recognized with 99.2% confidence</p>
                          </div>
                       </div>
                       <span className="text-xs font-bold text-secondary">Yesterday</span>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {/* BIOMETRIC PROFILE */}
          {activeTab === 'biometric' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
              
              <div className={cn(
                "border rounded-2xl p-8 relative overflow-hidden shadow-sm transition-all duration-500",
                bioStatus?.is_registered ? "bg-surface/60 border-border" : "bg-gradient-to-br from-accent/5 to-purple-500/10 border-accent/20"
              )}>
                <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none">
                  <Fingerprint className="w-64 h-64 -mb-10 -mr-10 text-accent" />
                </div>
                
                <div className="relative z-10">
                  <h3 className="text-2xl font-extrabold mb-3 flex items-center gap-3">
                    <ScanFace className={cn("w-7 h-7", bioStatus?.is_registered ? "text-success" : "text-accent")} />
                    Face Registration Status
                  </h3>
                  <p className="text-secondary font-medium max-w-xl mb-8 leading-relaxed">
                    Register your face with a multi-pose dataset to enable seamless, passwordless access to restricted areas and instant profile retrieval via the smart camera network.
                  </p>
                  
                  {bioStatus?.is_registered ? (
                    <div className="space-y-8">
                      <div className="inline-flex items-center gap-2 text-success font-bold bg-success/10 border border-success/20 px-4 py-2 rounded-xl">
                        <CheckCircle2 className="w-5 h-5" /> Verified and Active
                      </div>
                      <div className="flex gap-4">
                        <button onClick={() => setIsEnrolling(true)} className="px-6 py-2.5 bg-background border-2 border-border text-primary font-bold rounded-xl text-sm hover:border-accent hover:text-accent transition-colors shadow-sm">
                          Re-enroll Face Data
                        </button>
                        <button onClick={handleDeleteFace} className="px-6 py-2.5 bg-error/10 border border-error/20 text-error font-bold rounded-xl text-sm hover:bg-error/20 transition-colors">
                          Delete Profile
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                       <div className="inline-flex items-center gap-2 text-warning font-bold bg-warning/10 border border-warning/20 px-4 py-2 rounded-xl">
                        <AlertCircle className="w-5 h-5" /> Action Required: Not Registered
                      </div>
                      <div>
                        <button onClick={() => setIsEnrolling(true)} className="px-8 py-3 bg-accent text-white font-bold rounded-xl text-sm hover:bg-accent/90 transition-all shadow-lg hover:shadow-accent/25 hover:-translate-y-0.5 flex items-center gap-2">
                          <Camera className="w-5 h-5" /> Begin Smart Enrollment
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {bioStatus?.is_registered && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="bg-surface/60 backdrop-blur-md border border-border rounded-2xl p-8 shadow-sm">
                    <h4 className="text-lg font-bold mb-6 flex items-center gap-2"><Layers className="w-5 h-5 text-accent"/> Biometric Meta</h4>
                    <div className="space-y-4 text-sm font-medium">
                      <div className="flex justify-between items-center p-3 bg-background rounded-xl border border-border">
                        <span className="text-secondary">Last Updated</span>
                        <span className="font-bold">{bioStatus.last_updated}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-background rounded-xl border border-border">
                        <span className="text-secondary">Embedding Version</span>
                        <span className="font-bold bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded">v{bioStatus.version}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-background rounded-xl border border-border">
                        <span className="text-secondary">Stored Samples</span>
                        <span className="font-bold">{bioStatus.samples_count} HD Images</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-background rounded-xl border border-border">
                        <span className="text-secondary">Model Quality Score</span>
                        <span className="font-bold text-success flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> {bioStatus.quality_score.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-surface/60 backdrop-blur-md border border-border rounded-2xl p-8 shadow-sm">
                    <h4 className="text-lg font-bold mb-6 flex items-center gap-2"><Activity className="w-5 h-5 text-accent"/> Recognition Stats</h4>
                    <div className="space-y-4 text-sm font-medium">
                      <div className="flex justify-between items-center p-3 bg-background rounded-xl border border-border">
                        <span className="text-secondary">Total Recognitions</span>
                        <span className="font-bold">1,245 events</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-background rounded-xl border border-border">
                        <span className="text-secondary">Average Confidence</span>
                        <span className="font-bold text-success flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> 98.4%</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-background rounded-xl border border-border">
                        <span className="text-secondary">Last Seen Camera</span>
                        <span className="font-bold text-primary">Entrance_Main_01</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-background rounded-xl border border-border">
                        <span className="text-secondary">False Rejection Rate</span>
                        <span className="font-bold text-success">&lt; 0.01%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SYSTEM PERMISSIONS */}
          {activeTab === 'permissions' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="bg-surface/60 backdrop-blur-md border border-border rounded-2xl p-8 shadow-sm">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Shield className="w-5 h-5 text-accent"/> Role & Access Levels</h3>
                <div className="p-4 bg-accent/5 border border-accent/20 rounded-xl mb-6">
                  <p className="text-sm font-medium text-accent flex items-center gap-2"><Info className="w-4 h-4"/> Your role is set to <strong>Administrator</strong>. You have unrestricted access to all platform features.</p>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Dashboard Analytics", desc: "View high-level analytics and real-time metrics", granted: true },
                    { label: "Customer Intelligence", desc: "Manage CRM, view sentiment and visit history", granted: true },
                    { label: "Biometric Data Access", desc: "Access raw biometric embedding data and logs", granted: user?.role === 'admin' },
                    { label: "System Configuration", desc: "Modify system-level environment and AI parameters", granted: user?.role === 'admin' },
                    { label: "API Key Generation", desc: "Create and revoke external API keys", granted: user?.role === 'admin' },
                  ].map((perm, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-background border border-border rounded-xl">
                      <div>
                        <p className="font-bold text-sm">{perm.label}</p>
                        <p className="text-xs text-secondary font-medium mt-0.5">{perm.desc}</p>
                      </div>
                      {perm.granted ? (
                        <span className="px-3 py-1 bg-success/10 border border-success/20 text-success text-xs font-bold rounded-lg uppercase tracking-wider">Granted</span>
                      ) : (
                        <span className="px-3 py-1 bg-error/10 border border-error/20 text-error text-xs font-bold rounded-lg uppercase tracking-wider">Restricted</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECURITY & STORAGE */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
               <div className="bg-surface/60 backdrop-blur-md border border-border rounded-2xl p-8 shadow-sm">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><HardDrive className="w-5 h-5 text-accent"/> Storage Allocation</h3>
                <div className="space-y-5">
                  <div className="p-5 bg-background border border-border rounded-xl">
                    <div className="flex justify-between items-center text-sm mb-3">
                      <span className="font-bold flex items-center gap-2"><Fingerprint className="w-4 h-4 text-secondary"/> Biometric & Profile Data</span>
                      <span className="font-bold">12.4 MB / 1 GB</span>
                    </div>
                    <div className="w-full bg-surface border border-border rounded-full h-3 overflow-hidden">
                      <div className="bg-accent h-full rounded-full transition-all duration-1000" style={{ width: '1.2%' }}></div>
                    </div>
                    <p className="text-xs text-secondary font-medium mt-3 leading-relaxed">
                      Your high-resolution facial samples and encrypted embeddings occupy a very small fraction of your allocated blob storage.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-surface/60 backdrop-blur-md border border-border rounded-2xl p-8 shadow-sm">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Lock className="w-5 h-5 text-accent"/> Authentication</h3>
                <div className="flex items-center justify-between p-5 bg-background border border-border rounded-xl">
                  <div>
                    <p className="font-bold text-sm">Account Password</p>
                    <p className="text-xs text-secondary font-medium mt-0.5">Last changed 4 months ago</p>
                  </div>
                  <button className="px-5 py-2 bg-surface border border-border rounded-xl text-sm font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-colors shadow-sm">
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="bg-surface/60 backdrop-blur-md border border-border rounded-2xl p-8 shadow-sm animate-in fade-in slide-in-from-right-8 duration-500">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Monitor className="w-5 h-5 text-accent"/> Interface Settings</h3>
              <div className="flex items-center justify-between p-5 bg-background border border-border rounded-xl">
                <div>
                  <p className="font-bold text-sm">Theme Preference</p>
                  <p className="text-xs text-secondary font-medium mt-0.5">Toggle between dark and light modes for optimal viewing.</p>
                </div>
                <button 
                  onClick={toggleTheme}
                  className="px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-bold hover:bg-accent/90 transition-all shadow-md flex items-center gap-2"
                >
                  <Monitor className="w-4 h-4"/> {theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                </button>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="bg-surface/60 backdrop-blur-md border border-border rounded-2xl p-8 shadow-sm animate-in fade-in slide-in-from-right-8 duration-500">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Bell className="w-5 h-5 text-accent"/> Alert Preferences</h3>
              <div className="space-y-3">
                {[
                  { label: "VIP Customer Arrival", desc: "Get notified when a recognized VIP enters the store", active: true },
                  { label: "System Anomalies", desc: "Alerts for unusual traffic patterns or model degraded performance", active: true },
                  { label: "Daily Summary", desc: "Receive an end-of-day analytics report", active: false },
                ].map((pref, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-background border border-border rounded-xl cursor-pointer hover:border-accent/50 transition-colors">
                    <div>
                      <p className="font-bold text-sm">{pref.label}</p>
                      <p className="text-xs text-secondary font-medium mt-0.5">{pref.desc}</p>
                    </div>
                    <div className={cn("w-12 h-6 rounded-full p-1 transition-colors relative", pref.active ? "bg-accent" : "bg-border")}>
                      <div className={cn("w-4 h-4 rounded-full bg-white transition-transform duration-300", pref.active ? "translate-x-6" : "translate-x-0")} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
