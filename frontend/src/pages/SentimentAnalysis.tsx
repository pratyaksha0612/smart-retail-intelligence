import React, { useState } from 'react';
import { MessageSquareHeart, Smile, Frown, Meh, BarChart2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { API_URL } from '../lib/api';
export function SentimentAnalysis() {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<null | {
    sentiment: 'Positive' | 'Negative' | 'Neutral';
    confidence: number;
    emotion: string;
    keywords: string[];
  }>(null);

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setIsAnalyzing(true);
    try {
      const response = await fetch(`${API_URL}/api/sentiment/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) {
        throw new Error('Failed to analyze sentiment');
      }
      const data = await response.json();
      setResult({
        sentiment: data.sentiment,
        confidence: data.confidence,
        emotion: data.emotion,
        keywords: data.keywords,
      });
    } catch (error) {
      console.error(error);
      alert('Error analyzing sentiment');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Sentiment Analysis</h1>
        <p className="text-secondary">Analyze customer feedback to extract sentiment and key emotions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <MessageSquareHeart className="w-5 h-5 text-accent" />
              Review Input
            </h3>
            <textarea 
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste customer review or feedback here..."
              className="w-full h-40 p-4 bg-black/5 dark:bg-white/5 border border-border rounded-lg resize-none focus:outline-none focus:border-accent transition-colors mb-4 text-sm"
            ></textarea>
            <button 
              onClick={handleAnalyze}
              disabled={isAnalyzing || !text.trim()}
              className="w-full py-2.5 bg-primary text-background font-medium rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <span className="animate-spin w-4 h-4 border-2 border-background border-t-transparent rounded-full"></span>
                  Analyzing...
                </>
              ) : (
                'Analyze Text'
              )}
            </button>
          </div>

          {result && (
            <div className="bg-surface border border-border rounded-xl p-6 animate-in slide-in-from-bottom-4 duration-500">
              <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-accent" />
                Analysis Results
              </h3>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 border border-border rounded-lg bg-black/5 dark:bg-white/5">
                  <p className="text-sm text-secondary mb-1">Sentiment</p>
                  <p className="text-xl font-bold text-success flex items-center gap-2">
                    <Smile className="w-5 h-5" />
                    {result.sentiment}
                  </p>
                </div>
                <div className="p-4 border border-border rounded-lg bg-black/5 dark:bg-white/5">
                  <p className="text-sm text-secondary mb-1">Confidence</p>
                  <p className="text-xl font-bold">{result.confidence}%</p>
                </div>
                <div className="p-4 border border-border rounded-lg bg-black/5 dark:bg-white/5">
                  <p className="text-sm text-secondary mb-1">Primary Emotion</p>
                  <p className="text-xl font-bold">{result.emotion}</p>
                </div>
                <div className="p-4 border border-border rounded-lg bg-black/5 dark:bg-white/5">
                  <p className="text-sm text-secondary mb-2">Keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.keywords.map((kw, i) => (
                      <span key={i} className="px-2 py-0.5 bg-accent/10 text-accent text-xs font-medium rounded-full">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="font-semibold text-lg mb-6">Analysis History</h3>
          <div className="space-y-4">
             {/* Mock History */}
             <div className="p-4 border border-border rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
               <div className="flex items-start justify-between mb-2">
                 <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-success/10 text-success">
                   <Smile className="w-3 h-3" /> Positive
                 </span>
                 <span className="text-xs text-secondary">10 mins ago</span>
               </div>
               <p className="text-sm text-primary line-clamp-2">The new winter collection is absolutely fantastic. The materials feel very premium and the fit is perfect.</p>
             </div>
             
             <div className="p-4 border border-border rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
               <div className="flex items-start justify-between mb-2">
                 <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-error/10 text-error">
                   <Frown className="w-3 h-3" /> Negative
                 </span>
                 <span className="text-xs text-secondary">1 hour ago</span>
               </div>
               <p className="text-sm text-primary line-clamp-2">I ordered a size M but received an XL. The return process is taking way too long. Very disappointed.</p>
             </div>

             <div className="p-4 border border-border rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
               <div className="flex items-start justify-between mb-2">
                 <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-warning/10 text-warning">
                   <Meh className="w-3 h-3" /> Neutral
                 </span>
                 <span className="text-xs text-secondary">3 hours ago</span>
               </div>
               <p className="text-sm text-primary line-clamp-2">The shoes are okay. They look like the pictures but they run a bit narrow.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
