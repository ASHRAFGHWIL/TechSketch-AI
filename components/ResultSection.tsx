
import React, { useState, useRef, useEffect } from 'react';
import { Download, RefreshCw, FileText, CheckCircle2, FileCode, Palette, ChevronDown, Loader2, Image as ImageIcon, Grid, Sparkles, PenTool, History, RotateCw } from 'lucide-react';
import { GenerationResult, Language } from '../types';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from 'jspdf';

interface ResultSectionProps {
  result: GenerationResult;
  history: GenerationResult[];
  currentIndex: number;
  onSelectHistory: (index: number) => void;
  onReset: () => void;
  onRedesign: (includeDimensions?: boolean) => void;
  onRetry: () => void;
  language: Language;
}

type ColorTheme = 'default' | 'blue' | 'pink' | 'green' | 'orange' | 'purple';

export const ResultSection: React.FC<ResultSectionProps> = ({ 
    result, 
    history, 
    currentIndex, 
    onSelectHistory, 
    onReset, 
    onRedesign, 
    onRetry,
    language 
}) => {
  const [selectedColor, setSelectedColor] = useState<ColorTheme>('default');
  const [isTransparent, setIsTransparent] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const t = {
    en: {
        statusTitle: "Processing Complete",
        statusDesc: "Generated precise technical illustration",
        newProject: "New Project",
        retry: "Retry",
        redesignHq: "Redesign (HQ)",
        redesignPure: "Pure Design (HQ)",
        sourceInput: "Source Input",
        techOutput: "Technical Output",
        protocol: "Illustration Protocol",
        failed: "Image generation failed.",
        download: "Download",
        transparentBg: "Transparent Background",
        historyLabel: "Recent Generations",
        formats: {
            png: "Image File (PNG)",
            pngTransparent: "Image (Transparent PNG)",
            svg: "Vector Container (SVG)",
            pdf: "Technical Report (PDF)"
        },
        colors: {
            label: "Line Color",
            default: "Classic Black",
            blue: "Cyber Blue",
            pink: "Plasma Pink",
            green: "Matrix Green",
            orange: "Solar Orange",
            purple: "Neon Purple"
        }
    },
    ar: {
        statusTitle: "اكتملت المعالجة",
        statusDesc: "تم إنشاء الرسم الفني بدقة",
        newProject: "مشروع جديد",
        retry: "إعادة محاولة",
        redesignHq: "إعادة تصميم (عالية الدقة)",
        redesignPure: "تصميم نقي (دقة عالية)",
        sourceInput: "الصورة الأصلية",
        techOutput: "المخرج التقني",
        protocol: "بروتوكول الرسم",
        failed: "فشل إنشاء الصورة.",
        download: "تـحـمـيـل",
        transparentBg: "خلفية شفافة",
        historyLabel: "آخر النتائج",
        formats: {
            png: "ملف صورة (PNG)",
            pngTransparent: "صورة (PNG شفاف)",
            svg: "حاوية فيكتور (SVG)",
            pdf: "تقرير فني (PDF)"
        },
        colors: {
            label: "لون الخطوط",
            default: "أسود كلاسيكي",
            blue: "أزرق سيبراني",
            pink: "وردي بلازما",
            green: "أخضر مصفوفة",
            orange: "برتقالي مشع",
            purple: "بنفسجي نيون"
        }
    }
  };

  const content = t[language];

  const colorFilters: Record<ColorTheme, string> = {
      default: 'none',
      blue: 'invert(1) sepia(1) saturate(5000%) hue-rotate(190deg) brightness(1.2)', 
      pink: 'invert(1) sepia(1) saturate(5000%) hue-rotate(300deg) brightness(1.2)',
      green: 'invert(1) sepia(1) saturate(5000%) hue-rotate(80deg) brightness(1.2)',
      orange: 'invert(1) sepia(1) saturate(5000%) hue-rotate(0deg) brightness(1.2)',
      purple: 'invert(1) sepia(1) saturate(5000%) hue-rotate(240deg) brightness(1.2)',
  };

  const getProcessedCanvas = async (url: string, theme: ColorTheme, transparent: boolean): Promise<HTMLCanvasElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = url;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas context failed'));
                return;
            }
            
            if (transparent) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            } else {
                ctx.fillStyle = (theme === 'default') ? '#FFFFFF' : '#000000';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            
            ctx.filter = colorFilters[theme];
            ctx.drawImage(img, 0, 0);

            if (transparent) {
                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imgData.data;
                const isBlackOnWhite = theme === 'default';
                const threshold = 40;

                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i+1];
                    const b = data[i+2];

                    if (isBlackOnWhite) {
                        if (r > 255 - threshold && g > 255 - threshold && b > 255 - threshold) {
                            data[i+3] = 0;
                        }
                    } else {
                        if (r < threshold && g < threshold && b < threshold) {
                            data[i+3] = 0;
                        }
                    }
                }
                ctx.putImageData(imgData, 0, 0);
            }
            resolve(canvas);
        };
        img.onerror = reject;
    });
  };

  const handleDownload = async (format: 'png' | 'svg' | 'pdf') => {
    if (!result.generatedImage) return;
    setIsExporting(true);
    setIsMenuOpen(false);
    try {
        const canvas = await getProcessedCanvas(result.generatedImage, selectedColor, isTransparent);
        const link = document.createElement('a');
        const filenamePrefix = `TechSketch-${new Date().getTime()}`;

        if (format === 'png') {
            link.href = canvas.toDataURL('image/png');
            link.download = `${filenamePrefix}-${selectedColor}${isTransparent ? '-transparent' : ''}.png`;
        } else if (format === 'svg') {
            const imageUrl = canvas.toDataURL('image/png');
            const svgContent = `<svg width="${canvas.width}" height="${canvas.height}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvas.width} ${canvas.height}"><image href="${imageUrl}" width="${canvas.width}" height="${canvas.height}"/></svg>`;
            link.href = URL.createObjectURL(new Blob([svgContent], {type: 'image/svg+xml'}));
            link.download = `${filenamePrefix}-${selectedColor}.svg`;
        } else if (format === 'pdf') {
            const doc = new jsPDF({ 
                orientation: canvas.width > canvas.height ? 'l' : 'p', 
                unit: 'px', 
                format: [canvas.width + 40, canvas.height + 40] 
            });
            doc.addImage(canvas.toDataURL('image/png'), 'PNG', 20, 20, canvas.width, canvas.height);
            link.href = doc.output('bloburl');
            link.download = `${filenamePrefix}-report.pdf`;
        }
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } finally {
        setIsExporting(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in pb-32">
      {/* Status Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900/50 backdrop-blur-sm p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-4">
            <div className="p-2.5 bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-none mb-1">{content.statusTitle}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{content.statusDesc}</p>
            </div>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button onClick={onReset} className="flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex shadow-sm">
                <RefreshCw className="w-4 h-4" />
                {content.newProject}
            </button>
            <button onClick={onRetry} className="flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex shadow-sm">
                <RotateCw className="w-4 h-4" />
                {content.retry}
            </button>
            <button onClick={() => onRedesign(true)} className="flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-tech-700 dark:text-tech-400 bg-tech-50 dark:bg-tech-500/10 border border-tech-200 dark:border-tech-500/20 rounded-xl hover:bg-tech-100 dark:hover:bg-tech-500/20 transition-all flex shadow-sm">
                <Sparkles className="w-4 h-4" />
                {content.redesignHq}
            </button>
            <div className="relative flex-1 sm:flex-none" ref={menuRef}>
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} disabled={isExporting} className="w-full sm:w-auto flex items-center justify-between sm:justify-center gap-3 px-5 py-2.5 text-sm font-bold text-white bg-tech-600 dark:bg-tech-500 rounded-xl hover:bg-tech-700 dark:hover:bg-tech-600 shadow-lg shadow-tech-500/20 transition-all disabled:opacity-50 active:scale-95">
                    <div className="flex items-center gap-2">
                        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        {content.download}
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {isMenuOpen && (
                    <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-3 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        <button onClick={() => handleDownload('png')} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl text-left rtl:text-right transition-colors">
                            <ImageIcon className={`w-5 h-5 ${isTransparent ? 'text-green-500' : 'text-tech-500'}`} /> 
                            {isTransparent ? content.formats.pngTransparent : content.formats.png}
                        </button>
                        <button onClick={() => handleDownload('svg')} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl text-left rtl:text-right transition-colors">
                            <FileCode className="w-5 h-5 text-orange-500" /> {content.formats.svg}
                        </button>
                        <button onClick={() => handleDownload('pdf')} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl text-left rtl:text-right transition-colors">
                            <FileText className="w-5 h-5 text-red-500" /> {content.formats.pdf}
                        </button>
                    </div>
                )}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
            {/* Original Image Card */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 rtl:text-right">{content.sourceInput}</h4>
                <div className="aspect-video relative bg-slate-50 dark:bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-100 dark:border-slate-800">
                    <img src={result.originalImage} alt="Original" className="max-h-full max-w-full object-contain p-4" />
                </div>
            </div>

            {/* Generated Output Card */}
            <div className="bg-white dark:bg-slate-900 p-2 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden ring-4 ring-slate-50 dark:ring-slate-950 transition-colors">
                 <div className="flex flex-wrap items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 gap-3">
                    <h4 className="text-xs font-bold text-tech-600 dark:text-tech-400 uppercase tracking-widest flex items-center gap-2">
                        <FileText className="w-4 h-4" /> {content.techOutput}
                    </h4>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsTransparent(!isTransparent)} 
                            className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-2 shadow-sm ${isTransparent ? 'bg-green-100 border-green-200 text-green-700 dark:bg-green-500/20 dark:border-green-500/30 dark:text-green-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'}`} 
                            title={content.transparentBg}
                        >
                            <Grid className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase">Alpha</span>
                        </button>
                        <div className="relative">
                            <select 
                                value={selectedColor} 
                                onChange={(e) => setSelectedColor(e.target.value as ColorTheme)} 
                                className="appearance-none pl-9 pr-10 rtl:pr-9 rtl:pl-10 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none hover:border-tech-400 transition-all cursor-pointer shadow-sm"
                            >
                                <option value="default">{content.colors.default}</option>
                                <option value="blue">{content.colors.blue}</option>
                                <option value="pink">{content.colors.pink}</option>
                                <option value="green">{content.colors.green}</option>
                                <option value="orange">{content.colors.orange}</option>
                                <option value="purple">{content.colors.purple}</option>
                            </select>
                            <Palette className="absolute left-3 rtl:left-auto rtl:right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                            <ChevronDown className="absolute right-3 rtl:right-auto rtl:left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                 </div>
                 <div className="relative min-h-[500px] bg-white dark:bg-slate-950 flex items-center justify-center p-8 transition-all duration-500 overflow-hidden group/canvas">
                    {/* Background grid refined for both modes */}
                    <div className={`absolute inset-0 transition-opacity duration-500 ${isTransparent ? 'opacity-100' : 'opacity-0'}`}>
                        <div className="absolute inset-0 dark:hidden" style={{ backgroundImage: 'linear-gradient(45deg, #f1f5f9 25%, transparent 25%), linear-gradient(-45deg, #f1f5f9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f5f9 75%), linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px' }}></div>
                        <div className="absolute inset-0 hidden dark:block" style={{ backgroundImage: 'linear-gradient(45deg, #0f172a 25%, transparent 25%), linear-gradient(-45deg, #0f172a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #0f172a 75%), linear-gradient(-45deg, transparent 75%, #0f172a 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px' }}></div>
                    </div>

                    {!isTransparent && (
                         <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.1] blueprint-grid pointer-events-none"></div>
                    )}
                    
                    <img 
                        src={result.generatedImage || ''} 
                        alt="Output" 
                        className={`max-h-full max-w-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:drop-shadow-[0_20px_50px_rgba(0,0,0,0.4)] transition-all duration-500 ${selectedColor === 'default' ? 'mix-blend-multiply dark:mix-blend-normal dark:invert' : ''}`} 
                        style={{ filter: selectedColor !== 'default' ? colorFilters[selectedColor] : undefined }} 
                    />
                 </div>
            </div>
        </div>

        {/* Technical Analysis Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col transition-colors">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <History className="w-5 h-5 text-tech-500" /> {content.protocol}
                </h3>
            </div>
            <div className="p-8 overflow-y-auto max-h-[750px] prose prose-sm dark:prose-invert max-w-none rtl:text-right scrollbar-thin dark:scrollbar-thumb-slate-800" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <ReactMarkdown>{result.analysis || ''}</ReactMarkdown>
            </div>
        </div>
      </div>

      {/* Glassmorphism Floating History Bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] w-fit max-w-[95vw]">
          <div className="bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border border-white/40 dark:border-slate-800/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] rounded-[2.5rem] p-4 flex flex-col items-center gap-4 transition-all duration-300">
              <div className="flex items-center gap-2.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-3">
                  <History className="w-3.5 h-3.5" />
                  {content.historyLabel}
              </div>
              <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-1 px-2">
                  {history.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => onSelectHistory(idx)}
                        className={`relative w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all flex-shrink-0 group ${
                            currentIndex === idx 
                                ? 'border-tech-500 scale-110 shadow-2xl ring-4 ring-tech-500/10' 
                                : 'border-slate-100 dark:border-slate-800 hover:border-tech-300 dark:hover:border-tech-500/50 hover:scale-105'
                        }`}
                      >
                          <img src={item.generatedImage || item.originalImage} alt={`History ${idx}`} className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${currentIndex === idx ? '' : 'grayscale-[0.3] group-hover:grayscale-0'}`} />
                          <div className={`absolute inset-0 bg-tech-600/20 transition-opacity ${currentIndex === idx ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}></div>
                          <div className="absolute bottom-1 right-1 bg-slate-900/80 dark:bg-tech-600/90 text-[10px] text-white px-2 py-0.5 rounded-lg font-black backdrop-blur-sm">
                              {idx + 1}
                          </div>
                      </button>
                  ))}
              </div>
          </div>
      </div>
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: rgba(14, 165, 233, 0.2);
          border-radius: 10px;
        }
        
        .blueprint-grid {
            background-image: 
                linear-gradient(rgba(14, 165, 233, 0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(14, 165, 233, 0.05) 1px, transparent 1px);
            background-size: 20px 20px;
        }
      `}</style>
    </div>
  );
};
