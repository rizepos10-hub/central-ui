import {FormGroup} from "reactstrap";
import {Translate} from "react-jhipster";
import {InputText} from "primereact/inputtext";
import React, {useState} from "react";
import {ITaxonomy} from "app/shared/model/taxonomy.model";
import {useAppDispatch, useAppSelector} from "app/config/store";
import {createEntity as CreateAttribute} from "app/entities/item/retail/attributes/retail-attribute.reducer";
import {createEntity as CreateAttributeValue} from "app/entities/item/retail/attributes/retail-attribute-values.reducer";
import {Button} from "primereact/button";
import {ITerm} from "app/shared/model/term.model";

type RetailAttributeType = "Attribute" | "Attribute Value" | null;

type RetailAttributeAddProps = {
  type: RetailAttributeType;
  attributeId?: string;
};

const RetailAttributeAdd: React.FC<RetailAttributeAddProps> = ({ type, attributeId = null }) => {
  const dispatch = useAppDispatch();
  const [newAttribute, setNewAttribute] = useState<ITaxonomy | ITerm>({});

  const updating = useAppSelector(state => state.retailAttribute.updating);


  const handleInputChange = (e) => {
    const {name, value} = e.target;
    setNewAttribute((prev) => ({
      ...prev,
      [name] : value
    }))
  }
  const handleSave = (e) => {
    e.preventDefault();
    if (type === "Attribute"){
      dispatch(CreateAttribute(newAttribute))
    }
    else{
      const entity = {
        ...newAttribute,
        taxonomy: { id :attributeId }
      }
      dispatch(CreateAttributeValue(entity))
    }

    setNewAttribute({})
  }
  return (
    <>

      <form onSubmit={handleSave}>
        <FormGroup>

          <div className={"d-flex flex-column gap-2"}>
            <label>
              Name
            </label>
            <div className={"d-flex gap-3 mt-1"}>
            <InputText
              required={true}
              type="text"
              name="name"
              id="name"
              placeholder={`${type} name`}
              value={newAttribute.name}
              onChange={handleInputChange}
            />

            <Button  disabled={updating} label="Add Attribute" type="submit" />

          </div>
          </div>
        </FormGroup>

      </form>

    </>
  )
}

export default RetailAttributeAdd
