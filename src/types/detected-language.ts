export const DETECTED_LANGUAGES = {
  en: "English",
  hu: "Hungarian",
  de: "German",
  fr: "French",
  es: "Spanish",
  it: "Italian",
  pt: "Portuguese",
  nl: "Dutch",
  pl: "Polish",
  ro: "Romanian",
  cs: "Czech",
  ru: "Russian",
  uk: "Ukrainian",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese",
  ar: "Arabic",
  tr: "Turkish",
  sq: "Albanian",
  unknown: "the same language as the transcript",
} as const;

export type DetectedLanguageCode = keyof typeof DETECTED_LANGUAGES;

export function getLanguageDisplayName(code: DetectedLanguageCode): string {
  return DETECTED_LANGUAGES[code];
}
