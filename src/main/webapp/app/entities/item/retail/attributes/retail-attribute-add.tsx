import {translate, Translate} from "react-jhipster";
import React, {useRef, useState} from "react";
import {ITaxonomy} from "app/shared/model/taxonomy.model";
import {useAppDispatch, useAppSelector} from "app/config/store";
import {createEntity as createAttribute} from "app/entities/item/retail/attributes/retail-attribute.reducer";
import {createEntity as createAttributeValue} from "app/entities/item/retail/attributes/retail-attribute-values.reducer";
import {ITerm} from "app/shared/model/term.model";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type RetailAttributeType = "Attribute" | "Attribute Value" | null;

type RetailAttributeAddProps = {
  type: RetailAttributeType;
  attributeId?: string;
};

const RetailAttributeAdd: React.FC<RetailAttributeAddProps> = ({ type, attributeId = null }) => {
  const dispatch = useAppDispatch();
  const inputRef = useRef<HTMLInputElement>(null);

  const updating = useAppSelector(state => state.retailAttribute.updating);


  const handleSave = (e) => {
    e.preventDefault();
    const inputValue = inputRef.current?.value;

    if (type === "Attribute"){
      dispatch(createAttribute({ name: inputValue }));
    }
    else{
      const entity = {
        name: inputValue,
        taxonomy: { id :attributeId }
      }
      dispatch(createAttributeValue(entity))
    }

    inputRef.current.value = ""
  }
  return (
    <form onSubmit={handleSave} className="space-y-3">
      <div className="space-y-2">
        <label className="text-xs font-medium">
          <Translate contentKey={'retailAttributes.update.create.label'}>Name</Translate>
        </label>
        <div className="flex gap-2">
          <Input
            required={true}
            type="text"
            name="name"
            id="name"
            className="h-8 text-xs"
            placeholder={
              type === "Attribute"
                ? translate("retailAttributes.update.create.placeholder")
                : translate("retailAttributes.update.edit.placeholder")
            }
            ref={inputRef}
          />
          <Button
            disabled={updating}
            type="submit"
            size="sm"
            className="h-8 text-xs"
          >
            {type === 'Attribute' ? translate('retailAttributes.update.create.action'): translate('retailAttributes.update.edit.action')}
          </Button>
        </div>
      </div>
    </form>
  )
}

export default RetailAttributeAdd
