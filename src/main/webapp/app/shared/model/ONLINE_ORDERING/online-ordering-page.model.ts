import { PageScopeType, PageStatus, SectionType } from './online-ordering-page.enums';

export { PageScopeType, PageStatus, SectionType };

export interface IPageScope {
  type?: PageScopeType;
  branchIds?: string[];
  zoneIds?: string[];
}

export interface IPageSeo {
  title?: string;
  description?: string;
  ogImageId?: string;
}

export interface IPageThemeOverride {
  primary?: string;
  primaryForeground?: string;
  secondary?: string;
  secondaryForeground?: string;
  accent?: string;
  accentForeground?: string;
  background?: string;
  foreground?: string;
  card?: string;
  cardForeground?: string;
  popover?: string;
  popoverForeground?: string;
  muted?: string;
  mutedForeground?: string;
  border?: string;
  input?: string;
  ring?: string;
  destructive?: string;
  destructiveForeground?: string;
  chart1?: string;
  chart2?: string;
  chart3?: string;
  chart4?: string;
  chart5?: string;
  sidebarBackground?: string;
  sidebarForeground?: string;
  sidebarPrimary?: string;
  sidebarPrimaryForeground?: string;
  sidebarAccent?: string;
  sidebarAccentForeground?: string;
  sidebarBorder?: string;
  sidebarRing?: string;
  radius?: string;
  fontFamily?: string;
  headingFontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  lineHeight?: string;
  letterSpacing?: string;
}

export interface IPageChrome {
  header?: Record<string, unknown>;
  footer?: Record<string, unknown>;
  /** Page-level shop presentation overrides. Kept beside chrome so it is persisted in the existing page map. */
  shop?: IPageShopOverride;
}

export type ShopColorValue = string;

export interface IPageShopOverride {
  masthead?: {
    background?: ShopColorValue;
    backgroundImage?: string;
    foreground?: ShopColorValue;
    paddingY?: string;
    textAlign?: 'left' | 'center' | 'right';
    showCategories?: boolean;
  };
  content?: {
    background?: ShopColorValue;
    foreground?: ShopColorValue;
    paddingY?: string;
    maxWidth?: string;
  };
  sidebar?: {
    visible?: boolean;
    background?: ShopColorValue;
    border?: ShopColorValue;
    radius?: string;
    width?: string;
  };
  toolbar?: {
    background?: ShopColorValue;
    border?: ShopColorValue;
    radius?: string;
    sticky?: boolean;
  };
  grid?: {
    columns?: 1 | 2 | 3 | 4;
    gap?: string;
    background?: ShopColorValue;
    border?: ShopColorValue;
    radius?: string;
    cardLayout?: 'grid' | 'menu';
  };
  card?: {
    background?: ShopColorValue;
    foreground?: ShopColorValue;
    border?: ShopColorValue;
    hoverBackground?: ShopColorValue;
    hoverBorder?: ShopColorValue;
    radius?: string;
    imageBackground?: ShopColorValue;
    imageAspect?: string;
    imagePadding?: string;
    titleColor?: ShopColorValue;
    categoryColor?: ShopColorValue;
    priceColor?: ShopColorValue;
    actionBackground?: ShopColorValue;
    actionForeground?: ShopColorValue;
    actionBorder?: ShopColorValue;
    actionRadius?: string;
    hoverEffect?: 'none' | 'subtle' | 'lift';
  };
}

export interface IPageSection {
  id?: string;
  type: SectionType;
  order?: number;
  visible?: boolean;
  config?: Record<string, unknown>;
}

export interface IPublishedSnapshot {
  version?: number;
  publishedAt?: string;
  publishedBy?: string;
  themeOverride?: IPageThemeOverride;
  seo?: IPageSeo;
  chrome?: IPageChrome;
  sections?: IPageSection[];
}

export interface IOnlineOrderingPage {
  id?: string;
  name?: string;
  slug?: string;
  templateKey?: string;
  templateVersion?: number;
  status?: PageStatus;
  scope?: IPageScope;
  seo?: IPageSeo;
  themeOverride?: IPageThemeOverride;
  chrome?: IPageChrome;
  sections?: IPageSection[];
  publishedSnapshot?: IPublishedSnapshot;
  draftVersion?: number;
}

export interface ISectionTypeDescriptor {
  type: SectionType;
  label: string;
  description: string;
  schema?: Record<string, unknown>;
}

export const defaultPageValue: Readonly<IOnlineOrderingPage> = {
  name: '',
  slug: 'home',
  status: PageStatus.DRAFT,
  scope: { type: PageScopeType.TENANT },
  themeOverride: {},
  sections: [],
};
