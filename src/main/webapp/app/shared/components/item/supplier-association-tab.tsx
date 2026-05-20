import React, { useState, useEffect } from "react";
import { translate } from "react-jhipster";
import Select from 'app/shared/components/select/select';
import { IVariableItemVariant } from "app/shared/model/ITEM/retail/variable-item.model";
import { ISupplier } from "app/shared/model/STOCK/supplier.model";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";

interface SupplierAssociation {
  supplierId: string;
  supplierCode: string;
}

const SupplierAssociationTab = ({
  variant,
  itemId,
  suppliers,
  onSupplierChange,
}: {
  variant: IVariableItemVariant;
  itemId: string;
  suppliers: ISupplier[];
  onSupplierChange: (updated: { supplierAssociations: SupplierAssociation[] }) => void;
}) => {
  const [associations, setAssociations] = useState<SupplierAssociation[]>([]);
  const [selectedSupplierForAdd, setSelectedSupplierForAdd] = useState<{ label: string; value: string } | null>(null);

  useEffect(() => {
    if (variant?.supplierAssociations && variant.supplierAssociations.length > 0) {
      setAssociations(variant.supplierAssociations);
    }
  }, [variant]);

  // Filter out suppliers already added.
  const availableSuppliers = suppliers
    .filter((s) => !associations.find((assoc) => assoc.supplierId === s.id))
    .map((s) => ({ label: s.name, value: s.id }));

  const handleAddSupplier = () => {
    if (selectedSupplierForAdd) {
      const newAssociation: SupplierAssociation = { supplierId: selectedSupplierForAdd.value, supplierCode: "" };
      const updatedAssociations = [...associations, newAssociation];
      setAssociations(updatedAssociations);
      onSupplierChange({ supplierAssociations: updatedAssociations });
      setSelectedSupplierForAdd(null);
    }
  };

  const handleSupplierCodeChange = (supplierId: string, code: string) => {
    const updatedAssociations = associations.map((assoc) =>
      assoc.supplierId === supplierId ? { ...assoc, supplierCode: code } : assoc
    );
    setAssociations(updatedAssociations);
    onSupplierChange({ supplierAssociations: updatedAssociations });
  };

  const handleRemoveSupplier = (supplierId: string) => {
    const updatedAssociations = associations.filter((assoc) => assoc.supplierId !== supplierId);
    setAssociations(updatedAssociations);
    onSupplierChange({ supplierAssociations: updatedAssociations });
  };

  return (
    <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
      <div className="space-y-1">
        <h4 className="text-sm font-semibold text-foreground">
          {translate("items.update.tabs.supplier.selectSupplier")}
        </h4>
        <p className="text-xs text-muted-foreground">
          Link this variant to supplier-specific codes for purchasing.
        </p>
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <div className="flex-1">
          <Select
            inputId="supplier-add-dropdown"
            value={selectedSupplierForAdd}
            onChange={(option) => setSelectedSupplierForAdd(option as any)}
            options={availableSuppliers}
            placeholder={translate("items.update.tabs.supplier.selectSupplierPlaceHolder")}
            isSearchable
          />
        </div>
        <Button
          type="button"
          onClick={handleAddSupplier}
          disabled={!selectedSupplierForAdd}
          className="h-9 rounded-xl text-xs md:px-4"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          {translate("items.update.tabs.supplier.addSupplier")}
        </Button>
      </div>

      <div className="space-y-3">
        {associations.map((assoc) => {
          const supplier = suppliers.find((s) => s.id === assoc.supplierId);
          return (
            <div key={assoc.supplierId} className="flex flex-col gap-3 rounded-xl border border-border/60 bg-background p-3 md:flex-row md:items-center">
              <div className="min-w-0 md:w-48">
                <div className="text-xs font-semibold text-foreground truncate">
                  {supplier ? supplier.name : assoc.supplierId}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Supplier code
                </div>
              </div>
              <div className="flex-1">
                <Input
                  id={`supplierCode-${assoc.supplierId}`}
                  value={assoc.supplierCode}
                  onChange={(e) => handleSupplierCodeChange(assoc.supplierId, e.target.value)}
                  placeholder={translate("items.update.tabs.supplier.supplierCodePlaceHolder")}
                  className="h-9 text-xs"
                />
              </div>
              <Button
                type="button"
                onClick={() => handleRemoveSupplier(assoc.supplierId)}
                variant="outline"
                className="h-9 rounded-xl border-destructive/30 px-3 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                {translate("items.update.tabs.supplier.removeSupplier")}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SupplierAssociationTab;
