import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { UploadSection } from './components/UploadSection';
import { ResultSection } from './components/ResultSection';
import { ApiKeyModal } from './components/ApiKeyModal';
import { AppStatus, GenerationResult } from './types';
import { generateTechnicalDrawingImage, generateTechnicalPlan } from './services/geminiService';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  
  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Toggle dark mode class on html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!apiKey) return;

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

        try {
            setStatus(AppStatus.PROCESSING);
            
            // Parallel processing: Generate Image AND Analyze Text
            setLoadingMessage('Analyzing geometry & extracting vectors...');
            
            // We launch both requests but handle them as they complete
            const imagePromise = generateTechnicalDrawingImage(apiKey, base64Image);
            const planPromise = generateTechnicalPlan(apiKey, base64Image);

            const [generatedImage, analysis] = await Promise.all([imagePromise, planPromise]);

            setResult(prev => prev ? {
                ...prev,
                generatedImage,
                analysis
            } : null);
            
            setStatus(AppStatus.COMPLETED);

        } catch (error) {
            console.error(error);
            setStatus(AppStatus.ERROR);
            alert("An error occurred during processing. Please check your API Key or try a different image.");
            setStatus(AppStatus.IDLE);
        }
    };
    reader.readAsDataURL(file);
  }, [apiKey]);

  const handleReset = () => {
    setStatus(AppStatus.IDLE);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-tech-100 selection:text-tech-900 grid-bg transition-colors duration-300">
      
      {!apiKey && <ApiKeyModal onSave={setApiKey} />}
      
      <Header isDarkMode={isDarkMode} toggleTheme={() => setIsDarkMode(!isDarkMode)} />

      <main className="flex-1 flex flex-col relative">
        {status === AppStatus.IDLE && (
          <div className="flex-1 flex items-center justify-center p-4">
             <UploadSection onFileSelect={handleFileSelect} />
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
                        <p className="text-sm text-slate-500 dark:text-slate-400">Running inference on Gemini 2.5 Flash models...</p>
                    </div>
                    
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-4">
                        <div className="h-full bg-tech-500 animate-progress origin-left w-full"></div>
                    </div>
                </div>
            </div>
        )}

        {status === AppStatus.COMPLETED && result && (
            <ResultSection result={result} onReset={handleReset} />
        )}

        {/* Footer in Idle state */}
        {status === AppStatus.IDLE && (
            <footer className="py-6 text-center text-slate-400 dark:text-slate-600 text-sm">
                <p>Powered by Google Gemini 2.5 Flash & Tailwind CSS</p>
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