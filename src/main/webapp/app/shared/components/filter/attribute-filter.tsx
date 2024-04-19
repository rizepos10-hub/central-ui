import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from 'primereact/button';
import { Label } from 'reactstrap';
import AttributeDropdownFilter from "app/shared/components/filter/attribute-dropdown-filter";
import { getEntities as getAttributeValues } from "app/entities/item/retail/attributes/retail-attribute-values.reducer";
import { useAppDispatch, useAppSelector } from "app/config/store";
import { getEntities as getAttributes } from "app/entities/item/retail/attributes/retail-attribute.reducer";

const AttributeFilter = ({
  filteredAttributes,
  onFilterValueChange
}) => {
  const dispatch = useAppDispatch();
  const attributesList = useAppSelector(state => state.retailAttribute.entities);

  const filteredAvailableAttributes = useMemo(() => {
    const filteredAttributesIds = filteredAttributes?.map(atr => atr?.taxonomy?.id);
    const selectedAttributesSet = new Set(filteredAttributesIds);
    return attributesList?.filter(attr => !selectedAttributesSet.has(attr.id));
  }, [attributesList, filteredAttributes]);


  const handleAttributeValues = useCallback( (attributeId, callback) => {
    if (!attributeId) return;
    dispatch(getAttributeValues({ id: attributeId, size: 10, sort: 'asc', page: 0 }))
      .then((response: any) => {
        const attrValues = response?.payload?.data;
        if (attrValues) {
          const [firstAttrValue] = attrValues;
          const { id: attrValueId, name, taxonomy } = firstAttrValue || {};
          const newConstraint = {
            value: attrValueId,
            id: attrValueId,
            name,
            default: firstAttrValue,
            taxonomy,
            matchMode: 'EQUALS'
          };

          callback(newConstraint);
        }
      });
  }, []);

  const addAttrDropDown =  (attributeId) => {
    handleAttributeValues(attributeId, (newConstraint) => {
      const updatedFilters = {
        operator: "AND",
        constraints: [...filteredAttributes, newConstraint]
      };
      onFilterValueChange("attributes.attributeTerms.id", updatedFilters);
    });
  };

  useEffect(() => {
    dispatch(getAttributes({}));

  }, []);

  const groupedAttributes = {};
  filteredAttributes?.forEach((item: any) => {
    const defaultTaxonomy = item?.taxonomy;
    if (defaultTaxonomy) {
      const taxonomyKey = defaultTaxonomy.key;
      if (!groupedAttributes[taxonomyKey]) {
        groupedAttributes[taxonomyKey] = [];
      }
      groupedAttributes[taxonomyKey].push(item);
    }
  });

  const attributesListing = Object.keys(groupedAttributes)?.map((attr, i) => {
    const attributeId = groupedAttributes[attr]?.[0]?.default?.taxonomy?.id;
    return (
      <AttributeDropdownFilter
        key={attributeId}
        defaultAttribute={groupedAttributes[attr]?.[0]?.default?.taxonomy}
        defaultAttrValues={groupedAttributes[attr]}
        onAttributeValuesSelect={onFilterValueChange}
        availableAttributes={filteredAvailableAttributes}
        filteredAttributes={filteredAttributes}
      />
    );
  });



  return (
    <div className={"d-flex flex-column gap-1"}>
      <div>
        <Label className={'font-semibold'}>Attributes</Label>
      </div>
      <div className={"card d-flex flex-column gap-3"} style={{ maxHeight: "400px", overflowY: "auto" }}>
        <Button disabled={filteredAvailableAttributes.length <= 0} size={"small"} className={"ml-auto"}
                icon="pi pi-plus"
                onClick={() => addAttrDropDown(filteredAvailableAttributes?.[0]?.id)}
                rounded outlined  text aria-label="Filter" />
        {filteredAttributes.length > 0 ? attributesListing : (
          <AttributeDropdownFilter
            defaultAttribute={null}
            defaultAttrValues={null}
            onAttributeValuesSelect={onFilterValueChange}
            availableAttributes={filteredAvailableAttributes}
            filteredAttributes={filteredAttributes}
          />
        )}
      </div>
    </div>
  );
};
export default AttributeFilter;
