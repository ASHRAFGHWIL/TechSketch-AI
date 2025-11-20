import React, { useState, useEffect } from 'react';
import { Key, Lock, AlertCircle } from 'lucide-react';
import { Language } from '../types';

interface ApiKeyModalProps {
  onSave: (key: string) => void;
  language: Language;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave, language }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [key, setKey] = useState('');
  const [error, setError] = useState('');

  // Check if env var is available first
  useEffect(() => {
    if (process.env.API_KEY) {
        onSave(process.env.API_KEY);
        setIsOpen(false);
    }
  }, [onSave]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim().length < 10) {
      setError(language === 'en' ? 'Please enter a valid API Key' : 'الرجاء إدخال مفتاح صالح');
      return;
    }
    onSave(key);
    setIsOpen(false);
  };

  const t = {
    en: {
      title: "Enter Access Key",
      subtitle: "Gemini API connection required",
      label: "Google Gemini API Key",
      hint: "Your key is used locally for this session only.",
      button: "Connect & Continue",
      link: "Get an API Key"
    },
    ar: {
      title: "أدخل مفتاح الوصول",
      subtitle: "مطلوب الاتصال بـ Gemini API",
      label: "مفتاح Google Gemini API",
      hint: "يتم استخدام مفتاحك محلياً لهذه الجلسة فقط.",
      button: "اتصال ومتابعة",
      link: "احصل على مفتاح API"
    }
  };

  const content = t[language];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {content.label}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 rtl:left-auto rtl:right-3 top-2.5 w-5 h-5 text-slate-400" />
              <input
                id="apiKey"
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-tech-500 focus:border-tech-500 outline-none transition-all placeholder-slate-400"
                placeholder="AIzaSy..."
                dir="ltr"
              />
            </div>
             <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
              {content.hint}
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-tech-600 hover:bg-tech-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {content.button}
          </button>
          
          <div className="text-center pt-2">
             <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="text-xs text-tech-600 dark:text-tech-400 hover:underline"
            >
                {content.link}
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};