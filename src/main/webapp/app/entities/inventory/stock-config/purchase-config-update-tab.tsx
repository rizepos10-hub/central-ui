// PurchaseConfigUpdateTab.tsx
import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useAppSelector } from 'app/config/store';
import { IPurchaseConfig } from 'app/shared/model/STOCK/purchase-config.model';
import { translate } from 'react-jhipster';
import { Dropdown } from 'primereact/dropdown';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface PurchaseConfigUpdateTabProps {
  id?: string;
  variantIndex: number;
  onConfigChange: (config: IPurchaseConfig, variantIndex: number) => void;
  purchaseConfig: IPurchaseConfig;
}

export const PurchaseConfigUpdateTab: React.FC<PurchaseConfigUpdateTabProps> = ({
  variantIndex,
  id,
  onConfigChange,
  purchaseConfig
}) => {
  const location = useLocation();
  const isNew = id === undefined;
  const suppliers = useAppSelector(state => state.supplier.entities);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(
      supplier =>
        !purchaseConfig?.supplierConfigurations?.some(
          config => config.supplier.id === supplier.id
        )
    );
  }, [purchaseConfig?.supplierConfigurations, suppliers]);

  const handleNumberChange = (field: string, value: string) => {
    const num = value === '' ? null : parseFloat(value);
    const newConfig = { ...purchaseConfig, [field]: num };
    onConfigChange(newConfig, variantIndex);
  };

  const handleAddSupplier = (selectedSupplier: any) => {
    const newEntry = {
      supplier: selectedSupplier.value,
      defaultPrice: null,
      code: ''
    };
    const newConfig = {
      ...purchaseConfig,
      supplierConfigurations: [...(purchaseConfig?.supplierConfigurations || []), newEntry]
    };
    onConfigChange(newConfig, variantIndex);
  };

  const handleSupplierConfigChange = (configIndex: number, value: string) => {
    const price = value === '' ? null : parseFloat(value);
    const updatedConfigurations = purchaseConfig?.supplierConfigurations?.map((supConfig, index) =>
      index === configIndex ? { ...supConfig, defaultPrice: price } : supConfig
    );
    const newConfig = { ...purchaseConfig, supplierConfigurations: updatedConfigurations };
    onConfigChange(newConfig, variantIndex);
  };

  const handleSupplierCodeChange = (configIndex: number, newCode: string) => {
    const updatedConfigurations = purchaseConfig?.supplierConfigurations?.map((supConfig, index) =>
      index === configIndex ? { ...supConfig, code: newCode } : supConfig
    );
    const newConfig = { ...purchaseConfig, supplierConfigurations: updatedConfigurations };
    onConfigChange(newConfig, variantIndex);
  };

  const handleDeleteSupplier = (configIndex: number) => {
    const updatedConfigurations = purchaseConfig?.supplierConfigurations?.filter((_, index) => index !== configIndex);
    const newConfig = { ...purchaseConfig, supplierConfigurations: updatedConfigurations };
    onConfigChange(newConfig, variantIndex);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="defaultPrice" className="font-semibold text-xs">
            {translate('tempApp.stockConfig.defaultPrice')}
          </Label>
          <Input
            type="number"
            name="defaultPrice"
            id="defaultPrice"
            className="h-8 text-xs"
            step="0.01"
            value={purchaseConfig?.defaultPrice ?? ''}
            onChange={(e) => handleNumberChange('defaultPrice', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="minOrderQuantity" className="font-semibold text-xs">
            {translate('tempApp.stockConfig.minOrderQuantity')}
          </Label>
          <Input
            type="number"
            name="minOrderQuantity"
            id="minOrderQuantity"
            className="h-8 text-xs"
            step="1"
            value={purchaseConfig?.minOrderQuantity ?? ''}
            onChange={(e) => handleNumberChange('minOrderQuantity', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="font-semibold">{translate('tempApp.stockConfig.supplierConfig')}</Label>
        <div className="border rounded-md p-4 space-y-3">
          <div className="space-y-2">
            <Label className="text-xs">{translate('tempApp.stockConfig.selectSupplier')}</Label>
            <Dropdown
              options={filteredSuppliers}
              placeholder={translate('tempApp.stockConfig.selectSupplier')}
              className="w-full"
              optionLabel="name"
              filter
              onChange={handleAddSupplier}
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">{translate('common.supplier')}</TableHead>
                  <TableHead className="text-xs">{translate('common.costPrice')}</TableHead>
                  <TableHead className="text-xs">{translate('common.supplierCode')}</TableHead>
                  <TableHead className="text-xs">{translate('common.delete')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseConfig?.supplierConfigurations?.map((supConfig, index) => (
                  <TableRow key={supConfig.supplier.id}>
                    <TableCell className="text-xs">{supConfig.supplier.name}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        className="h-7 text-xs w-32"
                        required
                        value={supConfig?.defaultPrice ?? ''}
                        onChange={(e) => handleSupplierConfigChange(index, e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        className="h-7 text-xs w-32"
                        value={supConfig.code ?? ''}
                        onChange={(e) => handleSupplierCodeChange(index, e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleDeleteSupplier(index)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        {translate('common.delete')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseConfigUpdateTab;
