import React, { useState, useEffect } from 'react';
import { Key, Lock, AlertCircle } from 'lucide-react';

interface ApiKeyModalProps {
  onSave: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave }) => {
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
      setError('Please enter a valid API Key');
      return;
    }
    onSave(key);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
        <div className="bg-tech-50 p-6 border-b border-tech-100 flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg border border-tech-100 shadow-sm">
                <Key className="w-5 h-5 text-tech-600" />
            </div>
            <div>
                <h2 className="text-lg font-bold text-slate-900">Enter Access Key</h2>
                <p className="text-sm text-slate-500">Gemini API connection required</p>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-slate-700 mb-1">
              Google Gemini API Key
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
              <input
                id="apiKey"
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-tech-500 focus:border-tech-500 outline-none transition-all"
                placeholder="AIzaSy..."
              />
            </div>
             <p className="mt-2 text-xs text-slate-500">
              Your key is used locally for this session only.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-tech-600 hover:bg-tech-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            Connect & Continue
          </button>
          
          <div className="text-center pt-2">
             <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="text-xs text-tech-600 hover:underline"
            >
                Get an API Key
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};
