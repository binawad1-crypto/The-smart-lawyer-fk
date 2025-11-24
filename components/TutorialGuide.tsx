
import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, ArrowLeft, HelpCircle } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface TutorialStep {
    id: string;
    target: string; // CSS selector
    title: string;
    description: string;
    position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface TutorialGuideProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
}

const TutorialGuide: React.FC<TutorialGuideProps> = ({ isOpen, onClose, onComplete }) => {
    const { t, language } = useLanguage();
    const [currentStep, setCurrentStep] = useState(0);
    const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    const steps: TutorialStep[] = [
        {
            id: 'search',
            target: '[data-tutorial="search"]',
            title: language === 'ar' ? 'البحث عن الخدمات' : 'Search for Services',
            description: language === 'ar' 
                ? 'استخدم مربع البحث للعثور على الخدمات بسرعة. اكتب اسم الخدمة أو الكلمات المفتاحية.'
                : 'Use the search box to quickly find services. Type the service name or keywords.',
            position: 'bottom'
        },
        {
            id: 'sidebar-buttons',
            target: '[data-tutorial="sidebar-buttons"]',
            title: language === 'ar' ? 'الأزرار الرئيسية' : 'Main Buttons',
            description: language === 'ar'
                ? 'المساعد الذكي: للاستشارات المباشرة | المحفوظات: سجل العمليات السابقة | المفضلة: الخدمات المفضلة لديك'
                : 'Smart Assistant: For direct consultations | Saved: Previous operations log | Favorites: Your favorite services',
            position: 'right'
        },
        {
            id: 'categories',
            target: '[data-tutorial="categories"]',
            title: language === 'ar' ? 'الفئات' : 'Categories',
            description: language === 'ar'
                ? 'تصفح الخدمات حسب الفئات المختلفة. اختر الفئة التي تهمك لعرض الخدمات المتاحة.'
                : 'Browse services by different categories. Select the category that interests you to view available services.',
            position: 'right'
        },
        {
            id: 'output-panel',
            target: '[data-tutorial="output-panel"]',
            title: language === 'ar' ? 'قائمة النتائج' : 'Results Panel',
            description: language === 'ar'
                ? 'هنا ستظهر نتائج الخدمات. يمكنك نسخ النتائج، طباعتها، أو حفظها في المحفوظات.'
                : 'Service results will appear here. You can copy results, print them, or save them to history.',
            position: 'left'
        },
        {
            id: 'output-actions',
            target: '[data-tutorial="output-actions"]',
            title: language === 'ar' ? 'أزرار النتائج' : 'Result Actions',
            description: language === 'ar'
                ? 'استخدم هذه الأزرار: تكبير/تصغير الخط، نسخ النتيجة، طباعة، حفظ في المحفوظات، أو مناقشة النتيجة مع المساعد.'
                : 'Use these buttons: Zoom in/out text, copy result, print, save to history, or discuss result with assistant.',
            position: 'top'
        },
        {
            id: 'header-buttons',
            target: '[data-tutorial="header-buttons"]',
            title: language === 'ar' ? 'أزرار القائمة العلوية' : 'Header Buttons',
            description: language === 'ar'
                ? 'الخدمات: عرض جميع الخدمات | الإشعارات: الإشعارات المهمة | الملف الشخصي: إعداداتك | الدعم: الحصول على المساعدة'
                : 'Services: View all services | Notifications: Important notifications | Profile: Your settings | Support: Get help',
            position: 'bottom'
        }
    ];

    useEffect(() => {
        if (!isOpen) return;

        const step = steps[currentStep];
        if (!step) {
            onComplete();
            return;
        }

        const element = document.querySelector(step.target) as HTMLElement;
        if (element) {
            setTargetElement(element);
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            // Fallback if element not found immediately (e.g. due to dynamic rendering)
            const timer = setTimeout(() => {
                const el = document.querySelector(step.target) as HTMLElement;
                if (el) {
                    setTargetElement(el);
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    // Skip step if still not found
                    if (currentStep < steps.length - 1) {
                        setCurrentStep(currentStep + 1);
                    } else {
                        onComplete();
                    }
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isOpen, currentStep, onComplete, steps]);

    if (!isOpen) return null;

    const step = steps[currentStep];
    if (!step) return null;

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onComplete();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSkip = () => {
        onComplete();
    };

    // Calculate position for tooltip - ensure it stays within viewport
    const getTooltipPosition = () => {
        if (!targetElement) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

        const rect = targetElement.getBoundingClientRect();
        const tooltipWidth = 384; // max-w-sm = 384px
        const tooltipHeight = 220; // approximate height
        const padding = 20;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let top = rect.top;
        let left = rect.left;
        let transform = '';

        switch (step.position) {
            case 'top':
                top = rect.top - tooltipHeight - padding;
                left = rect.left + rect.width / 2;
                transform = 'translate(-50%, 0)';
                // Adjust vertical overflow
                if (top < 0) {
                    top = rect.bottom + padding;
                }
                // Adjust horizontal overflow
                if (left - tooltipWidth / 2 < padding) {
                    left = tooltipWidth / 2 + padding;
                } else if (left + tooltipWidth / 2 > viewportWidth - padding) {
                    left = viewportWidth - tooltipWidth / 2 - padding;
                }
                break;
            case 'bottom':
                top = rect.bottom + padding;
                left = rect.left + rect.width / 2;
                transform = 'translate(-50%, 0)';
                if (top + tooltipHeight > viewportHeight) {
                    top = rect.top - tooltipHeight - padding;
                }
                if (left - tooltipWidth / 2 < padding) {
                    left = tooltipWidth / 2 + padding;
                } else if (left + tooltipWidth / 2 > viewportWidth - padding) {
                    left = viewportWidth - tooltipWidth / 2 - padding;
                }
                break;
            case 'left':
                top = rect.top + rect.height / 2;
                left = rect.left - tooltipWidth - padding;
                transform = 'translate(0, -50%)';
                if (left < padding) {
                    left = rect.right + padding;
                }
                if (top - tooltipHeight / 2 < padding) {
                    top = tooltipHeight / 2 + padding;
                } else if (top + tooltipHeight / 2 > viewportHeight - padding) {
                    top = viewportHeight - tooltipHeight / 2 - padding;
                }
                break;
            case 'right':
                top = rect.top + rect.height / 2;
                left = rect.right + padding;
                transform = 'translate(0, -50%)';
                if (left + tooltipWidth > viewportWidth - padding) {
                    left = rect.left - tooltipWidth - padding;
                }
                if (top - tooltipHeight / 2 < padding) {
                    top = tooltipHeight / 2 + padding;
                } else if (top + tooltipHeight / 2 > viewportHeight - padding) {
                    top = viewportHeight - tooltipHeight / 2 - padding;
                }
                break;
            case 'center':
                top = rect.top + rect.height / 2;
                left = rect.left + rect.width / 2;
                transform = 'translate(-50%, -50%)';
                break;
        }

        return { top: `${top}px`, left: `${left}px`, transform };
    };

    const tooltipStyle = getTooltipPosition();

    return (
        <>
            {/* Overlay */}
            <div 
                ref={overlayRef}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity"
                onClick={handleNext}
            >
                {/* Highlight target element */}
                {targetElement && (
                    <div
                        className="absolute border-4 border-primary-500 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] pointer-events-none transition-all duration-300 ease-in-out"
                        style={{
                            top: `${targetElement.getBoundingClientRect().top}px`,
                            left: `${targetElement.getBoundingClientRect().left}px`,
                            width: `${targetElement.getBoundingClientRect().width}px`,
                            height: `${targetElement.getBoundingClientRect().height}px`,
                        }}
                    />
                )}
            </div>

            {/* Tooltip */}
            <div
                className="fixed z-[101] bg-white dark:bg-dark-card-bg rounded-xl shadow-2xl p-6 max-w-sm border-2 border-primary-500 pointer-events-auto transition-all duration-300 ease-in-out"
                style={tooltipStyle}
            >
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <HelpCircle className="text-primary-600 dark:text-primary-400" size={24} />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {step.title}
                        </h3>
                    </div>
                    <button
                        onClick={handleSkip}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                    {step.description}
                </p>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrevious}
                            disabled={currentStep === 0}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                currentStep === 0
                                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                        >
                            {language === 'ar' ? (
                                <ArrowRight size={16} className="inline" />
                            ) : (
                                <ArrowLeft size={16} className="inline" />
                            )}
                            <span className="ml-2">{language === 'ar' ? 'السابق' : 'Previous'}</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {currentStep + 1} / {steps.length}
                        </span>
                        <button
                            onClick={handleNext}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center gap-2"
                        >
                            <span>{currentStep === steps.length - 1 ? (language === 'ar' ? 'إنهاء' : 'Finish') : (language === 'ar' ? 'التالي' : 'Next')}</span>
                            {language === 'ar' ? (
                                <ArrowLeft size={16} />
                            ) : (
                                <ArrowRight size={16} />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default TutorialGuide;
