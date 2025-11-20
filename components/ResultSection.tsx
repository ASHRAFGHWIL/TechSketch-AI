import React from 'react';
import { Download, RefreshCw, FileText, CheckCircle2 } from 'lucide-react';
import { GenerationResult } from '../types';
import ReactMarkdown from 'react-markdown';

interface ResultSectionProps {
  result: GenerationResult;
  onReset: () => void;
}

export const ResultSection: React.FC<ResultSectionProps> = ({ result, onReset }) => {
  
  const handleDownload = () => {
    if (result.generatedImage) {
        const link = document.createElement('a');
        link.href = result.generatedImage;
        link.download = 'technical-drawing.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 text-green-700 rounded-full">
                <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
                <h3 className="font-bold text-slate-900">Processing Complete</h3>
                <p className="text-sm text-slate-500">Generated precise technical illustration</p>
            </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
            <button 
                onClick={onReset}
                className="flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex"
            >
                <RefreshCw className="w-4 h-4" />
                New Project
            </button>
            <button 
                onClick={handleDownload}
                disabled={!result.generatedImage}
                className="flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-tech-600 rounded-lg hover:bg-tech-700 transition-colors flex disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Download className="w-4 h-4" />
                Download PNG
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
        
        {/* Left Column: Visuals */}
        <div className="space-y-6">
             {/* Original Image */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Source Input</h4>
                <div className="aspect-video relative bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center">
                    <img 
                        src={result.originalImage} 
                        alt="Original" 
                        className="max-h-full max-w-full object-contain"
                    />
                </div>
            </div>

            {/* Generated Image */}
            <div className="bg-white p-1 rounded-2xl shadow-lg border border-slate-200 overflow-hidden ring-4 ring-slate-50">
                 <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                    <h4 className="text-xs font-bold text-tech-600 uppercase tracking-wider flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Technical Output
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400 border border-slate-200 px-2 py-1 rounded">VECTOR_MODE_V2</span>
                 </div>
                 <div className="relative min-h-[400px] bg-white p-6 blueprint-grid flex items-center justify-center">
                    {result.generatedImage ? (
                         <img 
                            src={result.generatedImage} 
                            alt="Generated Technical Drawing" 
                            className="max-h-full max-w-full object-contain drop-shadow-2xl mix-blend-multiply" 
                         />
                    ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400">
                            <p>Image generation failed.</p>
                        </div>
                    )}
                    
                    {/* Mock rulers for aesthetic */}
                    <div className="absolute left-0 top-0 bottom-0 w-6 border-r border-slate-200/50 flex flex-col justify-between py-2 items-center text-[8px] text-slate-300 font-mono select-none pointer-events-none">
                        <span>0</span><span>10</span><span>20</span><span>30</span><span>40</span>
                    </div>
                    <div className="absolute left-0 top-0 right-0 h-6 border-b border-slate-200/50 flex justify-between px-2 items-center text-[8px] text-slate-300 font-mono select-none pointer-events-none pl-8">
                        <span>0</span><span>10</span><span>20</span><span>30</span><span>40</span>
                    </div>
                 </div>
            </div>
        </div>

        {/* Right Column: Analysis Text */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 bg-tech-500 rounded-full animate-pulse"></span>
                    Illustration Protocol
                </h3>
            </div>
            <div className="p-6 overflow-y-auto max-h-[800px] prose prose-slate prose-sm max-w-none">
                {result.analysis ? (
                    <ReactMarkdown
                        components={{
                            h1: ({node, ...props}) => <h1 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3 flex items-center gap-2 before:content-['#'] before:text-tech-300" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-base font-medium text-slate-800 mt-4 mb-2" {...props} />,
                            ul: ({node, ...props}) => <ul className="space-y-2 my-4 list-none pl-0" {...props} />,
                            li: ({node, ...props}) => (
                                <li className="flex gap-3 text-slate-600" {...props}>
                                    <span className="text-tech-400 mt-1.5">›</span>
                                    <span>{props.children}</span>
                                </li>
                            ),
                            strong: ({node, ...props}) => <strong className="font-semibold text-slate-900" {...props} />,
                        }}
                    >
                        {result.analysis}
                    </ReactMarkdown>
                ) : (
                    <div className="space-y-4 animate-pulse">
                         <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                         <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                         <div className="h-4 bg-slate-100 rounded w-5/6"></div>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};
