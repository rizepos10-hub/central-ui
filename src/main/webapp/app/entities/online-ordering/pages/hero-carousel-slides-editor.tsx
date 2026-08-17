import React from 'react';
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MediaLibrary from 'app/shared/components/media-library/media-library';
import { transformAttachmentStructure } from 'app/shared/util/attachment-utils';
import { IAttachment } from 'app/shared/model/attachment.model';
import { ColorInputField } from './color-input-field';
import { PropertyEditorGroup } from './property-editor-group';

type SlideRecord = Record<string, unknown>;

type HeroCarouselSlidesEditorProps = {
  slides: SlideRecord[];
  layout: string;
  fixedStructure?: boolean;
  onChange: (slides: SlideRecord[]) => void;
};

function slideImageUrl(slide: SlideRecord): string | undefined {
  const image = slide.image as IAttachment | undefined;
  return image?.url ?? undefined;
}

function defaultSlide(image: IAttachment, layout: string): SlideRecord {
  if (layout === 'riode-split') {
    return {
      image,
      eyebrow: '',
      title: '',
      subtitle: '',
      discount: '',
      background: '#e8e8ea',
      cta: { text: 'Shop now', url: '' },
    };
  }
  return {
    image,
    text: '',
    buttonSetting: { text: '', color: '#ffffff', alignment: 'CENTER' },
  };
}

export const HeroCarouselSlidesEditor = ({ slides, layout, fixedStructure = false, onChange }: HeroCarouselSlidesEditorProps) => {
  const updateSlide = (index: number, patch: SlideRecord) => {
    const next = slides.map((slide, i) => (i === index ? { ...slide, ...patch } : slide));
    onChange(next);
  };

  const updateSlideField = (index: number, key: string, value: unknown) => {
    updateSlide(index, { [key]: value });
  };

  const removeSlide = (index: number) => {
    onChange(slides.filter((_, i) => i !== index));
  };

  const moveSlide = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;
    const next = [...slides];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    onChange(next);
  };

  const addSlide = (files: Parameters<typeof transformAttachmentStructure>[0]) => {
    const image = transformAttachmentStructure(files, 'toIAttachment')[0] as IAttachment | undefined;
    if (!image) return;
    onChange([...slides, defaultSlide(image, layout)]);
  };

  return (
    <div className="space-y-3">
      {!fixedStructure && (
        <PropertyEditorGroup title="Add slide" description="Choose an image to create a new slide" defaultOpen={false}>
          <MediaLibrary handleFilesSelectCallback={addSlide} />
        </PropertyEditorGroup>
      )}

      {slides.length === 0 ? (
        <p className="text-xs text-muted-foreground">No slides yet. Select or upload an image above.</p>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground">{slides.length} slide(s)</p>
          {slides.map((slide, index) => {
            const imageUrl = slideImageUrl(slide);
            const cta = (slide.cta as Record<string, string>) ?? {};
            const buttonSetting = (slide.buttonSetting as Record<string, string>) ?? {};

            return (
              <PropertyEditorGroup
                key={`${imageUrl ?? 'slide'}-${index}`}
                title={`Slide ${index + 1}`}
                description={imageUrl ? 'Image selected · edit copy and action' : 'No image selected'}
                badge={layout === 'riode-split' ? 'Promo' : 'Carousel'}
                defaultOpen={index === 0}
                contentClassName="p-2"
              >
                <div className="flex gap-2">
                <div className="shrink-0">
                  {imageUrl ? (
                    <img src={imageUrl} alt={`Slide ${index + 1}`} className="h-24 w-32 rounded border object-cover" />
                  ) : (
                    <div className="flex h-24 w-32 items-center justify-center rounded border bg-muted text-[10px] text-muted-foreground">
                      No image
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center justify-end gap-2">
                    {!fixedStructure && <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        disabled={index === 0}
                        onClick={() => moveSlide(index, 'up')}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        disabled={index === slides.length - 1}
                        onClick={() => moveSlide(index, 'down')}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => removeSlide(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>}
                  </div>

                  {layout === 'riode-split' ? (
                    <div className="landing-editor-fields-grid grid gap-2">
                      <div>
                        <Label className="text-xs">Eyebrow</Label>
                        <Input
                          className="h-8 text-xs"
                          value={(slide.eyebrow as string) ?? ''}
                          onChange={e => updateSlideField(index, 'eyebrow', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Title</Label>
                        <Input
                          className="h-8 text-xs"
                          value={(slide.title as string) ?? ''}
                          onChange={e => updateSlideField(index, 'title', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Subtitle</Label>
                        <Input
                          className="h-8 text-xs"
                          value={(slide.subtitle as string) ?? ''}
                          onChange={e => updateSlideField(index, 'subtitle', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Discount label</Label>
                        <Input
                          className="h-8 text-xs"
                          value={(slide.discount as string) ?? ''}
                          onChange={e => updateSlideField(index, 'discount', e.target.value)}
                        />
                      </div>
                      <ColorInputField
                        label="Background color"
                        placeholder="#e8e8ea"
                        value={(slide.background as string) ?? ''}
                        onChange={value => updateSlideField(index, 'background', value)}
                      />
                      <div>
                        <Label className="text-xs">CTA text</Label>
                        <Input
                          className="h-8 text-xs"
                          value={cta.text ?? ''}
                          onChange={e => updateSlideField(index, 'cta', { ...cta, text: e.target.value })}
                        />
                      </div>
                      <div className="landing-editor-wide-field">
                        <Label className="text-xs">CTA URL</Label>
                        <Input
                          className="h-8 text-xs"
                          value={cta.url ?? ''}
                          onChange={e => updateSlideField(index, 'cta', { ...cta, url: e.target.value })}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs">Overlay text</Label>
                        <Input
                          className="h-8 text-xs"
                          value={(slide.text as string) ?? ''}
                          onChange={e => updateSlideField(index, 'text', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Button text</Label>
                        <Input
                          className="h-8 text-xs"
                          value={buttonSetting.text ?? ''}
                          onChange={e =>
                            updateSlideField(index, 'buttonSetting', { ...buttonSetting, text: e.target.value })
                          }
                        />
                      </div>
                      <ColorInputField
                        label="Button color"
                        placeholder="#ffffff"
                        value={buttonSetting.color ?? ''}
                        onChange={value =>
                          updateSlideField(index, 'buttonSetting', { ...buttonSetting, color: value })
                        }
                      />
                      <div>
                        <Label className="text-xs">Button alignment</Label>
                        <Select
                          value={buttonSetting.alignment ?? 'CENTER'}
                          onValueChange={value =>
                            updateSlideField(index, 'buttonSetting', { ...buttonSetting, alignment: value })
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LEFT">Left</SelectItem>
                            <SelectItem value="CENTER">Center</SelectItem>
                            <SelectItem value="RIGHT">Right</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  <MediaLibrary
                    layout="compact"
                    handleFilesSelectCallback={files => {
                      const image = transformAttachmentStructure(files, 'toIAttachment')[0] as IAttachment | undefined;
                      if (image) updateSlideField(index, 'image', image);
                    }}
                  />
                </div>
                </div>
              </PropertyEditorGroup>
            );
          })}
        </div>
      )}
    </div>
  );
};

type SelectedImagePreviewProps = {
  image?: IAttachment | null;
  onClear: () => void;
  label?: string;
};

export const SelectedImagePreview = ({ image, onClear, label = 'Selected image' }: SelectedImagePreviewProps) => {
  if (!image?.url) return null;

  return (
    <div className="flex items-start gap-3 rounded-md border p-2">
      <img src={image.url} alt={image.name ?? label} className="h-20 w-28 rounded border object-cover" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{image.name ?? label}</p>
        <Button type="button" variant="outline" size="sm" className="mt-2 h-7 text-xs" onClick={onClear}>
          <Trash2 className="h-3 w-3 mr-1" />
          Remove
        </Button>
      </div>
    </div>
  );
};
