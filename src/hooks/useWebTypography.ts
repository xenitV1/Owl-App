import { useState, useEffect } from 'react';

// Available fonts for selection
export const FONT_OPTIONS = [
  { name: 'Monospace', value: 'font-mono', css: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace' },
  { name: 'Sans Serif', value: 'font-sans', css: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' },
  { name: 'Serif', value: 'font-serif', css: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' },
  { name: 'Inter', value: 'font-inter', css: 'Inter, ui-sans-serif, system-ui, sans-serif' },
  { name: 'Roboto', value: 'font-roboto', css: 'Roboto, ui-sans-serif, system-ui, sans-serif' },
  { name: 'Open Sans', value: 'font-opensans', css: '"Open Sans", ui-sans-serif, system-ui, sans-serif' },
  { name: 'Lato', value: 'font-lato', css: 'Lato, ui-sans-serif, system-ui, sans-serif' },
  { name: 'Poppins', value: 'font-poppins', css: 'Poppins, ui-sans-serif, system-ui, sans-serif' },
  { name: 'Montserrat', value: 'font-montserrat', css: 'Montserrat, ui-sans-serif, system-ui, sans-serif' },
  { name: 'Playfair Display', value: 'font-playfair', css: '"Playfair Display", ui-serif, Georgia, serif' }
];

// Storage key for user preferences
const STORAGE_KEY = 'webContentTypographySettings';

export interface TypographySettings {
  textSpacing: number;
  fontSize: number;
  selectedFont: string;
  wordSpacing: number;
}

const DEFAULT_SETTINGS: TypographySettings = {
  textSpacing: 1.7,
  fontSize: 14,
  selectedFont: 'font-mono',
  wordSpacing: 0
};

export function useWebTypography() {
  const loadSavedSettings = (): TypographySettings => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure all required properties exist
        return {
          ...DEFAULT_SETTINGS,
          ...parsed
        };
      }
    } catch (error) {
      console.warn('Failed to load typography settings:', error);
    }
    return DEFAULT_SETTINGS;
  };

  const saveSettings = (settings: TypographySettings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save typography settings:', error);
    }
  };

  const savedSettings = loadSavedSettings();

  const [textSpacing, setTextSpacing] = useState(savedSettings.textSpacing);
  const [fontSize, setFontSize] = useState(savedSettings.fontSize);
  const [selectedFont, setSelectedFont] = useState(savedSettings.selectedFont);
  const [wordSpacing, setWordSpacing] = useState(savedSettings.wordSpacing);

  // Auto-save settings when they change
  useEffect(() => {
    const settings: TypographySettings = {
      textSpacing,
      fontSize,
      selectedFont,
      wordSpacing
    };
    saveSettings(settings);
  }, [textSpacing, fontSize, selectedFont, wordSpacing]);

  const getFontFamily = (fontValue: string): string => {
    return FONT_OPTIONS.find(f => f.value === fontValue)?.css || 'monospace';
  };

  const getTypographyStyles = (elementType: 'paragraph' | 'heading' | 'list' | 'quote' = 'paragraph') => {
    const baseStyles = {
      fontSize: `${fontSize}px`,
      lineHeight: textSpacing,
      wordSpacing: `${wordSpacing}px`,
      fontFamily: getFontFamily(selectedFont)
    };

    // Adjust styles based on element type
    switch (elementType) {
      case 'heading':
        return {
          ...baseStyles,
          wordSpacing: `${wordSpacing * 0.5}px`, // Headings have less word spacing
        };
      case 'quote':
        return {
          ...baseStyles,
          textAlign: 'justify' as const,
          hyphens: 'auto' as const,
        };
      default:
        return {
          ...baseStyles,
          textAlign: 'justify' as const,
          hyphens: 'auto' as const,
        };
    }
  };

  return {
    // State
    textSpacing,
    fontSize,
    selectedFont,
    wordSpacing,

    // Setters
    setTextSpacing,
    setFontSize,
    setSelectedFont,
    setWordSpacing,

    // Utilities
    getFontFamily,
    getTypographyStyles,

    // Constants
    FONT_OPTIONS
  };
}
