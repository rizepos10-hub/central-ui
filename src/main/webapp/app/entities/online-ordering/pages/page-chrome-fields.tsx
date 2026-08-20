import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { IPageChrome } from 'app/shared/model/ONLINE_ORDERING/online-ordering-page.model';
import { IAttachment } from 'app/shared/model/attachment.model';
import MediaLibrary from 'app/shared/components/media-library/media-library';
import { transformAttachmentStructure } from 'app/shared/util/attachment-utils';
import { ColorInputField } from './color-input-field';
import { PropertyEditorGroup } from './property-editor-group';

type ChromePart = Record<string, unknown>;
type ChromePartKey = 'header' | 'footer';
type ChromeLink = { label: string; url: string };
type ChromeNavigationDefault = { key: string; label: string; defaultUrl: string };

const courtyardNavigationDefaults: ChromeNavigationDefault[] = [
  { key: 'home', label: 'Home', defaultUrl: '/' },
  { key: 'shop', label: 'Shop', defaultUrl: '/{branchId}/shop' },
  { key: 'categories', label: 'Categories', defaultUrl: '#categories' },
  { key: 'products', label: 'Products', defaultUrl: '#featured' },
  { key: 'contact', label: 'Contact', defaultUrl: '#contact' },
];

const atelierNavigationDefaults: ChromeNavigationDefault[] = [
  { key: 'home', label: 'Home', defaultUrl: '/' },
  { key: 'shop', label: 'Shop', defaultUrl: '/{branchId}/shop' },
  { key: 'journal', label: 'Journal', defaultUrl: '#lookbook' },
  { key: 'theme', label: 'Theme', defaultUrl: '#categories' },
];

const chromePart = (source: ChromePart | undefined): ChromePart => source ?? {};
const nested = (source: ChromePart, key: string): ChromePart =>
  source[key] && typeof source[key] === 'object' ? (source[key] as ChromePart) : {};
const stringValue = (source: ChromePart, key: string, fallback = '') =>
  typeof source[key] === 'string' ? String(source[key]) : fallback;
const booleanValue = (source: ChromePart, key: string, fallback = true) =>
  typeof source[key] === 'boolean' ? Boolean(source[key]) : fallback;
const numberValue = (source: ChromePart, key: string, fallback: number) =>
  typeof source[key] === 'number' && Number.isFinite(source[key]) ? Number(source[key]) : fallback;
const colorValue = (source: ChromePart, key: string, fallback: string) => {
  const value = stringValue(source, key, fallback);
  return value.toLowerCase() === 'transparent' || /^#[0-9a-f]{3,8}$/i.test(value) || /^(?:rgb|hsl)a?\(/i.test(value) ? value : fallback;
};

const defaultQuickLinks: ChromeLink[] = [
  { label: 'Privacy Policy', url: '/privacy-policy' },
  { label: 'Return Policy', url: '/return-policy' },
  { label: 'About Us', url: '/about-us' },
];

const quickLinksValue = (footer: ChromePart): ChromeLink[] => {
  if (!Array.isArray(footer.quickLinks)) return defaultQuickLinks;
  return footer.quickLinks
    .filter(link => link && typeof link === 'object')
    .map(link => link as ChromePart)
    .map(link => ({
      label: stringValue(link, 'label'),
      url: stringValue(link, 'url', '#'),
    }));
};

const Toggle = ({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (value: boolean) => void }) => (
  <label htmlFor={id} className="flex cursor-pointer items-center gap-2 rounded-md border bg-background px-2.5 py-2 text-xs">
    <Checkbox id={id} checked={checked} onCheckedChange={value => onChange(value === true)} />
    <span>{label}</span>
  </label>
);

const TextField = ({ id, label, value, placeholder, onChange }: { id: string; label: string; value: string; placeholder?: string; onChange: (value: string) => void }) => (
  <div className="space-y-1">
    <Label htmlFor={id} className="text-xs">{label}</Label>
    <Input id={id} value={value} placeholder={placeholder} onChange={event => onChange(event.target.value)} />
  </div>
);

const TextareaField = ({ id, label, value, placeholder, onChange }: { id: string; label: string; value: string; placeholder?: string; onChange: (value: string) => void }) => (
  <div className="space-y-1">
    <Label htmlFor={id} className="text-xs">{label}</Label>
    <textarea id={id} className="min-h-20 w-full rounded-md border bg-background px-2.5 py-2 text-xs outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" value={value} placeholder={placeholder} onChange={event => onChange(event.target.value)} />
  </div>
);

const LogoField = ({ id, label, image, onChange }: { id: string; label: string; image?: IAttachment; onChange: (image?: IAttachment) => void }) => (
  <div id={id} className="space-y-2 rounded-md border bg-muted/20 p-2.5">
    <Label className="text-xs">{label}</Label>
    {image?.url ? (
      <div className="flex items-center gap-2 rounded-md border bg-muted/20 p-2">
        <img src={image.url} alt={image.name || label} className="h-10 w-16 rounded object-contain" />
        <div className="min-w-0 flex-1"><p className="truncate text-[11px] font-medium">{image.name || 'Selected image'}</p><Button type="button" variant="ghost" className="h-6 px-1 text-[11px]" onClick={() => onChange(undefined)}>Remove</Button></div>
      </div>
    ) : <p className="text-[11px] text-muted-foreground">Uses the business logo until you choose a page-specific image.</p>}
    <MediaLibrary
      layout="compact"
      handleFilesSelectCallback={files => {
        const selected = transformAttachmentStructure(files, 'toIAttachment')[0] as IAttachment | undefined;
        if (selected) onChange(selected);
      }}
    />
  </div>
);

const footerBlockLabel = (type: string) => type.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, character => character.toUpperCase());

export default function PageChromeFields({ chrome, onChange, part, templateKey }: { chrome: IPageChrome; onChange: (value: IPageChrome) => void; part?: ChromePartKey; templateKey?: string }) {
  const header = chromePart(chrome.header);
  const footer = chromePart(chrome.footer);
  const headerAppearance = nested(header, 'appearance');
  const footerAppearance = nested(footer, 'appearance');
  const headerLabels = nested(header, 'labels');
  const footerLabels = nested(footer, 'labels');
  const headerNavigationLinks = nested(header, 'navigationLinks');
  // Resolve legacy chrome markers to the dedicated renderer selected by the
  // page template. This keeps older `classic`/`restaurant` pages compatible.
  const rawHeaderVariant = stringValue(header, 'variant', '').trim().toLowerCase();
  const templateHeaderVariant = templateKey === 'order-first'
    ? 'order-first'
    : templateKey === 'thai-palace'
      ? 'thai-palace'
      : templateKey === 'home-retail'
        ? 'retail'
        : templateKey === 'home-riode'
          ? 'riode'
          : templateKey === 'home-default'
            ? 'minimal'
            : templateKey === 'courtyard-hospitality'
              ? 'courtyard'
              : templateKey === 'ember-basil'
                ? 'ember-basil'
                : templateKey === 'nonna-table'
                  ? 'nonna-table'
                : templateKey === 'olive-hearth'
                    ? 'olive-hearth'
                    : templateKey === 'crimson-stack'
                      ? 'crimson-stack'
                      : templateKey === 'saffron-ember'
                        ? 'saffron-ember'
                        : templateKey === 'lime-char'
                          ? 'lime-char'
                          : templateKey === 'golden-wok'
                            ? 'golden-wok'
                             : templateKey === 'sakura-tide'
                               ? 'sakura-tide'
                               : templateKey === 'atelier-noir'
                                 ? 'atelier-noir'
                     : undefined;
  const headerVariant = templateHeaderVariant ?? (['minimal', 'order-first', 'thai-palace', 'retail', 'riode', 'courtyard', 'ember-basil', 'nonna-table', 'olive-hearth', 'crimson-stack', 'saffron-ember', 'lime-char', 'golden-wok', 'sakura-tide', 'atelier-noir'].includes(rawHeaderVariant)
    ? rawHeaderVariant
    : 'minimal');
  const rawFooterVariant = stringValue(footer, 'variant', '').trim().toLowerCase();
  const footerVariant = templateHeaderVariant ?? (['minimal', 'order-first', 'thai-palace', 'retail', 'riode', 'courtyard', 'ember-basil', 'nonna-table', 'olive-hearth', 'crimson-stack', 'saffron-ember', 'lime-char', 'golden-wok', 'sakura-tide', 'atelier-noir'].includes(rawFooterVariant)
    ? rawFooterVariant
    : 'minimal');
  const headerColorDefaults: Record<string, string> = headerVariant === 'order-first'
    ? { background: '#1a1a2e', foreground: '#fff8f0', accent: '#e94560', buttonBackground: '#e94560', buttonForeground: '#ffffff', borderColor: '#2c3551', announcementBackground: '#16213e', announcementForeground: '#fff8f0' }
    : headerVariant === 'thai-palace'
      ? { background: '#fff8ea', foreground: '#101010', accent: '#b78628', buttonBackground: '#b78628', buttonForeground: '#ffffff', borderColor: '#ead9b8', announcementBackground: '#ffffff', announcementForeground: '#101010' }
      : headerVariant === 'ember-basil'
        ? { background: '#422525', foreground: '#fffaf0', accent: '#febe10', buttonBackground: '#febe10', buttonForeground: '#422525', borderColor: '#8c5a3c', announcementBackground: '#faf5e5', announcementForeground: '#422525' }
        : headerVariant === 'nonna-table'
          ? { background: '#2d7000', foreground: '#ffffff', accent: '#967d47', buttonBackground: '#967d47', buttonForeground: '#ffffff', borderColor: '#5a8c3e', announcementBackground: '#f5fff5', announcementForeground: '#2d7000' }
            : headerVariant === 'olive-hearth'
              ? { background: '#2c3135', foreground: '#fff9f1', accent: '#e3aa6b', buttonBackground: '#e3aa6b', buttonForeground: '#2c3135', borderColor: '#6a5d50', announcementBackground: '#50585f', announcementForeground: '#fff9f1' }
              : headerVariant === 'crimson-stack'
                ? { background: '#000000', foreground: '#ffffff', accent: '#d92b3a', buttonBackground: '#d92b3a', buttonForeground: '#ffffff', borderColor: '#4b1d24', announcementBackground: '#171717', announcementForeground: '#ffffff' }
                : headerVariant === 'saffron-ember'
                  ? { background: '#432f29', foreground: '#ffffff', accent: '#de4917', buttonBackground: '#de4917', buttonForeground: '#ffffff', borderColor: '#6e5145', announcementBackground: '#f5f2eb', announcementForeground: '#432f29' }
                  : headerVariant === 'lime-char'
                    ? { background: '#131c16', foreground: '#edf8d8', accent: '#95d01a', buttonBackground: '#95d01a', buttonForeground: '#131c16', borderColor: '#4c6b0a', announcementBackground: '#242d10', announcementForeground: '#edf8d8' }
                    : headerVariant === 'golden-wok'
                      ? { background: '#000000', foreground: '#f5f5f5', accent: '#e9ac07', buttonBackground: '#e9ac07', buttonForeground: '#000000', borderColor: '#4d3b00', announcementBackground: '#202022', announcementForeground: '#f5f5f5' }
                       : headerVariant === 'sakura-tide'
                         ? { background: '#222426', foreground: '#f8eedb', accent: '#f46a44', buttonBackground: '#f46a44', buttonForeground: '#ffffff', borderColor: '#55565a', announcementBackground: '#2a2e32', announcementForeground: '#f8eedb' }
                         : headerVariant === 'atelier-noir'
                           ? { background: '#ffffff', foreground: '#111111', accent: '#d8b24a', buttonBackground: '#111111', buttonForeground: '#ffffff', borderColor: '#dedbd5', announcementBackground: '#000000', announcementForeground: '#ffffff' }
             : headerVariant === 'courtyard'
        ? { background: 'transparent', foreground: '#ffffff', accent: '#e7d0b0', buttonBackground: '#892e39', buttonForeground: '#ffffff', borderColor: 'transparent', announcementBackground: '#892e39', announcementForeground: '#ffffff' }
        : { background: '#ffffff', foreground: '#111827', accent: '#2563eb', buttonBackground: '#334155', buttonForeground: '#ffffff', borderColor: '#e5e7eb', announcementBackground: '#0f2744', announcementForeground: '#ffffff' };
  const footerColorDefaults: Record<string, string> = footerVariant === 'order-first'
    ? { background: '#101426', foreground: '#fff8f0', titleColor: '#fff8f0', subtitleColor: '#cbd5e1', linkColor: '#ff6b81', borderColor: '#2c3551' }
      : footerVariant === 'thai-palace'
        ? { background: '#062f25', foreground: '#fff8ea', titleColor: '#f2c94c', subtitleColor: '#ead9b8', linkColor: '#f2c94c', borderColor: '#8b6a2b' }
        : footerVariant === 'retail'
          ? { background: '#0c1e35', foreground: '#f8fafc', titleColor: '#ffffff', subtitleColor: '#cbd5e1', linkColor: '#60a5fa', borderColor: '#1e3a5f' }
          : footerVariant === 'riode'
            ? { background: '#f8fafc', foreground: '#1e293b', titleColor: '#1e3a5f', subtitleColor: '#64748b', linkColor: '#05b895', borderColor: '#e2e8f0' }
            : footerVariant === 'ember-basil'
              ? { background: '#422525', foreground: '#fffaf0', titleColor: '#febe10', subtitleColor: '#f6dfbf', linkColor: '#febe10', borderColor: '#8c5a3c' }
              : footerVariant === 'nonna-table'
                ? { background: '#2d7000', foreground: '#ffffff', titleColor: '#e3c98d', subtitleColor: '#f2f8e8', linkColor: '#e3c98d', borderColor: '#5a8c3e' }
                : footerVariant === 'olive-hearth'
                  ? { background: '#2c3135', foreground: '#fff9f1', titleColor: '#e3aa6b', subtitleColor: '#f5dfc9', linkColor: '#e3aa6b', borderColor: '#6a5d50' }
                  : footerVariant === 'crimson-stack'
                    ? { background: '#000000', foreground: '#ffffff', titleColor: '#d92b3a', subtitleColor: '#f2c4c8', linkColor: '#d92b3a', borderColor: '#4b1d24' }
                    : footerVariant === 'saffron-ember'
                      ? { background: '#432f29', foreground: '#ffffff', titleColor: '#de4917', subtitleColor: '#f5f2eb', linkColor: '#de4917', borderColor: '#6e5145' }
                      : footerVariant === 'lime-char'
                        ? { background: '#131c16', foreground: '#edf8d8', titleColor: '#95d01a', subtitleColor: '#cde3aa', linkColor: '#95d01a', borderColor: '#4c6b0a' }
                        : footerVariant === 'golden-wok'
                          ? { background: '#000000', foreground: '#f5f5f5', titleColor: '#e9ac07', subtitleColor: '#cfcfcf', linkColor: '#e9ac07', borderColor: '#4d3b00' }
                           : footerVariant === 'sakura-tide'
                             ? { background: '#222426', foreground: '#f8eedb', titleColor: '#f46a44', subtitleColor: '#bbc3d3', linkColor: '#f46a44', borderColor: '#55565a' }
                             : footerVariant === 'atelier-noir'
                               ? { background: '#000000', foreground: '#ffffff', titleColor: '#d8b24a', subtitleColor: '#c7c7c7', linkColor: '#d8b24a', borderColor: 'rgba(216,178,74,0.35)' }
                   : footerVariant === 'courtyard'
              ? { background: 'rgba(231,208,176,0.3)', foreground: '#171717', titleColor: '#892e39', subtitleColor: '#171717', linkColor: '#171717', borderColor: 'transparent' }
              : { background: '#ffffff', foreground: '#111827', titleColor: '#111827', subtitleColor: '#6b7280', linkColor: '#2563eb', borderColor: '#e5e7eb' };
  const isMinimalHeader = headerVariant === 'minimal';
  const isRestaurantHeader = headerVariant === 'order-first' || headerVariant === 'thai-palace' || headerVariant === 'ember-basil' || headerVariant === 'nonna-table' || headerVariant === 'olive-hearth' || headerVariant === 'crimson-stack' || headerVariant === 'saffron-ember' || headerVariant === 'lime-char' || headerVariant === 'golden-wok' || headerVariant === 'sakura-tide';
  const isAtelierNoirHeader = headerVariant === 'atelier-noir';
  const isRetailHeader = headerVariant === 'retail';
  const isRiodeHeader = headerVariant === 'riode';
  const isCourtyardHeader = headerVariant === 'courtyard';
  const isCourtyardFooter = footerVariant === 'courtyard';
  const supportsRetailHeaderControls = isRetailHeader || isRiodeHeader || isAtelierNoirHeader;
  const supportsRestaurantHeaderControls = isMinimalHeader || isRestaurantHeader || isCourtyardHeader || isAtelierNoirHeader;
  const supportsMainNavigationControls = supportsRetailHeaderControls || isCourtyardHeader;
  const supportsRetailUtilityLabels = supportsRetailHeaderControls || isRestaurantHeader;
  const quickLinks = quickLinksValue(footer);
  const footerColumns = Array.isArray(footer.columns)
    ? footer.columns.map(column => column && typeof column === 'object' ? column as ChromePart : {})
    : [];
  const headerLogo = header.logoImage && typeof header.logoImage === 'object' ? (header.logoImage as IAttachment) : undefined;
  const footerLogo = footer.logoImage && typeof footer.logoImage === 'object' ? (footer.logoImage as IAttachment) : undefined;
  const updatePart = (key: 'header' | 'footer', value: ChromePart) => onChange({ ...chrome, [key]: value });
  const updateFooterColumns = (columns: ChromePart[]) => updatePart('footer', { ...footer, columns });
  const updateFooterColumn = (columnIndex: number, patch: ChromePart) => updateFooterColumns(footerColumns.map((column, index) => index === columnIndex ? { ...column, ...patch } : column));
  const updateFooterBlock = (columnIndex: number, blockIndex: number, patch: ChromePart) => updateFooterColumns(footerColumns.map((column, index) => {
    if (index !== columnIndex) return column;
    const blocks = Array.isArray(column.blocks) ? column.blocks.map(block => block && typeof block === 'object' ? block as ChromePart : {}) : [];
    return { ...column, blocks: blocks.map((block, blockPosition) => blockPosition === blockIndex ? { ...block, ...patch } : block) };
  }));
  const updateAppearance = (key: 'header' | 'footer', field: string, value: string) => {
    const current = key === 'header' ? header : footer;
    updatePart(key, { ...current, appearance: { ...nested(current, 'appearance'), [field]: value } });
  };
  const updateBoolean = (key: 'header' | 'footer', field: string, value: boolean) => {
    const current = key === 'header' ? header : footer;
    updatePart(key, { ...current, [field]: value });
  };
  const updateLabel = (key: 'header' | 'footer', field: string, value: string) => {
    const current = key === 'header' ? header : footer;
    updatePart(key, { ...current, labels: { ...nested(current, 'labels'), [field]: value } });
  };
  const updateLabels = (key: 'header' | 'footer', values: ChromePart) => {
    const current = key === 'header' ? header : footer;
    updatePart(key, { ...current, labels: { ...nested(current, 'labels'), ...values } });
  };
  const updateNavigationLink = (key: string, value: string) => updatePart('header', {
    ...header,
    navigationLinks: { ...headerNavigationLinks, [key]: value },
  });
  const updateFooterLinks = (links: ChromeLink[]) => updatePart('footer', { ...footer, quickLinks: links });

  return (
    <Card className="landing-editor-chrome-fields w-full min-w-0 max-w-none">
      <CardContent className="space-y-2 p-2">
        <div className="landing-editor-chrome-sections grid gap-4">
          {(!part || part === 'header') && (
          <section className="min-w-0 space-y-2 rounded-xl border bg-muted/20 p-2.5 sm:p-3">
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold">Navbar</p>
              </div>
              <span className="rounded-full border px-2 py-1 text-[10px] text-muted-foreground">{headerVariant} layout</span>
            </div>

            <div className="landing-editor-property-groups grid gap-2">
            <PropertyEditorGroup title="Colors" description="Surface, text, buttons, and announcement" defaultOpen>
              <div className="landing-editor-fields-grid grid gap-2">
              <ColorInputField id="header-background" label="Background" value={colorValue(headerAppearance, 'background', headerColorDefaults.background)} onChange={value => updateAppearance('header', 'background', value)} />
              <ColorInputField id="header-foreground" label="Text color" value={colorValue(headerAppearance, 'foreground', headerColorDefaults.foreground)} onChange={value => updateAppearance('header', 'foreground', value)} />
              <ColorInputField id="header-accent" label="Accent color" value={colorValue(headerAppearance, 'accent', headerColorDefaults.accent)} onChange={value => updateAppearance('header', 'accent', value)} />
              <ColorInputField id="header-button-background" label="Account button" value={colorValue(headerAppearance, 'buttonBackground', headerColorDefaults.buttonBackground)} onChange={value => updateAppearance('header', 'buttonBackground', value)} />
              <ColorInputField id="header-button-foreground" label="Account button text" value={colorValue(headerAppearance, 'buttonForeground', headerColorDefaults.buttonForeground)} onChange={value => updateAppearance('header', 'buttonForeground', value)} />
              <ColorInputField id="header-border" label="Border" value={colorValue(headerAppearance, 'borderColor', headerColorDefaults.borderColor)} onChange={value => updateAppearance('header', 'borderColor', value)} />
              <ColorInputField id="header-announcement-background" label="Announcement background" value={colorValue(headerAppearance, 'announcementBackground', headerColorDefaults.announcementBackground)} onChange={value => updateAppearance('header', 'announcementBackground', value)} />
              <ColorInputField id="header-announcement-foreground" label="Announcement text" value={colorValue(headerAppearance, 'announcementForeground', headerColorDefaults.announcementForeground)} onChange={value => updateAppearance('header', 'announcementForeground', value)} />
              </div>
            </PropertyEditorGroup>

            <PropertyEditorGroup title="Announcement & branding" description="Logo, announcement copy, and sizing" defaultOpen>
              <div className="landing-editor-fields-grid grid gap-2">
                <TextField id="header-announcement" label="Announcement" value={stringValue(header, 'announcementText')} placeholder="Free delivery this week" onChange={value => updatePart('header', { ...header, announcementText: value })} />
                <TextField id="header-announcement-link" label="Announcement link" value={stringValue(header, 'announcementHref')} placeholder="/offers" onChange={value => updatePart('header', { ...header, announcementHref: value })} />
                <TextField id="header-logo-width" label="Logo width (px)" value={String(numberValue(header, 'logoWidth', 140))} onChange={value => updatePart('header', { ...header, logoWidth: Number(value) || 140 })} />
                <TextField id="header-logo-height" label="Logo height (px)" value={String(numberValue(header, 'logoHeight', 48))} onChange={value => updatePart('header', { ...header, logoHeight: Number(value) || 48 })} />
                <TextField id="header-logo-alt" label="Logo alt text" value={stringValue(header, 'logoAlt')} placeholder="Business logo" onChange={value => updatePart('header', { ...header, logoAlt: value })} />
              </div>
              {isCourtyardHeader ? <p className="text-[11px] text-muted-foreground">Uses the business logo from Online Ordering settings.</p> : <LogoField id="header-logo-image" label="Header logo image" image={headerLogo} onChange={image => updatePart('header', { ...header, logoImage: image })} />}
            </PropertyEditorGroup>

            <PropertyEditorGroup title="Visible controls" description="Choose which storefront actions appear" defaultOpen={false}>
              <div className="landing-editor-fields-grid grid gap-2">
              <Toggle id="header-show-logo" label="Show logo" checked={booleanValue(header, 'showLogo', true)} onChange={value => updateBoolean('header', 'showLogo', value)} />
              {isCourtyardHeader && <Toggle id="header-show-menu" label="Show menu button" checked={booleanValue(header, 'showMenu', true)} onChange={value => updateBoolean('header', 'showMenu', value)} />}
              <Toggle id="header-show-announcement" label="Show announcement" checked={booleanValue(header, 'showAnnouncement', false)} onChange={value => updateBoolean('header', 'showAnnouncement', value)} />
              {supportsRetailHeaderControls && <Toggle id="header-show-topbar" label="Show top bar" checked={booleanValue(header, 'showTopBar', true)} onChange={value => updateBoolean('header', 'showTopBar', value)} />}
              {supportsRetailHeaderControls && <Toggle id="header-show-search" label="Show search" checked={booleanValue(header, 'showSearch', true)} onChange={value => updateBoolean('header', 'showSearch', value)} />}
              {supportsMainNavigationControls && <Toggle id="header-show-navigation" label="Show navigation links" checked={booleanValue(header, 'showMainNavigation', true)} onChange={value => updateBoolean('header', 'showMainNavigation', value)} />}
              {supportsRestaurantHeaderControls && <Toggle id="header-show-branch" label="Show location/order controls" checked={booleanValue(header, 'showBranchSelector', true)} onChange={value => updateBoolean('header', 'showBranchSelector', value)} />}
              <Toggle id="header-show-language" label="Show language picker" checked={booleanValue(header, 'showLanguagePicker', true)} onChange={value => updateBoolean('header', 'showLanguagePicker', value)} />
              {supportsRestaurantHeaderControls && <Toggle id="header-show-theme" label="Show theme toggle" checked={booleanValue(header, 'showThemeToggle', true)} onChange={value => updateBoolean('header', 'showThemeToggle', value)} />}
              {supportsRestaurantHeaderControls && <Toggle id="header-show-currency" label="Show currency picker" checked={booleanValue(header, 'showCurrencyPicker', true)} onChange={value => updateBoolean('header', 'showCurrencyPicker', value)} />}
              <Toggle id="header-show-cart" label="Show cart" checked={booleanValue(header, 'showCart', true)} onChange={value => updateBoolean('header', 'showCart', value)} />
              <Toggle id="header-show-phone" label="Show phone" checked={booleanValue(header, 'showPhone', isRestaurantHeader || supportsRetailHeaderControls)} onChange={value => updateBoolean('header', 'showPhone', value)} />
              {supportsRetailHeaderControls && !isAtelierNoirHeader && <Toggle id="header-show-wishlist" label="Show wishlist" checked={booleanValue(header, 'showWishlist', true)} onChange={value => updateBoolean('header', 'showWishlist', value)} />}
              {isRiodeHeader && <Toggle id="header-show-categories" label="Show category menu" checked={booleanValue(header, 'showCategoriesMenu', true)} onChange={value => updateBoolean('header', 'showCategoriesMenu', value)} />}
              </div>
            </PropertyEditorGroup>

            <PropertyEditorGroup title="Account actions" description="Control each authentication and guest-order action independently" defaultOpen>
              <div className="landing-editor-fields-grid grid gap-2">
                <Toggle id="header-show-auth" label="Show account actions" checked={booleanValue(header, 'showAuth', true)} onChange={value => updateBoolean('header', 'showAuth', value)} />
                <Toggle id="header-show-login" label="Show login button" checked={booleanValue(header, 'showLogin', true)} onChange={value => updateBoolean('header', 'showLogin', value)} />
                <Toggle id="header-show-register" label="Show register button" checked={booleanValue(header, 'showRegister', true)} onChange={value => updateBoolean('header', 'showRegister', value)} />
                <Toggle id="header-show-account" label="Show signed-in account" checked={booleanValue(header, 'showAccount', true)} onChange={value => updateBoolean('header', 'showAccount', value)} />
                {supportsRestaurantHeaderControls && <Toggle id="header-show-guest-order" label="Show guest orders" checked={booleanValue(header, 'showGuestOrder', true)} onChange={value => updateBoolean('header', 'showGuestOrder', value)} />}
              </div>
            </PropertyEditorGroup>

            <PropertyEditorGroup title="Navigation labels" description="Localized text shown in the navbar" defaultOpen={false}>
              <div className="landing-editor-fields-grid grid gap-2">
              <TextField id="header-label-home" label="Home label" value={stringValue(headerLabels, 'home')} onChange={value => updateLabel('header', 'home', value)} />
              {(supportsRetailHeaderControls || isCourtyardHeader) && <TextField id="header-label-shop" label="Shop label" value={stringValue(headerLabels, 'shop')} onChange={value => updateLabel('header', 'shop', value)} />}
              {supportsMainNavigationControls && !isAtelierNoirHeader && <TextField id="header-label-categories" label="Categories label" value={stringValue(headerLabels, 'categories')} onChange={value => updateLabel('header', 'categories', value)} />}
              {supportsMainNavigationControls && !isAtelierNoirHeader && <TextField id="header-label-products" label="Products/deals label" value={stringValue(headerLabels, 'products', stringValue(headerLabels, 'deals'))} onChange={value => updateLabels('header', { products: value, deals: value })} />}
               {supportsMainNavigationControls && !isAtelierNoirHeader && <TextField id="header-label-contact" label="Contact label" value={stringValue(headerLabels, 'contact')} onChange={value => updateLabel('header', 'contact', value)} />}
               {supportsRetailHeaderControls && !isAtelierNoirHeader && <TextField id="header-label-buy" label="Buy now label" value={stringValue(headerLabels, 'buyNow')} onChange={value => updateLabel('header', 'buyNow', value)} />}
               {isAtelierNoirHeader && <TextField id="header-label-journal" label="Journal label" value={stringValue(headerLabels, 'journal')} onChange={value => updateLabel('header', 'journal', value)} />}
               {isAtelierNoirHeader && <TextField id="header-label-theme" label="Theme label" value={stringValue(headerLabels, 'theme')} onChange={value => updateLabel('header', 'theme', value)} />}
               </div>
             </PropertyEditorGroup>

             {(isCourtyardHeader || isAtelierNoirHeader) && <PropertyEditorGroup title="Navigation links" description="Destinations used by this template. Leave the default to keep the system route; {branchId} is replaced automatically." defaultOpen={false}>
               <div className="space-y-2">
                 {(isAtelierNoirHeader ? atelierNavigationDefaults : courtyardNavigationDefaults).map(link => (
                  <div className="grid gap-2 rounded-md border bg-background p-2 sm:grid-cols-2" key={link.key}>
                    <p className="self-end pb-1 text-xs font-medium">{stringValue(headerLabels, link.key, link.label)}</p>
                    <TextField id={`header-link-${link.key}`} label="URL" value={stringValue(headerNavigationLinks, link.key, link.defaultUrl)} placeholder={link.defaultUrl} onChange={value => updateNavigationLink(link.key, value)} />
                  </div>
                ))}
              </div>
            </PropertyEditorGroup>}

            <PropertyEditorGroup title="Action & utility labels" description="Login, search, cart, phone, and retail utility copy" defaultOpen={false}>
              <div className="landing-editor-fields-grid grid gap-2">
                <TextField id="header-label-login" label="Login label" value={stringValue(headerLabels, 'login')} onChange={value => updateLabel('header', 'login', value)} />
                <TextField id="header-label-register" label="Register label" value={stringValue(headerLabels, 'register')} onChange={value => updateLabel('header', 'register', value)} />
                {supportsRetailHeaderControls && <TextField id="header-label-search" label="Search placeholder" value={stringValue(headerLabels, 'search')} onChange={value => updateLabel('header', 'search', value)} />}
                {supportsRetailHeaderControls && !isAtelierNoirHeader && <TextField id="header-label-wishlist" label="Wishlist label" value={stringValue(headerLabels, 'wishlist')} onChange={value => updateLabel('header', 'wishlist', value)} />}
                {isRiodeHeader && <TextField id="header-label-shopping-cart" label="Shopping cart label" value={stringValue(headerLabels, 'shoppingCart')} onChange={value => updateLabel('header', 'shoppingCart', value)} />}
                {supportsRetailUtilityLabels && <TextField id="header-label-call-us" label="Call us label" value={stringValue(headerLabels, 'callUs')} onChange={value => updateLabel('header', 'callUs', value)} />}
                {isRetailHeader && <TextField id="header-label-special-offers" label="Special offers label" value={stringValue(headerLabels, 'specialOffers')} onChange={value => updateLabel('header', 'specialOffers', value)} />}
                {isRetailHeader && <TextField id="header-label-new-arrivals" label="New arrivals label" value={stringValue(headerLabels, 'newArrivals')} onChange={value => updateLabel('header', 'newArrivals', value)} />}
                {isRetailHeader && <TextField id="header-label-support" label="Support label" value={stringValue(headerLabels, 'support')} onChange={value => updateLabel('header', 'support', value)} />}
                {isRiodeHeader && <TextField id="header-label-welcome" label="Welcome label" value={stringValue(headerLabels, 'welcome')} onChange={value => updateLabel('header', 'welcome', value)} />}
              </div>
            </PropertyEditorGroup>
            </div>
          </section>
          )}

          {(!part || part === 'footer') && (
          <section className="min-w-0 space-y-2 rounded-xl border bg-muted/20 p-2.5 sm:p-3">
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold">Footer</p>
              </div>
              <span className="rounded-full border px-2 py-1 text-[10px] text-muted-foreground">{footerVariant} layout</span>
            </div>

            <div className="landing-editor-property-groups grid gap-2">
            <PropertyEditorGroup title="Colors" description="Surface, typography, links, and border" defaultOpen>
              <div className="landing-editor-fields-grid grid gap-2">
              <ColorInputField id="footer-background" label="Background" value={colorValue(footerAppearance, 'background', footerColorDefaults.background)} onChange={value => updateAppearance('footer', 'background', value)} />
              <ColorInputField id="footer-foreground" label="Text color" value={colorValue(footerAppearance, 'foreground', footerColorDefaults.foreground)} onChange={value => updateAppearance('footer', 'foreground', value)} />
              <ColorInputField id="footer-title" label="Heading color" value={colorValue(footerAppearance, 'titleColor', footerColorDefaults.titleColor)} onChange={value => updateAppearance('footer', 'titleColor', value)} />
              <ColorInputField id="footer-muted" label="Secondary text" value={colorValue(footerAppearance, 'subtitleColor', footerColorDefaults.subtitleColor)} onChange={value => updateAppearance('footer', 'subtitleColor', value)} />
              <ColorInputField id="footer-link" label="Link color" value={colorValue(footerAppearance, 'linkColor', footerColorDefaults.linkColor)} onChange={value => updateAppearance('footer', 'linkColor', value)} />
              <ColorInputField id="footer-border" label="Border" value={colorValue(footerAppearance, 'borderColor', footerColorDefaults.borderColor)} onChange={value => updateAppearance('footer', 'borderColor', value)} />
              </div>
            </PropertyEditorGroup>

            <PropertyEditorGroup title="Branding & content" description="Brand line, copy, and footer logo" defaultOpen>
              <div className="landing-editor-fields-grid grid gap-2">
                <TextField id="footer-brand" label="Brand line" value={stringValue(footer, 'brandText')} placeholder="Your business name" onChange={value => updatePart('footer', { ...footer, brandText: value })} />
                <TextField id="footer-tagline" label="Tagline" value={stringValue(footer, 'tagline')} placeholder="A short sentence about your business" onChange={value => updatePart('footer', { ...footer, tagline: value })} />
                <TextField id="footer-copyright" label="Copyright text" value={stringValue(footer, 'copyrightText')} placeholder="All rights reserved" onChange={value => updatePart('footer', { ...footer, copyrightText: value })} />
                <TextField id="footer-logo-width" label="Logo width (px)" value={String(numberValue(footer, 'logoWidth', 80))} onChange={value => updatePart('footer', { ...footer, logoWidth: Number(value) || 80 })} />
                <TextField id="footer-logo-height" label="Logo height (px)" value={String(numberValue(footer, 'logoHeight', 80))} onChange={value => updatePart('footer', { ...footer, logoHeight: Number(value) || 80 })} />
                <TextField id="footer-logo-alt" label="Logo alt text" value={stringValue(footer, 'logoAlt')} placeholder="Business logo" onChange={value => updatePart('footer', { ...footer, logoAlt: value })} />
              </div>
              {isCourtyardFooter ? <p className="text-[11px] text-muted-foreground">Uses the business logo from Online Ordering settings.</p> : <LogoField id="footer-logo-image" label="Footer logo image" image={footerLogo} onChange={image => updatePart('footer', { ...footer, logoImage: image })} />}
            </PropertyEditorGroup>

            <PropertyEditorGroup title="Visible content" description="Choose which footer blocks appear" defaultOpen={false}>
              <div className="landing-editor-fields-grid grid gap-2">
              <Toggle id="footer-show-logo" label="Show logo" checked={booleanValue(footer, 'showLogo', true)} onChange={value => updateBoolean('footer', 'showLogo', value)} />
              <Toggle id="footer-show-contact" label="Show contact" checked={booleanValue(footer, 'showContact', true)} onChange={value => updateBoolean('footer', 'showContact', value)} />
              <Toggle id="footer-show-hours" label="Show working hours" checked={booleanValue(footer, 'showHours', true)} onChange={value => updateBoolean('footer', 'showHours', value)} />
              <Toggle id="footer-show-social" label="Show social links" checked={booleanValue(footer, 'showSocial', true)} onChange={value => updateBoolean('footer', 'showSocial', value)} />
              <Toggle id="footer-show-links" label="Show quick links" checked={booleanValue(footer, 'showQuickLinks', true)} onChange={value => updateBoolean('footer', 'showQuickLinks', value)} />
              <Toggle id="footer-show-copyright" label="Show copyright" checked={booleanValue(footer, 'showCopyright', true)} onChange={value => updateBoolean('footer', 'showCopyright', value)} />
              </div>
            </PropertyEditorGroup>

            <PropertyEditorGroup title="Footer headings" description="Labels for contact, hours, social, and links" defaultOpen={false}>
              <div className="landing-editor-fields-grid grid gap-2">
              <TextField id="footer-label-contact" label="Contact heading" value={stringValue(footerLabels, 'contact')} onChange={value => updatePart('footer', { ...footer, labels: { ...nested(footer, 'labels'), contact: value } })} />
              <TextField id="footer-label-hours" label="Hours heading" value={stringValue(footerLabels, 'hours')} onChange={value => updatePart('footer', { ...footer, labels: { ...nested(footer, 'labels'), hours: value } })} />
              <TextField id="footer-label-social" label="Social heading" value={stringValue(footerLabels, 'social')} onChange={value => updatePart('footer', { ...footer, labels: { ...nested(footer, 'labels'), social: value } })} />
              <TextField id="footer-label-links" label="Links heading" value={stringValue(footerLabels, 'quickLinks')} onChange={value => updatePart('footer', { ...footer, labels: { ...nested(footer, 'labels'), quickLinks: value } })} />
              </div>
            </PropertyEditorGroup>

            <PropertyEditorGroup title="Quick links" description="Storefront-safe paths such as /about-us" badge={`${quickLinks.length}`} defaultOpen={false} className="landing-editor-wide-field">
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold">Links</p>
                  <p className="text-[11px] text-muted-foreground">Add links that are safe to expose on the storefront.</p>
                </div>
                <Button type="button" variant="outline" className="h-7 px-2 text-xs" onClick={() => updateFooterLinks([...quickLinks, { label: '', url: '/' }])}>
                  <Plus className="mr-1 h-3 w-3" /> Add link
                </Button>
              </div>
              {quickLinks.map((link, index) => (
                <div className="landing-editor-quick-link grid gap-2" key={`quick-link-${index}`}>
                  <Input aria-label={`Quick link ${index + 1} label`} value={link.label} placeholder="Label" onChange={event => updateFooterLinks(quickLinks.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item))} />
                  <Input aria-label={`Quick link ${index + 1} URL`} value={link.url} placeholder="/path" onChange={event => updateFooterLinks(quickLinks.map((item, itemIndex) => itemIndex === index ? { ...item, url: event.target.value } : item))} />
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9" aria-label={`Remove quick link ${index + 1}`} onClick={() => updateFooterLinks(quickLinks.filter((_, itemIndex) => itemIndex !== index))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </PropertyEditorGroup>

            {footerColumns.length > 0 && (
              <PropertyEditorGroup title="Template footer blocks" description="Edit content already defined by this template" badge={`${footerColumns.length}`} defaultOpen={false} className="landing-editor-wide-field">
                <div className="space-y-2">
                  {footerColumns.map((column, columnIndex) => {
                    const blocks = Array.isArray(column.blocks)
                      ? column.blocks.map(block => block && typeof block === 'object' ? block as ChromePart : {})
                      : [];
                    return (
                      <PropertyEditorGroup key={`footer-column-${columnIndex}`} title={`Footer column ${columnIndex + 1}`} description="Column heading and existing blocks" badge={`${blocks.length}`} defaultOpen={false}>
                        <div className="space-y-2">
                          <TextField id={`footer-column-${columnIndex}-title`} label="Column title" value={stringValue(column, 'title')} onChange={value => updateFooterColumn(columnIndex, { title: value })} />
                          {blocks.map((block, blockIndex) => {
                            const blockType = stringValue(block, 'type', 'FREE_TEXT');
                            const blockLinks = Array.isArray(block.links)
                              ? block.links.map(link => link && typeof link === 'object' ? link as ChromePart : {})
                              : [];
                            const blockImage = block.logoImage && typeof block.logoImage === 'object' ? block.logoImage as IAttachment : undefined;
                            return (
                              <PropertyEditorGroup key={`footer-block-${columnIndex}-${blockIndex}`} title={`${footerBlockLabel(blockType)} ${blockIndex + 1}`} description="Only existing block fields are shown" defaultOpen={false}>
                                <div className="landing-editor-fields-grid grid gap-2">
                                  <TextField id={`footer-block-${columnIndex}-${blockIndex}-title`} label="Block heading" value={stringValue(block, 'title')} onChange={value => updateFooterBlock(columnIndex, blockIndex, { title: value })} />
                                  {blockType === 'LOGO' && (
                                    <>
                                      <TextField id={`footer-block-${columnIndex}-${blockIndex}-brand`} label="Brand text" value={stringValue(block, 'brandText')} onChange={value => updateFooterBlock(columnIndex, blockIndex, { brandText: value })} />
                                      <TextField id={`footer-block-${columnIndex}-${blockIndex}-tagline`} label="Tagline" value={stringValue(block, 'tagline')} onChange={value => updateFooterBlock(columnIndex, blockIndex, { tagline: value })} />
                                      <TextField id={`footer-block-${columnIndex}-${blockIndex}-logo-width`} label="Logo width (px)" value={String(numberValue(block, 'logoWidth', 80))} onChange={value => updateFooterBlock(columnIndex, blockIndex, { logoWidth: Number(value) || 80 })} />
                                      <TextField id={`footer-block-${columnIndex}-${blockIndex}-logo-height`} label="Logo height (px)" value={String(numberValue(block, 'logoHeight', 80))} onChange={value => updateFooterBlock(columnIndex, blockIndex, { logoHeight: Number(value) || 80 })} />
                                      <TextField id={`footer-block-${columnIndex}-${blockIndex}-logo-alt`} label="Logo alt text" value={stringValue(block, 'logoAlt')} placeholder="Business logo" onChange={value => updateFooterBlock(columnIndex, blockIndex, { logoAlt: value })} />
                                      <Toggle id={`footer-block-${columnIndex}-${blockIndex}-contact-under-logo`} label="Show contact under logo" checked={booleanValue(block, 'showContactUnderLogo', false)} onChange={value => updateFooterBlock(columnIndex, blockIndex, { showContactUnderLogo: value })} />
                                      <div className="landing-editor-wide-field">
                                        <LogoField id={`footer-block-${columnIndex}-${blockIndex}-logo-image`} label="Block logo image" image={blockImage} onChange={image => updateFooterBlock(columnIndex, blockIndex, { logoImage: image })} />
                                      </div>
                                    </>
                                  )}
                                  {blockType === 'FREE_TEXT' && <div className="landing-editor-wide-field"><TextareaField id={`footer-block-${columnIndex}-${blockIndex}-body`} label="Body" value={stringValue(block, 'body')} placeholder="Footer text" onChange={value => updateFooterBlock(columnIndex, blockIndex, { body: value })} /></div>}
                                  {blockType === 'CONTACT' && (
                                    <p className="landing-editor-wide-field text-[11px] text-muted-foreground">Address, phone, and email are read from Online Ordering settings.</p>
                                  )}
                                  {blockType === 'WORKING_HOURS' && <p className="landing-editor-wide-field text-[11px] text-muted-foreground">Working hours are read from Online Ordering settings.</p>}
                                  {blockType === 'QUICK_LINKS' && (Array.isArray(footer.quickLinks) ? <p className="landing-editor-wide-field text-[11px] text-muted-foreground">Quick links are managed by the page-level Quick links group above.</p> : blockLinks.map((link, linkIndex) => (
                                    <div className="landing-editor-wide-field grid gap-2 sm:grid-cols-2" key={`footer-block-link-${columnIndex}-${blockIndex}-${linkIndex}`}>
                                      <TextField id={`footer-block-${columnIndex}-${blockIndex}-link-${linkIndex}-label`} label={`Link ${linkIndex + 1} label`} value={stringValue(link, 'label')} onChange={value => updateFooterBlock(columnIndex, blockIndex, { links: blockLinks.map((item, itemIndex) => itemIndex === linkIndex ? { ...item, label: value } : item) })} />
                                      <TextField id={`footer-block-${columnIndex}-${blockIndex}-link-${linkIndex}-url`} label={`Link ${linkIndex + 1} URL`} value={stringValue(link, 'url', '#')} onChange={value => updateFooterBlock(columnIndex, blockIndex, { links: blockLinks.map((item, itemIndex) => itemIndex === linkIndex ? { ...item, url: value } : item) })} />
                                    </div>
                                  )))}
                                </div>
                              </PropertyEditorGroup>
                            );
                          })}
                        </div>
                      </PropertyEditorGroup>
                    );
                  })}
                </div>
              </PropertyEditorGroup>
            )}
            </div>
          </section>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
