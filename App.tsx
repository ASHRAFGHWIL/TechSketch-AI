
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { UploadSection } from './components/UploadSection';
import { ResultSection } from './components/ResultSection';
import { ApiKeyModal } from './components/ApiKeyModal';
import { AppStatus, GenerationResult, Language } from './types';
import { generateTechnicalDrawingImage, generateTechnicalPlan } from './services/geminiService';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [history, setHistory] = useState<GenerationResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [includeDimensions, setIncludeDimensions] = useState(true);
  
  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(false);
  // Language state
  const [language, setLanguage] = useState<Language>('en');

  // Toggle dark mode class on html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Handle direction for Arabic
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!process.env.API_KEY && !apiKey) {
      setShowKeyModal(true);
      return;
    }

    setStatus(AppStatus.UPLOADING);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        const base64Image = e.target?.result as string;
        await processImage(base64Image, false, includeDimensions);
    };
    reader.readAsDataURL(file);
  }, [apiKey, language, includeDimensions]);

  const processImage = async (base64Image: string, highQuality: boolean, dims: boolean) => {
      try {
          setStatus(AppStatus.PROCESSING);
          
          setLoadingMessage(
              highQuality 
                ? (language === 'en' ? 'Refining with Ultra-HQ Precision...' : 'جاري التحسين بدقة عالية جداً...')
                : (language === 'en' ? 'Analyzing geometry & extracting vectors...' : 'جاري تحليل الأشكال الهندسية واستخراج المتجهات...')
          );
          
          const currentKey = process.env.API_KEY || apiKey;
          
          const imagePromise = generateTechnicalDrawingImage(currentKey, base64Image, highQuality, dims);
          const planPromise = generateTechnicalPlan(currentKey, base64Image, language);

          const [generatedImage, analysis] = await Promise.all([imagePromise, planPromise]);

          const newResult: GenerationResult = {
              originalImage: base64Image,
              generatedImage,
              analysis
          };

          setHistory(prev => {
              const updated = [...prev, newResult].slice(-5);
              setCurrentIndex(updated.length - 1);
              return updated;
          });
          
          setStatus(AppStatus.COMPLETED);

      } catch (error: any) {
          console.error("Processing Error:", error);
          const errorMessage = error.message || "";
          const isPermissionDenied = errorMessage.includes("PERMISSION_DENIED") || errorMessage.includes("403") || errorMessage.includes("Requested entity was not found");
          
          if (isPermissionDenied) {
              setApiKey('');
              setShowKeyModal(true);
              alert(language === 'en' 
                ? "Permission Denied: Please select a paid project API key."
                : "تم رفض التصريح: يرجى اختيار مفتاح من مشروع مفعل به الدفع.");
          } else {
              setStatus(AppStatus.ERROR);
              alert(language === 'en' 
                  ? "An error occurred during processing."
                  : "حدث خطأ أثناء المعالجة."
              );
          }
          setStatus(AppStatus.IDLE);
      }
  };

  const handleRedesign = (dims: boolean = true) => {
    if (currentIndex >= 0 && history[currentIndex]) {
        processImage(history[currentIndex].originalImage, true, dims);
    }
  };

  const handleRetry = () => {
    if (currentIndex >= 0 && history[currentIndex]) {
        processImage(history[currentIndex].originalImage, false, includeDimensions);
    }
  };

  const handleReset = () => {
    setStatus(AppStatus.IDLE);
    setHistory([]);
    setCurrentIndex(-1);
  };

  const handleKeySave = (key: string) => {
    setApiKey(key);
    setShowKeyModal(false);
  };

  const t = {
      en: {
          footer: "Powered by Google Gemini Models & Tailwind CSS",
          inference: "Running inference on Gemini vision models..."
      },
      ar: {
          footer: "مدعوم بواسطة نماذج Google Gemini و Tailwind CSS",
          inference: "جاري التشغيل على نماذج رؤية Gemini..."
      }
  };

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 ${language === 'ar' ? 'font-cairo' : 'font-sans'} selection:bg-tech-100 selection:text-tech-900 grid-bg transition-colors duration-300`}>
      
      {(showKeyModal || (!apiKey && !process.env.API_KEY)) && (
        <ApiKeyModal onSave={handleKeySave} language={language} />
      )}
      
      <Header 
        isDarkMode={isDarkMode} 
        toggleTheme={() => setIsDarkMode(!isDarkMode)} 
        language={language}
        setLanguage={setLanguage}
      />

      <main className="flex-1 flex flex-col relative">
        {status === AppStatus.IDLE && (
          <div className="flex-1 flex flex-col items-center justify-center p-4">
             <UploadSection 
                onFileSelect={handleFileSelect} 
                language={language} 
                includeDimensions={includeDimensions}
                setIncludeDimensions={setIncludeDimensions}
             />
          </div>
        )}

        {status === AppStatus.PROCESSING && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-colors duration-300">
                <div className="flex flex-col items-center gap-6 max-w-md text-center p-8">
                    <div className="relative w-24 h-24">
                        <div className="absolute inset-0 border-4 border-tech-100 dark:border-slate-800 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-tech-600 rounded-full border-t-transparent animate-spin"></div>
                        <Loader2 className="absolute inset-0 m-auto w-8 h-8 text-tech-600 animate-pulse" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{loadingMessage}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{t[language].inference}</p>
                    </div>
                    
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-4">
                        <div className="h-full bg-tech-500 animate-progress origin-left rtl:origin-right w-full"></div>
                    </div>
                </div>
            </div>
        )}

        {status === AppStatus.COMPLETED && history.length > 0 && (
            <ResultSection 
              result={history[currentIndex]} 
              history={history}
              currentIndex={currentIndex}
              onSelectHistory={setCurrentIndex}
              onReset={handleReset} 
              onRedesign={handleRedesign}
              onRetry={handleRetry}
              language={language} 
            />
        )}

        {status === AppStatus.IDLE && (
            <footer className="py-6 text-center text-slate-400 dark:text-slate-600 text-sm">
                <p>{t[language].footer}</p>
            </footer>
        )}
      </main>

      <style>{`
        @keyframes progress {
            0% { transform: scaleX(0); }
            50% { transform: scaleX(0.7); }
            100% { transform: scaleX(1); }
        }
        .animate-progress {
            animation: progress 3s ease-out infinite;
        }
        .animate-fade-in {
            animation: fadeIn 0.5s ease-out forwards;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default App;
