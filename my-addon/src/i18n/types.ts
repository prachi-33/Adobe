import { translations } from './translations';

export type Language = 'en' | 'es' | 'fr';
export type TranslationKey = keyof typeof translations.en;
