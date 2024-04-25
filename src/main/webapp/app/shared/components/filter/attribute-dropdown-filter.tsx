import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import Select from 'react-select';
import { ITaxonomy } from 'app/shared/model/taxonomy.model';
import { ITerm } from 'app/shared/model/term.model';
import {
  getEntities as getAttributeValues,
  reset as resetAttributeValues
} from "app/entities/item/retail/attributes/retail-attribute-values.reducer";
import { Button, Col, Label } from "reactstrap";
import AsyncSelect from "react-select/async";

type AttributeFilterProps = {
  availableAttributes: [];
  onAttributeValuesSelect: () => void;
};

const AttributeDropdownFilter = ({ filteredAttributes, availableAttributes, onAttributeValuesSelect, defaultAttribute, defaultAttrValues}) => {
  const dispatch = useAppDispatch();

  const [itemAttribute, setItemAttribute] = useState<{
    attributeTax: ITaxonomy;
    attributeTerms: ITerm[];
  } | null>(defaultAttribute ? {
    attributeTax: defaultAttribute,
    attributeTerms: defaultAttrValues?.[0]?.id ? defaultAttrValues : []
  } : null);

  const attributeValuesList = useAppSelector(state => state.retailAttributeValue.entities);
  const loadingAttributesValues = useAppSelector(state => state.retailAttributeValue.loading);


  const handleAttributeValuesChange = (selectedAttributesValues, e) => {
    if (e.action === "clear") {
      const removedIds = e.removedValues.map(attr => `${attr.id}-${attr.taxonomy.key}`);
      filteredAttributes = filteredAttributes.filter(attr => !removedIds.includes(`${attr.default.id}-${attr.default.taxonomy.key}`));
    }

    const modifiedValues = selectedAttributesValues.map(attrValue => ({
      ...attrValue,
      value: attrValue.id,
      id: attrValue.id,
      name: attrValue?.name,
      default: attrValue,
      matchMode: 'EQUALS'
    }));

    const uniqueAttributes = [...filteredAttributes, ...modifiedValues].reduce((acc, attr) => {
      const key = `${attr.default.id}-${attr.default.taxonomy.key}`;
      if (!acc.keySet.has(key)) {
        acc.keySet.add(key);
        acc.uniqueAttributes.push(attr);
      }
      return acc;
    }, { uniqueAttributes: [], keySet: new Set() }).uniqueAttributes;

    setItemAttribute((prevState) => ({
      ...prevState, attributeTerms: modifiedValues
    }))
    onAttributeValuesSelect("attributes.attributeTerms.id", { operator: "AND", constraints: uniqueAttributes });
  };



  const handleItemAttributeSelect = async (selectedOption, e) => {
    if (e.action === "clear") {
      const removedAttributeId = e?.removedValues?.[0]?.id;
      const uniqueAttributes = filteredAttributes.filter(attr =>  attr.default.taxonomy.id !== removedAttributeId);
      onAttributeValuesSelect("attributes.attributeTerms.id", { operator: "AND", constraints: uniqueAttributes });

    } else if (selectedOption) {

      const response :any = await dispatch(getAttributeValues({
        id: selectedOption.id,
        size: 400,
        sort: 'asc',
        page: 0
      }));

      const attrValue = response?.payload?.data?.[0];
      const modifiedAttributeValue = {
        ...attrValue,
        value: attrValue.id,
        id: attrValue.id,
        name: attrValue?.name,
        default: attrValue,
        matchMode: 'EQUALS'
      }

      setItemAttribute({ attributeTax: selectedOption, attributeTerms: [attrValue] });
      const existingId = itemAttribute?.attributeTax?.id;
      if(existingId){
        const uniqueAttributes = filteredAttributes.filter(attr =>  attr.default.taxonomy.id !== existingId);
        onAttributeValuesSelect("attributes.attributeTerms.id", { operator: "AND", constraints: [...uniqueAttributes, modifiedAttributeValue] });
      }else{
        onAttributeValuesSelect("attributes.attributeTerms.id", { operator: "AND", constraints: [...filteredAttributes, modifiedAttributeValue] });
      }
    }
  };


  const loadOptions = (attributeId) => {
    dispatch(resetAttributeValues())
    dispatch(getAttributeValues({
      id: attributeId,
      size: 400,
      sort: 'asc',
      page: 0
    }));
  };


  return (
    <div className={"d-flex flex-row gap-3"}>
      <div className={'d-flex flex-column'}>
        <Select
          value={itemAttribute?.attributeTax || null}
          options={availableAttributes}
          placeholder={"Select Attribute"}
          styles={{control: (baseStyles) => ({
            ...baseStyles,
                minWidth: "18rem"
            })}}
          isClearable
          getOptionValue={option => option.id}
          getOptionLabel={option => option.name}
          onChange={handleItemAttributeSelect}
        />
      </div>
      <div className={'d-flex flex-column'}>
        <AsyncSelect
          value={itemAttribute?.attributeTerms}
          isDisabled={!itemAttribute?.attributeTax}
          getOptionLabel={option => option.name}
          getOptionValue={option => option.id}
          styles={{control: (baseStyles) => ({
              ...baseStyles,
              minWidth: "18rem"
            })}}
          placeholder={"Select Attribute Value"}
          isLoading={loadingAttributesValues}
          onFocus={() => loadOptions(itemAttribute?.attributeTax?.id)}
          defaultOptions={attributeValuesList}
          isMulti
          onChange={handleAttributeValuesChange}
        />
      </div>
    </div>
  );
};

export default AttributeDropdownFilter;
