import React from 'react';
import { PenTool, Ruler, Layers, Moon, Sun, Languages } from 'lucide-react';
import { Language } from '../types';

interface HeaderProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const Header: React.FC<HeaderProps> = ({ isDarkMode, toggleTheme, language, setLanguage }) => {
  
  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  const t = {
    en: {
      title: "TechSketch AI",
      subtitle: "PRODUCT TO VECTOR CONVERTER",
      layerExtraction: "Layer Extraction",
      autoDimension: "Auto-Dimension"
    },
    ar: {
      title: "TechSketch AI",
      subtitle: "تحويل المنتج إلى فيكتور",
      layerExtraction: "استخراج الطبقات",
      autoDimension: "أبعاد تلقائية"
    }
  };

  const content = t[language];

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white">
          <div className="bg-tech-600 p-2 rounded-lg">
            <PenTool className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight rtl:text-right">{content.title}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono hidden sm:block rtl:text-right">{content.subtitle}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-300 font-medium hidden md:flex">
                <div className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-tech-500" />
                    <span>{content.layerExtraction}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Ruler className="w-4 h-4 text-tech-500" />
                    <span>{content.autoDimension}</span>
                </div>
            </div>

            <div className="flex items-center gap-2 border-s border-slate-200 dark:border-slate-700 ps-4">
                <button 
                    onClick={toggleLanguage}
                    className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-tech-500 flex items-center gap-1"
                    aria-label="Toggle Language"
                    title={language === 'en' ? "Switch to Arabic" : "Switch to English"}
                >
                    <Languages className="w-5 h-5" />
                    <span className="text-xs font-bold">{language === 'en' ? 'EN' : 'عربي'}</span>
                </button>

                <button 
                    onClick={toggleTheme}
                    className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-tech-500"
                    aria-label="Toggle Dark Mode"
                >
                    {isDarkMode ? (
                        <Sun className="w-5 h-5" />
                    ) : (
                        <Moon className="w-5 h-5" />
                    )}
                </button>
            </div>
        </div>
      </div>
    </header>
  );
};