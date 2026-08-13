// Registry of selectable languages. The list is intentionally broad and
// extensible — the UI can offer any of these. Full UI-string dictionaries are
// shipped for a growing subset (see src/locales); others fall back to English
// for UI while the AI assistant can still respond in the chosen language.

export interface Language {
  code: string; // BCP-47-ish code
  english: string; // English name
  native: string; // endonym
  rtl?: boolean;
}

export const LANGUAGES: Language[] = [
  { code: "en", english: "English", native: "English" },
  { code: "fil", english: "Filipino", native: "Filipino" },
  { code: "es", english: "Spanish", native: "Español" },
  { code: "fr", english: "French", native: "Français" },
  { code: "de", english: "German", native: "Deutsch" },
  { code: "pt", english: "Portuguese", native: "Português" },
  { code: "it", english: "Italian", native: "Italiano" },
  { code: "nl", english: "Dutch", native: "Nederlands" },
  { code: "ru", english: "Russian", native: "Русский" },
  { code: "uk", english: "Ukrainian", native: "Українська" },
  { code: "pl", english: "Polish", native: "Polski" },
  { code: "tr", english: "Turkish", native: "Türkçe" },
  { code: "ja", english: "Japanese", native: "日本語" },
  { code: "ko", english: "Korean", native: "한국어" },
  { code: "zh", english: "Chinese (Simplified)", native: "中文（简体）" },
  { code: "zh-Hant", english: "Chinese (Traditional)", native: "中文（繁體）" },
  { code: "hi", english: "Hindi", native: "हिन्दी" },
  { code: "bn", english: "Bengali", native: "বাংলা" },
  { code: "ur", english: "Urdu", native: "اردو", rtl: true },
  { code: "ar", english: "Arabic", native: "العربية", rtl: true },
  { code: "he", english: "Hebrew", native: "עברית", rtl: true },
  { code: "fa", english: "Persian", native: "فارسی", rtl: true },
  { code: "id", english: "Indonesian", native: "Bahasa Indonesia" },
  { code: "ms", english: "Malay", native: "Bahasa Melayu" },
  { code: "vi", english: "Vietnamese", native: "Tiếng Việt" },
  { code: "th", english: "Thai", native: "ไทย" },
  { code: "km", english: "Khmer", native: "ខ្មែរ" },
  { code: "my", english: "Burmese", native: "မြန်မာ" },
  { code: "ta", english: "Tamil", native: "தமிழ்" },
  { code: "te", english: "Telugu", native: "తెలుగు" },
  { code: "el", english: "Greek", native: "Ελληνικά" },
  { code: "sv", english: "Swedish", native: "Svenska" },
  { code: "fi", english: "Finnish", native: "Suomi" },
  { code: "no", english: "Norwegian", native: "Norsk" },
  { code: "da", english: "Danish", native: "Dansk" },
  { code: "cs", english: "Czech", native: "Čeština" },
  { code: "ro", english: "Romanian", native: "Română" },
  { code: "hu", english: "Hungarian", native: "Magyar" },
  { code: "sw", english: "Swahili", native: "Kiswahili" },
  { code: "af", english: "Afrikaans", native: "Afrikaans" },
  { code: "am", english: "Amharic", native: "አማርኛ" },
  { code: "yo", english: "Yoruba", native: "Yorùbá" },
];

export function isRtl(code: string): boolean {
  return LANGUAGES.find((l) => l.code === code)?.rtl ?? false;
}

export function languageMeta(code: string): Language | undefined {
  return LANGUAGES.find((l) => l.code === code);
}
