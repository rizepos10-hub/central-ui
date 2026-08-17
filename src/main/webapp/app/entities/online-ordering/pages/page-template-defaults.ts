import { IPageThemeOverride } from 'app/shared/model/ONLINE_ORDERING/online-ordering-page.model';
import { SectionType } from 'app/shared/model/ONLINE_ORDERING/online-ordering-page.enums';

export type TemplatePalette = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  mutedForeground: string;
  cardBackground: string;
  cardHoverBackground: string;
};

const DEFAULT_PALETTE: TemplatePalette = {
  primary: '#062f25',
  secondary: '#0b4638',
  accent: '#f2c94c',
  background: '#fff8ea',
  foreground: '#101010',
  mutedForeground: '#666666',
  cardBackground: '#ffffff',
  cardHoverBackground: '#0b4638',
};

const TEMPLATE_PALETTES: Record<string, TemplatePalette> = {
  'home-default': DEFAULT_PALETTE,
  'thai-palace': DEFAULT_PALETTE,
  'order-first': {
    primary: '#1a1a2e',
    secondary: '#16213e',
    accent: '#e94560',
    background: '#fff8f0',
    foreground: '#1a1a2e',
    mutedForeground: '#666666',
    cardBackground: '#ffffff',
    cardHoverBackground: '#f5f5f5',
  },
  'home-retail': {
    primary: '#1e3a5f',
    secondary: '#0c1e35',
    accent: '#2563eb',
    background: '#f8fafc',
    foreground: '#0f172a',
    mutedForeground: '#64748b',
    cardBackground: '#ffffff',
    cardHoverBackground: '#e2e8f0',
  },
  'home-riode': {
    primary: '#05b895',
    secondary: '#1e3a5f',
    accent: '#2563eb',
    background: '#f8fafc',
    foreground: '#1e293b',
    mutedForeground: '#64748b',
    cardBackground: '#ffffff',
    cardHoverBackground: '#e2e8f0',
  },
};

const validColor = (value: unknown, fallback: string): string => {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  return value.trim();
};

export const getTemplatePalette = (templateKey?: string, themeOverride?: IPageThemeOverride): TemplatePalette => {
  const base = TEMPLATE_PALETTES[templateKey ?? ''] ?? DEFAULT_PALETTE;
  return {
    ...base,
    primary: validColor(themeOverride?.primary, base.primary),
    secondary: validColor(themeOverride?.secondary, base.secondary),
    accent: validColor(themeOverride?.accent, base.accent),
  };
};

export const getSectionAppearanceDefaults = (
  templateKey: string | undefined,
  themeOverride: IPageThemeOverride | undefined,
  sectionType: SectionType,
  sectionConfig: Record<string, unknown> = {},
): Record<string, unknown> => {
  const palette = getTemplatePalette(templateKey, themeOverride);
  const variant = String(sectionConfig.variant ?? '');
  const defaults: Record<string, unknown> = {
    background: palette.background,
    titleColor: palette.foreground,
    eyebrowColor: palette.primary,
    subtitleColor: palette.mutedForeground,
    cardBackground: palette.cardBackground,
    cardHoverBackground: palette.cardHoverBackground,
  };

  if (sectionType === SectionType.BUSINESS_INFO) {
    defaults.background = '#070707';
    defaults.titleColor = '#ffffff';
    defaults.subtitleColor = '#ffffffa6';
    defaults.eyebrowColor = palette.accent;
  }

  if (sectionType === SectionType.RICH_TEXT && sectionConfig.background === 'primary') {
    defaults.background = palette.primary;
    defaults.titleColor = '#ffffff';
    defaults.subtitleColor = '#ffffffc7';
    defaults.eyebrowColor = palette.accent;
  }

  if (sectionType === SectionType.HERO_BANNER) {
    if (variant === 'cta') {
      defaults.background = '#f2c94c';
      defaults.titleColor = '#101010';
      defaults.subtitleColor = '#333333';
    } else if (variant === 'retail-cta') {
      defaults.background = palette.primary;
      defaults.titleColor = '#ffffff';
      defaults.subtitleColor = '#ffffffcc';
    } else if (variant === 'retail') {
      defaults.background = palette.secondary;
      defaults.titleColor = '#ffffff';
      defaults.subtitleColor = '#ffffffcc';
      defaults.eyebrowColor = '#93c5fd';
    } else {
      defaults.background = palette.primary;
      defaults.titleColor = '#ffffff';
      defaults.subtitleColor = '#ffffffcc';
      defaults.eyebrowColor = palette.accent;
    }
  }

  return defaults;
};

export const getHeroBoxModelDefaults = (variant: string): Record<string, number> => {
  if (variant === 'cta' || variant === 'retail-cta') {
    return {
      marginTop: 0,
      marginRight: 16,
      marginBottom: 64,
      marginLeft: 16,
      paddingTop: 80,
      paddingRight: 24,
      paddingBottom: 80,
      paddingLeft: 24,
      borderRadius: 42,
    };
  }

  if (variant === 'riode-duo') {
    return {
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      paddingTop: 32,
      paddingRight: 16,
      paddingBottom: 32,
      paddingLeft: 16,
      borderRadius: 0,
    };
  }

  if (variant === 'retail') {
    return {
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      paddingTop: 64,
      paddingRight: 24,
      paddingBottom: 64,
      paddingLeft: 24,
      borderRadius: 0,
    };
  }

  return {
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    paddingTop: 128,
    paddingRight: 24,
    paddingBottom: 96,
    paddingLeft: 24,
    borderRadius: 0,
  };
};
