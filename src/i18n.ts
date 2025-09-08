import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
  // Ensure locale is defined and valid
  if (!locale || !['en', 'tr'].includes(locale)) {
    console.warn(`[i18n] Invalid or missing locale: ${locale}, falling back to 'en'`);
    locale = 'en';
  }

  try {
    const messages = (await import(`./messages/${locale}.json`)).default;
    console.log('[i18n] loaded messages', { locale });
    return { 
      locale,
      messages 
    };
  } catch (error) {
    console.error(`[i18n] Failed to load messages for locale: ${locale}`, error);
    // Fallback to English
    const fallbackMessages = (await import(`./messages/en.json`)).default;
    return { 
      locale: 'en',
      messages: fallbackMessages 
    };
  }
});