import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { InputText } from "primereact/inputtext";
import { translate } from "react-jhipster";
import Select from "react-select";

const SupplierAssociationTab = ({ variant, itemId, suppliers, onSupplierChange }) => {
  const navigate = useNavigate();

  const [variantSupplier, setVariantSupplier] = useState({
    selectedSupplierIds: [],
    supplierCode: "",
  });

  useEffect(() => {
    setVariantSupplier({
      selectedSupplierIds: variant?.supplierAssociation?.supplierIds || [],
      supplierCode: variant?.supplierAssociation?.supplierCode || "",
    });
  }, [variant]);

  const handleSupplierChange = (selectedIds) => {
    const updatedVariant = { ...variantSupplier, selectedSupplierIds: selectedIds };
    setVariantSupplier(updatedVariant);
    onSupplierChange({ supplierIds: selectedIds, supplierCode: updatedVariant.supplierCode });
  };

  const handleSupplierCodeChange = (code) => {
    const updatedVariant = { ...variantSupplier, supplierCode: code };
    setVariantSupplier(updatedVariant);
    onSupplierChange({ supplierIds: updatedVariant.selectedSupplierIds, supplierCode: code });
  };

  return (
    <div className="p-3">
      <div className="p-field">
        <label htmlFor={`suppliers-${variant.id}`} className="mr-3">
          {translate("items.update.tabs.supplier.selectSuppliers")}
        </label>
        <Select
          inputId={`suppliers-${variant.id}`}
          isMulti
          value={suppliers
            .filter((s) => (variantSupplier.selectedSupplierIds || []).includes(s.id))
            .map((s) => ({ label: s.name, value: s.id }))}
          onChange={(selected) => handleSupplierChange(selected.map((opt) => opt.value))}
          options={suppliers.map((s) => ({ label: s.name, value: s.id }))}
          placeholder={translate("items.update.tabs.supplier.selectSupplierPlaceHolder")}
          isSearchable
          className="w-100"
        />
      </div>

      <div className="p-field mt-4">
        <label htmlFor={`supplierCode-${variant.id}`} className="mr-3">
          {translate("items.update.tabs.supplier.supplierCode")}
        </label>
        <InputText
          id={`supplierCode-${variant.id}`}
          value={variantSupplier.supplierCode}
          onChange={(e) => handleSupplierCodeChange(e.target.value)}
          placeholder={translate("items.update.tabs.supplier.supplierCodePlaceHolder")}
        />
      </div>
    </div>
  );
};

export default SupplierAssociationTab;
