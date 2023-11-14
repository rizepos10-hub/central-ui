import React, {useEffect, useState} from 'react';
import {Button, Modal, ModalBody, ModalFooter, ModalHeader, Input, Label, Col, Row, Table} from 'reactstrap';
import {InputText} from "primereact/inputtext";
import {InputNumber} from "primereact/inputnumber";
import {Checkbox} from "primereact/checkbox";
import './required-option.css';
import CustomCreatableSelect from "app/entities/pizza-group/custome-select";
import Select from "react-select";
import {useAppDispatch, useAppSelector} from "app/config/store";
import {
  deleteDefinitionGroupOption,
  editDefinitionGroupOption
} from "app/entities/item-definitions/item-definitions.reducer";
import {combineModifiers} from "app/entities/pizza-group/utils";
import _default from "chart.js/dist/plugins/plugin.tooltip";
import numbers = _default.defaults.animations.numbers;
import {TabPanel, TabView } from 'primereact/tabview';

interface NewRequiredOption {
  id: string | null;
  affectOtherOption: boolean;
  name: string;
  desc: string;
  order: number | null;
  modifiers: Modifier[];
  definitionType: string;
  dependsOn: [];
  required: boolean;
}

interface Modifier {
  label: string;
  defaultPrice: number;
  modifiedPrices: any[];
}



interface  Combination{
  price: number
  modifierIds: string[]
}

interface NewRequiredOptionModalProps {
  pizzaDefinition?: any
  groupId?:string
  option
  onOptionDelete
  onOptionSave
  groups
}

const NewRequiredOptionInputs: React.FC<NewRequiredOptionModalProps> = ({ groupId, pizzaDefinition,option,onOptionDelete,onOptionSave,groups }) => {

  const dispatch = useAppDispatch()
  const updateSuccess = useAppSelector(state => state.itemDefinitions.updateSuccess)
  const [newOption, setNewOption] = useState<NewRequiredOption>();

  const [newModifier, setNewModifier] = useState<any>({
     label: '',
      defaultPrice: 0,
     modifiedPrices: [],
  });

  const [showPricesModal, setShowPricesModal] = useState(false);
  const [dirtyState,setDirtyState] = useState(false)

  const [selectedModifierOption, setSelectedModifierOption]  = useState('');
  const [isUpdating,setIsUpdating] = useState(false)
  const allOptionsExceptCurrent = groups
    .flatMap(group => group.options?.filter(option => option.id !== newOption?.id));

 const dependsOnOptions = allOptionsExceptCurrent.map(opt => ({label: opt?.name, value: opt?.id}))





  const updateCombinedModifiers = () => {
    const newModifiers = combineModifiers(option, allOptionsExceptCurrent);
    setNewOption((prevOption) => ({
      ...prevOption,
      modifiers: newModifiers,
    }));
    console.log(newModifiers, 'newModifiersnewModifiers')
  };



  useEffect(() => {

    if (JSON.stringify(option) !== JSON.stringify(newOption)) {
      setDirtyState(true);
    } else {
      setDirtyState(false);
    }


  }, [option, newOption,isUpdating]);


  console.log(option.modifiers, 'modifi')
  useEffect(() => {


    if ( option) {
      setNewOption(option);
      updateCombinedModifiers();
    }







  }, [isUpdating,option]);

    console.log(newOption, 'optionoption')
  console.log(option, 'optionoption111')





  const handleSave = async () => {
      setIsUpdating(true);
      const optionToUpdate = {...newOption, id: option.id}
       console.log(optionToUpdate, 'optionToUpdate')
      await dispatch(editDefinitionGroupOption({ option: optionToUpdate, id: pizzaDefinition.id, groupId }));
      setIsUpdating(false);

      onOptionSave(optionToUpdate)

  };



  const getDependsOnValues = () => {
    return newOption?.dependsOn?.map((dependsOnId) => {
      const option = allOptionsExceptCurrent.find((opt) => opt.id === dependsOnId);
      return { label:option?.name, value: option?.id}
    });
  };







  const handleDefaultPriceChange = (modifierIndex: number, newDefaultPrice: number) => {
    setNewOption((prevOption) => {
      if (!prevOption) return null;

      const updatedModifiers = prevOption?.modifiers.map((modifier, index) => {
        if (index === modifierIndex) {
          return {
            ...modifier,
            defaultPrice: newDefaultPrice,
          };
        }
        return modifier;
      });

      return {
        ...prevOption,
        modifiers: updatedModifiers,
      };
    });
  };


  const handleCombinationPriceChange = (modifierIndex: number, combinationIndex: number, newPrice: number) => {
    setNewOption((prevOption) => {
      if (!prevOption) return null;

      const updatedModifiers = (prevOption?.modifiers || []).map((modifier, index) => {
        if (index === modifierIndex) {
          const updatedCombinationPrices = (modifier.modifiedPrices || []).map(
            (combination, comboIndex) => {
              if (comboIndex === combinationIndex) {
                return {
                  ...combination,
                  price: newPrice,
                };
              }
              return combination;
            }
          );

          return {
            ...modifier,
            modifiedPrices: updatedCombinationPrices,
          };
        }
        return modifier;
      });

      return {
        ...prevOption,
        modifiers: updatedModifiers,
      };
    });
  };


  const handleAddModifier = (newModifierLabel) => {
    setNewOption((prevOption) => ({
      ...prevOption,
      modifiers: [
        ...prevOption.modifiers,
        {
          label: newModifierLabel,
            defaultPrice: 0,
          modifiedPrices: [],
        },
      ],
    }));
  };

  const handleDependsOnChange = (selectedOptions) => {
    const selectedOptionIds = selectedOptions.map((opt) => opt.value);
    setNewOption({ ...newOption, dependsOn: selectedOptionIds });
  };


  const handleOpenPricesModal = () => {
    setShowPricesModal(true);
  };


  const handleClosePricesModal = () => {
    setShowPricesModal(false);
  };

  const handleDelete = async () => {
    setIsUpdating(true);
    await dispatch(deleteDefinitionGroupOption({ id: pizzaDefinition.id, groupId, optionId: newOption?.id }));
    setIsUpdating(false);
    onOptionDelete(newOption?.id);

  };



  return (
    <>
      <Col md="12">
      <div className="d-flex flex-column gap-2">
        <Row>
          <Col md={"3"}>
        <div contentEditable  suppressContentEditableWarning={true} className="option-name"
             onInput={(e) => setNewOption({ ...newOption, name: e.currentTarget.innerText })}>
          {option?.name}
        </div>
            <span contentEditable className="subtitle" onInput={(e) => setNewOption({ ...newOption, desc: e.currentTarget.innerText })}>
              {option.desc}
            </span>
          </Col>
          <Col md="6" className="d-flex flex-row gap-5">
         <CustomCreatableSelect
           selectedModifierOption={selectedModifierOption}
           setSelectedModifierOption={setSelectedModifierOption}
           onAddModifier={handleAddModifier}
           modifiers={option?.modifiers}
         />
            <div>
              <Button severity="help" onClick={handleOpenPricesModal}>
                Set Prices
              </Button>
            </div>
          </Col>
        </Row>
      </div>
      <div className="d-flex my-3 gap-1">
        <Modal isOpen={showPricesModal} toggle={handleClosePricesModal}>
          <ModalHeader toggle={handleClosePricesModal}>Set Prices</ModalHeader>
          <ModalBody>
            <TabView>
              {newOption?.modifiers?.map((modifier, index) => {
                console.log(modifier, 'modifiermodifier');
                return (
                  <TabPanel key={index} header={modifier.label}>
                    <div>
                      <Label for={`defaultPrice${index}`}>Default Price:</Label>
                      <InputNumber
                        id={`defaultPrice${index}`}
                        value={modifier?.defaultPrice}
                        onChange={(e) => handleDefaultPriceChange(index, e.value)}
                      />
                    </div>
                    <Table>
                      <thead>
                      <tr>
                        <th>Label</th>
                        <th>Price</th>
                      </tr>
                      </thead>
                      <tbody>
                      {modifier?.modifiedPrices?.map((combinedItem: any, combinedIndex) => (
                        <tr key={combinedIndex}>
                          <td>{combinedItem.label}</td>
                          <td>
                            <InputNumber
                              value={combinedItem.price}
                              onChange={(e) => handleCombinationPriceChange(index, combinedIndex, e.value)}
                            />
                          </td>
                        </tr>
                      ))}
                      </tbody>
                    </Table>
                  </TabPanel>
                );
              })}
            </TabView>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={handleClosePricesModal}>
              Update Modifier
            </Button>
          </ModalFooter>
        </Modal>




        <Col md={"3"}>
            <div  className="d-flex flex-row mt-3 gap-1">
              <Label for="affectOtherOption">Affect Other Option:</Label>
              <Checkbox
                checked={newOption?.affectOtherOption}
                onChange={(e) => setNewOption({...newOption, affectOtherOption: e.target.checked})}/>
            </div>
            <div  className="d-flex flex-row mt-3 gap-1">
              <Label for="requiredOption">Required:</Label>
              <Checkbox
                checked={newOption?.required}
                onChange={(e) => setNewOption({...newOption, required: e.target.checked})}/>
            </div>

          </Col>

            <Col md={"5"} className=" mt-3" >
              <Label for="dependsOn">Depends On:</Label>

                <Select
                  id="dependsOn"
                  isMulti
                  onChange={handleDependsOnChange}
                  options={dependsOnOptions}
                  value={getDependsOnValues()}
                />
            </Col>
      </div>

      </Col>
      <div className="d-flex justify-content-start gap-3" key={option.id}>
        <Button color="danger" disabled={isUpdating} onClick={handleDelete}>
          Delete
        </Button>
        {dirtyState &&   (
          <Button color="primary" disabled={isUpdating} onClick={handleSave}>
            Save
          </Button>
        )}

      </div>
    </>
  );
};

export default NewRequiredOptionInputs;


