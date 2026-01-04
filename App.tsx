
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
  const [result, setResult] = useState<GenerationResult | null>(null);
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
    if (!apiKey && !process.env.API_KEY) {
      setShowKeyModal(true);
      return;
    }

    setStatus(AppStatus.UPLOADING);
    
    // Read file to base64
    const reader = new FileReader();
    reader.onload = async (e) => {
        const base64Image = e.target?.result as string;
        
        setResult({
            originalImage: base64Image,
            generatedImage: null,
            analysis: null,
        });

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
          
          // Image generation - Use the requested quality and dimension settings
          const imagePromise = generateTechnicalDrawingImage(currentKey, base64Image, highQuality, dims);
          
          const planPromise = result?.analysis ? Promise.resolve(result.analysis) : generateTechnicalPlan(currentKey, base64Image, language);

          const [generatedImage, analysis] = await Promise.all([imagePromise, planPromise]);

          setResult(prev => prev ? {
              ...prev,
              generatedImage,
              analysis
          } : null);
          
          setStatus(AppStatus.COMPLETED);

      } catch (error: any) {
          console.error(error);
          
          const errorMsg = error.message || "";
          if (errorMsg.includes("PERMISSION_DENIED") || errorMsg.includes("403") || errorMsg.includes("not found")) {
            setStatus(AppStatus.IDLE);
            setShowKeyModal(true);
            alert(language === 'en'
              ? "Access denied. High-quality models require a valid API key from a paid project. Please re-select your key."
              : "تم رفض الوصول. تتطلب النماذج عالية الجودة مفتاح API صالحًا من مشروع مفعل به الدفع. يرجى إعادة اختيار مفتاحك."
            );
          } else {
            setStatus(AppStatus.ERROR);
            alert(language === 'en' 
                ? "An error occurred during processing. Please check your connection or try again."
                : "حدث خطأ أثناء المعالجة. يرجى التحقق من اتصالك أو المحاولة مرة أخرى."
            );
            setStatus(AppStatus.IDLE);
          }
      }
  };

  const handleRedesign = (dims: boolean = true) => {
    if (result && result.originalImage) {
        processImage(result.originalImage, true, dims);
    }
  };

  const handleReset = () => {
    setStatus(AppStatus.IDLE);
    setResult(null);
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

  const handleKeySave = (key: string) => {
    setApiKey(key);
    setShowKeyModal(false);
  };

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 ${language === 'ar' ? 'font-cairo' : 'font-sans'} selection:bg-tech-100 selection:text-tech-900 grid-bg transition-colors duration-300`}>
      
      {(showKeyModal || (!apiKey && !process.env.API_KEY)) && <ApiKeyModal onSave={handleKeySave} language={language} />}
      
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

        {status === AppStatus.COMPLETED && result && (
            <ResultSection 
              result={result} 
              onReset={handleReset} 
              onRedesign={handleRedesign}
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
