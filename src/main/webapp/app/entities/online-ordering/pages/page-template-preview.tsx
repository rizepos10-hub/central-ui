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
  'courtyard-hospitality': {
    title: 'Courtyard Hospitality',
    subtitle: 'Full-screen spaces, menus, story, and hospitality chrome',
    accent: '#819072',
    header: '#892e39',
    surface: '#ffffff',
    render: () => (
      <>
        <div className="h-[31%] w-full" style={{ background: 'linear-gradient(135deg,#171717,#892e39)' }}>
          <div className="mx-auto mt-[14%] h-2 w-10 rounded bg-white/90" />
        </div>
        <div className="h-[18%] w-full bg-white px-2 py-2">
          <div className="mx-auto h-1 w-16 rounded bg-[#892e39]/60" />
          <div className="mx-auto mt-1 h-1 w-24 rounded bg-slate-200" />
        </div>
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-[13%] w-full border-b-2 border-white"
            style={{ background: index % 2 === 0 ? '#7d8d70' : '#b99775' }}
          />
        ))}
        <div className="h-[12%] bg-[#e7d0b0]/40" />
      </>
    ),
  },
  'ember-basil': {
    title: 'Ember & Basil',
    subtitle: 'Thin-crust Italian pizza, warm red tones, and golden accents',
    accent: '#febe10',
    header: '#422525',
    surface: '#faf5e5',
    render: () => (
      <>
        <div className="h-[30%] w-full" style={{ background: 'linear-gradient(135deg,#422525,#cc2d2d)' }}>
          <div className="mx-auto mt-[14%] h-1.5 w-12 rounded" style={{ background: '#febe10' }} />
          <div className="mx-auto mt-1 h-1 w-20 rounded bg-white/80" />
        </div>
        <div className="grid grid-cols-2 gap-0.5 px-1 py-1" style={{ background: '#faf5e5' }}>
          <div className="h-8 rounded-sm bg-white shadow-sm" />
          <div className="h-8 rounded-sm" style={{ background: '#422525' }} />
        </div>
        <div className="grid grid-cols-4 gap-0.5 px-1 pb-1" style={{ background: '#fffdf7' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-3 rounded-sm" style={{ background: i % 2 ? '#faf5e5' : '#febe10' }} />
          ))}
        </div>
        <div className="h-[18%]" style={{ background: 'linear-gradient(135deg,#422525,#8c3a2b)' }} />
      </>
    ),
  },
  'nonna-table': {
    title: 'Nonna’s Table',
    subtitle: 'Italian pizza, pasta, and a warm family table',
    accent: '#967d47',
    header: '#2d7000',
    surface: '#f5fff5',
    render: () => (
      <>
        <div className="h-[30%] w-full" style={{ background: 'linear-gradient(135deg,#153900,#2d7000)' }}>
          <div className="mx-auto mt-[14%] h-1.5 w-14 rounded bg-white/90" />
          <div className="mx-auto mt-1 h-1 w-20 rounded" style={{ background: '#e3c98d' }} />
        </div>
        <div className="flex gap-0.5 px-1 py-1" style={{ background: '#f5fff5' }}>
          <div className="h-8 flex-1 rounded-sm bg-white shadow-sm" />
          <div className="h-8 flex-1 rounded-sm" style={{ background: '#967d47' }} />
        </div>
        <div className="grid grid-cols-4 gap-0.5 px-1 pb-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-3 rounded-sm bg-white shadow-sm" style={{ borderTop: `2px solid ${i % 2 ? '#967d47' : '#2d7000'}` }} />
          ))}
        </div>
        <div className="h-[18%]" style={{ background: 'linear-gradient(135deg,#2d7000,#967d47)' }} />
      </>
    ),
  },
  'olive-hearth': {
    title: 'Olive & Hearth',
    subtitle: 'Rustic pizza, fresh ingredients, and an artisan story',
    accent: '#e3aa6b',
    header: '#2c3135',
    surface: '#fff9f1',
    render: () => (
      <>
        <div className="h-[30%] w-full" style={{ background: 'linear-gradient(135deg,#2c3135,#50585f)' }}>
          <div className="mx-auto mt-[14%] h-1.5 w-12 rounded" style={{ background: '#e3aa6b' }} />
          <div className="mx-auto mt-1 h-1 w-20 rounded bg-[#fff9f1]/80" />
        </div>
        <div className="h-[16%] px-1 py-1" style={{ background: '#fff9f1' }}>
          <div className="h-1 w-16 rounded" style={{ background: '#d74720' }} />
          <div className="mt-1 h-1 w-24 rounded bg-slate-300" />
        </div>
        <div className="grid grid-cols-3 gap-0.5 px-1 pb-1" style={{ background: '#ffecd9' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-7 rounded-sm" style={{ background: i === 1 ? '#e3aa6b' : '#fff9f1' }} />
          ))}
        </div>
        <div className="h-[18%]" style={{ background: 'linear-gradient(135deg,#2c3135,#d74720)' }} />
      </>
    ),
  },
  'crimson-stack': {
    title: 'Crimson Stack',
    subtitle: 'Bold burgers, red-and-black energy, and fast ordering',
    accent: '#d92b3a',
    header: '#000000',
    surface: '#ffffff',
    render: () => (
      <>
        <div className="h-[30%] w-full" style={{ background: 'linear-gradient(135deg,#000000,#d92b3a)' }}>
          <div className="mx-auto mt-[14%] h-1.5 w-14 rounded" style={{ background: '#d92b3a' }} />
          <div className="mx-auto mt-1 h-1 w-20 rounded bg-white/85" />
        </div>
        <div className="grid grid-cols-4 gap-0.5 px-1 py-1" style={{ background: '#ffffff' }}>
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-7 rounded-sm" style={{ background: i % 2 ? '#171717' : '#d92b3a' }} />)}
        </div>
        <div className="grid grid-cols-3 gap-0.5 px-1 pb-1" style={{ background: '#d92b3a' }}>
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-5 rounded-sm" style={{ background: i === 1 ? '#000000' : '#ffffff' }} />)}
        </div>
        <div className="h-[18%]" style={{ background: 'linear-gradient(135deg,#000000,#d92b3a)' }} />
      </>
    ),
  },
  'saffron-ember': {
    title: 'Saffron Ember',
    subtitle: 'Warm Turkish grill hospitality with terracotta accents',
    accent: '#de4917',
    header: '#432f29',
    surface: '#f5f2eb',
    render: () => (
      <>
        <div className="h-[30%] w-full" style={{ background: 'linear-gradient(135deg,#432f29,#de4917)' }}>
          <div className="mx-auto mt-[14%] h-1.5 w-14 rounded" style={{ background: '#de4917' }} />
          <div className="mx-auto mt-1 h-1 w-20 rounded bg-[#f5f2eb]/90" />
        </div>
        <div className="h-[17%] px-1 py-1" style={{ background: '#f5f2eb' }}>
          <div className="h-1 w-16 rounded" style={{ background: '#de4917' }} />
          <div className="mt-1 h-1 w-24 rounded bg-[#432f29]/35" />
        </div>
        <div className="grid grid-cols-4 gap-0.5 px-1 pb-1" style={{ background: '#f5f2eb' }}>
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-7 rounded-sm" style={{ background: i % 2 ? '#432f29' : '#ffffff' }} />)}
        </div>
        <div className="h-[18%]" style={{ background: 'linear-gradient(135deg,#432f29,#de4917)' }} />
      </>
    ),
  },
  'lime-char': {
    title: 'Lime & Char',
    subtitle: 'Dark charcoal, electric lime, and location-led burger moments',
    accent: '#95d01a',
    header: '#131c16',
    surface: '#edf8d8',
    render: () => (
      <>
        <div className="h-[30%] w-full" style={{ background: 'linear-gradient(135deg,#131c16,#4c6b0a)' }}>
          <div className="mx-auto mt-[14%] h-1.5 w-14 rounded" style={{ background: '#95d01a' }} />
          <div className="mx-auto mt-1 h-1 w-20 rounded bg-[#edf8d8]/90" />
        </div>
        <div className="grid grid-cols-2 gap-0.5 px-1 py-1" style={{ background: '#edf8d8' }}>
          <div className="h-8 rounded-sm bg-white shadow-sm" />
          <div className="h-8 rounded-sm" style={{ background: '#95d01a' }} />
        </div>
        <div className="h-[16%] px-1 py-1" style={{ background: '#ffffff' }}>
          <div className="h-1 w-16 rounded" style={{ background: '#95d01a' }} />
          <div className="mt-1 h-1 w-24 rounded bg-[#131c16]/30" />
        </div>
        <div className="h-[18%]" style={{ background: 'linear-gradient(135deg,#131c16,#95d01a)' }} />
      </>
    ),
  },
  'golden-wok': {
    title: 'Golden Wok',
    subtitle: 'Black, gold, and editorial Chinese restaurant storytelling',
    accent: '#e9ac07',
    header: '#000000',
    surface: '#f5f5f5',
    render: () => (
      <>
        <div className="h-[30%] w-full" style={{ background: 'linear-gradient(135deg,#000000,#545454)' }}>
          <div className="mx-auto mt-[14%] h-1.5 w-14 rounded" style={{ background: '#e9ac07' }} />
          <div className="mx-auto mt-1 h-1 w-20 rounded bg-white/85" />
        </div>
        <div className="h-[17%] px-1 py-1" style={{ background: '#f5f5f5' }}>
          <div className="h-1 w-16 rounded" style={{ background: '#e9ac07' }} />
          <div className="mt-1 h-1 w-24 rounded bg-[#202022]/35" />
        </div>
        <div className="grid grid-cols-4 gap-0.5 px-1 pb-1" style={{ background: '#eeeeee' }}>
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-7 rounded-sm" style={{ background: i === 1 ? '#e9ac07' : '#ffffff' }} />)}
        </div>
        <div className="h-[18%]" style={{ background: 'linear-gradient(135deg,#000000,#e9ac07)' }} />
      </>
    ),
  },
  'sakura-tide': {
    title: 'Sakura Tide',
    subtitle: 'Coral sushi energy, wave imagery, and calm cream surfaces',
    accent: '#f46a44',
    header: '#222426',
    surface: '#f8eedb',
    render: () => (
      <>
        <div className="h-[30%] w-full" style={{ background: 'linear-gradient(135deg,#222426,#f46a44)' }}>
          <div className="mx-auto mt-[14%] h-1.5 w-14 rounded" style={{ background: '#f46a44' }} />
          <div className="mx-auto mt-1 h-1 w-20 rounded bg-[#f8eedb]/90" />
        </div>
        <div className="grid grid-cols-2 gap-0.5 px-1 py-1" style={{ background: '#f8eedb' }}>
          <div className="h-8 rounded-sm bg-white shadow-sm" />
          <div className="h-8 rounded-sm" style={{ background: '#f46a44' }} />
        </div>
        <div className="grid grid-cols-3 gap-0.5 px-1 pb-1" style={{ background: '#ffffff' }}>
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-6 rounded-sm" style={{ background: i === 1 ? '#f8eedb' : '#ffffff', borderTop: `2px solid ${i === 1 ? '#f46a44' : '#222426'}` }} />)}
        </div>
        <div className="h-[18%]" style={{ background: 'linear-gradient(135deg,#222426,#f46a44)' }} />
      </>
    ),
  },
  'atelier-noir': {
    title: 'Atelier Noir',
    subtitle: 'Monochrome fashion edit with gold accents and editorial storytelling',
    accent: '#d8b24a',
    header: '#000000',
    surface: '#ffffff',
    render: () => (
      <>
        <div className="flex h-[10%] items-center justify-center" style={{ background: '#000000' }}>
          <div className="h-1 w-20 rounded bg-white/80" />
        </div>
        <div className="grid h-[32%] grid-cols-2" style={{ background: '#111111' }}>
          <div style={{ background: 'linear-gradient(135deg,#a7a7a7,#323232)' }} />
          <div className="flex flex-col justify-center gap-1 px-2">
            <div className="h-1 w-10 rounded" style={{ background: '#d8b24a' }} />
            <div className="h-2 w-20 rounded bg-white" />
            <div className="h-1 w-16 rounded bg-white/60" />
            <div className="mt-1 h-3 w-12 rounded-sm" style={{ background: '#d8b24a' }} />
          </div>
        </div>
        <div className="flex h-[10%] items-center gap-1 px-1" style={{ background: '#ffffff' }}>
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-1 flex-1 rounded bg-black/70" />)}
        </div>
        <div className="grid h-[18%] grid-cols-4 gap-0.5 px-1 pb-1" style={{ background: '#f4f4f2' }}>
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="rounded-sm bg-white" style={{ borderTop: `2px solid ${i === 1 ? '#d8b24a' : '#dedbd5'}` }} />)}
        </div>
        <div className="h-[18%]" style={{ background: 'linear-gradient(135deg,#111111,#d8b24a)' }} />
      </>
    ),
  },
  'fine-dining': {
    title: 'Fine Dining',
    subtitle: 'Lebanese hospitality with menu stories, delivery, catering, and gallery moments',
    accent: '#c5a572',
    header: '#1d1d1d',
    surface: '#f5f5f5',
    render: () => (
      <>
        <div className="flex h-[9%] items-center justify-between px-2" style={{ background: '#1d1d1d' }}>
          <div className="h-1.5 w-10 rounded bg-white/85" />
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-1 w-3 rounded" style={{ background: index === 2 ? '#c5a572' : '#f5f5f5' }} />)}
          </div>
        </div>
        <div className="relative flex h-[27%] flex-col justify-center overflow-hidden px-3" style={{ background: 'linear-gradient(115deg,#1d1d1d 12%,#403a31 48%,#a58a5f 100%)' }}>
          <div className="absolute right-0 top-0 h-full w-2/5 opacity-45" style={{ background: 'linear-gradient(135deg,transparent 0 28%,#f5eee4 29% 31%,transparent 32% 48%,#26221c 49% 72%,transparent 73%)' }} />
          <div className="relative mb-1 h-1 w-12 rounded" style={{ background: '#c5a572' }} />
          <div className="relative h-2.5 w-24 rounded bg-white/90" />
          <div className="relative mt-1 h-1 w-16 rounded bg-white/55" />
          <div className="relative mt-2 h-2.5 w-11 rounded-sm" style={{ background: '#c5a572' }} />
        </div>
        <div className="flex h-[13%] items-center gap-2 px-2" style={{ background: '#f5f5f5' }}>
          <div className="h-8 w-8 rounded-sm" style={{ background: 'linear-gradient(135deg,#d1b58c,#52412e)' }} />
          <div className="flex-1">
            <div className="h-1 w-16 rounded" style={{ background: '#a78653' }} />
            <div className="mt-1 h-1 w-24 rounded bg-[#5c5145]/35" />
          </div>
          <div className="h-8 w-6 rounded-sm" style={{ background: 'linear-gradient(160deg,#ede5d8,#7e6245)' }} />
        </div>
        <div className="grid h-[19%] grid-cols-3 gap-0.5 px-1" style={{ background: '#1d1d1d' }}>
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex flex-col justify-end gap-0.5 border border-[#c5a572]/70 p-1" style={{ background: index % 2 ? '#242424' : '#1d1d1d' }}>
              <div className="h-1 w-8 rounded bg-[#c5a572]" />
              <div className="h-0.5 w-10 rounded bg-white/45" />
            </div>
          ))}
        </div>
        <div className="grid h-[12%] grid-cols-2 gap-1 px-1 py-0.5" style={{ background: '#8f8f8f' }}>
          <div className="rounded-sm" style={{ background: 'linear-gradient(135deg,#e9e0d3,#7d6041)' }} />
          <div className="flex flex-col justify-center gap-1 px-1">
            <div className="h-1 w-14 rounded bg-white/85" />
            <div className="h-0.5 w-16 rounded bg-white/55" />
          </div>
        </div>
        <div className="flex h-[8%] items-center justify-center gap-2" style={{ background: '#8f8f8f' }}>
          <div className="h-1 w-16 rounded bg-white/80" />
          <div className="h-1 w-8 rounded" style={{ background: '#1d1d1d' }} />
        </div>
        <div className="grid h-[12%] grid-cols-3 gap-1 px-1 py-0.5" style={{ background: '#f5f5f5' }}>
          {Array.from({ length: 3 }).map((_, index) => <div key={index} className="rounded-sm" style={{ background: index === 1 ? '#e6d5b8' : '#ffffff', borderTop: `2px solid ${index === 1 ? '#c5a572' : '#d8c79c'}` }} />)}
        </div>
      </>
    ),
  },
};

// Import cards are rendered before a tenant page exists, so they cannot use the live
// storefront renderer. These local snapshots keep every registered template visual,
// deterministic, and independent of tenant/auth state.
const TEMPLATE_SCREENSHOTS: Record<string, string> = {
  'home-default': '/content/images/landing-templates/home-default.webp',
  'order-first': '/content/images/landing-templates/order-first.webp',
  'home-riode': '/content/images/landing-templates/home-riode.webp',
  'home-retail': '/content/images/landing-templates/home-retail.webp',
  'thai-palace': '/content/images/landing-templates/thai-palace.webp',
  'courtyard-hospitality': '/content/images/landing-templates/courtyard-hospitality.webp',
  'ember-basil': '/content/images/landing-templates/ember-basil.webp',
  'nonna-table': '/content/images/landing-templates/nonna-table.webp',
  'olive-hearth': '/content/images/landing-templates/olive-hearth.webp',
  'crimson-stack': '/content/images/landing-templates/crimson-stack.webp',
  'saffron-ember': '/content/images/landing-templates/saffron-ember.webp',
  'lime-char': '/content/images/landing-templates/lime-char.webp',
  'golden-wok': '/content/images/landing-templates/golden-wok.webp',
  'sakura-tide': '/content/images/landing-templates/sakura-tide.webp',
  'atelier-noir': '/content/images/landing-templates/atelier-noir.webp',
  'fine-dining': '/content/images/landing-templates/fine-dining.webp',
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
            height:
              section.type === SectionType.HERO_BANNER ||
              section.type === SectionType.HERO_CAROUSEL ||
              section.type === SectionType.COURTYARD_HERO
                ? '28%'
                : '12%',
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
  showMeta?: boolean;
  livePreviewUrl?: string | null;
};

export const PageTemplatePreview = ({
  page,
  isActive,
  storeDomain,
  className,
  showLinks = true,
  showMeta = true,
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
  const liveUrl = livePreviewUrl ?? (isActive && page.status === PageStatus.PUBLISHED ? normalizeStorefrontUrl(storeDomain) : null);
  const screenshot = TEMPLATE_SCREENSHOTS[page.templateKey ?? ''];

  return (
    <div className={cn('shrink-0', className)}>
      <div className="overflow-hidden rounded-lg border bg-white shadow-sm" style={{ width: 220 }}>
        <div className="flex items-center gap-1 border-b bg-slate-50 px-2 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
          <span className="ml-1 truncate text-[9px] text-muted-foreground">/{page.slug}</span>
        </div>
        <div className="relative flex h-[150px] flex-col overflow-hidden" style={{ background: spec.surface }}>
          {screenshot ? (
            <>
              <img
                src={screenshot}
                alt={`${spec.title} template screenshot`}
                className="absolute inset-0 h-full w-full object-cover object-top"
                loading="lazy"
                decoding="async"
              />
              <div
                className="absolute inset-x-0 top-0 z-10 flex h-5 items-center justify-between px-2 text-[7px] font-medium text-white shadow-sm"
                style={{ background: headerBackground }}
                aria-hidden="true"
              >
                <span className="inline-flex items-center gap-1 truncate">
                  <span className="inline-flex h-2.5 w-2.5 items-center justify-center rounded-full bg-white/90 text-[5px] font-bold text-slate-900">
                    ✓
                  </span>
                  Your brand
                </span>
                <span className="shrink-0 opacity-80">Home · Shop</span>
              </div>
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-0.5" style={{ background: accent }} />
            </>
          ) : (
            <>
              {showAnnouncement && (
                <div
                  className="h-3 shrink-0 truncate px-2 text-center text-[7px] font-medium text-white"
                  style={{ background: (headerAppearance.announcementBackground as string) || headerBackground }}
                >
                  {announcementText}
                </div>
              )}
              <div
                className="flex h-5 shrink-0 items-center justify-between px-2 text-[7px] text-white"
                style={{ background: headerBackground }}
              >
                <span className="h-1.5 w-8 rounded bg-white/80" />
                <span>
                  {chromeLabel(header, 'home', 'Home')} · {chromeLabel(header, 'shop', 'Shop')}
                </span>
              </div>
              {spec.render()}
              <div
                className="flex h-5 shrink-0 items-center justify-between px-2 text-[7px] text-white"
                style={{ background: footerBackground }}
              >
                <span className="h-1.5 w-10 rounded bg-white/70" />
                <span>{footer.showCopyright !== false ? 'Copyright' : 'Footer'}</span>
              </div>
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-0.5" style={{ background: accent }} />
            </>
          )}
        </div>
      </div>
      {showMeta && (
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
      )}
    </div>
  );
};

export default PageTemplatePreview;
