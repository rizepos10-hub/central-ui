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
}

export interface IPageChrome {
  header?: Record<string, unknown>;
  footer?: Record<string, unknown>;
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
