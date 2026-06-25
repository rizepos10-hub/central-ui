import {
  DIRECT_PRINT_LANGUAGE_LABELS,
  DirectPrintLanguage,
  LabelElement,
  LabelTemplate,
  normalizeLabelTemplate,
} from '../model/label-template.model';
import { LabelDatum, resolveBarcodeData, resolveElementText, resolvePriceParts } from './label-data';

const elementOf = (type: LabelElement['type']): LabelElement => ({ type } as LabelElement);

const PLACEHOLDER_MAP = {
  name: (datum: LabelDatum) => resolveElementText(elementOf('productName'), datum, false),
  productName: (datum: LabelDatum) => resolveElementText(elementOf('productName'), datum, false),
  sku: (datum: LabelDatum) => resolveElementText(elementOf('sku'), datum),
  barcode: (datum: LabelDatum) => resolveBarcodeData(datum),
  price: (datum: LabelDatum) => resolvePriceParts(datum.variant).current,
  comparePrice: (datum: LabelDatum) => resolvePriceParts(datum.variant).original ?? '',
  category: (datum: LabelDatum) => resolveElementText(elementOf('category'), datum),
  brand: (datum: LabelDatum) => resolveElementText(elementOf('brand'), datum),
  description: (datum: LabelDatum) => resolveElementText(elementOf('description'), datum),
  mixmatch: () => '',
} as const;

export const DIRECT_PRINT_PLACEHOLDERS = Object.keys(PLACEHOLDER_MAP) as Array<keyof typeof PLACEHOLDER_MAP>;

const PLACEHOLDER_REGEX = /@([a-zA-Z][a-zA-Z0-9_]*)/g;

export const extractDirectPrintPlaceholders = (script: string): string[] => {
  const found = new Set<string>();
  for (const match of script.matchAll(PLACEHOLDER_REGEX)) {
    found.add(match[1]);
  }
  return Array.from(found);
};

export const findUnsupportedDirectPrintPlaceholders = (script: string): string[] =>
  extractDirectPrintPlaceholders(script).filter(token => !(token in PLACEHOLDER_MAP));

export const renderDirectPrintScript = (script: string, datum: LabelDatum): string =>
  script.replace(PLACEHOLDER_REGEX, (_match, token: keyof typeof PLACEHOLDER_MAP) => {
    const resolver = PLACEHOLDER_MAP[token];
    if (!resolver) return '';
    return resolver(datum) ?? '';
  });

export const directPrintLanguageName = (language: DirectPrintLanguage): string => DIRECT_PRINT_LANGUAGE_LABELS[language];

export const isDirectPrintTemplate = (template: LabelTemplate | null | undefined): boolean =>
  Boolean(template && normalizeLabelTemplate(template).templateType === 'direct');

const isNonPrintableChar = (char: string): boolean => {
  const code = char.charCodeAt(0);
  return (code >= 0 && code <= 8) || code === 11 || code === 12 || (code >= 14 && code <= 31) || code === 127;
};

const LANGUAGE_PATTERNS: Array<{ language: DirectPrintLanguage; matches: RegExp[] }> = [
  { language: 'zpl', matches: [/(\^XA|\^XZ|\^FO|\^FT|~TA|~SD|^CI\d+)/im, /(\^BC|\^BY|\^FD|\^FS)/im] },
  { language: 'epl', matches: [/\bN\s*\r?\n/im, /\b(A|B|GW|P)\d*,\d*,/im] },
  { language: 'tspl', matches: [/\b(SIZE|GAP|DENSITY|CLS|TEXT|BARCODE|PRINT)\b/im] },
];

export const detectDirectPrintLanguage = (script: string): DirectPrintLanguage | null => {
  const normalized = script.trim();
  if (!normalized) return null;
  for (const entry of LANGUAGE_PATTERNS) {
    if (entry.matches.every(pattern => pattern.test(normalized))) {
      return entry.language;
    }
  }
  return null;
};

export const findDirectPrintControlChars = (script: string): string[] => {
  const found = new Set<string>();
  for (const char of script) {
    if (isNonPrintableChar(char)) {
      found.add(`0x${char.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}`);
    }
  }
  return Array.from(found);
};

export const visualizeDirectPrintScript = (script: string): string =>
  Array.from(script, char =>
    isNonPrintableChar(char) ? `\\x${char.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}` : char
  ).join('');
