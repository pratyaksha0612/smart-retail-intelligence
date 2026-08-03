import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Box, Activity } from 'lucide-react';
import { cn } from '../lib/utils';

export function ProductClassification() {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
        analyzeImage();
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 2000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Product Classification</h1>
        <p className="text-secondary">Upload a product image for instant AI-based categorization and tagging.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface border border-border rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-accent" />
              Upload Image
            </h3>
            
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImageUpload}
            />
            
            {!image ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-64 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                  <ImageIcon className="w-8 h-8 text-accent" />
                </div>
                <p className="font-medium mb-1">Click or drag image to upload</p>
                <p className="text-sm text-secondary">Supports JPG, PNG, WEBP (Max 5MB)</p>
              </div>
            ) : (
              <div className="relative w-full h-96 bg-black/5 dark:bg-white/5 rounded-xl border border-border overflow-hidden group">
                <img src={image} alt="Uploaded product" className="w-full h-full object-contain" />
                
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                    <div className="w-16 h-16 rounded-full border-4 border-accent border-t-transparent animate-spin mb-4"></div>
                    <p className="font-medium text-lg">Running inference model...</p>
                    <p className="text-sm text-secondary mt-1 flex items-center gap-1">
                      <Activity className="w-4 h-4" /> MobileNetV2 Architecture
                    </p>
                  </div>
                )}

                {!isAnalyzing && (
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-background text-primary text-sm font-medium rounded-md shadow-sm border border-border hover:bg-surface"
                    >
                      Change Image
                    </button>
                    <button 
                      onClick={() => setImage(null)}
                      className="px-3 py-1.5 bg-error text-white text-sm font-medium rounded-md shadow-sm hover:opacity-90"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
              <Box className="w-5 h-5 text-accent" />
              Prediction Results
            </h3>
            
            {!image ? (
              <div className="text-center py-8">
                <p className="text-secondary text-sm">Upload an image to see classification results.</p>
              </div>
            ) : isAnalyzing ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-full h-12 bg-black/5 dark:bg-white/5 animate-pulse rounded-lg"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-5 animate-in slide-in-from-right-4 duration-500">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div>
                    <p className="text-sm text-secondary mb-1">Top Prediction</p>
                    <p className="text-xl font-bold text-success">Nike Air Max</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-secondary mb-1">Confidence</p>
                    <p className="text-xl font-bold">98.2%</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-secondary mb-3">Other Candidates</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Running Shoes</span>
                      <span className="font-medium text-secondary">84.5%</span>
                    </div>
                    <div className="w-full bg-black/5 dark:bg-white/5 rounded-full h-1.5">
                      <div className="bg-accent h-1.5 rounded-full" style={{ width: '84.5%' }}></div>
                    </div>

                    <div className="flex items-center justify-between text-sm pt-2">
                      <span>Sneakers</span>
                      <span className="font-medium text-secondary">62.1%</span>
                    </div>
                    <div className="w-full bg-black/5 dark:bg-white/5 rounded-full h-1.5">
                      <div className="bg-accent h-1.5 rounded-full" style={{ width: '62.1%' }}></div>
                    </div>

                    <div className="flex items-center justify-between text-sm pt-2">
                      <span>Athletic Footwear</span>
                      <span className="font-medium text-secondary">45.8%</span>
                    </div>
                    <div className="w-full bg-black/5 dark:bg-white/5 rounded-full h-1.5">
                      <div className="bg-accent h-1.5 rounded-full" style={{ width: '45.8%' }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 mt-4 border-t border-border flex justify-between items-center text-xs text-secondary">
                  <span>Inference Time</span>
                  <span className="font-medium">142ms</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
