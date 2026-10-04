import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { changeAppLanguage } from '../../i18n';
import { useToast } from '../../context/ToastContext';

export const LanguageSelector: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { i18n } = useTranslation();
  const { info } = useToast();
  const currentLang = i18n.language || 'en';

  const languages: Array<{ code: 'en' | 'hi' | 'mr'; label: string; short: string }> = [
    { code: 'en', label: 'English', short: 'EN' },
    { code: 'hi', label: 'हिन्दी', short: 'हिन्दी' },
    { code: 'mr', label: 'मराठी', short: 'मराठी' },
  ];

  const handleSelect = (code: 'en' | 'hi' | 'mr', label: string) => {
    if (code === currentLang) return;
    changeAppLanguage(code);
    info(
      code === 'hi'
        ? `भाषा बदलकर ${label} कर दी गई है`
        : code === 'mr'
        ? `भाषा बदलून ${label} करण्यात आली आहे`
        : `Language changed to ${label}`,
      'Language'
    );
  };

  return (
    <div className="flex items-center gap-1 bg-slate-100/90 border border-slate-200/80 rounded-lg p-0.5 shadow-xs text-xs font-medium">
      <div className="px-1.5 text-slate-500 flex items-center">
        <Globe className="w-3.5 h-3.5" />
      </div>
      {languages.map((lang) => {
        const isActive = currentLang.startsWith(lang.code);
        return (
          <button
            key={lang.code}
            onClick={() => handleSelect(lang.code, lang.label)}
            className={`px-2 py-1 rounded-md transition-all text-xs font-medium cursor-pointer ${
              isActive
                ? 'bg-white text-blue-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title={`Switch to ${lang.label}`}
          >
            {compact ? lang.short : lang.label}
          </button>
        );
      })}
    </div>
  );
};
export default LanguageSelector;
