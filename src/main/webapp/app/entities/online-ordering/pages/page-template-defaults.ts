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
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
  sidebarBackground: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
  radius: string;
  fontFamily: string;
  headingFontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
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
  chart1: '#062f25',
  chart2: '#f2c94c',
  chart3: '#0b4638',
  chart4: '#b42318',
  chart5: '#666666',
  sidebarBackground: '#ffffff',
  sidebarForeground: '#101010',
  sidebarPrimary: '#062f25',
  sidebarPrimaryForeground: '#fff8ea',
  sidebarAccent: '#f3ead8',
  sidebarAccentForeground: '#101010',
  sidebarBorder: '#e5d9c4',
  sidebarRing: '#f2c94c',
  radius: '0.5rem',
  fontFamily: 'Inter, system-ui, sans-serif',
  headingFontFamily: 'Inter, system-ui, sans-serif',
  fontSize: '16px',
  fontWeight: '400',
  lineHeight: '1.5',
  letterSpacing: '0.05em',
  cardBackground: '#ffffff',
  cardHoverBackground: '#0b4638',
};

const TEMPLATE_PALETTES: Record<string, Partial<TemplatePalette>> = {
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
  'courtyard-hospitality': {
    primary: '#892e39',
    primaryForeground: '#ffffff',
    secondary: '#e7d0b0',
    secondaryForeground: '#171717',
    accent: '#819072',
    accentForeground: '#ffffff',
    background: '#ffffff',
    foreground: '#171717',
    card: '#ffffff',
    cardForeground: '#171717',
    popover: '#ffffff',
    popoverForeground: '#171717',
    muted: '#f3eaeb',
    mutedForeground: '#171717',
    border: '#892e39',
    input: '#892e39',
    ring: '#892e39',
    destructive: '#b42318',
    destructiveForeground: '#ffffff',
    cardBackground: '#ffffff',
    cardHoverBackground: '#f3eaeb',
  },
  'ember-basil': {
    primary: '#422525',
    primaryForeground: '#fffaf0',
    secondary: '#faf5e5',
    secondaryForeground: '#422525',
    accent: '#febe10',
    accentForeground: '#422525',
    background: '#fffdf7',
    foreground: '#422525',
    card: '#ffffff',
    cardForeground: '#422525',
    popover: '#ffffff',
    popoverForeground: '#422525',
    muted: '#faf5e5',
    mutedForeground: '#6f5148',
    border: '#ead9b8',
    input: '#ead9b8',
    ring: '#febe10',
    destructive: '#b42318',
    destructiveForeground: '#ffffff',
    cardBackground: '#ffffff',
    cardHoverBackground: '#faf5e5',
  },
  'nonna-table': {
    primary: '#2d7000',
    primaryForeground: '#ffffff',
    secondary: '#f5fff5',
    secondaryForeground: '#2d7000',
    accent: '#967d47',
    accentForeground: '#ffffff',
    background: '#ffffff',
    foreground: '#234d16',
    card: '#ffffff',
    cardForeground: '#234d16',
    popover: '#ffffff',
    popoverForeground: '#234d16',
    muted: '#edf7e9',
    mutedForeground: '#4d6648',
    border: '#d7e7ce',
    input: '#d7e7ce',
    ring: '#967d47',
    destructive: '#b42318',
    destructiveForeground: '#ffffff',
    cardBackground: '#ffffff',
    cardHoverBackground: '#f5fff5',
  },
  'olive-hearth': {
    primary: '#2c3135',
    primaryForeground: '#fff9f1',
    secondary: '#ffecd9',
    secondaryForeground: '#2c3135',
    accent: '#e3aa6b',
    accentForeground: '#2c3135',
    background: '#fff9f1',
    foreground: '#2c3135',
    card: '#ffffff',
    cardForeground: '#2c3135',
    popover: '#ffffff',
    popoverForeground: '#2c3135',
    muted: '#f6e8d9',
    mutedForeground: '#50585f',
    border: '#e6c9aa',
    input: '#e6c9aa',
    ring: '#e3aa6b',
    destructive: '#b42318',
    destructiveForeground: '#ffffff',
    cardBackground: '#ffffff',
    cardHoverBackground: '#ffecd9',
  },
  'crimson-stack': {
    primary: '#000000',
    primaryForeground: '#ffffff',
    secondary: '#171717',
    secondaryForeground: '#ffffff',
    accent: '#d92b3a',
    accentForeground: '#ffffff',
    background: '#ffffff',
    foreground: '#171717',
    card: '#ffffff',
    cardForeground: '#171717',
    popover: '#ffffff',
    popoverForeground: '#171717',
    muted: '#f1f1f1',
    mutedForeground: '#666666',
    border: '#e5e7eb',
    input: '#e5e7eb',
    ring: '#d92b3a',
    destructive: '#b42318',
    destructiveForeground: '#ffffff',
    cardBackground: '#ffffff',
    cardHoverBackground: '#f5f5f5',
  },
  'saffron-ember': {
    primary: '#432f29',
    primaryForeground: '#ffffff',
    secondary: '#f5f2eb',
    secondaryForeground: '#432f29',
    accent: '#de4917',
    accentForeground: '#ffffff',
    background: '#fffdf9',
    foreground: '#432f29',
    card: '#ffffff',
    cardForeground: '#432f29',
    popover: '#ffffff',
    popoverForeground: '#432f29',
    muted: '#f5f2eb',
    mutedForeground: '#788288',
    border: '#e3d8d0',
    input: '#e3d8d0',
    ring: '#de4917',
    destructive: '#b42318',
    destructiveForeground: '#ffffff',
    cardBackground: '#ffffff',
    cardHoverBackground: '#f5f2eb',
  },
  'lime-char': {
    primary: '#131c16',
    primaryForeground: '#edf8d8',
    secondary: '#242d10',
    secondaryForeground: '#edf8d8',
    accent: '#95d01a',
    accentForeground: '#131c16',
    background: '#fafafa',
    foreground: '#2e2e2e',
    card: '#ffffff',
    cardForeground: '#2e2e2e',
    popover: '#ffffff',
    popoverForeground: '#2e2e2e',
    muted: '#edf8d8',
    mutedForeground: '#4c6b0a',
    border: '#d8e6bd',
    input: '#d8e6bd',
    ring: '#95d01a',
    destructive: '#b42318',
    destructiveForeground: '#ffffff',
    cardBackground: '#ffffff',
    cardHoverBackground: '#edf8d8',
  },
  'golden-wok': {
    primary: '#000000',
    primaryForeground: '#f5f5f5',
    secondary: '#202022',
    secondaryForeground: '#f5f5f5',
    accent: '#e9ac07',
    accentForeground: '#000000',
    background: '#f5f5f5',
    foreground: '#202022',
    card: '#ffffff',
    cardForeground: '#202022',
    popover: '#ffffff',
    popoverForeground: '#202022',
    muted: '#eeeeee',
    mutedForeground: '#545454',
    border: '#d5d5d5',
    input: '#d5d5d5',
    ring: '#e9ac07',
    destructive: '#b42318',
    destructiveForeground: '#ffffff',
    cardBackground: '#ffffff',
    cardHoverBackground: '#eeeeee',
  },
  'sakura-tide': {
    primary: '#222426',
    primaryForeground: '#f8eedb',
    secondary: '#2a2e32',
    secondaryForeground: '#f8eedb',
    accent: '#f46a44',
    accentForeground: '#ffffff',
    background: '#fffaf3',
    foreground: '#222426',
    card: '#ffffff',
    cardForeground: '#222426',
    popover: '#ffffff',
    popoverForeground: '#222426',
    muted: '#f8eedb',
    mutedForeground: '#6d7580',
    border: '#eadfd4',
    input: '#eadfd4',
    ring: '#f46a44',
    destructive: '#b42318',
    destructiveForeground: '#ffffff',
    cardBackground: '#ffffff',
    cardHoverBackground: '#f8eedb',
  },
  'atelier-noir': {
    primary: '#000000',
    primaryForeground: '#ffffff',
    secondary: '#111111',
    secondaryForeground: '#ffffff',
    accent: '#d8b24a',
    accentForeground: '#111111',
    background: '#ffffff',
    foreground: '#151515',
    card: '#ffffff',
    cardForeground: '#151515',
    popover: '#ffffff',
    popoverForeground: '#151515',
    muted: '#f4f4f2',
    mutedForeground: '#666666',
    border: '#dedbd5',
    input: '#dedbd5',
    ring: '#d8b24a',
    destructive: '#b42318',
    destructiveForeground: '#ffffff',
    cardBackground: '#ffffff',
    cardHoverBackground: '#f4f4f2',
  },
  'fine-dining': {
    primary: '#1d1d1d',
    primaryForeground: '#f5f5f5',
    secondary: '#2a2a2a',
    secondaryForeground: '#f5f5f5',
    accent: '#c5a572',
    accentForeground: '#0a0a0a',
    background: '#f5f5f5',
    foreground: '#0a0a0a',
    card: '#ffffff',
    cardForeground: '#0a0a0a',
    popover: '#ffffff',
    popoverForeground: '#0a0a0a',
    muted: '#e6d5b8',
    mutedForeground: '#5c5145',
    border: '#d8c79c',
    input: '#d8c79c',
    ring: '#c5a572',
    destructive: '#b42318',
    destructiveForeground: '#ffffff',
    cardBackground: '#ffffff',
    cardHoverBackground: '#e6d5b8',
  },
};

const TEMPLATE_THEME_DETAILS: Record<string, Partial<TemplatePalette>> = {
  'home-default': { fontFamily: 'Inter, system-ui, sans-serif', headingFontFamily: 'Inter, system-ui, sans-serif', radius: '0.5rem' },
  'thai-palace': { fontFamily: 'Inter, system-ui, sans-serif', headingFontFamily: 'Playfair Display, Georgia, serif', radius: '0.5rem' },
  'order-first': { fontFamily: 'Inter, system-ui, sans-serif', headingFontFamily: 'Inter, system-ui, sans-serif', radius: '0.5rem' },
  'home-retail': { fontFamily: 'Inter, system-ui, sans-serif', headingFontFamily: 'Inter, system-ui, sans-serif', radius: '0.5rem', letterSpacing: '0.02em' },
  'home-riode': { fontFamily: 'Inter, system-ui, sans-serif', headingFontFamily: 'Inter, system-ui, sans-serif', radius: '0.5rem', letterSpacing: '0.02em' },
  'courtyard-hospitality': { fontFamily: 'Seravek, "Helvetica Neue", Helvetica, Arial, sans-serif', headingFontFamily: 'Seravek, "Helvetica Neue", Helvetica, Arial, sans-serif', radius: '0rem', letterSpacing: '0.04em' },
  'ember-basil': { fontFamily: 'Montserrat, Inter, system-ui, sans-serif', headingFontFamily: 'Montserrat, Inter, system-ui, sans-serif', radius: '0.75rem', letterSpacing: '0.03em' },
  'nonna-table': { fontFamily: 'Inter, system-ui, sans-serif', headingFontFamily: 'Playfair Display, Georgia, serif', radius: '0.75rem', letterSpacing: '0.03em' },
  'olive-hearth': { fontFamily: 'Lora, Georgia, serif', headingFontFamily: 'Lora, Georgia, serif', radius: '0.25rem', letterSpacing: '0.02em' },
  'crimson-stack': { fontFamily: 'Montserrat, Inter, system-ui, sans-serif', headingFontFamily: 'Montserrat, Inter, system-ui, sans-serif', radius: '0.25rem', letterSpacing: '0.02em' },
  'saffron-ember': { fontFamily: 'Lora, Georgia, serif', headingFontFamily: 'Lora, Georgia, serif', radius: '0.5rem', letterSpacing: '0.02em' },
  'lime-char': { fontFamily: 'Inter, system-ui, sans-serif', headingFontFamily: 'Inter, system-ui, sans-serif', radius: '0.5rem', letterSpacing: '0.02em' },
  'golden-wok': { fontFamily: 'Inter, system-ui, sans-serif', headingFontFamily: 'Inter, system-ui, sans-serif', radius: '0.25rem', letterSpacing: '0.02em' },
  'sakura-tide': { fontFamily: 'Inter, system-ui, sans-serif', headingFontFamily: 'Inter, system-ui, sans-serif', radius: '0.75rem', letterSpacing: '0.03em' },
  'atelier-noir': { fontFamily: 'Inter, system-ui, sans-serif', headingFontFamily: 'Inter, system-ui, sans-serif', radius: '0rem', letterSpacing: '0.04em' },
  'fine-dining': { fontFamily: 'Poppins, Arial, sans-serif', headingFontFamily: 'Playfair Display, Georgia, serif', radius: '0.625rem', letterSpacing: '0.02em' },
};

const validColor = (value: unknown, fallback: string): string => {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  return value.trim();
};

export const getTemplatePalette = (templateKey?: string, themeOverride?: IPageThemeOverride): TemplatePalette => {
  const templatePalette = TEMPLATE_PALETTES[templateKey ?? ''] ?? {};
  const base = {
    ...DEFAULT_PALETTE,
    ...templatePalette,
    ...(TEMPLATE_THEME_DETAILS[templateKey ?? ''] ?? {}),
  } as TemplatePalette;
  const themedBase = {
    ...base,
    chart1: templatePalette.chart1 || base.primary,
    chart2: templatePalette.chart2 || base.accent,
    chart3: templatePalette.chart3 || base.secondary,
    chart4: templatePalette.chart4 || base.destructive,
    chart5: templatePalette.chart5 || base.mutedForeground,
    sidebarBackground: templatePalette.sidebarBackground || base.card,
    sidebarForeground: templatePalette.sidebarForeground || base.cardForeground,
    sidebarPrimary: templatePalette.sidebarPrimary || base.primary,
    sidebarPrimaryForeground: templatePalette.sidebarPrimaryForeground || base.primaryForeground,
    sidebarAccent: templatePalette.sidebarAccent || base.accent,
    sidebarAccentForeground: templatePalette.sidebarAccentForeground || base.accentForeground,
    sidebarBorder: templatePalette.sidebarBorder || base.border,
    sidebarRing: templatePalette.sidebarRing || base.ring,
  };
  return {
    ...themedBase,
    primary: validColor(themeOverride?.primary, themedBase.primary),
    primaryForeground: validColor(themeOverride?.primaryForeground, themedBase.primaryForeground),
    secondary: validColor(themeOverride?.secondary, themedBase.secondary),
    secondaryForeground: validColor(themeOverride?.secondaryForeground, themedBase.secondaryForeground),
    accent: validColor(themeOverride?.accent, themedBase.accent),
    accentForeground: validColor(themeOverride?.accentForeground, themedBase.accentForeground),
    background: validColor(themeOverride?.background, themedBase.background),
    foreground: validColor(themeOverride?.foreground, themedBase.foreground),
    card: validColor(themeOverride?.card, themedBase.card),
    cardForeground: validColor(themeOverride?.cardForeground, themedBase.cardForeground),
    popover: validColor(themeOverride?.popover, themedBase.popover),
    popoverForeground: validColor(themeOverride?.popoverForeground, themedBase.popoverForeground),
    muted: validColor(themeOverride?.muted, themedBase.muted),
    mutedForeground: validColor(themeOverride?.mutedForeground, themedBase.mutedForeground),
    border: validColor(themeOverride?.border, themedBase.border),
    input: validColor(themeOverride?.input, themedBase.input),
    ring: validColor(themeOverride?.ring, themedBase.ring),
    destructive: validColor(themeOverride?.destructive, themedBase.destructive),
    destructiveForeground: validColor(themeOverride?.destructiveForeground, themedBase.destructiveForeground),
    chart1: validColor(themeOverride?.chart1, themedBase.chart1),
    chart2: validColor(themeOverride?.chart2, themedBase.chart2),
    chart3: validColor(themeOverride?.chart3, themedBase.chart3),
    chart4: validColor(themeOverride?.chart4, themedBase.chart4),
    chart5: validColor(themeOverride?.chart5, themedBase.chart5),
    sidebarBackground: validColor(themeOverride?.sidebarBackground, themedBase.sidebarBackground),
    sidebarForeground: validColor(themeOverride?.sidebarForeground, themedBase.sidebarForeground),
    sidebarPrimary: validColor(themeOverride?.sidebarPrimary, themedBase.sidebarPrimary),
    sidebarPrimaryForeground: validColor(themeOverride?.sidebarPrimaryForeground, themedBase.sidebarPrimaryForeground),
    sidebarAccent: validColor(themeOverride?.sidebarAccent, themedBase.sidebarAccent),
    sidebarAccentForeground: validColor(themeOverride?.sidebarAccentForeground, themedBase.sidebarAccentForeground),
    sidebarBorder: validColor(themeOverride?.sidebarBorder, themedBase.sidebarBorder),
    sidebarRing: validColor(themeOverride?.sidebarRing, themedBase.sidebarRing),
    radius: validColor(themeOverride?.radius, themedBase.radius),
    fontFamily: validColor(themeOverride?.fontFamily, themedBase.fontFamily),
    headingFontFamily: validColor(themeOverride?.headingFontFamily, themedBase.headingFontFamily),
    fontSize: validColor(themeOverride?.fontSize, themedBase.fontSize),
    fontWeight: validColor(themeOverride?.fontWeight, themedBase.fontWeight),
    lineHeight: validColor(themeOverride?.lineHeight, themedBase.lineHeight),
    letterSpacing: validColor(themeOverride?.letterSpacing, themedBase.letterSpacing),
    // Legacy section appearance fields map to the same semantic tokens as the
    // shadcn surface fields. Keeping these derived prevents newly opened
    // section editors from falling back to stale, hard-coded template colors
    // after a page theme is changed.
    cardBackground: validColor(themeOverride?.card, themedBase.card),
    cardHoverBackground: validColor(themeOverride?.muted, themedBase.cardHoverBackground),
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
    } else if (variant === 'atelier-split') {
      defaults.background = palette.primary;
      defaults.titleColor = palette.primaryForeground;
      defaults.subtitleColor = palette.primaryForeground;
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
  if (variant === 'atelier-split') {
    return {
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      borderRadius: 0,
    };
  }

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
