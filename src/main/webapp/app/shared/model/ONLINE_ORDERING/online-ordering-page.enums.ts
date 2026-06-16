export enum PageStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum PageScopeType {
  TENANT = 'TENANT',
  BRANCH = 'BRANCH',
  ZONE = 'ZONE',
}

export enum SectionType {
  HERO_CAROUSEL = 'HERO_CAROUSEL',
  FEATURED_ITEMS = 'FEATURED_ITEMS',
  CATEGORY_STRIP = 'CATEGORY_STRIP',
  BRANCH_DIRECTORY = 'BRANCH_DIRECTORY',
  BUSINESS_INFO = 'BUSINESS_INFO',
  RICH_TEXT = 'RICH_TEXT',
  HERO_BANNER = 'HERO_BANNER',
  SPACER = 'SPACER',
  FEATURE_GRID = 'FEATURE_GRID',
}

export type PageSection = {
  id?: string;
  type: SectionType;
  order?: number;
  visible?: boolean;
  config?: Record<string, unknown>;
};
