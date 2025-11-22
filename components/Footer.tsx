
import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { MapPin } from 'lucide-react';

const Footer: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();

  return (
    <footer className="bg-light-bg dark:bg-dark-bg text-center py-6 mt-auto">
      <div className="container mx-auto px-4">
        {/* Location Indicator */}
        {currentUser?.location && (
            <div className="mb-6 flex justify-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 border border-primary-500/20 rounded-full text-primary-600 dark:text-primary-400 text-sm font-medium shadow-[0_0_10px_rgba(188,149,92,0.2)]">
                    <MapPin size={14} className="animate-pulse" />
                    <span>{currentUser.location}</span>
                </div>
            </div>
        )}
        
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
