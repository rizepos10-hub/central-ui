import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MultiSelect } from "primereact/multiselect";
import { InputText } from "primereact/inputtext";
import { translate } from 'react-jhipster';

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
          <h3>{`Variant ${variant.name}`}</h3>

          {/* MultiSelect for Suppliers */}
          <div className="p-field">
            <label htmlFor={`suppliers-${variant.id}`} className="mr-3">{translate('items.update.tabs.supplier.selectSuppliers')}</label>
            <MultiSelect
              id={`suppliers-${variant.id}`}
              value={variantSuppliers[index]?.selectedSupplierIds || []} // Pre-select based on supplierIds in variantSuppliers
              options={suppliers.map(s => ({ label: s.name, value: s.id }))} // Map suppliers to MultiSelect format
              onChange={(e) => handleSupplierChange(index, e.value)}
              placeholder={translate('items.update.tabs.supplier.selectSupplierPlaceHolder')}
              display="chip"
              filter
              filterPlaceholder={translate('items.update.tabs.supplier.searchSuppliers')}
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
