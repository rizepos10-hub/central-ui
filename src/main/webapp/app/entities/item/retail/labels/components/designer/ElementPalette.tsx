import React, { Dispatch } from 'react';
import { ChevronDown, ChevronUp, Eye, EyeOff, LayoutGrid, Plus, TriangleAlert } from 'lucide-react';
import { ELEMENT_TYPE_LABELS, LabelElementType, LabelTemplate } from '../../model/label-template.model';
import { DesignerAction } from '../../store/designer-reducer';
import { ElementIcon } from '../ElementIcon';

const ADDABLE_TYPES: LabelElementType[] = [
  'productName',
  'price',
  'sku',
  'barcode',
  'qrCode',
  'category',
  'brand',
  'description',
  'customText',
  'productImage',
  'logo',
];

type ElementPaletteProps = {
  template: LabelTemplate;
  selectedElementId: string | null;
  warnIds: Set<string>;
  dispatch: Dispatch<DesignerAction>;
};

export const ElementPalette = ({ template, selectedElementId, warnIds, dispatch }: ElementPaletteProps) => {
  const layers = [...template.elements].reverse();
  return (
    <div className="flex w-48 shrink-0 flex-col overflow-y-auto border-r border-border bg-muted/30 p-2">
      <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Add element</p>
      <div className="flex flex-col gap-1">
        {ADDABLE_TYPES.map(type => (
          <button
            key={type}
            type="button"
            onClick={() => dispatch({ type: 'add', elementType: type })}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-foreground hover:bg-accent"
          >
            <ElementIcon type={type} size={15} />
            {ELEMENT_TYPE_LABELS[type]}
            <Plus className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
          </button>
        ))}
      </div>

      {layers.length > 0 && (
        <>
          <p className="mt-4 flex items-center gap-1 px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <LayoutGrid className="h-3 w-3" /> Layers
          </p>
          <div className="flex flex-col gap-0.5">
            {layers.map((e, ri) => (
              <div
                key={e.id}
                className={`group flex items-center gap-1 rounded-md px-2 py-1 text-left text-sm ${
                  selectedElementId === e.id ? 'bg-accent' : 'hover:bg-accent/60'
                } ${warnIds.has(e.id) ? 'text-red-600' : 'text-foreground'}`}
              >
                <button type="button" onClick={() => dispatch({ type: 'select', id: e.id })} className="flex min-w-0 flex-1 items-center gap-1.5">
                  <ElementIcon type={e.type} size={13} />
                  <span className={`truncate ${e.visible ? '' : 'opacity-40'}`}>
                    {e.type === 'customText' && e.value ? e.value : ELEMENT_TYPE_LABELS[e.type]}
                  </span>
                  {warnIds.has(e.id) && <TriangleAlert className="ml-auto h-3 w-3 shrink-0" />}
                </button>
                <button
                  type="button"
                  title="Bring forward"
                  disabled={ri === 0}
                  onClick={() => dispatch({ type: 'reorder', id: e.id, dir: 'forward' })}
                  className="shrink-0 text-muted-foreground hover:text-foreground disabled:opacity-25"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title="Send backward"
                  disabled={ri === layers.length - 1}
                  onClick={() => dispatch({ type: 'reorder', id: e.id, dir: 'backward' })}
                  className="shrink-0 text-muted-foreground hover:text-foreground disabled:opacity-25"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title={e.visible ? 'Hide' : 'Show'}
                  onClick={() => dispatch({ type: 'updateElement', element: { ...e, visible: !e.visible } })}
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  {e.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
