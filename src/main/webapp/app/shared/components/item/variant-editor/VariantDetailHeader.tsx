import React from 'react';
import { Translate } from 'react-jhipster';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface VariantDetailHeaderProps {
  label: string;
  onDelete?: () => void;
  canDelete?: boolean;
}

export const VariantDetailHeader = ({ label, onDelete, canDelete = true }: VariantDetailHeaderProps) => {
  return (
    <div className="flex items-center justify-between gap-3 pb-2 mb-2 border-b">
      <span className="text-sm font-medium truncate">{label}</span>
      {onDelete && canDelete && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs shrink-0 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-3 w-3 mr-1" />
          <Translate contentKey="items.update.deleteVariant">Delete Variant</Translate>
        </Button>
      )}
    </div>
  );
};

export default VariantDetailHeader;
