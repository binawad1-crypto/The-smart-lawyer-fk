import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { SiteSettings, Language, SiteSettingsContextType } from '../types';

export const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

const defaultSettings: SiteSettings = {
    siteName: { en: 'The Smart Assistant', ar: 'المساعد الذكي' },
    siteSubtitle: { en: 'For Law Practice', ar: 'للمحاماه' },
    metaDescription: { en: 'AI-Powered Legal Services', ar: 'خدمات قانونية مدعومة بالذكاء الاصطناعي' },
    seoKeywords: { en: 'law, legal, ai, lawyer, assistant', ar: 'قانون, محاماة, ذكاء اصطناعي, محامي, مساعد' },
    logoUrl: '',
    faviconUrl: '',
    isMaintenanceMode: false,
    landingPageConfig: undefined, // Will fall back to hardcoded constants if undefined
    adPixels: {
        googleTagId: '',
        facebookPixelId: '',
        snapchatPixelId: 'c3a97bbb-5508-4710-82b9-abebc81eb7a7',
        tiktokPixelId: '',
    },
    ticketTypes: [],
};

interface SiteSettingsProviderProps {
  children: ReactNode;
}

export const SiteSettingsProvider: React.FC<SiteSettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const settingsDocRef = doc(db, 'site_settings', 'main');
    
    const unsubscribe = onSnapshot(settingsDocRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as Partial<SiteSettings>;
          // Deep merge with defaults to ensure all fields are present, especially new ones
          const mergedSettings: SiteSettings = {
            ...defaultSettings,
            ...data,
            siteName: { ...defaultSettings.siteName, ...data.siteName },
            siteSubtitle: { ...defaultSettings.siteSubtitle, ...data.siteSubtitle },
            metaDescription: { ...defaultSettings.metaDescription, ...data.metaDescription },
            seoKeywords: { ...defaultSettings.seoKeywords, ...data.seoKeywords },
            adPixels: { ...defaultSettings.adPixels, ...data.adPixels },
          };
          setSettings(mergedSettings);
        } else {
          console.log("Site settings document not found, using defaults.");
          setSettings(defaultSettings);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching site settings:", error);
        setSettings(defaultSettings); // Fallback to defaults on error
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <SiteSettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SiteSettingsContext.Provider>
  );
};