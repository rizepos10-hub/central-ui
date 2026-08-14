import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { IPageChrome } from 'app/shared/model/ONLINE_ORDERING/online-ordering-page.model';

type ChromePart = Record<string, unknown>;
type ChromeLink = { label: string; url: string };

const part = (source: ChromePart | undefined): ChromePart => source ?? {};
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
  return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
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

const ColorField = ({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) => (
  <div className="space-y-1">
    <Label htmlFor={id} className="text-xs">{label}</Label>
    <Input id={id} type="color" className="h-9 p-1" value={value} onChange={event => onChange(event.target.value)} />
  </div>
);

const TextField = ({ id, label, value, placeholder, onChange }: { id: string; label: string; value: string; placeholder?: string; onChange: (value: string) => void }) => (
  <div className="space-y-1">
    <Label htmlFor={id} className="text-xs">{label}</Label>
    <Input id={id} value={value} placeholder={placeholder} onChange={event => onChange(event.target.value)} />
  </div>
);

export default function PageChromeFields({ chrome, onChange }: { chrome: IPageChrome; onChange: (value: IPageChrome) => void }) {
  const header = part(chrome.header);
  const footer = part(chrome.footer);
  const headerAppearance = nested(header, 'appearance');
  const footerAppearance = nested(footer, 'appearance');
  const headerLabels = nested(header, 'labels');
  const footerLabels = nested(footer, 'labels');
  const quickLinks = quickLinksValue(footer);

  const updatePart = (key: 'header' | 'footer', value: ChromePart) => onChange({ ...chrome, [key]: value });
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
  const updateFooterLinks = (links: ChromeLink[]) => updatePart('footer', { ...footer, quickLinks: links });

  return (
    <Card>
      <CardHeader className="p-3">
        <CardTitle className="text-sm">Storefront navbar &amp; footer</CardTitle>
        <p className="text-xs text-muted-foreground">
          Customize the presentation of this landing page across the complete Online Ordering experience. Cart, checkout, account, branch, language, and runtime business data remain connected to the existing storefront services.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 p-3">
        <div className="grid gap-4 xl:grid-cols-2">
          <section className="space-y-4 rounded-xl border bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">Navbar appearance</p>
                <p className="text-[11px] text-muted-foreground">The template layout stays fixed; styling and presentation can change.</p>
              </div>
              <span className="rounded-full border px-2 py-1 text-[10px] text-muted-foreground">{String(header.variant ?? 'classic')} layout</span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <ColorField id="header-background" label="Background" value={colorValue(headerAppearance, 'background', '#ffffff')} onChange={value => updateAppearance('header', 'background', value)} />
              <ColorField id="header-foreground" label="Text color" value={colorValue(headerAppearance, 'foreground', '#111827')} onChange={value => updateAppearance('header', 'foreground', value)} />
              <ColorField id="header-accent" label="Accent color" value={colorValue(headerAppearance, 'accent', '#2563eb')} onChange={value => updateAppearance('header', 'accent', value)} />
              <ColorField id="header-button-background" label="Account button" value={colorValue(headerAppearance, 'buttonBackground', '#334155')} onChange={value => updateAppearance('header', 'buttonBackground', value)} />
              <ColorField id="header-button-foreground" label="Account button text" value={colorValue(headerAppearance, 'buttonForeground', '#ffffff')} onChange={value => updateAppearance('header', 'buttonForeground', value)} />
              <ColorField id="header-border" label="Border" value={colorValue(headerAppearance, 'borderColor', '#e5e7eb')} onChange={value => updateAppearance('header', 'borderColor', value)} />
              <ColorField id="header-announcement-background" label="Announcement background" value={colorValue(headerAppearance, 'announcementBackground', '#0f2744')} onChange={value => updateAppearance('header', 'announcementBackground', value)} />
              <ColorField id="header-announcement-foreground" label="Announcement text" value={colorValue(headerAppearance, 'announcementForeground', '#ffffff')} onChange={value => updateAppearance('header', 'announcementForeground', value)} />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <TextField id="header-announcement" label="Announcement" value={stringValue(header, 'announcementText')} placeholder="Free delivery this week" onChange={value => updatePart('header', { ...header, announcementText: value })} />
              <TextField id="header-announcement-link" label="Announcement link" value={stringValue(header, 'announcementHref')} placeholder="/offers" onChange={value => updatePart('header', { ...header, announcementHref: value })} />
              <TextField id="header-logo-width" label="Logo width (px)" value={String(numberValue(header, 'logoWidth', 140))} onChange={value => updatePart('header', { ...header, logoWidth: Number(value) || 140 })} />
              <TextField id="header-logo-height" label="Logo height (px)" value={String(numberValue(header, 'logoHeight', 48))} onChange={value => updatePart('header', { ...header, logoHeight: Number(value) || 48 })} />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Toggle id="header-show-announcement" label="Show announcement" checked={booleanValue(header, 'showAnnouncement', false)} onChange={value => updateBoolean('header', 'showAnnouncement', value)} />
              <Toggle id="header-show-topbar" label="Show top bar" checked={booleanValue(header, 'showTopBar', true)} onChange={value => updateBoolean('header', 'showTopBar', value)} />
              <Toggle id="header-show-search" label="Show search" checked={booleanValue(header, 'showSearch', true)} onChange={value => updateBoolean('header', 'showSearch', value)} />
              <Toggle id="header-show-navigation" label="Show navigation links" checked={booleanValue(header, 'showMainNavigation', true)} onChange={value => updateBoolean('header', 'showMainNavigation', value)} />
              <Toggle id="header-show-branch" label="Show location/order controls" checked={booleanValue(header, 'showBranchSelector', true)} onChange={value => updateBoolean('header', 'showBranchSelector', value)} />
              <Toggle id="header-show-language" label="Show language picker" checked={booleanValue(header, 'showLanguagePicker', true)} onChange={value => updateBoolean('header', 'showLanguagePicker', value)} />
              <Toggle id="header-show-theme" label="Show theme toggle" checked={booleanValue(header, 'showThemeToggle', true)} onChange={value => updateBoolean('header', 'showThemeToggle', value)} />
              <Toggle id="header-show-currency" label="Show currency picker" checked={booleanValue(header, 'showCurrencyPicker', true)} onChange={value => updateBoolean('header', 'showCurrencyPicker', value)} />
              <Toggle id="header-show-cart" label="Show cart" checked={booleanValue(header, 'showCart', true)} onChange={value => updateBoolean('header', 'showCart', value)} />
              <Toggle id="header-show-auth" label="Show account actions" checked={booleanValue(header, 'showAuth', true)} onChange={value => updateBoolean('header', 'showAuth', value)} />
              <Toggle id="header-show-account" label="Show signed-in account" checked={booleanValue(header, 'showAccount', true)} onChange={value => updateBoolean('header', 'showAccount', value)} />
              <Toggle id="header-show-phone" label="Show phone" checked={booleanValue(header, 'showPhone', false)} onChange={value => updateBoolean('header', 'showPhone', value)} />
              <Toggle id="header-show-wishlist" label="Show wishlist" checked={booleanValue(header, 'showWishlist', true)} onChange={value => updateBoolean('header', 'showWishlist', value)} />
              <Toggle id="header-show-categories" label="Show category menu" checked={booleanValue(header, 'showCategoriesMenu', true)} onChange={value => updateBoolean('header', 'showCategoriesMenu', value)} />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <TextField id="header-label-home" label="Home label" value={stringValue(headerLabels, 'home')} onChange={value => updateLabel('header', 'home', value)} />
              <TextField id="header-label-shop" label="Shop label" value={stringValue(headerLabels, 'shop')} onChange={value => updateLabel('header', 'shop', value)} />
              <TextField id="header-label-categories" label="Categories label" value={stringValue(headerLabels, 'categories')} onChange={value => updateLabel('header', 'categories', value)} />
              <TextField id="header-label-products" label="Products/deals label" value={stringValue(headerLabels, 'products', stringValue(headerLabels, 'deals'))} onChange={value => updateLabels('header', { products: value, deals: value })} />
              <TextField id="header-label-contact" label="Contact label" value={stringValue(headerLabels, 'contact')} onChange={value => updateLabel('header', 'contact', value)} />
              <TextField id="header-label-buy" label="Buy now label" value={stringValue(headerLabels, 'buyNow')} onChange={value => updateLabel('header', 'buyNow', value)} />
              <TextField id="header-label-login" label="Login label" value={stringValue(headerLabels, 'login')} onChange={value => updateLabel('header', 'login', value)} />
              <TextField id="header-label-register" label="Register label" value={stringValue(headerLabels, 'register')} onChange={value => updateLabel('header', 'register', value)} />
              <TextField id="header-label-search" label="Search placeholder" value={stringValue(headerLabels, 'search')} onChange={value => updateLabel('header', 'search', value)} />
              <TextField id="header-label-cart" label="Cart label" value={stringValue(headerLabels, 'cart')} onChange={value => updateLabel('header', 'cart', value)} />
            </div>
          </section>

          <section className="space-y-4 rounded-xl border bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">Footer appearance &amp; content</p>
                <p className="text-[11px] text-muted-foreground">Keep business data live while controlling the footer’s emphasis, links, and copy.</p>
              </div>
              <span className="rounded-full border px-2 py-1 text-[10px] text-muted-foreground">{String(footer.variant ?? 'classic')} layout</span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <ColorField id="footer-background" label="Background" value={colorValue(footerAppearance, 'background', '#ffffff')} onChange={value => updateAppearance('footer', 'background', value)} />
              <ColorField id="footer-foreground" label="Text color" value={colorValue(footerAppearance, 'foreground', '#111827')} onChange={value => updateAppearance('footer', 'foreground', value)} />
              <ColorField id="footer-title" label="Heading color" value={colorValue(footerAppearance, 'titleColor', '#111827')} onChange={value => updateAppearance('footer', 'titleColor', value)} />
              <ColorField id="footer-muted" label="Secondary text" value={colorValue(footerAppearance, 'subtitleColor', '#6b7280')} onChange={value => updateAppearance('footer', 'subtitleColor', value)} />
              <ColorField id="footer-link" label="Link color" value={colorValue(footerAppearance, 'linkColor', '#2563eb')} onChange={value => updateAppearance('footer', 'linkColor', value)} />
              <ColorField id="footer-border" label="Border" value={colorValue(footerAppearance, 'borderColor', '#e5e7eb')} onChange={value => updateAppearance('footer', 'borderColor', value)} />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <TextField id="footer-brand" label="Brand line" value={stringValue(footer, 'brandText')} placeholder="Your business name" onChange={value => updatePart('footer', { ...footer, brandText: value })} />
              <TextField id="footer-tagline" label="Tagline" value={stringValue(footer, 'tagline')} placeholder="A short sentence about your business" onChange={value => updatePart('footer', { ...footer, tagline: value })} />
              <TextField id="footer-copyright" label="Copyright text" value={stringValue(footer, 'copyrightText')} placeholder="All rights reserved" onChange={value => updatePart('footer', { ...footer, copyrightText: value })} />
              <TextField id="footer-logo-width" label="Logo width (px)" value={String(numberValue(footer, 'logoWidth', 80))} onChange={value => updatePart('footer', { ...footer, logoWidth: Number(value) || 80 })} />
              <TextField id="footer-logo-height" label="Logo height (px)" value={String(numberValue(footer, 'logoHeight', 80))} onChange={value => updatePart('footer', { ...footer, logoHeight: Number(value) || 80 })} />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Toggle id="footer-show-logo" label="Show logo" checked={booleanValue(footer, 'showLogo', true)} onChange={value => updateBoolean('footer', 'showLogo', value)} />
              <Toggle id="footer-show-contact" label="Show contact" checked={booleanValue(footer, 'showContact', true)} onChange={value => updateBoolean('footer', 'showContact', value)} />
              <Toggle id="footer-show-hours" label="Show working hours" checked={booleanValue(footer, 'showHours', true)} onChange={value => updateBoolean('footer', 'showHours', value)} />
              <Toggle id="footer-show-social" label="Show social links" checked={booleanValue(footer, 'showSocial', true)} onChange={value => updateBoolean('footer', 'showSocial', value)} />
              <Toggle id="footer-show-links" label="Show quick links" checked={booleanValue(footer, 'showQuickLinks', true)} onChange={value => updateBoolean('footer', 'showQuickLinks', value)} />
              <Toggle id="footer-show-copyright" label="Show copyright" checked={booleanValue(footer, 'showCopyright', true)} onChange={value => updateBoolean('footer', 'showCopyright', value)} />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <TextField id="footer-label-contact" label="Contact heading" value={stringValue(footerLabels, 'contact')} onChange={value => updatePart('footer', { ...footer, labels: { ...nested(footer, 'labels'), contact: value } })} />
              <TextField id="footer-label-hours" label="Hours heading" value={stringValue(footerLabels, 'hours')} onChange={value => updatePart('footer', { ...footer, labels: { ...nested(footer, 'labels'), hours: value } })} />
              <TextField id="footer-label-social" label="Social heading" value={stringValue(footerLabels, 'social')} onChange={value => updatePart('footer', { ...footer, labels: { ...nested(footer, 'labels'), social: value } })} />
              <TextField id="footer-label-links" label="Links heading" value={stringValue(footerLabels, 'quickLinks')} onChange={value => updatePart('footer', { ...footer, labels: { ...nested(footer, 'labels'), quickLinks: value } })} />
            </div>

            <div className="space-y-2 rounded-lg border bg-background p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold">Quick links</p>
                  <p className="text-[11px] text-muted-foreground">Use storefront-safe paths such as /privacy-policy or /about-us.</p>
                </div>
                <Button type="button" variant="outline" className="h-7 px-2 text-xs" onClick={() => updateFooterLinks([...quickLinks, { label: '', url: '/' }])}>
                  <Plus className="mr-1 h-3 w-3" /> Add link
                </Button>
              </div>
              {quickLinks.map((link, index) => (
                <div className="grid grid-cols-[1fr_1fr_auto] gap-2" key={`quick-link-${index}`}>
                  <Input aria-label={`Quick link ${index + 1} label`} value={link.label} placeholder="Label" onChange={event => updateFooterLinks(quickLinks.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item))} />
                  <Input aria-label={`Quick link ${index + 1} URL`} value={link.url} placeholder="/path" onChange={event => updateFooterLinks(quickLinks.map((item, itemIndex) => itemIndex === index ? { ...item, url: event.target.value } : item))} />
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9" aria-label={`Remove quick link ${index + 1}`} onClick={() => updateFooterLinks(quickLinks.filter((_, itemIndex) => itemIndex !== index))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </CardContent>
    </Card>
  );
}
