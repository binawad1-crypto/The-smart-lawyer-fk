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
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {t('copyrightText')}
        </p>
      </div>
    </footer>
  );
};

export default Footer;