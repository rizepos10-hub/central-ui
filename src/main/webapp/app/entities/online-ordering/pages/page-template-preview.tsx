import React from 'react';
import { ExternalLink } from 'lucide-react';
import { IOnlineOrderingPage } from 'app/shared/model/ONLINE_ORDERING/online-ordering-page.model';
import { PageStatus, SectionType } from 'app/shared/model/ONLINE_ORDERING/online-ordering-page.enums';
import { cn } from 'app/lib/utils';
import { normalizeStorefrontUrl } from './page-preview-utils';

type PreviewSpec = {
  title: string;
  subtitle: string;
  accent: string;
  header: string;
  surface: string;
  render: () => React.ReactNode;
};

const sectionColor: Partial<Record<SectionType, string>> = {
  [SectionType.HERO_BANNER]: '#1e293b',
  [SectionType.HERO_CAROUSEL]: '#334155',
  [SectionType.CATEGORY_STRIP]: '#e2e8f0',
  [SectionType.FEATURED_ITEMS]: '#f1f5f9',
  [SectionType.FEATURE_GRID]: '#f8fafc',
  [SectionType.BRANCH_DIRECTORY]: '#dbeafe',
  [SectionType.BUSINESS_INFO]: '#0f172a',
  [SectionType.RICH_TEXT]: '#fef3c7',
  [SectionType.SPACER]: '#ffffff',
  [SectionType.FOOTER]: '#0f172a',
};

function sectionPreviewBackground(section: { type?: SectionType; config?: Record<string, unknown> }): string {
  const appearance = (section.config?.appearance ?? {}) as Record<string, string | undefined>;
  if (appearance.background) return appearance.background;
  if (section.type === SectionType.FEATURED_ITEMS) {
    return sectionColor[section.type as SectionType] ?? '#e2e8f0';
  }
  return sectionColor[section.type as SectionType] ?? '#e2e8f0';
}

function pageAccent(page: IOnlineOrderingPage, fallback: string): string {
  return page.themeOverride?.accent ?? fallback;
}

function chromePart(page: IOnlineOrderingPage, key: 'header' | 'footer'): Record<string, unknown> {
  const part = page.chrome?.[key];
  return part && typeof part === 'object' ? part : {};
}

function chromeAppearance(part: Record<string, unknown>): Record<string, unknown> {
  const appearance = part.appearance;
  return appearance && typeof appearance === 'object' ? (appearance as Record<string, unknown>) : {};
}

function chromeLabel(part: Record<string, unknown>, key: string, fallback: string): string {
  const labels = part.labels;
  if (!labels || typeof labels !== 'object') return fallback;
  const value = (labels as Record<string, unknown>)[key];
  return typeof value === 'string' && value.trim() ? value : fallback;
}

const PREVIEW_BY_TEMPLATE: Record<string, PreviewSpec> = {
  'home-default': {
    title: 'Restaurant showcase',
    subtitle: 'Full-screen hero, feature grid, branches',
    accent: '#f2c94c',
    header: '#062f25',
    surface: '#fff8ea',
    render: () => (
      <>
        <div className="h-[38%] w-full" style={{ background: 'linear-gradient(135deg,#062f25,#0b4638)' }}>
          <div className="mx-auto mt-[18%] h-1 w-8 rounded" style={{ background: '#f2c94c' }} />
          <div className="mx-auto mt-1 h-1.5 w-14 rounded bg-white/80" />
        </div>
        <div className="grid grid-cols-4 gap-0.5 px-1 py-1" style={{ background: '#fff8ea' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-3 rounded-sm bg-white shadow-sm" />
          ))}
        </div>
        <div className="h-[18%] w-full bg-white/90 px-1 py-1">
          <div className="h-1 w-10 rounded bg-slate-300" />
          <div className="mt-1 grid grid-cols-3 gap-0.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-2 rounded-sm bg-slate-200" />
            ))}
          </div>
        </div>
      </>
    ),
  },
  'order-first': {
    title: 'Order first',
    subtitle: 'Carousel, categories, then products',
    accent: '#f2c94c',
    header: '#062f25',
    surface: '#fff8ea',
    render: () => (
      <>
        <div className="h-2 w-full" style={{ background: '#062f25' }} />
        <div className="h-[22%] w-full bg-slate-300" />
        <div className="flex gap-0.5 px-1 py-1" style={{ background: '#fff8ea' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-2 flex-1 rounded-full bg-white shadow-sm" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-0.5 px-1 pb-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-3 rounded-sm bg-white shadow-sm" />
          ))}
        </div>
      </>
    ),
  },
  'home-retail': {
    title: 'Electronics retail',
    subtitle: 'Search header, navy hero, category strip',
    accent: '#2563eb',
    header: '#1e3a5f',
    surface: '#f8fafc',
    render: () => (
      <>
        <div className="px-1 py-0.5" style={{ background: '#1e3a5f' }}>
          <div className="flex items-center gap-0.5">
            <div className="h-1.5 w-4 rounded-sm bg-white/90" />
            <div className="h-1.5 flex-1 rounded-sm bg-white/30" />
          </div>
        </div>
        <div className="h-[28%] w-full" style={{ background: 'linear-gradient(120deg,#0c1e35,#1e3a5f,#2563eb)' }} />
        <div className="grid grid-cols-3 gap-0.5 px-1 py-0.5" style={{ background: '#f8fafc' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-2 rounded-sm bg-white shadow-sm" />
          ))}
        </div>
        <div className="grid grid-cols-4 gap-0.5 px-1 pb-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-3 rounded-sm bg-white shadow-sm" />
          ))}
        </div>
      </>
    ),
  },
  'home-riode': {
    title: 'Riode eCommerce',
    subtitle: 'Split carousel, category grid, dual promos',
    accent: '#05b895',
    header: '#1e3a5f',
    surface: '#f8fafc',
    render: () => (
      <>
        <div className="h-1 w-full bg-slate-100" />
        <div className="flex items-center gap-0.5 px-1 py-0.5">
          <div className="h-1.5 w-3 rounded-sm bg-slate-300" />
          <div className="h-1.5 flex-1 rounded-sm bg-slate-200" />
        </div>
        <div className="flex gap-0.5 px-1">
          <div className="h-[26%] flex-[3] rounded-sm bg-slate-300" />
          <div className="h-[26%] flex-1 rounded-sm" style={{ background: '#2d3748' }} />
        </div>
        <div className="grid grid-cols-2 gap-0.5 px-1 py-0.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-0.5 rounded-sm bg-white p-0.5 shadow-sm">
              <div className="h-2 w-2 rounded-sm bg-slate-200" />
              <div className="flex-1 space-y-0.5">
                <div className="h-0.5 w-full rounded bg-slate-300" />
                <div className="h-0.5 w-2/3 rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-0.5 px-1 pb-1">
          <div className="h-2 flex-1 rounded-sm" style={{ background: '#3cbea4' }} />
          <div className="h-2 flex-1 rounded-sm bg-slate-600" />
        </div>
      </>
    ),
  },
};

function GenericSectionPreview({ page }: { page: IOnlineOrderingPage }) {
  const sections = [...(page.sections ?? [])]
    .filter(s => s.visible !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .slice(0, 6);

  if (!sections.length) {
    return (
      <div className="flex h-full items-center justify-center px-2 text-center text-[8px] text-muted-foreground">
        No template sections are available for preview
      </div>
    );
  }

  return (
    <>
      <div className="h-2 w-full bg-slate-200" />
      {sections.map((section, index) => (
        <div
          key={section.id ?? `${section.type}-${index}`}
          className="mx-1 my-0.5 rounded-sm"
          style={{
            background: sectionPreviewBackground(section),
            height: section.type === SectionType.HERO_BANNER || section.type === SectionType.HERO_CAROUSEL ? '28%' : '12%',
            minHeight: 6,
          }}
        />
      ))}
    </>
  );
}

function getFeaturedAppearance(page: IOnlineOrderingPage): Record<string, unknown> | undefined {
  const section = page.sections?.find(s => s.type === SectionType.FEATURED_ITEMS);
  return section?.config?.appearance as Record<string, unknown> | undefined;
}

function resolvePreview(page: IOnlineOrderingPage): PreviewSpec {
  const templateKey = page.templateKey ?? '';
  const featuredBg = getFeaturedAppearance(page)?.background;
  const featuredSurface = typeof featuredBg === 'string' ? featuredBg : undefined;

  if (PREVIEW_BY_TEMPLATE[templateKey]) {
    const base = PREVIEW_BY_TEMPLATE[templateKey];
    return {
      ...base,
      accent: pageAccent(page, base.accent),
      header: page.themeOverride?.primary ?? base.header,
      surface: featuredSurface ?? base.surface,
    };
  }

  return {
    title: 'Custom page',
    subtitle: `${page.sections?.length ?? 0} sections`,
    accent: pageAccent(page, '#64748b'),
    header: page.themeOverride?.primary ?? '#334155',
    surface: featuredSurface ?? '#f8fafc',
    render: () => <GenericSectionPreview page={page} />,
  };
}

type PageTemplatePreviewProps = {
  page: IOnlineOrderingPage;
  isActive?: boolean;
  storeDomain?: string;
  className?: string;
  showLinks?: boolean;
  livePreviewUrl?: string | null;
};

export const PageTemplatePreview = ({
  page,
  isActive,
  storeDomain,
  className,
  showLinks = true,
  livePreviewUrl,
}: PageTemplatePreviewProps) => {
  const spec = resolvePreview(page);
  const header = chromePart(page, 'header');
  const footer = chromePart(page, 'footer');
  const headerAppearance = chromeAppearance(header);
  const footerAppearance = chromeAppearance(footer);
  const announcementText = typeof header.announcementText === 'string' ? header.announcementText.trim() : '';
  const showAnnouncement = header.showAnnouncement !== false && Boolean(announcementText);
  const headerBackground = typeof headerAppearance.background === 'string' ? headerAppearance.background : spec.header;
  const footerBackground = typeof footerAppearance.background === 'string' ? footerAppearance.background : '#0f172a';
  const accent = pageAccent(page, spec.accent);
  const liveUrl =
    livePreviewUrl ??
    (isActive && page.status === PageStatus.PUBLISHED ? normalizeStorefrontUrl(storeDomain) : null);

  return (
    <div className={cn('shrink-0', className)}>
      <div className="overflow-hidden rounded-lg border bg-white shadow-sm" style={{ width: 220 }}>
        <div className="flex items-center gap-1 border-b bg-slate-50 px-2 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
          <span className="ml-1 truncate text-[9px] text-muted-foreground">/{page.slug}</span>
        </div>
        <div className="relative flex h-[130px] flex-col overflow-hidden" style={{ background: spec.surface }}>
          {showAnnouncement && <div className="h-3 shrink-0 truncate px-2 text-center text-[7px] font-medium text-white" style={{ background: headerAppearance.announcementBackground as string || headerBackground }}>{announcementText}</div>}
          <div className="flex h-5 shrink-0 items-center justify-between px-2 text-[7px] text-white" style={{ background: headerBackground }}>
            <span className="h-1.5 w-8 rounded bg-white/80" />
            <span>{chromeLabel(header, 'home', 'Home')} · {chromeLabel(header, 'shop', 'Shop')} · {chromeLabel(header, 'cart', 'Cart')}</span>
          </div>
          {spec.render()}
          <div className="flex h-5 shrink-0 items-center justify-between px-2 text-[7px] text-white" style={{ background: footerBackground }}>
            <span className="h-1.5 w-10 rounded bg-white/70" />
            <span>{footer.showCopyright !== false ? 'Copyright' : 'Footer'}</span>
          </div>
          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-0.5"
            style={{ background: accent }}
          />
        </div>
      </div>
      <div className="mt-2 max-w-[220px]">
        <p className="text-xs font-medium leading-tight">{spec.title}</p>
        <p className="text-[10px] leading-snug text-muted-foreground">{spec.subtitle}</p>
        {showLinks && liveUrl && (
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
          >
            View live
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        )}
      </div>
    </div>
  );
};

export default PageTemplatePreview;
