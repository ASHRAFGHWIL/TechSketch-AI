import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, FileCheck } from 'lucide-react';
import { Language } from '../types';

interface UploadSectionProps {
  onFileSelect: (file: File) => void;
  language: Language;
}

export const UploadSection: React.FC<UploadSectionProps> = ({ onFileSelect, language }) => {
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

  const t = {
    en: {
      titleMain: "Transform Photos into",
      titleHighlight: "Technical Illustrations",
      description: "AI-powered drafting assistant. Upload a product photo to generate vector-style line art with engineering specifications instantly.",
      uploadText: "Click to upload or drag and drop",
      uploadSubtext: "SVG, PNG, JPG or WEBP (max 10MB)",
      edgeDetection: "Edge Detection",
      autoScaling: "Auto-Scaling",
      vectorStyle: "Vector Style"
    },
    ar: {
      titleMain: "حول صورك إلى",
      titleHighlight: "رسومات هندسية فنية",
      description: "مساعد تصميم مدعوم بالذكاء الاصطناعي. ارفع صورة المنتج لإنشاء رسم خطي بأسلوب الفيكتور مع مواصفات هندسية فوراً.",
      uploadText: "اضغط للرفع أو اسحب الملف هنا",
      uploadSubtext: "SVG, PNG, JPG أو WEBP (حد أقصى 10 ميجابايت)",
      edgeDetection: "كشف الحواف",
      autoScaling: "قياس تلقائي",
      vectorStyle: "نمط فيكتور"
    }
  };

  const content = t[language];

  return (
    <div className="max-w-2xl mx-auto text-center space-y-8 py-12 px-4">
        <div className="space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight transition-colors">
                {content.titleMain} <br/>
                <span className="text-tech-600 dark:text-tech-500">{content.titleHighlight}</span>
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-lg mx-auto transition-colors">
                {content.description}
            </p>
        </div>

      <div
        className={`relative group cursor-pointer border-2 border-dashed rounded-3xl p-10 transition-all duration-300 ease-in-out
          ${dragActive 
            ? "border-tech-500 bg-tech-50 dark:bg-slate-800/50 scale-[1.02]" 
            : "border-slate-300 dark:border-slate-700 hover:border-tech-400 hover:bg-slate-50 dark:hover:bg-slate-800/30"
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
          <div className={`p-4 rounded-full transition-colors ${dragActive ? 'bg-white dark:bg-slate-800 text-tech-600 shadow-md' : 'bg-tech-50 dark:bg-slate-800 text-tech-600'}`}>
            <UploadCloud className="w-10 h-10" />
          </div>
          
          <div className="space-y-1">
            <p className="text-lg font-semibold text-slate-700 dark:text-slate-200 transition-colors">
              {content.uploadText}
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500 transition-colors">
              {content.uploadSubtext}
            </p>
          </div>
        </div>
        
        {/* Decorative elements - Logical positioning for RTL support if needed, currently absolute */}
        <div className="absolute top-4 left-4 rtl:left-auto rtl:right-4 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
             <ImageIcon className="w-5 h-5" />
        </div>
        <div className="absolute bottom-4 right-4 rtl:right-auto rtl:left-4 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
             <FileCheck className="w-5 h-5" />
        </div>
      </div>

      <div className="flex justify-center gap-8 text-xs font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider transition-colors">
        <div className="flex items-center gap-2">
            <span className="block w-2 h-2 bg-green-500 rounded-full"></span>
            {content.edgeDetection}
        </div>
        <div className="flex items-center gap-2">
            <span className="block w-2 h-2 bg-blue-500 rounded-full"></span>
            {content.autoScaling}
        </div>
        <div className="flex items-center gap-2">
            <span className="block w-2 h-2 bg-purple-500 rounded-full"></span>
            {content.vectorStyle}
        </div>
      </div>
    </div>
  );
};