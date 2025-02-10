import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MultiSelect } from "primereact/multiselect";
import { InputText } from "primereact/inputtext";
import { translate } from 'react-jhipster';
import Select from "react-select";

const SupplierAssociationTab = ({ variants, itemId, suppliers, onSupplierChange }) => {
  const navigate = useNavigate();

  const [variantSuppliers, setVariantSuppliers] = useState([]);

  useEffect(() => {
    const initialSuppliersState = variants.map(variant => ({
      selectedSupplierIds: variant?.supplierAssociation?.supplierIds || [], // Use supplierIds for pre-selected IDs
      supplierCode: variant?.supplierAssociation?.supplierCode || '', // Pre-existing supplier code
    }));
    setVariantSuppliers(initialSuppliersState);
  }, [variants]);

  const handleSupplierChange = (index, selectedIds) => {
    const updatedVariants = [...variantSuppliers];
    updatedVariants[index].selectedSupplierIds = selectedIds; // Update selected supplier IDs for the variant
    setVariantSuppliers(updatedVariants);
    onSupplierChange(index, { supplierIds: selectedIds, supplierCode: updatedVariants[index].supplierCode });
  };

  const handleSupplierCodeChange = (index, code) => {
    const updatedVariants = [...variantSuppliers];
    updatedVariants[index].supplierCode = code; // Update supplier code for the variant
    setVariantSuppliers(updatedVariants);
    onSupplierChange(index, { supplierIds: updatedVariants[index].selectedSupplierIds, supplierCode: code });
  };


  return (
    <div className="p-3">
      {variants.map((variant, index) => (
        <div key={variant.id} className="variant-supplier-section mb-4">
          {/* MultiSelect for Suppliers */}
          <div className="p-field">
            <label htmlFor={`suppliers-${variant.id}`} className="mr-3">{translate('items.update.tabs.supplier.selectSuppliers')}</label>
            <Select
              inputId={`suppliers-${variant.id}`}
              isMulti
              value={suppliers
                .filter(s => (variantSuppliers[index]?.selectedSupplierIds || []).includes(s.id))
                .map(s => ({ label: s.name, value: s.id }))}
              onChange={(selected) => handleSupplierChange(index, selected.map(opt => opt.value))}
              options={suppliers.map(s => ({ label: s.name, value: s.id }))}
              placeholder={translate('items.update.tabs.supplier.selectSupplierPlaceHolder')}
              isSearchable
              className="w-100"
            />
          </div>

          {/* Input for Supplier Code */}
          <div className="p-field mt-4">
            <label htmlFor={`supplierCode-${variant.id}`} className="mr-3">{translate('items.update.tabs.supplier.supplierCode')}</label>
            <InputText
              id={`supplierCode-${variant.id}`}
              value={variantSuppliers[index]?.supplierCode || ''} // Ensure supplierCode is handled correctly
              onChange={(e) => handleSupplierCodeChange(index, e.target.value)}
              placeholder={translate('items.update.tabs.supplier.supplierCodePlaceHolder')}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default SupplierAssociationTab;
