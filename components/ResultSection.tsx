import React, { useState, useRef, useEffect } from 'react';
import { Download, RefreshCw, FileText, CheckCircle2, FileCode, FileType, Palette, ChevronDown, Loader2, Image as ImageIcon, Grid } from 'lucide-react';
import { GenerationResult, Language } from '../types';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from 'jspdf';

interface ResultSectionProps {
  result: GenerationResult;
  onReset: () => void;
  language: Language;
}

type ColorTheme = 'default' | 'blue' | 'pink' | 'green' | 'orange' | 'purple';

export const ResultSection: React.FC<ResultSectionProps> = ({ result, onReset, language }) => {
  const [selectedColor, setSelectedColor] = useState<ColorTheme>('default');
  const [isTransparent, setIsTransparent] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
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
        sourceInput: "Source Input",
        techOutput: "Technical Output",
        protocol: "Illustration Protocol",
        vectorMode: "VECTOR_MODE_V2",
        failed: "Image generation failed.",
        download: "Download",
        transparentBg: "Transparent Background",
        formats: {
            png: "Image File (PNG)",
            svg: "Vector Container (SVG)",
            pdf: "Technical Report (PDF)",
            ai: "Adobe Illustrator (AI)",
            eps: "Encapsulated PostScript (EPS)",
            cdr: "CorelDRAW (CDR)"
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
        sourceInput: "الصورة الأصلية",
        techOutput: "المخرج التقني",
        protocol: "بروتوكول الرسم",
        vectorMode: "وضع_الفيكتور_2",
        failed: "فشل إنشاء الصورة.",
        download: "تـحـمـيـل",
        transparentBg: "خلفية شفافة",
        formats: {
            png: "ملف صورة (PNG)",
            svg: "حاوية فيكتور (SVG)",
            pdf: "تقرير فني (PDF)",
            ai: "أدوبي إليستريتور (AI)",
            eps: "بوست سكريبت (EPS)",
            cdr: "كوريل درو (CDR)"
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

  // CSS Filters to transform black lines on white bg -> Neon lines on black bg
  const colorFilters: Record<ColorTheme, string> = {
      default: 'none',
      blue: 'invert(1) sepia(1) saturate(5000%) hue-rotate(190deg) brightness(1.2)', 
      pink: 'invert(1) sepia(1) saturate(5000%) hue-rotate(300deg) brightness(1.2)',
      green: 'invert(1) sepia(1) saturate(5000%) hue-rotate(80deg) brightness(1.2)',
      orange: 'invert(1) sepia(1) saturate(5000%) hue-rotate(0deg) brightness(1.2)',
      purple: 'invert(1) sepia(1) saturate(5000%) hue-rotate(240deg) brightness(1.2)',
  };

  /**
   * Applies filters and returns the Canvas element for data extraction.
   */
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
            
            // Draw solid black background for neon themes if not transparent initially
            // Note: CSS Filters work on the source image. 
            // If we want transparency, we rely on post-processing the pixels.
            // If we want solid background, we can fill rect.
            
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

            // Post-process for transparency
            if (transparent) {
                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imgData.data;
                const isNeon = theme !== 'default';
                const threshold = 30; // RGB threshold for background detection

                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i+1];
                    const b = data[i+2];

                    if (isNeon) {
                        // Neon Mode: Background is Black. Remove Black pixels.
                        // Check if pixel is dark enough
                        if (r < threshold && g < threshold && b < threshold) {
                            data[i+3] = 0; // Set Alpha to 0
                        }
                    } else {
                        // Default Mode: Background is White. Remove White pixels.
                        // Check if pixel is bright enough
                        if (r > 255 - threshold && g > 255 - threshold && b > 255 - threshold) {
                            data[i+3] = 0; // Set Alpha to 0
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

  /**
   * Generates EPS (Encapsulated PostScript) content from Canvas Data
   */
  const generateEPS = (canvas: HTMLCanvasElement): string => {
    const width = canvas.width;
    const height = canvas.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    
    let hexData = '';
    // Simple R G B hex encoding
    for (let i = 0; i < data.length; i += 4) {
        // Handle alpha for white background if opaque
        const a = data[i+3];
        let r, g, b;
        
        if (a === 0) {
            // If transparent, write as white (EPS basic doesn't support alpha channel easily without masking)
            // But for vector softwares importing this, white background is standard canvas
            r = 'FF'; g = 'FF'; b = 'FF'; 
        } else {
            r = data[i].toString(16).padStart(2, '0');
            g = data[i+1].toString(16).padStart(2, '0');
            b = data[i+2].toString(16).padStart(2, '0');
        }
        
        hexData += r + g + b;
    }
    
    // Break into lines to avoid massive single line
    const chunkedHex = hexData.match(/.{1,128}/g)?.join('\n') || hexData;

    return `%!PS-Adobe-3.0 EPSF-3.0
%%BoundingBox: 0 0 ${width} ${height}
%%Title: TechSketch Export
%%Creator: TechSketch AI
%%Pages: 1
%%EndComments
/readstring {
  currentfile exch readhexstring pop
} bind def
/rpic {
  ${width} ${height} scale
  ${width} ${height} 8 [${width} 0 0 -${height} 0 ${height}]
  {currentfile ${width * 3} string readhexstring pop} false 3 colorimage
} bind def
rpic
${chunkedHex}
%%EOF`;
  };

  const handleDownload = async (format: 'png' | 'svg' | 'pdf' | 'ai' | 'eps' | 'cdr') => {
    if (!result.generatedImage) return;
    setIsExporting(true);
    setIsMenuOpen(false);

    try {
        const canvas = await getProcessedCanvas(result.generatedImage, selectedColor, isTransparent);
        const link = document.createElement('a');

        if (format === 'png') {
            link.href = canvas.toDataURL('image/png');
            link.download = `technical-drawing-${selectedColor}.png`;
        } 
        else if (format === 'svg') {
            const imageUrl = canvas.toDataURL('image/png');
            const svgContent = `
<svg width="100%" height="100%" viewBox="0 0 ${canvas.width} ${canvas.height}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <image href="${imageUrl}" x="0" y="0" width="${canvas.width}" height="${canvas.height}" />
</svg>`;
            const blob = new Blob([svgContent.trim()], { type: 'image/svg+xml' });
            link.href = URL.createObjectURL(blob);
            link.download = `technical-drawing-${selectedColor}.svg`;
        }
        else if (format === 'pdf' || format === 'ai') {
            // AI files are PDF-compatible. We generate a PDF.
            // For AI, we only save the image page to keep it clean for editing.
            const imageUrl = canvas.toDataURL('image/png');
            const doc = new jsPDF({
                orientation: canvas.width > canvas.height ? 'l' : 'p',
                unit: 'px',
                format: [canvas.width + 40, canvas.height + 40] // Custom size to fit image + margins
            });
            
            doc.addImage(imageUrl, 'PNG', 20, 20, canvas.width, canvas.height);
            
            // Only add text report for PDF export, not AI
            if (format === 'pdf' && result.analysis && language === 'en') {
                doc.addPage();
                doc.setFontSize(16);
                doc.text("Technical Specifications", 20, 40);
                doc.setFontSize(12);
                const splitText = doc.splitTextToSize(result.analysis.replace(/[#*]/g, ''), canvas.width);
                doc.text(splitText, 20, 60);
            }
            
            link.href = doc.output('bloburl');
            link.download = `technical-drawing-${selectedColor}.${format}`;
        }
        else if (format === 'eps' || format === 'cdr') {
            const epsContent = generateEPS(canvas);
            const blob = new Blob([epsContent], { type: 'application/postscript' });
            link.href = URL.createObjectURL(blob);
            link.download = `technical-drawing-${selectedColor}.${format}`;
        }

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (link.href.startsWith('blob:')) URL.revokeObjectURL(link.href);

    } catch (error) {
        console.error("Export Error:", error);
    } finally {
        setIsExporting(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
                <h3 className="font-bold text-slate-900 dark:text-white">{content.statusTitle}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{content.statusDesc}</p>
            </div>
        </div>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            <button 
                onClick={onReset}
                className="flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex"
            >
                <RefreshCw className="w-4 h-4" />
                {content.newProject}
            </button>
            
            <div className="h-auto w-px bg-slate-300 dark:bg-slate-700 hidden sm:block mx-2"></div>

            <div className="relative flex-1 sm:flex-none" ref={menuRef}>
                <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    disabled={!result.generatedImage || isExporting}
                    className="w-full sm:w-auto flex items-center justify-between sm:justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-tech-600 border border-tech-600 rounded-lg hover:bg-tech-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div className="flex items-center gap-2">
                        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        {content.download}
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isMenuOpen && (
                    <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-1">
                            <button onClick={() => handleDownload('png')} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-left rtl:text-right transition-colors">
                                <ImageIcon className="w-4 h-4 text-tech-500" />
                                {content.formats.png}
                            </button>
                            <button onClick={() => handleDownload('svg')} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-left rtl:text-right transition-colors">
                                <FileCode className="w-4 h-4 text-orange-500" />
                                {content.formats.svg}
                            </button>
                            <button onClick={() => handleDownload('pdf')} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-left rtl:text-right transition-colors">
                                <FileText className="w-4 h-4 text-red-500" />
                                {content.formats.pdf}
                            </button>
                            <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                            <button onClick={() => handleDownload('ai')} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-left rtl:text-right transition-colors">
                                <FileType className="w-4 h-4 text-orange-600" />
                                {content.formats.ai}
                            </button>
                            <button onClick={() => handleDownload('eps')} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-left rtl:text-right transition-colors">
                                <FileType className="w-4 h-4 text-blue-600" />
                                {content.formats.eps}
                            </button>
                            <button onClick={() => handleDownload('cdr')} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-left rtl:text-right transition-colors">
                                <FileType className="w-4 h-4 text-green-600" />
                                {content.formats.cdr}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
        
        {/* Left Column: Visuals */}
        <div className="space-y-6">
             {/* Original Image */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors duration-300">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 rtl:text-right">{content.sourceInput}</h4>
                <div className="aspect-video relative bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center">
                    <img 
                        src={result.originalImage} 
                        alt="Original" 
                        className="max-h-full max-w-full object-contain"
                    />
                </div>
            </div>

            {/* Generated Image */}
            <div className="bg-white dark:bg-slate-900 p-1 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden ring-4 ring-slate-50 dark:ring-slate-800 transition-colors duration-300">
                 <div className="flex flex-wrap items-center justify-between p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 gap-2">
                    <h4 className="text-xs font-bold text-tech-600 dark:text-tech-400 uppercase tracking-wider flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        {content.techOutput}
                    </h4>

                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setIsTransparent(!isTransparent)}
                            className={`p-1.5 rounded-md transition-colors border ${isTransparent ? 'bg-tech-100 border-tech-200 text-tech-600 dark:bg-tech-900/30 dark:border-tech-800 dark:text-tech-400' : 'bg-white border-slate-200 text-slate-400 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-400'}`}
                            title={content.transparentBg}
                        >
                            <Grid className="w-4 h-4" />
                        </button>

                        <div className="relative">
                            <div className="absolute inset-y-0 left-2 rtl:left-auto rtl:right-2 flex items-center pointer-events-none">
                                <Palette className="w-3 h-3 text-slate-400" />
                            </div>
                            <select 
                                value={selectedColor}
                                onChange={(e) => setSelectedColor(e.target.value as ColorTheme)}
                                className="appearance-none pl-7 pr-8 rtl:pr-7 rtl:pl-8 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md focus:outline-none focus:ring-1 focus:ring-tech-500 cursor-pointer"
                            >
                                <option value="default">{content.colors.default}</option>
                                <option value="blue">{content.colors.blue}</option>
                                <option value="pink">{content.colors.pink}</option>
                                <option value="green">{content.colors.green}</option>
                                <option value="orange">{content.colors.orange}</option>
                                <option value="purple">{content.colors.purple}</option>
                            </select>
                            <div className="absolute inset-y-0 right-2 rtl:right-auto rtl:left-2 flex items-center pointer-events-none">
                                <ChevronDown className="w-3 h-3 text-slate-400" />
                            </div>
                        </div>
                    </div>
                 </div>
                 <div className="relative min-h-[400px] bg-white dark:bg-slate-950 p-6 blueprint-grid flex items-center justify-center transition-colors duration-300">
                    {result.generatedImage ? (
                         <img 
                            src={result.generatedImage} 
                            alt="Generated Technical Drawing" 
                            className={`max-h-full max-w-full object-contain drop-shadow-2xl transition-all duration-500 ${
                                selectedColor === 'default' ? 'mix-blend-multiply dark:mix-blend-normal dark:invert' : 'mix-blend-screen'
                            }`}
                            style={{ 
                                filter: selectedColor !== 'default' ? colorFilters[selectedColor] : undefined 
                            }}
                         />
                    ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400">
                            <p>{content.failed}</p>
                        </div>
                    )}
                    
                    {/* Mock rulers for aesthetic */}
                    <div className="absolute left-0 top-0 bottom-0 w-6 border-e border-slate-200/50 dark:border-slate-700/30 flex flex-col justify-between py-2 items-center text-[8px] text-slate-300 dark:text-slate-700 font-mono select-none pointer-events-none">
                        <span>0</span><span>10</span><span>20</span><span>30</span><span>40</span>
                    </div>
                    <div className="absolute left-0 top-0 right-0 h-6 border-b border-slate-200/50 dark:border-slate-700/30 flex justify-between px-2 items-center text-[8px] text-slate-300 dark:text-slate-700 font-mono select-none pointer-events-none ps-8">
                        <span>0</span><span>10</span><span>20</span><span>30</span><span>40</span>
                    </div>
                 </div>
            </div>
        </div>

        {/* Right Column: Analysis Text */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-full overflow-hidden transition-colors duration-300">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-2 h-2 bg-tech-500 rounded-full animate-pulse"></span>
                    {content.protocol}
                </h3>
            </div>
            <div className="p-6 overflow-y-auto max-h-[800px] prose prose-slate prose-sm dark:prose-invert max-w-none rtl:text-right" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                {result.analysis ? (
                    <ReactMarkdown
                        components={{
                            h1: ({node, ...props}) => <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-200 dark:border-slate-700" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3 flex items-center gap-2 before:content-['#'] before:text-tech-300 dark:before:text-tech-600" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-base font-medium text-slate-800 dark:text-slate-300 mt-4 mb-2" {...props} />,
                            ul: ({node, ...props}) => <ul className="space-y-2 my-4 list-none pl-0 rtl:pr-0" {...props} />,
                            li: ({node, ...props}) => (
                                <li className="flex gap-3 text-slate-600 dark:text-slate-400" {...props}>
                                    <span className="text-tech-400 dark:text-tech-500 mt-1.5 rtl:rotate-180">›</span>
                                    <span>{props.children}</span>
                                </li>
                            ),
                            strong: ({node, ...props}) => <strong className="font-semibold text-slate-900 dark:text-white" {...props} />,
                        }}
                    >
                        {result.analysis}
                    </ReactMarkdown>
                ) : (
                    <div className="space-y-4 animate-pulse">
                         <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4"></div>
                         <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/2"></div>
                         <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-5/6"></div>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};