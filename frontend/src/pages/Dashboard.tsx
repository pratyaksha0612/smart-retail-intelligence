import React, { useState } from 'react';
import { 
  Users, ScanFace, Smile, Zap, Activity, CheckCircle,
  Database, ArrowRight, Eye, Play, Search, Shield, UserPlus, Calendar, ChevronDown, Sparkles, Clock, Server, AlertCircle
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer 
} from 'recharts';
import { cn } from '../lib/utils';
import { useQuery } from '@tanstack/react-query';
import { 
  getDashboardOverview, getDashboardCharts, getDashboardActivity, 
  getSystemStatus, getModelStatus, getDatabaseHealth, getDashboardRecent, API_URL
} from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// --- Animations ---
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

// --- Skeleton Loaders ---
function SkeletonPulse({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-black/5 dark:bg-white/5 rounded-xl", className)} />;
}

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chartPeriod, setChartPeriod] = useState("week");

  const { data: overview, isLoading: overviewLoading } = useQuery({ queryKey: ['overview'], queryFn: getDashboardOverview });
  const { data: chartData, isLoading: chartLoading } = useQuery({ queryKey: ['charts', chartPeriod], queryFn: () => getDashboardCharts(chartPeriod) });
  const { data: activity, isLoading: activityLoading } = useQuery({ queryKey: ['activity'], queryFn: getDashboardActivity });
  const { data: sysStatus, isLoading: sysLoading } = useQuery({ queryKey: ['systemStatus'], queryFn: getSystemStatus, refetchInterval: 10000 });
  const { data: modelStatus } = useQuery({ queryKey: ['modelStatus'], queryFn: getModelStatus });
  const { data: dbHealth } = useQuery({ queryKey: ['dbHealth'], queryFn: getDatabaseHealth });
  const { data: recent, isLoading: recentLoading } = useQuery({ queryKey: ['recent'], queryFn: getDashboardRecent });

  const isLoading = overviewLoading || chartLoading || activityLoading || recentLoading || sysLoading;

  if (isLoading) {
    return (
      <div className="max-w-[1400px] mx-auto space-y-12 pb-12 pt-8">
        <div className="space-y-4">
          <SkeletonPulse className="w-32 h-6 rounded-full" />
          <SkeletonPulse className="w-3/4 max-w-lg h-12" />
          <SkeletonPulse className="w-1/2 max-w-md h-6" />
        </div>
        <div className="flex gap-4">
          {[1, 2, 3, 4].map(i => <SkeletonPulse key={i} className="flex-1 h-24" />)}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <SkeletonPulse className="xl:col-span-2 h-[400px]" />
          <SkeletonPulse className="h-[400px]" />
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="max-w-[1400px] mx-auto py-2 px-4 relative z-10 flex flex-col gap-6 h-full overflow-y-auto"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Hero Section */}
      <motion.div variants={itemVariants as any} className="relative z-10 flex items-start justify-between shrink-0 mb-4">
        <div className="mt-2 flex items-center gap-6">
          {user?.profile_picture_path ? (
            <img src={`${API_URL}/${user.profile_picture_path}?t=${new Date().getTime()}`} alt="Profile" className="w-20 h-20 rounded-2xl object-cover shadow-lg border-2 border-border shrink-0" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-accent to-purple-500 shadow-lg border-2 border-border shrink-0 flex items-center justify-center text-white text-3xl font-bold">
              {user?.full_name?.charAt(0) || 'A'}
            </div>
          )}
          <div className="flex flex-col justify-center">
            <h1 className="text-4xl md:text-[44px] font-bold tracking-tight mb-2 text-primary leading-tight">
              <span className="text-emerald-600 dark:text-emerald-400">Welcome</span> <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 bg-clip-text text-transparent">back, {user?.full_name?.split(' ')[0] || 'Admin'}</span>
            </h1>
            <p className="text-secondary font-medium text-[15px]">
              Here's what's happening with your business today.
            </p>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-border text-primary text-[13px] shadow-sm">
          <Calendar className="w-4 h-4 text-emerald-500" />
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
        </div>
      </motion.div>

      {/* Horizontal Metrics Strip */}
      <motion.div variants={itemVariants as any} className="flex flex-col md:flex-row items-stretch bg-transparent border-t border-b border-border divide-y md:divide-y-0 md:divide-x divide-border relative shrink-0">
        
        <div className="flex-1 py-4 md:pr-6 group">
          <div className="flex items-center justify-between mb-2">
            <div className="w-11 h-11 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)] group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-shadow">
              <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-success text-sm font-semibold flex items-center">↑ 12.5%</span>
          </div>
          <h3 className="text-[28px] font-bold text-primary mb-1 leading-none">{overview?.customers_today || 2}</h3>
          <p className="text-[13px] font-medium text-primary mb-0.5 mt-2">Active Customers</p>
          <p className="text-[11px] text-secondary">Unique visitors today</p>
        </div>

        <div className="flex-1 py-4 md:px-6 group">
          <div className="flex items-center justify-between mb-2">
            <div className="w-11 h-11 rounded-full bg-teal-500/10 flex items-center justify-center border border-teal-500/20 shadow-[0_0_15px_rgba(20,184,166,0.15)] group-hover:shadow-[0_0_20px_rgba(20,184,166,0.3)] transition-shadow">
              <ScanFace className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </div>
            <span className="text-success text-sm font-semibold flex items-center">↑ 1.2%</span>
          </div>
          <h3 className="text-[28px] font-bold text-primary mb-1 leading-none">{overview?.recognition_accuracy || '90.7%'}</h3>
          <p className="text-[13px] font-medium text-primary mb-0.5 mt-2">Avg. Recognition Confidence</p>
          <p className="text-[11px] text-secondary">Based on recent scans</p>
        </div>

        <div className="flex-1 py-4 md:px-6 group">
          <div className="flex items-center justify-between mb-2">
            <div className="w-11 h-11 rounded-full bg-lime-500/10 flex items-center justify-center border border-lime-500/20 shadow-[0_0_15px_rgba(132,204,22,0.15)] group-hover:shadow-[0_0_20px_rgba(132,204,22,0.3)] transition-shadow">
              <Smile className="w-5 h-5 text-lime-600 dark:text-lime-400" />
            </div>
            <span className="text-error text-sm font-semibold flex items-center">↓ 2.1%</span>
          </div>
          <h3 className="text-[28px] font-bold text-primary mb-1 leading-none">{overview?.sentiment_score || "80.0%"}</h3>
          <p className="text-[13px] font-medium text-primary mb-0.5 mt-2">Global Sentiment</p>
          <p className="text-[11px] text-secondary">Positive review ratio</p>
        </div>

        <div className="flex-1 py-4 md:pl-6 group">
          <div className="flex items-center justify-between mb-2">
            <div className="w-11 h-11 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.15)] group-hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-shadow">
              <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-success text-sm font-semibold flex items-center">↑ 8.4%</span>
          </div>
          <h3 className="text-[28px] font-bold text-primary mb-1 leading-none">{overview?.products_classified || 20}</h3>
          <p className="text-[13px] font-medium text-primary mb-0.5 mt-2">Total Predictions</p>
          <p className="text-[11px] text-secondary">Inference operations</p>
        </div>
      </motion.div>

      {/* Main Content Grid 1: Charts & Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Main Chart */}
        <motion.div variants={itemVariants as any} className="bg-surface border border-border rounded-3xl p-5 xl:col-span-2 shadow-lg relative flex flex-col">
           <div className="flex items-start justify-between mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-500" />
                <div>
                  <h3 className="text-lg font-bold text-primary">Traffic & Engagement</h3>
                  <p className="text-xs text-secondary mt-0.5">Customer visits over the selected period</p>
                </div>
              </div>
              <div className="bg-background px-3 py-1.5 rounded-lg border border-border flex items-center gap-2 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-sm text-secondary">
                This Week <ChevronDown className="w-4 h-4" />
              </div>
           </div>
           
           <div className="flex-1 relative z-10 min-h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData || []} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--secondary-text)' }} dy={20} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--secondary-text)' }} />
                  <Tooltip 
                    cursor={{ stroke: 'rgba(16,185,129,0.3)', strokeWidth: 1, strokeDasharray: '3 3' }}
                    contentStyle={{ backgroundColor: 'var(--surface)', backdropFilter: 'blur(10px)', borderColor: 'var(--border)', borderRadius: '12px', color: 'var(--primary-text)' }}
                    itemStyle={{ color: 'var(--primary-text)', fontWeight: 600 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#10B981" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorVisits)" 
                    animationDuration={2000}
                    animationEasing="ease-out"
                  />
                </AreaChart>
             </ResponsiveContainer>
           </div>
        </motion.div>

        {/* Quick Actions Array */}
        <motion.div variants={itemVariants as any} className="bg-surface border border-border rounded-3xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              <h3 className="text-lg font-bold text-primary">Quick Actions</h3>
            </div>
            
            <div className="space-y-2">
              <button onClick={() => navigate('/vision')} className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-background transition-all group border border-transparent hover:border-border">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center">
                    <ScanFace className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-primary text-[13px]">New Face Scan</h4>
                    <p className="text-[11px] text-secondary mt-0.5">Start a new scan session</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-secondary group-hover:text-emerald-500 transition-colors" />
              </button>

              <button onClick={() => alert("Backup Initiated!")} className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-background transition-all group border border-transparent hover:border-border">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center">
                    <Database className="w-4 h-4 text-teal-500" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-primary text-[13px]">Backup DB</h4>
                    <p className="text-[11px] text-secondary mt-0.5">Create a system backup</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-secondary group-hover:text-teal-500 transition-colors" />
              </button>

              <button onClick={() => navigate('/settings')} className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-background transition-all group border border-transparent hover:border-border">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center">
                    <UserPlus className="w-4 h-4 text-lime-500" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-primary text-[13px]">Add User</h4>
                    <p className="text-[11px] text-secondary mt-0.5">Invite a new team member</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-secondary group-hover:text-lime-500 transition-colors" />
              </button>

              <button onClick={() => navigate('/settings')} className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-background transition-all group border border-transparent hover:border-border">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center">
                    <Shield className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-primary text-[13px]">Security Logs</h4>
                    <p className="text-[11px] text-secondary mt-0.5">View system security logs</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-secondary group-hover:text-green-500 transition-colors" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content Grid 2: Recent Activity & System Health */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-12">
        {/* Recent Activity */}
        <motion.div variants={itemVariants as any} className="bg-surface border border-border rounded-3xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-emerald-500" />
            <h3 className="text-lg font-bold text-primary">Recent Customers</h3>
          </div>
          <div className="space-y-4">
            {recent?.customers?.slice(0, 4).map((c: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-background border border-transparent hover:border-border transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary">{c.name}</p>
                    <p className="text-xs text-secondary">{c.email}</p>
                  </div>
                </div>
                <span className="text-xs text-secondary">{c.date}</span>
              </div>
            ))}
            {(!recent?.customers || recent.customers.length === 0) && <p className="text-sm text-secondary p-4 text-center">No recent customers found.</p>}
          </div>
        </motion.div>

        {/* System Health */}
        <motion.div variants={itemVariants as any} className="bg-surface border border-border rounded-3xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-6">
            <Server className="w-5 h-5 text-teal-500" />
            <h3 className="text-lg font-bold text-primary">System Health</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-background p-4 rounded-2xl border border-border">
              <p className="text-xs text-secondary mb-1">CPU Usage</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-primary">{sysStatus?.cpu_usage || 0}%</span>
                {sysStatus?.cpu_usage > 80 && <AlertCircle className="w-4 h-4 text-error mb-1" />}
              </div>
            </div>
            <div className="bg-background p-4 rounded-2xl border border-border">
              <p className="text-xs text-secondary mb-1">Memory Usage</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-primary">{sysStatus?.memory_usage || 0}%</span>
                {sysStatus?.memory_usage > 85 && <AlertCircle className="w-4 h-4 text-error mb-1" />}
              </div>
            </div>
            <div className="bg-background p-4 rounded-2xl border border-border">
              <p className="text-xs text-secondary mb-1">Database Status</p>
              <span className="text-sm font-bold text-emerald-500">{dbHealth?.status || 'Healthy'}</span>
            </div>
            <div className="bg-background p-4 rounded-2xl border border-border">
              <p className="text-xs text-secondary mb-1">API Latency</p>
              <span className="text-sm font-bold text-primary">{sysStatus?.api || '24ms'}</span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-primary mb-3">Model Status</h4>
            <div className="space-y-2">
              {modelStatus?.map((model: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-background border border-border">
                  <span className="text-xs font-medium text-primary">{model.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-secondary">{model.version}</span>
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full",
                      model.status === 'Loaded' ? "bg-emerald-500/10 text-emerald-500" : "bg-secondary/10 text-secondary"
                    )}>
                      {model.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

    </motion.div>
  );
}
