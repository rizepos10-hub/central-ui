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
import {areObjectsEqual, generateDependencyOptions} from "app/entities/pizza-group/utils";
import _default from "chart.js/dist/plugins/plugin.tooltip";
import numbers = _default.defaults.animations.numbers;
import {TabPanel, TabView } from 'primereact/tabview';
import {cloneDeep} from "lodash";
import {Button as PrimeButton} from 'primereact/button'

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
  id?:string
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
  const [newOption, setNewOption] = useState<NewRequiredOption>();



  const [showPricesModal, setShowPricesModal] = useState(false);
  const [dirtyState,setDirtyState] = useState(false)

  const [selectedModifierOption, setSelectedModifierOption]  = useState('');
  const [isUpdating,setIsUpdating] = useState(false)
  const allOptionsExceptCurrent = groups
    .flatMap(group => group.options?.filter(option => option.id !== newOption?.id)).filter(opt => opt.affectOtherOption === true);

 const dependsOnOptions = allOptionsExceptCurrent.map(opt => ({label: opt?.name, value: opt?.id}))

  const [addedModifiedItem, setAddedModifiedItem] = useState<any>(null)
  const [showModifiersOptions, setShowModifiersOptions] = useState(false)

  const [selectedOptions, setSelectedOptions] = useState([]);
  const [selectedModifiersForModifiedPrices, setSelectedModifiersForModifiedPrices] = useState([]);

  const handleOptionsSelectChange = (selectedOptionsFromSelect) => {
    setSelectedOptions(selectedOptionsFromSelect);

  };

  const handleModifiersSelectChange = (optionId, selectedModifiersFromSelect) => {
    setSelectedModifiersForModifiedPrices((prev) => {
      const newModifiersState = { ...prev };

      if (!newModifiersState[optionId]) {
        newModifiersState[optionId] = [];
      }

      newModifiersState[optionId] = selectedModifiersFromSelect.map((selectedModifier) =>  ({id:selectedModifier.value, label: selectedModifier.label}));

      const modifierLabels = Object.values(newModifiersState).flatMap((labelsArray) => labelsArray.map((labelObject) => labelObject.label));

      const optionsSelectedEntries = Object.fromEntries(
        Object.entries(newModifiersState)
          .filter(([key, value]) => value.length > 0)
          .map(([key, value]) => [key, value.map(entry => entry.id)])
      );
      console.log(optionsSelectedEntries, 'optionsSelectedEntries')




      const result = {
        optionsSelected: optionsSelectedEntries,
        price: 0,
        label: modifierLabels.join(' | '),
      };
      setAddedModifiedItem(result)
      console.log(result, 'resultresult')

      return newModifiersState;
    });
  };



  console.log(selectedModifiersForModifiedPrices, 'selectedModifiersForModifiedPrices')
  // Assuming selectedModifiersForModifiedPrices is an array of selected modifiers

  const updateNewOptionModifiers = () => {

    setNewOption((prevOption) => {
      const updatedOption = { ...prevOption };

      updatedOption.modifiers = updatedOption.modifiers.map((modifier) => {
        const updatedModifier = { ...modifier };

        updatedModifier.modifiedPrices = [...modifier.modifiedPrices];

        const isItemExists = updatedModifier.modifiedPrices.some((item) => {

          return areObjectsEqual(item?.optionsSelected,addedModifiedItem?.optionsSelected);
        });

        if (!isItemExists) {
          updatedModifier.modifiedPrices.push(addedModifiedItem);
          setShowModifiersOptions(prev => !prev)
        } else {
          alert("Item already exists!");
        }
        return updatedModifier;
      });
      setAddedModifiedItem(null)


      return updatedOption;
    });

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
    }







  }, [isUpdating,option]);

    console.log(newOption, 'optionoption')
  console.log(allOptionsExceptCurrent, 'allOptionsExceptCurrent')





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

  const handleDeleteModifier = (modifierLabelId) => {
    setNewOption((prevOption) => {
      const updatedModifiers = prevOption.modifiers.filter((modifier) => modifier.id !== modifierLabelId);

      return {
        ...prevOption,
        modifiers: updatedModifiers,
      };
    });
  };

  const handleEditModifier = ({ oldModifierId, newLabel }) => {
    console.log(oldModifierId, 'oldModifierId', newLabel, 'newLAbel')
    setNewOption((prevOption) => {
      const updatedModifiers = prevOption.modifiers.map((mdf) => {
        console.log(mdf, 'oldModifierIdoldModifierId' )
        return (
          mdf.id === oldModifierId ? {...mdf, label: newLabel} : mdf
        )
      })

      return {
        ...prevOption,
        modifiers: updatedModifiers,
      };
    });
  };

  console.log(newOption, 'newOption')
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
    const confirmDelete = window.confirm("Are you sure you want to delete this option?");

    if (confirmDelete) {
      setIsUpdating(true);
      await dispatch(deleteDefinitionGroupOption({ id: pizzaDefinition.id, groupId, optionId: newOption?.id }));
      setIsUpdating(false);
      onOptionDelete(newOption?.id);
    }
  };


  const handleShowModifiersOptions = () => {
    setShowModifiersOptions((prev) => !prev)
  }

 ;

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
           optionModifiers={option?.modifiers}
           onDeleteModifier={handleDeleteModifier}
           onEditModifier={handleEditModifier}
         />
            <div>
              <PrimeButton  onClick={handleOpenPricesModal}>
                Set Prices
              </PrimeButton>
            </div>
          </Col>
        </Row>
      </div>
      <div className="d-flex my-3 gap-1">
        <Modal isOpen={showPricesModal} toggle={handleClosePricesModal}>
          <ModalHeader toggle={handleClosePricesModal}>Set Prices</ModalHeader>
          <ModalBody>
            {newOption?.dependsOn?.length > 0 &&
              <div className="d-flex justify-content-end">
                <Button color={`${!showModifiersOptions ? 'primary' : 'danger'}`} onClick={handleShowModifiersOptions}>
                  {showModifiersOptions? 'X' : 'Add Modifiers'}
                  </Button>
              </div>
            }
            {showModifiersOptions &&
              <div className="d-flex flex-column gap-3 mt-3">
                <Select options={generateDependencyOptions(newOption?.dependsOn, allOptionsExceptCurrent)}
                        onChange={(selectedOptions) => handleOptionsSelectChange(selectedOptions)}
                        isMulti={true}
                        value={selectedOptions}/>
                <div className="d-flex flex-column justify-content-start gap-3 mb-4 ">
                  {selectedOptions.map((selectedOption, index) => (
                    <div key={index}>
                      Modifier(s) {index + 1}
                      {selectedOption.modifiers && (
                        <Select
                          key={`modifiers-${index}`}
                          options={selectedOption.modifiers.map((modifier) => ({...modifier, value: modifier.id}))}
                          onChange={(selectedModifiers) => handleModifiersSelectChange(selectedOption.id, selectedModifiers)}
                          isMulti={true}
                          value={selectedOption.modifiers?.filter((modifier) =>
                            selectedModifiersForModifiedPrices[selectedOption.id]?.some((selectedModifier) => modifier.id === selectedModifier.id)
                          ).map(mdf => ({...mdf, value: mdf.id})) || []}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>}
            {showModifiersOptions && addedModifiedItem &&
              <PrimeButton className="my-3" onClick={updateNewOptionModifiers}>
                Add New Dependent Modifier
              </PrimeButton>}
            <TabView >

              { newOption?.modifiers?.map((modifier, index) => {
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
                    {modifier?.modifiedPrices?.length > 0 && <Table>
                      <thead>
                      <tr>
                        <th>Label</th>
                        <th>Price</th>
                      </tr>
                      </thead>
                      <tbody>
                      {modifier?.modifiedPrices?.map((combinedItem: any, combinedIndex) => (
                        <tr key={combinedIndex}>
                          <td>{modifier.label} ({combinedItem.label})</td>
                          <td>
                            <InputNumber
                              value={combinedItem.price}
                              onChange={(e) => handleCombinationPriceChange(index, combinedIndex, e.value)}
                            />
                          </td>
                        </tr>
                      ))}
                      </tbody>
                    </Table>}
                  </TabPanel>
                );
              })}
            </TabView>
          </ModalBody>
          <ModalFooter>
            <PrimeButton  onClick={handleClosePricesModal}>
              Update Modifier
            </PrimeButton>
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
                  placeholder='Select the options the current option depends on'
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


