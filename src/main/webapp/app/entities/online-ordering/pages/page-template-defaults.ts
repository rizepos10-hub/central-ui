import { IPageThemeOverride } from 'app/shared/model/ONLINE_ORDERING/online-ordering-page.model';
import { SectionType } from 'app/shared/model/ONLINE_ORDERING/online-ordering-page.enums';

export type TemplatePalette = {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  input: string;
  ring: string;
  destructive: string;
  destructiveForeground: string;
  cardBackground: string;
  cardHoverBackground: string;
};

const DEFAULT_PALETTE: TemplatePalette = {
  primary: '#062f25',
  primaryForeground: '#fff8ea',
  secondary: '#0b4638',
  secondaryForeground: '#fff8ea',
  accent: '#f2c94c',
  accentForeground: '#101010',
  background: '#fff8ea',
  foreground: '#101010',
  card: '#ffffff',
  cardForeground: '#101010',
  popover: '#ffffff',
  popoverForeground: '#101010',
  muted: '#f3ead8',
  mutedForeground: '#666666',
  border: '#e5d9c4',
  input: '#e5d9c4',
  ring: '#f2c94c',
  destructive: '#b42318',
  destructiveForeground: '#ffffff',
  cardBackground: '#ffffff',
  cardHoverBackground: '#0b4638',
};

const TEMPLATE_PALETTES: Record<string, TemplatePalette> = {
  'home-default': DEFAULT_PALETTE,
  'thai-palace': DEFAULT_PALETTE,
  'order-first': {
    primary: '#1a1a2e',
    primaryForeground: '#fff8f0',
    secondary: '#16213e',
    secondaryForeground: '#fff8f0',
    accent: '#e94560',
    accentForeground: '#ffffff',
    background: '#fff8f0',
    foreground: '#1a1a2e',
    card: '#ffffff',
    cardForeground: '#1a1a2e',
    popover: '#ffffff',
    popoverForeground: '#1a1a2e',
    muted: '#f5f5f5',
    mutedForeground: '#666666',
    border: '#e5e7eb',
    input: '#e5e7eb',
    ring: '#e94560',
    destructive: '#b42318',
    destructiveForeground: '#ffffff',
    cardBackground: '#ffffff',
    cardHoverBackground: '#f5f5f5',
  },
  'home-retail': {
    primary: '#1e3a5f',
    primaryForeground: '#ffffff',
    secondary: '#0c1e35',
    secondaryForeground: '#ffffff',
    accent: '#2563eb',
    accentForeground: '#ffffff',
    background: '#f8fafc',
    foreground: '#0f172a',
    card: '#ffffff',
    cardForeground: '#0f172a',
    popover: '#ffffff',
    popoverForeground: '#0f172a',
    muted: '#e2e8f0',
    mutedForeground: '#64748b',
    border: '#e2e8f0',
    input: '#e2e8f0',
    ring: '#2563eb',
    destructive: '#b42318',
    destructiveForeground: '#ffffff',
    cardBackground: '#ffffff',
    cardHoverBackground: '#e2e8f0',
  },
  'home-riode': {
    primary: '#05b895',
    primaryForeground: '#ffffff',
    secondary: '#1e3a5f',
    secondaryForeground: '#ffffff',
    accent: '#2563eb',
    accentForeground: '#ffffff',
    background: '#f8fafc',
    foreground: '#1e293b',
    card: '#ffffff',
    cardForeground: '#1e293b',
    popover: '#ffffff',
    popoverForeground: '#1e293b',
    muted: '#e2e8f0',
    mutedForeground: '#64748b',
    border: '#e2e8f0',
    input: '#e2e8f0',
    ring: '#2563eb',
    destructive: '#b42318',
    destructiveForeground: '#ffffff',
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
    primaryForeground: validColor(themeOverride?.primaryForeground, base.primaryForeground),
    secondary: validColor(themeOverride?.secondary, base.secondary),
    secondaryForeground: validColor(themeOverride?.secondaryForeground, base.secondaryForeground),
    accent: validColor(themeOverride?.accent, base.accent),
    accentForeground: validColor(themeOverride?.accentForeground, base.accentForeground),
    background: validColor(themeOverride?.background, base.background),
    foreground: validColor(themeOverride?.foreground, base.foreground),
    card: validColor(themeOverride?.card, base.card),
    cardForeground: validColor(themeOverride?.cardForeground, base.cardForeground),
    popover: validColor(themeOverride?.popover, base.popover),
    popoverForeground: validColor(themeOverride?.popoverForeground, base.popoverForeground),
    muted: validColor(themeOverride?.muted, base.muted),
    mutedForeground: validColor(themeOverride?.mutedForeground, base.mutedForeground),
    border: validColor(themeOverride?.border, base.border),
    input: validColor(themeOverride?.input, base.input),
    ring: validColor(themeOverride?.ring, base.ring),
    destructive: validColor(themeOverride?.destructive, base.destructive),
    destructiveForeground: validColor(themeOverride?.destructiveForeground, base.destructiveForeground),
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
    defaults.background = palette.secondary;
    defaults.titleColor = palette.secondaryForeground;
    defaults.subtitleColor = palette.secondaryForeground;
    defaults.eyebrowColor = palette.accent;
  }

  if (sectionType === SectionType.RICH_TEXT && sectionConfig.background === 'primary') {
    defaults.background = palette.primary;
    defaults.titleColor = palette.primaryForeground;
    defaults.subtitleColor = palette.primaryForeground;
    defaults.eyebrowColor = palette.accent;
  }

  if (sectionType === SectionType.HERO_BANNER) {
    if (variant === 'cta') {
      defaults.background = palette.accent;
      defaults.titleColor = palette.accentForeground;
      defaults.subtitleColor = palette.accentForeground;
    } else if (variant === 'retail-cta') {
      defaults.background = palette.primary;
      defaults.titleColor = palette.primaryForeground;
      defaults.subtitleColor = palette.primaryForeground;
    } else if (variant === 'retail') {
      defaults.background = palette.secondary;
      defaults.titleColor = palette.secondaryForeground;
      defaults.subtitleColor = palette.secondaryForeground;
      defaults.eyebrowColor = palette.accent;
    } else {
      defaults.background = palette.primary;
      defaults.titleColor = palette.primaryForeground;
      defaults.subtitleColor = palette.primaryForeground;
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
