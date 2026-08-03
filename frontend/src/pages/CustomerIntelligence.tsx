import React, { useState } from 'react';
import { Search, Filter, MoreHorizontal, User, UserCheck, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export function CustomerIntelligence() {
  const [search, setSearch] = useState('');
  const { token } = useAuth();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/auth/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    }
  });

  const filteredCustomers = customers.filter((c: any) => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.id.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Customer Intelligence</h1>
          <p className="text-secondary">Manage and analyze your customer base (Admins & Users).</p>
        </div>
        <button className="px-4 py-2 bg-primary text-background font-medium rounded-md hover:opacity-90 transition-opacity">
          Export Data
        </button>
      </div>

      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-black/5 dark:bg-white/5">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
            <input 
              type="text" 
              placeholder="Search customers..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-4 text-sm bg-background border border-border rounded-md focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <button className="px-3 py-1.5 bg-background border border-border rounded-md text-sm font-medium flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-12 text-secondary">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-black/5 dark:bg-white/5 text-secondary border-b border-border">
                <tr>
                  <th className="px-6 py-3 font-medium">Customer</th>
                  <th className="px-6 py-3 font-medium">Status / Role</th>
                  <th className="px-6 py-3 font-medium">Total Visits</th>
                  <th className="px-6 py-3 font-medium">Last Visit</th>
                  <th className="px-6 py-3 font-medium">Avg. Sentiment</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-secondary">No customers found</td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer: any) => (
                    <tr key={customer.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold text-xs uppercase">
                            {customer.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-primary">{customer.name}</p>
                            <p className="text-xs text-secondary">{customer.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-medium",
                          customer.status === 'VIP' ? "bg-accent/10 text-accent" :
                          customer.status === 'New' ? "bg-success/10 text-success" :
                          customer.status === 'At Risk' ? "bg-error/10 text-error" :
                          "bg-secondary/10 text-secondary"
                        )}>
                          {customer.role === 'admin' ? 'Admin / VIP' : 'Registered User'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium">{customer.visits}</td>
                      <td className="px-6 py-4 text-secondary">{customer.lastVisit}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "flex items-center gap-1.5 text-xs font-medium",
                          customer.sentiment === 'Positive' ? "text-success" :
                          customer.sentiment === 'Negative' ? "text-error" :
                          "text-warning"
                        )}>
                          {customer.sentiment}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-1.5 text-secondary hover:text-primary hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-border flex items-center justify-between text-sm text-secondary">
          <span>Showing {filteredCustomers.length} entries</span>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 border border-border rounded-md hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50" disabled>Previous</button>
            <button className="px-3 py-1 border border-border rounded-md hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50" disabled>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
