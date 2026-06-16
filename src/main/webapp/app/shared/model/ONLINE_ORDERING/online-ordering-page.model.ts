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
  secondary?: string;
  accent?: string;
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
  sections?: IPageSection[];
}

export interface IOnlineOrderingPage {
  id?: string;
  name?: string;
  slug?: string;
  status?: PageStatus;
  scope?: IPageScope;
  seo?: IPageSeo;
  themeOverride?: IPageThemeOverride;
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
