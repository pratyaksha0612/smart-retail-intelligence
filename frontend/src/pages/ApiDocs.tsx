import React from 'react';
import { ExternalLink, Terminal, Code2 } from 'lucide-react';
import { API_URL } from '../lib/api';
export function ApiDocs() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">API Documentation</h1>
          <p className="text-secondary">Explore the interactive OpenAPI reference for the Smart Retail backend.</p>
        </div>
        <a 
          href={`${API_URL}/docs`} 
          target="_blank" 
          rel="noreferrer"
          className="px-4 py-2 bg-primary text-background font-medium rounded-md hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          Open in New Tab <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-surface border border-border rounded-xl p-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
            <Terminal className="w-6 h-6 text-accent" />
          </div>
          <h3 className="font-semibold mb-1">FastAPI Powered</h3>
          <p className="text-sm text-secondary">High performance async REST API built with Python 3.</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-4">
            <Code2 className="w-6 h-6 text-success" />
          </div>
          <h3 className="font-semibold mb-1">Auto-Generated Swagger</h3>
          <p className="text-sm text-secondary">Interactive documentation natively integrated below.</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-warning" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.29 7 12 12 20.71 7"></polyline><line x1="12" y1="22" x2="12" y2="12"></line></svg>
          </div>
          <h3 className="font-semibold mb-1">Pydantic Validation</h3>
          <p className="text-sm text-secondary">Strict data schemas and type checking on all endpoints.</p>
        </div>
      </div>

      <div className="flex-1 bg-surface border border-border rounded-xl overflow-hidden min-h-[600px] relative">
        {/* We use an iframe to embed the FastAPI Swagger UI */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-surface">
          <div className="text-center">
             <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
             <p className="text-secondary">Loading Swagger UI from backend...</p>
             <p className="text-xs text-secondary/60 mt-2">Ensure FastAPI backend is running on port 8000</p>
          </div>
        </div>
        
        <iframe 
          src={`${API_URL}/docs`} 
          className="w-full h-full relative z-10 border-none bg-white dark:bg-black/90"
          title="FastAPI Swagger UI"
          onLoad={(e) => {
             // Basic attempt to hide loader when loaded, though cross-origin policies restrict DOM access
             e.currentTarget.style.opacity = '1';
          }}
          style={{opacity: 0, transition: 'opacity 0.5s ease-in-out'}}
        />
      </div>
    </div>
  );
}
