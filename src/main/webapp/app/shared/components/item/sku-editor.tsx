import React, { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { normalizeSkuList } from 'app/shared/util/sku-utils';

type SkuEditorProps = {
  value?: Array<string | null | undefined> | null;
  onChange: (value: string[]) => void;
  placeholder?: string;
  inputClassName?: string;
  disabled?: boolean;
};

export type SkuEditorHandle = {
  insertSku: (sku?: string | number | null) => void;
};

const splitSkuInput = (value: string): string[] =>
  normalizeSkuList(
    value
      .split(/[\n,]/)
      .map(part => part.trim())
  );

const appendSkus = (
  current: Array<string | null | undefined> | null | undefined,
  incoming: string[]
): string[] => normalizeSkuList([...(current ?? []), ...incoming]);

const SkuEditor = forwardRef<SkuEditorHandle, SkuEditorProps>(({ value, onChange, placeholder, inputClassName, disabled = false }, ref) => {
  const [inputValue, setInputValue] = useState('');
  const skus = useMemo(() => normalizeSkuList(value), [value]);

  const commitInput = () => {
    const nextSkus = splitSkuInput(inputValue);
    if (nextSkus.length === 0) {
      setInputValue('');
      return;
    }
    onChange(appendSkus(skus, nextSkus));
    setInputValue('');
  };

  const removeSku = (skuToRemove: string) => {
    onChange(skus.filter(sku => sku !== skuToRemove));
  };

  useImperativeHandle(ref, () => ({
    insertSku: sku => {
      const normalizedSku = normalizeSkuList([sku === null || sku === undefined ? '' : String(sku)]).at(0);
      if (!normalizedSku) {
        return;
      }
      onChange(appendSkus(skus, [normalizedSku]));
      setInputValue('');
    },
  }), [onChange, skus]);

  return (
    <div className="space-y-2">
      {skus.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {skus.map(sku => (
            <Badge key={sku} variant="secondary" className="gap-1 px-2 py-1 text-xs font-normal">
              <span>{sku}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-muted-foreground hover:text-foreground"
                onClick={() => removeSku(sku)}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      ) : null}
      <Input
        value={inputValue}
        disabled={disabled}
        placeholder={placeholder}
        className={inputClassName}
        onChange={e => setInputValue(e.target.value)}
        onBlur={commitInput}
        onPaste={e => {
          const pastedValue = e.clipboardData.getData('text');
          if (!/[\n,]/.test(pastedValue)) {
            return;
          }
          e.preventDefault();
          const nextSkus = splitSkuInput(pastedValue);
          if (nextSkus.length > 0) {
            onChange(appendSkus(skus, nextSkus));
          }
          setInputValue('');
        }}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
            if (inputValue.trim().length === 0 && e.key !== 'Tab') {
              e.preventDefault();
              return;
            }
            e.preventDefault();
            commitInput();
            return;
          }
        }}
      />
    </div>
  );
});

export default SkuEditor;
