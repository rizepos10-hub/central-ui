import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Code2, Copy, MoreVertical, Pencil, Plus, Printer, Star, Tag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LabelTemplate, paperNameFor } from '../model/label-template.model';
import { useLabelTemplates } from '../store/useLabelTemplates';
import { useLabelFlow } from '../store/label-flow-context';
import { LabelCanvasPreview } from '../components/LabelCanvas';
import { ElementChip } from '../components/ElementChip';
import { directPrintLanguageName, isDirectPrintTemplate } from '../util/label-script';

const TemplateListScreen = () => {
  const navigate = useNavigate();
  const { setTemplate } = useLabelFlow();
  const { templates, removeTemplate, duplicate, setDefault, isPresetId } = useLabelTemplates();

  const onUse = (template: LabelTemplate) => {
    setTemplate(template);
    navigate(`/labels/select/${template.id}`);
  };

  return (
    <div className="w-full px-4 py-5">
      <div className="mb-1 flex items-start justify-between gap-4">
        <div>
          <h2 className="m-0 text-xl font-bold text-foreground">Label Templates</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Each template shows exactly what your printed label will look like. Pick the one that matches your label paper, or design your
            own.
          </p>
        </div>
        <Button onClick={() => navigate('/labels/design/new')} className="shrink-0 gap-2">
          <Plus className="h-4 w-4" />
          New Template
        </Button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {templates.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            isPreset={isPresetId(template.id)}
            onUse={() => onUse(template)}
            onDesign={() => navigate(`/labels/design/${template.id}`)}
            onDuplicate={() => duplicate(template)}
            onSetDefault={() => setDefault(template.id)}
            onDelete={() => removeTemplate(template.id)}
          />
        ))}
      </div>
    </div>
  );
};

type TemplateCardProps = {
  template: LabelTemplate;
  isPreset: boolean;
  onUse: () => void;
  onDesign: () => void;
  onDuplicate: () => void;
  onSetDefault: () => void;
  onDelete: () => void;
};

const TemplateCard = ({ template, isPreset, onUse, onDesign, onDuplicate, onSetDefault, onDelete }: TemplateCardProps) => {
  const isDirect = isDirectPrintTemplate(template);
  const fieldTypes = Array.from(new Set(template.elements.filter(e => e.visible).map(e => e.type)));

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2 px-4 pt-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600">
              <Tag className="h-4 w-4" />
            </span>
            <h3 className="m-0 truncate text-base font-bold text-foreground">{template.name}</h3>
            {template.isDefault && (
              <span className="shrink-0 rounded-full bg-emerald-500/12 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                Recommended
              </span>
            )}
          </div>
          <p className="mt-1 line-clamp-2 h-8 text-xs text-muted-foreground">{template.description}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="rounded p-1 text-muted-foreground hover:bg-muted" onClick={e => e.stopPropagation()}>
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onDesign}>
              <Pencil className="mr-2 h-4 w-4" /> Design
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="mr-2 h-4 w-4" /> Duplicate
            </DropdownMenuItem>
            {!template.isDefault && (
              <DropdownMenuItem onClick={onSetDefault}>
                <Star className="mr-2 h-4 w-4" /> Set as default
              </DropdownMenuItem>
            )}
            {!isPreset && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-red-600 focus:text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <button type="button" onClick={onUse} className="flex flex-1 cursor-pointer flex-col px-4 pb-4 pt-3 text-left">
        <div className="flex h-[168px] flex-col items-center justify-center rounded-lg bg-muted/60 px-3 py-4">
          {isDirect ? (
            <>
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                <Printer className="h-7 w-7" />
              </span>
              <div className="mt-3 text-center">
                <p className="m-0 text-sm font-semibold text-foreground">{directPrintLanguageName(template.directPrint?.language ?? 'zpl')}</p>
                <p className="mt-1 max-w-[240px] text-[10px] leading-4 text-muted-foreground">
                  Canvas design compiled to native printer commands
                  {template.directPrint?.dpi ? ` · ${template.directPrint.dpi} DPI` : ''}
                  {template.directPrint?.printerName ? ` · ${template.directPrint.printerName}` : ''}
                </p>
              </div>
            </>
          ) : (
            <>
              <LabelCanvasPreview template={template} maxWidthPx={240} maxHeightPx={120} />
              <span className="mt-2 text-[10px] italic text-muted-foreground">Preview — placeholder data shown</span>
            </>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {isDirect ? (
            <>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-[11px] font-semibold text-amber-700">
                <Code2 className="h-3.5 w-3.5" />
                Direct Printing
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2 py-1 text-[11px] font-semibold text-slate-700">
                {directPrintLanguageName(template.directPrint?.language ?? 'zpl')}
              </span>
            </>
          ) : (
            fieldTypes.map(type => <ElementChip key={type} type={type} />)
          )}
        </div>

        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-xs text-muted-foreground">
            {template.widthMm.toFixed(0)} × {template.heightMm.toFixed(0)} mm · {paperNameFor(template)}
          </span>
          <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-sky-600">
            Use template
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </button>
    </div>
  );
};

export default TemplateListScreen;
