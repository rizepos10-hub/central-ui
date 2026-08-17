import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MediaLibrary from 'app/shared/components/media-library/media-library';
import { transformAttachmentStructure } from 'app/shared/util/attachment-utils';
import { IAttachment } from 'app/shared/model/attachment.model';
import { IOnlineOrderingPage } from 'app/shared/model/ONLINE_ORDERING/online-ordering-page.model';
import { EditorNode } from './landing-editor-bridge';
import { ColorInputField } from './color-input-field';
import { PropertyEditorGroup } from './property-editor-group';

type ElementPropertiesFieldsProps = {
  node: EditorNode;
  page: IOnlineOrderingPage;
  onUpdatePath: (path: string, value: unknown) => void;
};

type StyleFieldProps = {
  label: string;
  value: unknown;
  onChange: (value: unknown) => void;
  type?: 'text' | 'number';
  placeholder?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const getPathValue = (source: unknown, path?: string): unknown => {
  if (!path) return undefined;
  return path.split('.').reduce<unknown>((current, part) => {
    if (Array.isArray(current)) return current[Number(part)];
    if (isRecord(current)) return current[part];
    return undefined;
  }, source);
};

const textValue = (value: unknown) => (typeof value === 'string' || typeof value === 'number' ? String(value) : '');
const numberValue = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? String(value) : '');

function StyleTextField({ label, value, onChange, type = 'text', placeholder }: StyleFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        type={type}
        value={type === 'number' ? numberValue(value) : textValue(value)}
        placeholder={placeholder}
        className="h-8 text-xs"
        onChange={event => {
          if (type === 'number') {
            onChange(event.target.value === '' ? undefined : Number(event.target.value));
          } else {
            onChange(event.target.value);
          }
        }}
      />
    </div>
  );
}

function StyleColorField({ label, value, onChange, placeholder }: StyleFieldProps) {
  return <ColorInputField label={label} value={textValue(value)} placeholder={placeholder} onChange={onChange} />;
}

function VisibilityField({ node, page, onUpdatePath }: ElementPropertiesFieldsProps) {
  const visibilityPath = node.editor?.visibilityPath;
  if (!visibilityPath) return null;
  const value = getPathValue(page, visibilityPath);
  const checked = typeof value === 'boolean' ? value : true;
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md border bg-background px-2.5 py-2 text-xs">
      <Checkbox checked={checked} onCheckedChange={next => onUpdatePath(visibilityPath, next === true)} />
      <span>Visible in storefront</span>
    </label>
  );
}

function SharedStyleFields({ node, page, onUpdatePath }: ElementPropertiesFieldsProps) {
  const stylePath = node.editor?.stylePath;
  const styleValue = stylePath ? getPathValue(page, stylePath) : undefined;
  const style = isRecord(styleValue) ? styleValue : {};
  const updateStyle = (key: string, value: unknown) => {
    if (stylePath) onUpdatePath(`${stylePath}.${key}`, value);
  };

  if (!stylePath) {
    return <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">This element has no template styling overrides.</p>;
  }

  return (
    <PropertyEditorGroup title="Appearance" description="Shared styling for this element type" defaultOpen={false}>
      {node.kind === 'media' && (
        <>
          <div className="landing-editor-fields-grid grid gap-2">
            <StyleTextField label="Width (px)" type="number" value={node.editor?.widthPath ? getPathValue(page, node.editor.widthPath) : style.width} onChange={value => node.editor?.widthPath ? onUpdatePath(node.editor.widthPath, value) : updateStyle('width', value)} />
            <StyleTextField label="Height (px)" type="number" value={node.editor?.heightPath ? getPathValue(page, node.editor.heightPath) : style.height} onChange={value => node.editor?.heightPath ? onUpdatePath(node.editor.heightPath, value) : updateStyle('height', value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Image fit</Label>
            <Select value={textValue(style.objectFit) || 'cover'} onValueChange={value => updateStyle('objectFit', value)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cover">Cover</SelectItem>
                <SelectItem value="contain">Contain</SelectItem>
                <SelectItem value="fill">Stretch</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <StyleTextField label="Corner radius (px)" type="number" value={style.borderRadius} onChange={value => updateStyle('borderRadius', value)} />
        </>
      )}
      {(node.kind === 'text' || node.kind === 'action') && (
        <div className="landing-editor-fields-grid grid gap-2">
          <StyleTextField label="Font size (px)" type="number" value={style.fontSize} onChange={value => updateStyle('fontSize', value)} />
          <div className="space-y-1.5">
            <Label className="text-xs">Weight</Label>
            <Select value={textValue(style.fontWeight) || '400'} onValueChange={value => updateStyle('fontWeight', Number(value))}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="400">Regular</SelectItem>
                <SelectItem value="500">Medium</SelectItem>
                <SelectItem value="600">Semibold</SelectItem>
                <SelectItem value="700">Bold</SelectItem>
                <SelectItem value="800">Extra bold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      {(node.kind === 'text' || node.kind === 'action') && (
        <div className="landing-editor-fields-grid grid gap-2">
          <StyleColorField label="Text color" value={style.color} placeholder="#111827" onChange={value => updateStyle('color', value)} />
          {node.kind === 'action' ? (
            <StyleColorField label="Button color" value={style.backgroundColor} placeholder="#111827" onChange={value => updateStyle('backgroundColor', value)} />
          ) : (
            <div className="space-y-1.5">
              <Label className="text-xs">Alignment</Label>
              <Select value={textValue(style.textAlign) || 'left'} onValueChange={value => updateStyle('textAlign', value)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}
      {node.kind === 'action' && (
        <StyleTextField label="Corner radius (px)" type="number" value={style.borderRadius} onChange={value => updateStyle('borderRadius', value)} />
      )}
    </PropertyEditorGroup>
  );
}

function MediaProperties({ node, page, onUpdatePath }: ElementPropertiesFieldsProps) {
  const image = getPathValue(page, node.fieldPath) as IAttachment | undefined;
  const imageUrl = image?.url || image?.path;
  const altPath = node.editor?.altPath;

  return (
    <>
      <PropertyEditorGroup title="Image" description="Source and accessibility text" defaultOpen>
        {imageUrl ? (
          <div className="overflow-hidden rounded-md border bg-muted/30">
            <img src={imageUrl} alt={textValue(altPath ? getPathValue(page, altPath) : image?.name) || node.label} className="h-28 w-full object-contain" />
            <div className="flex items-center justify-between gap-2 border-t px-2 py-1.5">
              <span className="truncate text-[11px] text-muted-foreground">{image?.name || 'Selected image'}</span>
              <button type="button" className="text-[11px] text-destructive hover:underline" onClick={() => node.fieldPath && onUpdatePath(node.fieldPath, undefined)}>Remove</button>
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">No image selected.</div>
        )}
        {node.fieldPath && (
          <MediaLibrary
            layout="compact"
            defaultValues={image ? transformAttachmentStructure([image], 'toFileLibraryListItem') : []}
            handleFilesSelectCallback={files => {
              const nextImage = transformAttachmentStructure(files, 'toIAttachment')[0] as IAttachment | undefined;
              if (nextImage) onUpdatePath(node.fieldPath, nextImage);
            }}
          />
        )}
        {altPath && <StyleTextField label="Alt text" value={getPathValue(page, altPath)} placeholder="Describe this image" onChange={value => onUpdatePath(altPath, value)} />}
        <VisibilityField node={node} page={page} onUpdatePath={onUpdatePath} />
      </PropertyEditorGroup>
      <SharedStyleFields node={node} page={page} onUpdatePath={onUpdatePath} />
    </>
  );
}

function TextProperties({ node, page, onUpdatePath }: ElementPropertiesFieldsProps) {
  const textPath = node.editor?.textPath || node.fieldPath;
  const value = textPath ? getPathValue(page, textPath) : undefined;

  return (
    <>
      <PropertyEditorGroup title="Content" description="Text shown in the storefront" defaultOpen>
        <Label className="text-xs">Content</Label>
        <textarea className="mt-1.5 min-h-20 w-full rounded-md border bg-background px-2.5 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" value={textValue(value)} onChange={event => textPath && onUpdatePath(textPath, event.target.value)} />
        <VisibilityField node={node} page={page} onUpdatePath={onUpdatePath} />
      </PropertyEditorGroup>
      <SharedStyleFields node={node} page={page} onUpdatePath={onUpdatePath} />
    </>
  );
}

function ActionProperties({ node, page, onUpdatePath }: ElementPropertiesFieldsProps) {
  const textPath = node.editor?.textPath;
  const urlPath = node.editor?.urlPath;
  const variantPath = node.editor?.variantPath;

  return (
    <>
      <PropertyEditorGroup title="Content & link" description="Button label, destination, and variant" defaultOpen>
        {textPath && <StyleTextField label="Button text" value={getPathValue(page, textPath)} onChange={value => onUpdatePath(textPath, value)} />}
        {urlPath && <StyleTextField label="Link" value={getPathValue(page, urlPath)} placeholder="/shop or https://…" onChange={value => onUpdatePath(urlPath, value)} />}
        {variantPath && <StyleTextField label="Variant" value={getPathValue(page, variantPath)} placeholder="primary" onChange={value => onUpdatePath(variantPath, value)} />}
        <VisibilityField node={node} page={page} onUpdatePath={onUpdatePath} />
      </PropertyEditorGroup>
      <SharedStyleFields node={node} page={page} onUpdatePath={onUpdatePath} />
    </>
  );
}

export default function ElementPropertiesFields({ node, page, onUpdatePath }: ElementPropertiesFieldsProps) {
  return (
    <div className="space-y-2">
      {node.kind === 'media' && <MediaProperties node={node} page={page} onUpdatePath={onUpdatePath} />}
      {node.kind === 'text' && <TextProperties node={node} page={page} onUpdatePath={onUpdatePath} />}
      {node.kind === 'action' && <ActionProperties node={node} page={page} onUpdatePath={onUpdatePath} />}
      {!['media', 'text', 'action'].includes(node.kind) && <SharedStyleFields node={node} page={page} onUpdatePath={onUpdatePath} />}
    </div>
  );
}
