
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
            
            if (theme !== 'default' && !transparent) {
                 ctx.fillStyle = '#000000';
                 ctx.fillRect(0, 0, canvas.width, canvas.height);
            } else if (!transparent) {
                 ctx.fillStyle = '#FFFFFF';
                 ctx.fillRect(0, 0, canvas.width, canvas.height);
            } else {
                 ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
            
            ctx.filter = colorFilters[theme];
            ctx.drawImage(img, 0, 0);

            if (transparent) {
                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imgData.data;
                const threshold = 30;
                for (let i = 0; i < data.length; i += 4) {
                    if (theme === 'default') {
                        if (data[i] > 255 - threshold && data[i+1] > 255 - threshold && data[i+2] > 255 - threshold) data[i+3] = 0;
                    } else {
                        if (data[i] < threshold && data[i+1] < threshold && data[i+2] < threshold) data[i+3] = 0;
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
        if (format === 'png') {
            link.href = canvas.toDataURL('image/png');
            link.download = `tech-drawing-${selectedColor}.png`;
        } else if (format === 'svg') {
            const imageUrl = canvas.toDataURL('image/png');
            const svgContent = `<svg width="${canvas.width}" height="${canvas.height}" xmlns="http://www.w3.org/2000/svg"><image href="${imageUrl}" width="100%" height="100%"/></svg>`;
            link.href = URL.createObjectURL(new Blob([svgContent], {type: 'image/svg+xml'}));
            link.download = `tech-drawing-${selectedColor}.svg`;
        } else if (format === 'pdf') {
            const doc = new jsPDF({ orientation: canvas.width > canvas.height ? 'l' : 'p', unit: 'px', format: [canvas.width + 40, canvas.height + 40] });
            doc.addImage(canvas.toDataURL('image/png'), 'PNG', 20, 20, canvas.width, canvas.height);
            link.href = doc.output('bloburl');
            link.download = `tech-report-${selectedColor}.pdf`;
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
                <h3 className="font-bold text-slate-900 dark:text-white">{content.statusTitle}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{content.statusDesc}</p>
            </div>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button onClick={onReset} className="flex-1 sm:flex-none items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex">
                <RefreshCw className="w-4 h-4" />
                {content.newProject}
            </button>
            <button onClick={onRetry} className="flex-1 sm:flex-none items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex">
                <RotateCw className="w-4 h-4" />
                {content.retry}
            </button>
            <button onClick={() => onRedesign(true)} className="flex-1 sm:flex-none items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-tech-700 dark:text-tech-400 bg-tech-50 dark:bg-tech-900/20 border border-tech-200 dark:border-tech-800 rounded-lg hover:bg-tech-100 dark:hover:bg-tech-900/40 flex transition-colors">
                <Sparkles className="w-4 h-4" />
                {content.redesignHq}
            </button>
            <button onClick={() => onRedesign(false)} className="flex-1 sm:flex-none items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 flex transition-colors">
                <PenTool className="w-4 h-4" />
                {content.redesignPure}
            </button>
            <div className="relative flex-1 sm:flex-none" ref={menuRef}>
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} disabled={isExporting} className="w-full sm:w-auto flex items-center justify-between sm:justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-tech-600 rounded-lg hover:bg-tech-700 disabled:opacity-50">
                    <div className="flex items-center gap-2">
                        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        {content.download}
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {isMenuOpen && (
                    <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 p-1">
                        <button onClick={() => handleDownload('png')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-left rtl:text-right">
                            <ImageIcon className="w-4 h-4 text-tech-500" /> {content.formats.png}
                        </button>
                        <button onClick={() => handleDownload('svg')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-left rtl:text-right">
                            <FileCode className="w-4 h-4 text-orange-500" /> {content.formats.svg}
                        </button>
                        <button onClick={() => handleDownload('pdf')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-left rtl:text-right">
                            <FileText className="w-4 h-4 text-red-500" /> {content.formats.pdf}
                        </button>
                    </div>
                )}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 rtl:text-right">{content.sourceInput}</h4>
                <div className="aspect-video relative bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center">
                    <img src={result.originalImage} alt="Original" className="max-h-full max-w-full object-contain" />
                </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-1 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden ring-4 ring-slate-50 dark:ring-slate-800">
                 <div className="flex flex-wrap items-center justify-between p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 gap-2">
                    <h4 className="text-xs font-bold text-tech-600 dark:text-tech-400 uppercase tracking-wider flex items-center gap-2">
                        <FileText className="w-4 h-4" /> {content.techOutput}
                    </h4>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsTransparent(!isTransparent)} className={`p-1.5 rounded-md border transition-colors ${isTransparent ? 'bg-tech-100 border-tech-200 text-tech-600 dark:bg-tech-900/30' : 'bg-white border-slate-200 text-slate-400 dark:bg-slate-700'}`} title={content.transparentBg}>
                            <Grid className="w-4 h-4" />
                        </button>
                        <div className="relative">
                            <select value={selectedColor} onChange={(e) => setSelectedColor(e.target.value as ColorTheme)} className="appearance-none pl-7 pr-8 rtl:pr-7 rtl:pl-8 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md focus:outline-none">
                                <option value="default">{content.colors.default}</option>
                                <option value="blue">{content.colors.blue}</option>
                                <option value="pink">{content.colors.pink}</option>
                                <option value="green">{content.colors.green}</option>
                                <option value="orange">{content.colors.orange}</option>
                                <option value="purple">{content.colors.purple}</option>
                            </select>
                            <Palette className="absolute left-2 rtl:left-auto rtl:right-2 top-1.5 w-3 h-3 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                 </div>
                 <div className="relative min-h-[400px] bg-white dark:bg-slate-950 blueprint-grid flex items-center justify-center p-6">
                    <img src={result.generatedImage || ''} alt="Output" className={`max-h-full max-w-full object-contain drop-shadow-2xl transition-all ${selectedColor === 'default' ? 'mix-blend-multiply dark:mix-blend-normal dark:invert' : ''}`} style={{ filter: selectedColor !== 'default' ? colorFilters[selectedColor] : undefined }} />
                 </div>
            </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center">
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-tech-500" /> {content.protocol}
                </h3>
            </div>
            <div className="p-6 overflow-y-auto max-h-[600px] prose prose-sm dark:prose-invert max-w-none rtl:text-right" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <ReactMarkdown>{result.analysis || ''}</ReactMarkdown>
            </div>
        </div>
      </div>

      {/* Floating History Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] w-fit max-w-[90vw]">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-800 shadow-2xl rounded-2xl p-3 flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest px-2">
                  <History className="w-3 h-3" />
                  {content.historyLabel}
              </div>
              <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1 px-2">
                  {history.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => onSelectHistory(idx)}
                        className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 group ${
                            currentIndex === idx 
                                ? 'border-tech-500 scale-110 shadow-lg' 
                                : 'border-slate-200 dark:border-slate-700 hover:border-tech-400 hover:scale-105'
                        }`}
                      >
                          <img src={item.generatedImage || item.originalImage} alt={`History ${idx}`} className="w-full h-full object-cover" />
                          <div className={`absolute inset-0 bg-tech-600/20 transition-opacity ${currentIndex === idx ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}></div>
                          <div className="absolute bottom-0 right-0 bg-tech-600 text-[8px] text-white px-1.5 py-0.5 rounded-tl-md font-bold">
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
      `}</style>
    </div>
  );
};
