
import React, { useState, useEffect } from 'react';
import { Key, Lock, AlertCircle, ExternalLink } from 'lucide-react';
import { Language } from '../types';

interface ApiKeyModalProps {
  onSave: (key: string) => void;
  language: Language;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave, language }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkKey = async () => {
      // Check if a key is already selected in the AI Studio environment
      if ((window as any).aistudio) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (hasKey) {
          onSave(process.env.API_KEY || '');
          setIsOpen(false);
        }
      } else if (process.env.API_KEY) {
        // Fallback for direct environment variable availability
        onSave(process.env.API_KEY);
        setIsOpen(false);
      }
    };
    checkKey();
  }, [onSave]);

  const handleOpenSelectKey = async () => {
    try {
      if ((window as any).aistudio) {
        await (window as any).aistudio.openSelectKey();
        // As per instructions, proceed assuming success after triggering the dialog
        onSave(process.env.API_KEY || '');
        setIsOpen(false);
      } else {
        setError(language === 'en' 
          ? "Key selection is only available within the AI Studio environment." 
          : "اختيار المفتاح متاح فقط داخل بيئة AI Studio.");
      }
    } catch (err) {
      setError(language === 'en' 
        ? "Failed to open the key selection dialog." 
        : "فشل في فتح نافذة اختيار المفتاح.");
    }
  };

  const t = {
    en: {
      title: "Authorization Required",
      subtitle: "Select a paid API Key to continue",
      description: "This application uses high-quality Gemini Pro models for technical illustration. These models require a valid API key from a paid Google Cloud project.",
      button: "Select API Key",
      billingLink: "Learn about Gemini API billing",
      hint: "Your key is managed securely by AI Studio."
    },
    ar: {
      title: "مطلوب تصريح",
      subtitle: "اختر مفتاح API مفعل للمتابعة",
      description: "يستخدم هذا التطبيق نماذج Gemini Pro عالية الجودة للرسوم الفنية. تتطلب هذه النماذج مفتاح API صالحًا من مشروع Google Cloud مفعل به الدفع.",
      button: "اختر مفتاح API",
      billingLink: "تعرف على فوترة Gemini API",
      hint: "يتم إدارة مفتاحك بأمان بواسطة AI Studio."
    }
  };

  const content = t[language];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-slate-800 transition-colors duration-300">
        <div className="bg-tech-50 dark:bg-slate-800 p-6 border-b border-tech-100 dark:border-slate-700 flex items-center gap-3">
            <div className="p-2 bg-white dark:bg-slate-700 rounded-lg border border-tech-100 dark:border-slate-600 shadow-sm">
                <Key className="w-5 h-5 text-tech-600 dark:text-tech-400" />
            </div>
            <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{content.title}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{content.subtitle}</p>
            </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {content.description}
            </p>
            
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-tech-600 dark:text-tech-400 hover:underline"
            >
              {content.billingLink}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handleOpenSelectKey}
            className="w-full bg-tech-600 hover:bg-tech-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-tech-500/25 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Lock className="w-4 h-4" />
            {content.button}
          </button>
          
          <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">
            {content.hint}
          </p>
        </div>
      </div>
    </div>
  );
};
