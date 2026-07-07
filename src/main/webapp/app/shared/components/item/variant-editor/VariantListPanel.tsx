import React from 'react';
import { Translate } from 'react-jhipster';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { GripVertical, Plus } from 'lucide-react';
import { cn } from 'app/lib/utils';

interface VariantRow {
  name?: string;
  sku?: string;
  [key: string]: any;
}

interface VariantListPanelProps {
  variants: VariantRow[];
  activeIndex: number;
  onSelectVariant: (index: number) => void;
  onAddVariant: () => void;
  renderLabel?: (variant: VariantRow, index: number) => React.ReactNode;
  draggable?: boolean;
  draggedIndex?: number | null;
  dragOverIndex?: number | null;
  onDragStart?: (index: number) => void;
  onDragOver?: (e: React.DragEvent, index: number) => void;
  onDragLeave?: () => void;
  onDrop?: (index: number) => void;
}

export const VariantListPanel = ({
  variants,
  activeIndex,
  onSelectVariant,
  onAddVariant,
  renderLabel,
  draggable = false,
  draggedIndex,
  dragOverIndex,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
}: VariantListPanelProps) => {
  const getLabel = (variant: VariantRow, index: number) => {
    if (renderLabel) return renderLabel(variant, index);
    return variant.name || `Variant ${index + 1}`;
  };

  return (
    <div className="flex flex-col h-full">
      <Label className="text-xs font-semibold mb-2 px-1 block">
        <Translate contentKey="items.update.variants">Variants</Translate>
      </Label>

      <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
        {variants.map((variant, index) => (
          <div
            key={index}
            className={cn(
              'flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer text-xs transition-colors',
              'hover:bg-muted/60',
              activeIndex === index ? 'bg-muted font-medium' : '',
              dragOverIndex === index ? 'border-t-2 border-primary' : ''
            )}
            onClick={() => onSelectVariant(index)}
            onDragOver={draggable && onDragOver ? e => onDragOver(e, index) : undefined}
            onDragLeave={draggable && onDragLeave ? onDragLeave : undefined}
            onDrop={draggable && onDrop ? () => onDrop(index) : undefined}
          >
            {draggable && (
              <div
                className="cursor-grab shrink-0"
                draggable
                onDragStart={onDragStart ? () => onDragStart(index) : undefined}
                onClick={e => e.stopPropagation()}
              >
                <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="truncate leading-tight">{getLabel(variant, index)}</div>
              {variant.sku && (
                <div className="text-[10px] text-muted-foreground truncate">{variant.sku}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2 mt-auto">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full h-7 text-xs"
          onClick={onAddVariant}
        >
          <Plus className="h-3 w-3 mr-1" />
          <Translate contentKey="items.update.addSingleVariant">Add Variant</Translate>
        </Button>
      </div>
    </div>
  );
};

export default VariantListPanel;
