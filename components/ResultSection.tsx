import React, { useState } from 'react';
import { Download, RefreshCw, FileText, CheckCircle2, FileCode, FileType, Palette, ChevronDown, Loader2 } from 'lucide-react';
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
  const [isExporting, setIsExporting] = useState(false);

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
      // Invert (White lines, Black BG) -> Sepia (Colorize) -> Saturate (Vibrant) -> Hue Rotate (Shift Color)
      blue: 'invert(1) sepia(1) saturate(5000%) hue-rotate(190deg) brightness(1.2)', 
      pink: 'invert(1) sepia(1) saturate(5000%) hue-rotate(300deg) brightness(1.2)',
      green: 'invert(1) sepia(1) saturate(5000%) hue-rotate(80deg) brightness(1.2)',
      orange: 'invert(1) sepia(1) saturate(5000%) hue-rotate(0deg) brightness(1.2)',
      purple: 'invert(1) sepia(1) saturate(5000%) hue-rotate(240deg) brightness(1.2)',
  };

  /**
   * Applies the selected color filters to the image using a temporary canvas
   * and returns the new Base64 Data URL.
   */
  const processImageForExport = async (url: string, theme: ColorTheme): Promise<string> => {
    if (theme === 'default') return url;

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
            
            // Draw a solid black background first to ensure the neon effect looks correct (opaque)
            // The invert filter turns the white background to black, but drawing black first is safer for alpha handling.
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Apply the exact same filters used in CSS
            ctx.filter = colorFilters[theme];
            ctx.drawImage(img, 0, 0);
            
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = reject;
    });
  };

  const handleDownloadPNG = async () => {
    if (!result.generatedImage) return;
    setIsExporting(true);

    try {
        const imageUrl = await processImageForExport(result.generatedImage, selectedColor);
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `technical-drawing-${selectedColor}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error("PNG Export Error:", error);
    } finally {
        setIsExporting(false);
    }
  };

  const handleDownloadSVG = async () => {
    if (!result.generatedImage) return;
    setIsExporting(true);

    try {
        // Embed the PROCESSED image (with colors) into the SVG
        const imageUrl = await processImageForExport(result.generatedImage, selectedColor);
        
        const svgContent = `
<svg width="100%" height="100%" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <title>Technical Drawing Export (${selectedColor})</title>
  <desc>Generated by TechSketch AI</desc>
  <image href="${imageUrl}" x="0" y="0" width="100%" height="100%" />
</svg>`;
        
        const blob = new Blob([svgContent.trim()], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `technical-drawing-${selectedColor}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
         console.error("SVG Export Error:", error);
    } finally {
        setIsExporting(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!result.generatedImage) return;
    setIsExporting(true);

    try {
        const imageUrl = await processImageForExport(result.generatedImage, selectedColor);
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(20);
        doc.setTextColor(0, 51, 102);
        doc.text("TechSketch AI | Technical Drawing", 15, 20);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 15, 28);
        doc.text(`Theme: ${selectedColor.charAt(0).toUpperCase() + selectedColor.slice(1)}`, 15, 33);
        doc.line(15, 36, 195, 36);
        
        // Image placement logic
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        const maxWidth = pageWidth - (margin * 2);
        const maxHeight = pageHeight - 60;
        
        const imgProps = doc.getImageProperties(imageUrl);
        let imgHeight = (imgProps.height * maxWidth) / imgProps.width;
        let imgWidth = maxWidth;

        if (imgHeight > maxHeight) {
            imgWidth = (imgProps.width * maxHeight) / imgProps.height;
            imgHeight = maxHeight;
        }
        
        doc.addImage(imageUrl, 'PNG', margin, 45, imgWidth, imgHeight);
        
        // Analysis Page (Only include text if English)
        if (result.analysis && language === 'en') {
            doc.addPage();
            doc.setFontSize(16);
            doc.setTextColor(0, 51, 102);
            doc.text("Technical Specifications & Analysis", 15, 20);
            doc.line(15, 25, 195, 25);
            
            doc.setFontSize(11);
            doc.setTextColor(60);
            
            const cleanText = result.analysis
                .replace(/#{1,6} /g, '') 
                .replace(/\*\*/g, '') 
                .replace(/\*/g, '•'); 
                
            const splitText = doc.splitTextToSize(cleanText, maxWidth);
            doc.text(splitText, 15, 35);
        } else if (result.analysis && language === 'ar') {
             doc.addPage();
             doc.setFontSize(12);
             doc.text("Full analysis available in web view.", 15, 20);
             doc.text("(Arabic PDF text export requires custom font installation)", 15, 28);
        }
        
        doc.save(`technical-drawing-report-${selectedColor}.pdf`);
    } catch (error) {
        console.error("PDF Export Error:", error);
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

            <div className="flex gap-2 flex-1 sm:flex-none">
                <button 
                    onClick={handleDownloadPNG}
                    disabled={!result.generatedImage || isExporting}
                    className="flex-1 items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors flex disabled:opacity-50"
                    title="Download PNG Image"
                >
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileType className="w-4 h-4" />}
                    PNG
                </button>
                <button 
                    onClick={handleDownloadSVG}
                    disabled={!result.generatedImage || isExporting}
                    className="flex-1 items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors flex disabled:opacity-50"
                    title="Export as SVG"
                >
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCode className="w-4 h-4" />}
                    SVG
                </button>
                <button 
                    onClick={handleDownloadPDF}
                    disabled={!result.generatedImage || isExporting}
                    className="flex-1 items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-tech-600 border border-tech-600 rounded-lg hover:bg-tech-700 transition-colors flex disabled:opacity-50"
                    title="Export PDF Report"
                >
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <FileText className="w-4 h-4" />}
                    PDF
                </button>
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