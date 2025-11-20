import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, FileCheck } from 'lucide-react';

interface UploadSectionProps {
  onFileSelect: (file: File) => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({ onFileSelect }) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="max-w-2xl mx-auto text-center space-y-8 py-12 px-4">
        <div className="space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                Transform Photos into <br/>
                <span className="text-tech-600">Technical Illustrations</span>
            </h2>
            <p className="text-lg text-slate-500 max-w-lg mx-auto">
                AI-powered drafting assistant. Upload a product photo to generate vector-style line art with engineering specifications instantly.
            </p>
        </div>

      <div
        className={`relative group cursor-pointer border-2 border-dashed rounded-3xl p-10 transition-all duration-300 ease-in-out
          ${dragActive 
            ? "border-tech-500 bg-tech-50 scale-[1.02]" 
            : "border-slate-300 hover:border-tech-400 hover:bg-slate-50"
          }
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleChange}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className={`p-4 rounded-full transition-colors ${dragActive ? 'bg-white text-tech-600 shadow-md' : 'bg-tech-50 text-tech-600'}`}>
            <UploadCloud className="w-10 h-10" />
          </div>
          
          <div className="space-y-1">
            <p className="text-lg font-semibold text-slate-700">
              Click to upload or drag and drop
            </p>
            <p className="text-sm text-slate-400">
              SVG, PNG, JPG or WEBP (max 10MB)
            </p>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-4 left-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
             <ImageIcon className="w-5 h-5" />
        </div>
        <div className="absolute bottom-4 right-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
             <FileCheck className="w-5 h-5" />
        </div>
      </div>

      <div className="flex justify-center gap-8 text-xs font-mono text-slate-400 uppercase tracking-wider">
        <div className="flex items-center gap-2">
            <span className="block w-2 h-2 bg-green-500 rounded-full"></span>
            Edge Detection
        </div>
        <div className="flex items-center gap-2">
            <span className="block w-2 h-2 bg-blue-500 rounded-full"></span>
            Auto-Scaling
        </div>
        <div className="flex items-center gap-2">
            <span className="block w-2 h-2 bg-purple-500 rounded-full"></span>
            Vector Style
        </div>
      </div>
    </div>
  );
};
