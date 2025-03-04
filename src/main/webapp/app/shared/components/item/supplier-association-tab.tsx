import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { InputText } from "primereact/inputtext";
import { translate } from "react-jhipster";
import Select from "react-select";
import { IVariableItemVariant } from "app/shared/model/ITEM/retail/variable-item.model";
import { ISupplier } from "app/shared/model/STOCK/supplier.model";
import { Button } from "primereact/button";

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
  const navigate = useNavigate();

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
    <div className="p-3">
      <div className="p-field">
        <label htmlFor="supplier-add-dropdown" className="mr-3">
          {translate("items.update.tabs.supplier.selectSupplier")}
        </label>
        <div className="flex items-center">
          <Select
            inputId="supplier-add-dropdown"
            value={selectedSupplierForAdd}
            onChange={(option) => setSelectedSupplierForAdd(option as any)}
            options={availableSuppliers}
            placeholder={translate("items.update.tabs.supplier.selectSupplierPlaceHolder")}
            isSearchable
            className="w-64"
          />
          <button
            type="button"
            onClick={handleAddSupplier}
            className="ml-3 bg-blue-500 text-white px-4 py-2 rounded"
          >
            {translate("items.update.tabs.supplier.addSupplier")}
          </button>
        </div>
      </div>

      <div className="mt-4">
        {associations.map((assoc) => {
          const supplier = suppliers.find((s) => s.id === assoc.supplierId);
          return (
            <div key={assoc.supplierId} className="p-field flex items-center mb-4 align-items-baseline">
              <label htmlFor={`supplierCode-${assoc.supplierId}`} className="mr-3 w-40">
                {supplier ? supplier.name : assoc.supplierId}
              </label>
              <InputText
                id={`supplierCode-${assoc.supplierId}`}
                value={assoc.supplierCode}
                onChange={(e) => handleSupplierCodeChange(assoc.supplierId, e.target.value)}
                placeholder={translate("items.update.tabs.supplier.supplierCodePlaceHolder")}
              />
              <Button
                type="button"
                onClick={() => handleRemoveSupplier(assoc.supplierId)}
                severity="danger"
              >
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
