
import React from 'react';
import { useLanguage } from '../hooks/useLanguage';

const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-light-bg dark:bg-dark-bg text-center py-6 mt-auto">
      <div className="container mx-auto px-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-4xl mx-auto">
          <span className="font-bold">{t('disclaimerTitle')}:</span> {t('disclaimerText')}
        </p>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2">
          <span>{t('copyrightText')}</span>
          <span className="hidden md:inline">|</span>
          <div className="flex items-center gap-1">
            <span>{t('technicalSupport')}:</span>
            <a href="mailto:info@ai-guid.com" className="font-medium text-primary-600 dark:text-primary-400 hover:underline">
                info@ai-guid.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;