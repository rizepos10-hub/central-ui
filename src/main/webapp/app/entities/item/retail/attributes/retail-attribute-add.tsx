import {FormGroup} from "reactstrap";
import {translate, Translate} from "react-jhipster";
import {InputText} from "primereact/inputtext";
import React, {useRef, useState} from "react";
import {ITaxonomy} from "app/shared/model/taxonomy.model";
import {useAppDispatch, useAppSelector} from "app/config/store";
import {createEntity as createAttribute} from "app/entities/item/retail/attributes/retail-attribute.reducer";
import {createEntity as createAttributeValue} from "app/entities/item/retail/attributes/retail-attribute-values.reducer";
import {Button} from "primereact/button";
import {ITerm} from "app/shared/model/term.model";

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
    <>

      <form onSubmit={handleSave}>
        <FormGroup>

          <div className={"d-flex flex-column gap-2"}>
            <label>
              <Translate contentKey={'retailAttributes.update.create.label'}>Name</Translate>
            </label>
            <div className={"d-flex gap-3 mt-1"}>
              <div className={"d-flex gap-3 mt-1"}>
                <InputText
                  required={true}
                  type="text"
                  name="name"
                  id="name"
                  placeholder={
                    type === "Attribute"
                      ? translate("retailAttributes.update.create.placeholder")
                      : translate("retailAttributes.update.edit.placeholder")
                  }
                  ref={inputRef}
                />
              </div>

            <Button  disabled={updating} label={type === 'Attribute' ? translate('retailAttributes.update.create.action'): translate('retailAttributes.update.edit.action')} type="submit" />

          </div>
          </div>
        </FormGroup>

      </form>

    </>
  )
}

export default RetailAttributeAdd
