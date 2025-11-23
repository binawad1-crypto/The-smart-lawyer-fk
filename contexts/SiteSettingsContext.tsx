
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { SiteSettings, Language, SiteSettingsContextType } from '../types';

export const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

// Golden Scale Icon Data URI
const DEFAULT_FAVICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjY2RhNTY0IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtc2NhbGUiPjxwYXRoIGQ9Im0xNiAxNiAzLTggMyA4Yy0uODcuNjUtMS45MiAxLTMgMXMtMi4xMy0uMzUtMy0xWiIvPjxwYXRoIGQ9Im0yIDE2IDMtOCAzIDhjLS44Ny42NS0xLjkyIDEtMyAxcS0yLjEzLS4zNS0zLTFaIi8+PHBhdGggZD0iTTcgMjFoMTAiLz48cGF0aCBkPSJNMTIgM3YxOCIvPjxwYXRoIGQ9Ik0zIDdoMmMyIDAgNS0xIDctMiAyIDEgNSAyIDcgMmgyIi8+PC9zdmc+';

const defaultSettings: SiteSettings = {
    siteName: { en: 'The Smart Assistant', ar: 'المساعد الذكي' },
    siteSubtitle: { en: 'For Law and Legal Consulting', ar: 'للمحاماة والاستشارات القانونية' },
    metaDescription: { en: 'The Smart Assistant for Law Practice: An AI-powered platform that provides specialized services for lawyers and legal consultants.', ar: 'المساعد الذكي للمحاماة والاستشارات القانونية: منصة مدعومة بالذكاء الاصطناعي تقدم خدمات متخصصة للمحامين والمستشارين القانونيين.' },
    seoKeywords: { en: 'law, legal, ai, lawyer, assistant, drafting, cases, lawtech, attorney', ar: 'محاماه, قانون, ذكاء اصطناعي, محامي, مساعد, صياغة, قضايا, تقنية قانونية' },
    logoUrl: '', // Leave empty to allow text fallback in Header
    faviconUrl: DEFAULT_FAVICON,
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
            // Ensure favicon has a default if empty in DB
            faviconUrl: data.faviconUrl || defaultSettings.faviconUrl
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
