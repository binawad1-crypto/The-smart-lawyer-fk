import React from 'react';
import { Service } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { iconMap } from '../constants';
import { FileText, Play } from 'lucide-react';

interface ServiceCardProps {
  service: Service;
  onRunClick: () => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onRunClick }) => {
  const { language, t } = useLanguage();
  const Icon = iconMap[service.icon] || FileText;

  return (
    <div
      className="bg-light-card-bg dark:bg-dark-card-bg rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col border border-gray-200 dark:border-gray-700 overflow-hidden p-6 text-center items-center justify-between"
      style={{ minHeight: '220px' }}
    >
      <div className="flex flex-col items-center">
        <div className="inline-block p-4 mb-3 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400">
          <Icon className="h-9 w-9" />
        </div>
        <h3 className="text-md font-bold text-gray-800 dark:text-white h-12 flex items-center justify-center">
          {service.title[language]}
        </h3>
      </div>
      <button
        onClick={onRunClick}
        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 text-sm transition-colors duration-200 flex items-center justify-center gap-2 rounded-md mt-3"
      >
        <Play size={16} />
        {t('runService')}
      </button>
    </div>
  );
};

export default ServiceCard;