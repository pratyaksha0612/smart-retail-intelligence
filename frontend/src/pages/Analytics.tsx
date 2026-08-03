import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Download } from 'lucide-react';

const revenueData = [
  { name: 'Mon', value: 12000 }, { name: 'Tue', value: 19000 }, { name: 'Wed', value: 15000 },
  { name: 'Thu', value: 22000 }, { name: 'Fri', value: 28000 }, { name: 'Sat', value: 35000 }, { name: 'Sun', value: 32000 },
];

const demographicData = [
  { name: '18-24', value: 20 }, { name: '25-34', value: 45 }, { name: '35-44', value: 25 }, { name: '45+', value: 10 },
];

const COLORS = ['#4F46E5', '#6366F1', '#818CF8', '#A5B4FC'];

export function Analytics() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Analytics</h1>
          <p className="text-secondary">Comprehensive retail performance reports and trends.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-surface border border-border rounded-md text-sm font-medium flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <Calendar className="w-4 h-4" /> This Week
          </button>
          <button className="px-4 py-2 bg-primary text-background font-medium rounded-md flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-6">
          <h3 className="font-semibold text-lg mb-6">Revenue Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--secondary-text)' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--secondary-text)' }} tickFormatter={(val) => `$${val/1000}k`} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="font-semibold text-lg mb-6">Customer Demographics</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={demographicData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {demographicData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            {demographicData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                <span className="text-secondary">{d.name}</span>
                <span className="font-medium ml-auto">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
