import React from 'react';
import { BarChart3, Check, ChevronDown, CreditCard, Search, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from 'app/lib/utils';
import { IPageThemeOverride } from 'app/shared/model/ONLINE_ORDERING/online-ordering-page.model';
import { getTemplatePalette } from './page-template-defaults';

type ThemeEditorPreviewProps = {
  pageName?: string;
  templateKey?: string;
  themeOverride?: IPageThemeOverride;
};

const parseHex = (value: string) => {
  const raw = value.trim().replace(/^#/, '');
  if (!/^(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw)) return null;
  const normalized = raw.length === 3 ? raw.split('').map(part => `${part}${part}`).join('') : raw;
  return {
    red: Number.parseInt(normalized.slice(0, 2), 16),
    green: Number.parseInt(normalized.slice(2, 4), 16),
    blue: Number.parseInt(normalized.slice(4, 6), 16),
  };
};

const toHsl = (value: string) => {
  const trimmed = value.trim();
  if (trimmed.toLowerCase() === 'transparent') return '0 0% 0% / 0';
  if (/^\d+(?:\.\d+)?\s+\d+(?:\.\d+)?%\s+\d+(?:\.\d+)?%(?:\s*\/\s*\d+(?:\.\d+)?)?$/i.test(trimmed)) return trimmed;
  const rgb = parseHex(trimmed);
  if (!rgb) return trimmed;

  const red = rgb.red / 255;
  const green = rgb.green / 255;
  const blue = rgb.blue / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const difference = max - min;
  const lightness = (max + min) / 2;
  let hue = 0;
  let saturation = 0;

  if (difference !== 0) {
    saturation = difference / (1 - Math.abs(2 * lightness - 1));
    if (max === red) hue = ((green - blue) / difference) % 6;
    else if (max === green) hue = (blue - red) / difference + 2;
    else hue = (red - green) / difference + 4;
    hue = (hue * 60 + 360) % 360;
  }

  return `${Math.round(hue)} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`;
};

const toThemeVariables = (palette: ReturnType<typeof getTemplatePalette>): React.CSSProperties => {
  const variables: Record<string, string> = {
    '--primary': toHsl(palette.primary),
    '--primary-foreground': toHsl(palette.primaryForeground),
    '--secondary': toHsl(palette.secondary),
    '--secondary-foreground': toHsl(palette.secondaryForeground),
    '--accent': toHsl(palette.accent),
    '--accent-foreground': toHsl(palette.accentForeground),
    '--background': toHsl(palette.background),
    '--foreground': toHsl(palette.foreground),
    '--card': toHsl(palette.card),
    '--card-foreground': toHsl(palette.cardForeground),
    '--popover': toHsl(palette.popover),
    '--popover-foreground': toHsl(palette.popoverForeground),
    '--muted': toHsl(palette.muted),
    '--muted-foreground': toHsl(palette.mutedForeground),
    '--destructive': toHsl(palette.destructive),
    '--destructive-foreground': toHsl(palette.destructiveForeground),
    '--border': toHsl(palette.border),
    '--input': toHsl(palette.input),
    '--ring': toHsl(palette.ring),
    '--chart-1': toHsl(palette.chart1),
    '--chart-2': toHsl(palette.chart2),
    '--chart-3': toHsl(palette.chart3),
    '--chart-4': toHsl(palette.chart4),
    '--chart-5': toHsl(palette.chart5),
    '--sidebar': toHsl(palette.sidebarBackground),
    '--sidebar-background': toHsl(palette.sidebarBackground),
    '--sidebar-foreground': toHsl(palette.sidebarForeground),
    '--sidebar-primary': toHsl(palette.sidebarPrimary),
    '--sidebar-primary-foreground': toHsl(palette.sidebarPrimaryForeground),
    '--sidebar-accent': toHsl(palette.sidebarAccent),
    '--sidebar-accent-foreground': toHsl(palette.sidebarAccentForeground),
    '--sidebar-border': toHsl(palette.sidebarBorder),
    '--sidebar-ring': toHsl(palette.sidebarRing),
    '--radius': palette.radius,
    '--font-family': palette.fontFamily,
    '--font-sans': palette.fontFamily,
    '--font-serif': palette.headingFontFamily,
    '--font-mono': 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    '--headlines-font-family': palette.headingFontFamily,
    '--paragraph-font-family': palette.fontFamily,
    '--font-size': palette.fontSize,
    '--font-weight': palette.fontWeight,
    '--line-height': palette.lineHeight,
    '--letter-spacing': palette.letterSpacing,
  };

  return {
    ...variables,
    fontFamily: 'var(--font-family)',
    fontSize: 'var(--font-size)',
    fontWeight: 'var(--font-weight)',
    lineHeight: 'var(--line-height)',
    letterSpacing: 'var(--letter-spacing)',
  } as React.CSSProperties;
};

const chartBars = [
  { label: 'Chart 1', height: '72%', className: 'bg-chart-1' },
  { label: 'Chart 2', height: '48%', className: 'bg-chart-2' },
  { label: 'Chart 3', height: '84%', className: 'bg-chart-3' },
  { label: 'Chart 4', height: '58%', className: 'bg-chart-4' },
  { label: 'Chart 5', height: '66%', className: 'bg-chart-5' },
];

export default function ThemeEditorPreview({ pageName, templateKey, themeOverride }: ThemeEditorPreviewProps) {
  const palette = getTemplatePalette(templateKey, themeOverride);

  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-y-auto bg-background text-foreground"
      style={toThemeVariables(palette)}
    >
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Theme preview</p>
            <p className="truncate text-xs text-muted-foreground">{pageName || templateKey || 'Current template'} · live token preview</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-primary" />
          Changes update the storefront preview
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1080px] space-y-5 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">Theme tokens</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">A consistent storefront language</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Preview the same surfaces, controls, cards, navigation, charts, and typography that your landing page and ordering flows inherit.</p>
          </div>
          <Badge variant="outline" className="w-fit border-primary/30 bg-primary/5 text-primary">{templateKey || 'custom theme'}</Badge>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(17rem,0.8fr)]">
          <div className="space-y-5">
            <Card className="overflow-hidden">
              <CardHeader className="border-b bg-muted/30 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Core components</CardTitle>
                  <CardDescription>Primary, secondary, accent, destructive, and outline states.</CardDescription>
                </div>
                <div className="flex items-center gap-2 rounded-md border bg-background px-2 py-1.5 text-xs text-muted-foreground">
                  <Search className="h-3.5 w-3.5" />
                  Search preview
                </div>
              </CardHeader>
              <CardContent className="grid gap-5 p-4 sm:grid-cols-2 sm:p-5">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Actions</p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm">Primary</Button>
                    <Button size="sm" variant="secondary">Secondary</Button>
                    <Button size="sm" variant="outline">Outline</Button>
                    <Button size="sm" variant="destructive">Delete</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>Active badge</Badge>
                    <Badge variant="secondary">Quiet badge</Badge>
                    <Badge variant="outline">Outline badge</Badge>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Form controls</p>
                  <Input placeholder="Input border and ring" />
                  <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm">
                    <span>Selected option</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-5 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Card surface</CardTitle>
                  <CardDescription>Uses `bg-card` and `text-card-foreground`.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between rounded-md border border-border bg-card p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-accent-foreground"><CreditCard className="h-4 w-4" /></div>
                      <div><p className="text-sm font-medium">Card content</p><p className="text-xs text-muted-foreground">Muted supporting text</p></div>
                    </div>
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                </CardContent>
                <CardFooter className="justify-between border-t bg-muted/20 pt-3 text-xs text-muted-foreground">
                  <span>Border + radius</span><span className="font-medium text-foreground">Shared token</span>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Feedback states</CardTitle>
                  <CardDescription>Muted, accent, and destructive feedback.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">Success / primary message</div>
                  <div className="rounded-md border border-accent/40 bg-accent/20 px-3 py-2 text-sm text-accent-foreground">Accent notice</div>
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">Destructive message</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <div><CardTitle>Chart palette</CardTitle><CardDescription>Chart 1 through Chart 5 stay available for data visualizations.</CardDescription></div>
                <BarChart3 className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="flex h-40 items-end gap-3 rounded-md border bg-muted/20 p-4">
                  {chartBars.map(bar => (
                    <div key={bar.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                      <div className={cn('w-full rounded-sm transition-[height]', bar.className)} style={{ height: bar.height }} />
                      <span className="text-[10px] text-muted-foreground">{bar.label.replace('Chart ', '#')}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-5">
            <div className="overflow-hidden rounded-lg border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm">
              <div className="border-b border-sidebar-border px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">Sidebar preview</p>
                <p className="mt-1 text-lg font-semibold">Workspace</p>
              </div>
              <div className="space-y-1 p-2 text-sm">
                {['Overview', 'Orders', 'Products', 'Customers'].map((label, index) => (
                  <div key={label} className={cn('flex items-center justify-between rounded-md px-3 py-2', index === 0 ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground')}>
                    <span>{label}</span>
                    {index === 0 && <Check className="h-3.5 w-3.5" />}
                  </div>
                ))}
              </div>
              <div className="border-t border-sidebar-border p-3 text-xs opacity-70">Sidebar tokens · border · ring · accent</div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Typography</CardTitle>
                <CardDescription>Preview the selected family, weight, spacing, and rhythm.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tracking-tight">Storefront heading</p>
                <p className="mt-3 text-sm text-muted-foreground">Supporting copy inherits the theme’s base size, line height, and letter spacing.</p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Eyebrow label</p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
