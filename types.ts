
import React from 'react';
import { User as FirebaseUser } from 'firebase/auth';

export interface SubscriptionInfo {
  id: string; // The firestore document ID
  planId: string; // e.g., 'monthly', 'annual'
  stripeSubscriptionId?: string; // The ID from Stripe
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';
  current_period_end: number; // Unix timestamp
  priceId: string;
  isManual?: boolean;
}

export interface AppUser extends FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  
  isAdmin?: boolean;
  status?: 'active' | 'disabled';
  tokenBalance?: number;
  stripeId?: string;
  subscription?: SubscriptionInfo;
}

export enum Theme {
  Light = 'light',
  Dark = 'dark',
}

export enum Language {
  EN = 'en',
  AR = 'ar',
}

export interface LandingPageFeature {
  icon: string;
  title: Record<Language, string>;
  description: Record<Language, string>;
  color: string;
}

export interface LandingPageConfig {
  heroTitleMain: Record<Language, string>;
  heroTitleHighlight: Record<Language, string>;
  heroSubtitle: Record<Language, string>;
  featuresTitle: Record<Language, string>;
  features: LandingPageFeature[];
}

export interface AdPixels {
  googleTagId?: string; // G-XXXXXXXXXX or AW-XXXXXXXXXX
  facebookPixelId?: string;
  snapchatPixelId?: string;
  tiktokPixelId?: string;
}

export interface SiteSettings {
  siteName: Record<Language, string>;
  metaDescription: Record<Language, string>;
  seoKeywords: Record<Language, string>;
  logoUrl: string;
  faviconUrl: string;
  isMaintenanceMode: boolean;
  landingPageConfig?: LandingPageConfig;
  adPixels?: AdPixels;
}

export interface SiteSettingsContextType {
  settings: SiteSettings | null;
  loading: boolean;
}


export enum ServiceCategory {
  LitigationAndPleadings = 'litigationAndPleadings',
  SpecializedConsultations = 'specializedConsultations',
  InvestigationsAndCriminal = 'investigationsAndCriminal',
  CorporateAndCompliance = 'corporateAndCompliance',
  CreativeServices = 'creativeServices',
}

export interface Service {
  id: string;
  title: Record<Language, string>;
  description: Record<Language, string>;
  category: ServiceCategory;
  subCategory: Record<Language, string>;
  icon: string; // Changed from React.ComponentType to string
  geminiModel: string;
  formInputs: FormInput[];
  usageCount?: number;
  geminiConfig?: any; // Optional field for extra model configs
}

export type FormInputType = 'text' | 'textarea' | 'date' | 'file' | 'select';

export interface FormInput {
  name: string;
  label: Record<Language, string>;
  type: FormInputType;
  options?: { value: string; label: Record<Language, string> }[];
}

export interface Translations {
  [key: string]: Record<Language, string>;
}

export interface Plan {
  id: string;
  priceId: string; // From Stripe dashboard
  title: Record<Language, string>;
  price: Record<Language, string>;
  tokens: number;
  isPopular?: boolean;
  features: Record<Language, string>[];
  status: 'active' | 'inactive';
}

// Interfaces for Stripe Extension data
export interface StripePrice {
  id: string;
  active: boolean;
  currency: string;
  unit_amount: number;
  interval?: string;
  type?: string;
}

export interface StripeProduct {
  id: string;
  active: boolean;
  name: string;
  description?: string;
  prices?: StripePrice[];
  metadata?: any;
}