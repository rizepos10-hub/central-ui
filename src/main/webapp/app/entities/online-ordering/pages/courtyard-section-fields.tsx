import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PropertyEditorGroup } from './property-editor-group';
import { SectionType } from 'app/shared/model/ONLINE_ORDERING/online-ordering-page.enums';
import { IPageSection } from 'app/shared/model/ONLINE_ORDERING/online-ordering-page.model';

type ConfigRecord = Record<string, unknown>;

const recordValue = (value: unknown): ConfigRecord => value && typeof value === 'object' && !Array.isArray(value) ? value as ConfigRecord : {};
const stringValue = (value: unknown, fallback = '') => typeof value === 'string' ? value : fallback;
const imageUrl = (value: unknown) => {
  if (typeof value === 'string') return value;
  return stringValue(recordValue(value).url);
};

const TextField = ({ id, label, value, placeholder, onChange }: { id: string; label: string; value: string; placeholder?: string; onChange: (value: string) => void }) => (
  <div className="space-y-1">
    <Label htmlFor={id} className="text-xs">{label}</Label>
    <Input id={id} className="h-8 text-xs" value={value} placeholder={placeholder} onChange={event => onChange(event.target.value)} />
  </div>
);

const TextareaField = ({ id, label, value, placeholder, onChange }: { id: string; label: string; value: string; placeholder?: string; onChange: (value: string) => void }) => (
  <div className="space-y-1">
    <Label htmlFor={id} className="text-xs">{label}</Label>
    <Textarea id={id} className="min-h-20 text-xs" value={value} placeholder={placeholder} onChange={event => onChange(event.target.value)} />
  </div>
);

const ImageField = ({ id, label, value, onChange }: { id: string; label: string; value: unknown; onChange: (value: ConfigRecord) => void }) => {
  const url = imageUrl(value);
  return (
    <div className="space-y-1 sm:col-span-2">
      <Label htmlFor={id} className="text-xs">{label}</Label>
      <Input id={id} className="h-8 text-xs" value={url} placeholder="https://..." onChange={event => onChange({ ...recordValue(value), url: event.target.value })} />
      <p className="text-[10px] text-muted-foreground">Use a public image URL or a file-library URL. The storefront uses the selected source as-is.</p>
    </div>
  );
};

const updateAt = (source: ConfigRecord, path: string, value: unknown): ConfigRecord => {
  const [head, ...tail] = path.split('.');
  if (!head) return source;
  if (!tail.length) return { ...source, [head]: value };
  return { ...source, [head]: updateAt(recordValue(source[head]), tail.join('.'), value) };
};

export default function CourtyardSectionFields({ section, onConfigChange }: { section: IPageSection; onConfigChange: (key: string, value: unknown) => void }) {
  const config = section.config ?? {};
  const update = (path: string, value: unknown) => {
    const next = updateAt(config, path, value);
    const [key, ...rest] = path.split('.');
    if (rest.length === 0) onConfigChange(key, value);
    else onConfigChange(key, next[key]);
  };

  if (section.type === SectionType.COURTYARD_HERO) {
    return (
      <PropertyEditorGroup title="Courtyard hero" description="Full-screen opening image" defaultOpen>
        <div className="landing-editor-fields-grid grid gap-2">
          <ImageField id="courtyard-hero-image" label="Hero image" value={config.image} onChange={value => onConfigChange('image', value)} />
          <TextField id="courtyard-hero-alt" label="Image alt text" value={stringValue(config.imageAlt, 'Hospitality venue in your city')} onChange={value => onConfigChange('imageAlt', value)} />
        </div>
      </PropertyEditorGroup>
    );
  }

  if (section.type === SectionType.COURTYARD_WELCOME) {
    return (
      <PropertyEditorGroup title="Courtyard welcome" description="Introduction copy" defaultOpen>
        <div className="landing-editor-fields-grid grid gap-2">
          <TextField id="courtyard-welcome-title" label="Title" value={stringValue(config.title, 'welcome to your hospitality venue')} onChange={value => onConfigChange('title', value)} />
          <div className="landing-editor-wide-field"><TextareaField id="courtyard-welcome-body" label="Body" value={stringValue(config.body)} onChange={value => onConfigChange('body', value)} /></div>
        </div>
      </PropertyEditorGroup>
    );
  }

  if (section.type === SectionType.COURTYARD_SLIDER) {
    const slides = Array.isArray(config.slides) ? config.slides.map(recordValue) : [];
    const updateSlide = (index: number, path: string, value: unknown) => {
      const nextSlides = slides.map((slide, slideIndex) => slideIndex === index ? updateAt(slide, path, value) : slide);
      onConfigChange('slides', nextSlides);
    };
    return (
      <div className="space-y-2">
        <PropertyEditorGroup title="Courtyard slider" description="The slide count and order are fixed; copy, images, and actions remain editable." defaultOpen>
          <div className="landing-editor-fields-grid grid gap-2">
            <TextField id="courtyard-slider-eyebrow" label="Section label" value={stringValue(config.eyebrow)} onChange={value => onConfigChange('eyebrow', value)} />
            <TextField id="courtyard-slider-autoplay" label="Autoplay (ms)" value={String(config.autoplayMs ?? 6500)} onChange={value => onConfigChange('autoplayMs', Number(value) || 0)} />
          </div>
        </PropertyEditorGroup>
        <PropertyEditorGroup title="Slides" description="Edit each visual slide" badge={`${slides.length}`} defaultOpen>
          <div className="space-y-2">
            {slides.map((slide, index) => {
              const cta = recordValue(slide.cta);
              return (
                <PropertyEditorGroup key={`courtyard-slide-${index}`} title={`${index + 1}. ${stringValue(slide.title, 'Untitled slide')}`} description="Image, title, and CTA" defaultOpen={index === 0}>
                  <div className="landing-editor-fields-grid grid gap-2">
                    <ImageField id={`courtyard-slide-${index}-image`} label="Image" value={slide.image} onChange={value => updateSlide(index, 'image', value)} />
                    <TextField id={`courtyard-slide-${index}-alt`} label="Alt text" value={stringValue(slide.alt)} onChange={value => updateSlide(index, 'alt', value)} />
                    <TextField id={`courtyard-slide-${index}-title`} label="Title" value={stringValue(slide.title)} onChange={value => updateSlide(index, 'title', value)} />
                    <TextField id={`courtyard-slide-${index}-cta-text`} label="CTA label" value={stringValue(cta.text)} onChange={value => updateSlide(index, 'cta.text', value)} />
                    <TextField id={`courtyard-slide-${index}-cta-url`} label="CTA URL" value={stringValue(cta.url, '#')} onChange={value => updateSlide(index, 'cta.url', value)} />
                  </div>
                </PropertyEditorGroup>
              );
            })}
          </div>
        </PropertyEditorGroup>
      </div>
    );
  }

  if (section.type === SectionType.COURTYARD_ACCOLADES) {
    const items = Array.isArray(config.items) ? config.items.map(recordValue) : [];
    return (
      <div className="space-y-2">
        <PropertyEditorGroup title="Accolades" description="Awards section heading and copy" defaultOpen>
          <TextField id="courtyard-accolades-title" label="Title" value={stringValue(config.title, 'our accolades')} onChange={value => onConfigChange('title', value)} />
        </PropertyEditorGroup>
        <PropertyEditorGroup title="Awards" description="Edit the fixed award cards" badge={`${items.length}`} defaultOpen>
          <div className="space-y-2">
            {items.map((item, index) => (
              <PropertyEditorGroup key={`courtyard-accolade-${index}`} title={`Award ${index + 1}`} defaultOpen={index === 0}>
                <div className="space-y-2">
                  <ImageField id={`courtyard-accolade-${index}-image`} label="Image" value={item.image} onChange={value => onConfigChange('items', items.map((entry, entryIndex) => entryIndex === index ? { ...entry, image: value } : entry))} />
                  <TextareaField id={`courtyard-accolade-${index}-text`} label="Copy" value={stringValue(item.text)} onChange={value => onConfigChange('items', items.map((entry, entryIndex) => entryIndex === index ? { ...entry, text: value } : entry))} />
                </div>
              </PropertyEditorGroup>
            ))}
          </div>
        </PropertyEditorGroup>
      </div>
    );
  }

  if (section.type === SectionType.COURTYARD_NEWSLETTER) {
    return (
      <PropertyEditorGroup title="Stay in touch" description="Newsletter copy and form labels" defaultOpen>
        <div className="landing-editor-fields-grid grid gap-2">
          <TextField id="courtyard-newsletter-title" label="Title" value={stringValue(config.title, 'Stay in touch')} onChange={value => onConfigChange('title', value)} />
          <TextField id="courtyard-newsletter-placeholder" label="Email placeholder" value={stringValue(config.placeholder, 'Your e-mail address')} onChange={value => onConfigChange('placeholder', value)} />
          <TextField id="courtyard-newsletter-button" label="Button label" value={stringValue(config.buttonLabel, 'Subscribe')} onChange={value => onConfigChange('buttonLabel', value)} />
          <TextField id="courtyard-newsletter-success" label="Success message" value={stringValue(config.successMessage)} onChange={value => onConfigChange('successMessage', value)} />
          <div className="landing-editor-wide-field"><TextareaField id="courtyard-newsletter-body" label="Body" value={stringValue(config.body)} onChange={value => onConfigChange('body', value)} /></div>
        </div>
      </PropertyEditorGroup>
    );
  }

  return null;
}
