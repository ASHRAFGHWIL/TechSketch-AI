import React from 'react';
import { PenTool, Ruler, Layers } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-900">
          <div className="bg-tech-600 p-2 rounded-lg">
            <PenTool className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-sans tracking-tight">TechSketch AI</h1>
            <p className="text-xs text-slate-500 font-mono hidden sm:block">PRODUCT TO VECTOR CONVERTER</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6 text-sm text-slate-600 font-medium">
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-tech-500" />
            <span>Layer Extraction</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Ruler className="w-4 h-4 text-tech-500" />
            <span>Auto-Dimension</span>
          </div>
        </div>
      </div>
    </header>
  );
};
