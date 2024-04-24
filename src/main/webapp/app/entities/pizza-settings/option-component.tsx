import React, {useEffect, useState} from 'react';
import {Button, Modal, ModalBody, ModalFooter, ModalHeader, Label, Col, Row, Table} from 'reactstrap';
import {InputNumber} from "primereact/inputnumber";
import {Checkbox} from "primereact/checkbox";
import './required-option.css';
import CustomCreatableSelect from "app/entities/pizza-settings/custome-select";
import Select from "react-select";
import {useAppDispatch} from "app/config/store";
import {
  deleteDefinitionGroupOption,
  editDefinitionGroupOption
} from "app/entities/item-definitions/item-definitions.reducer";
import {areObjectsEqual, generateDependencyOptions, getModifierNames} from "app/entities/pizza-settings/utils";
import {TabPanel, TabView } from 'primereact/tabview';
import {Button as PrimeButton} from 'primereact/button'
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faTrash} from "@fortawesome/free-solid-svg-icons/faTrash";
import {AttachmentType} from "app/shared/model/ENUMS/attachment-type.model";
import {IAttachment} from "app/shared/model/attachment.model";
import Attachment from "app/shared/components/attachment/attachment";

interface newOption {
  id: string | null;
  affectOtherOption: boolean;
  name: string;
  desc: string;
  order: number | null;
  modifiers: Modifier[];
  definitionType: string;
  dependsOn: [];
  required: boolean;
  icon: IAttachment | null;
  builderImage: IAttachment | null;
}

interface Modifier {
  id?:string
  label: string;
  defaultPrice: number;
  modifiedPrices: any[];
  definitionType: string
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
  groups,
  optionRef
}

const NewRequiredOptionInputs: React.FC<NewRequiredOptionModalProps> = ({ groupId, pizzaDefinition,option,onOptionDelete,onOptionSave,groups,optionRef }) => {

  const dispatch = useAppDispatch()
  const [newOption, setNewOption] = useState<newOption>();


  const [showPricesModal, setShowPricesModal] = useState(false);
  const [dirtyState,setDirtyState] = useState(false)

  const [selectedAttachments, setSelectedAttachments] = useState([]);

  const [selectedModifierFromOption, setSelectedModifierFromOption]  = useState('');
  const [isUpdating,setIsUpdating] = useState(false)
  const allOptionsExceptCurrent = groups
    .flatMap(group => group.options?.filter(option => option.id !== newOption?.id)).filter(opt => opt?.affectOtherOption === true);

   const dependsOnOptions = allOptionsExceptCurrent.map(opt => ({label: opt?.name, value: opt?.id}))

  const toppingAreaModifiers = newOption?.modifiers.filter(mdf => mdf.definitionType === 'TOPPING_AREA')

  const [addedModifiedItem, setAddedModifiedItem] = useState<any>(null)
  const [showModifiersOptions, setShowModifiersOptions] = useState(false)

  const [selectedModifiersForModifiedPrices, setSelectedModifiersForModifiedPrices] = useState([]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [discard, setDiscard] = useState(false)


  const handleModifiersSelectChange = (optionId, selectedModifiersFromSelect) => {
    setSelectedModifiersForModifiedPrices((prev) => {
      const newModifiersState = { ...prev };

      if (!newModifiersState[optionId]) {
        newModifiersState[optionId] = [];
      }

      newModifiersState[optionId] = Array(selectedModifiersFromSelect).map((selectedModifier) =>  ({id:selectedModifier.value, label: selectedModifier.label}));

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



    const dependsOnOptionsIncluded = newOption.dependsOn.every((dependsOnOptionId) =>
      // eslint-disable-next-line no-prototype-builtins
      addedModifiedItem.optionsSelected?.hasOwnProperty(dependsOnOptionId)
    );

    if (!dependsOnOptionsIncluded) {
      alert("Not all dependsOn options are included in the new combination!");
      return;
    }

    setNewOption((prevOption) => {
      const updatedOption = { ...prevOption };


      const toppingAreaModifiersList = updatedOption?.modifiers.filter(mdf => mdf.definitionType === "TOPPING_AREA")
      const updatedModifiers = updatedOption.modifiers.filter(mdf => mdf.definitionType !== 'TOPPING_AREA')?.map((modifier, index) => {
        if (index === activeTabIndex) {
          return {
            ...modifier,
            modifiedPrices: [...modifier.modifiedPrices],
          };
        } else {
          return modifier;
        }
      });

      const exists = updatedModifiers[activeTabIndex].modifiedPrices.some((item) =>
        areObjectsEqual(item?.optionsSelected, addedModifiedItem?.optionsSelected)
      );
      console.log(updatedModifiers, 'updatedModifiers')
      console.log(addedModifiedItem, 'updatedModifiers')



      if (!exists) {
        updatedModifiers[activeTabIndex].modifiedPrices.push(addedModifiedItem);
        setAddedModifiedItem(null);
        setSelectedModifiersForModifiedPrices(null)
        setShowModifiersOptions((prev) => !prev);
      }else {
        alert("Item already exists!")
      }
      updatedOption.modifiers = [...updatedModifiers, ...toppingAreaModifiersList];
      console.log(updatedOption.modifiers, 'updatedOption.modifiers')
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
      setDiscard(false)
    }







  }, [isUpdating,option,discard]);

    console.log(newOption, 'optionoption')
  console.log(allOptionsExceptCurrent, 'allOptionsExceptCurrent')



  const handleDiscard = () => {
      setDiscard(true)
    setSelectedModifierFromOption(null)
  };


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

      const toppingAreaModifiersList = prevOption?.modifiers.filter(mdf => mdf.definitionType === "TOPPING_AREA")
      const updatedModifiers = prevOption?.modifiers?.filter(mdf => mdf.definitionType !== 'TOPPING_AREA')?.map((modifier, index) => {
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
        modifiers: [...updatedModifiers, ...toppingAreaModifiersList],
      };
    });
  };


  const handleCombinationPriceChange = (modifierIndex: number, combinationIndex: number, newPrice: number) => {
    setNewOption((prevOption) => {
      if (!prevOption) return null;

      const toppingAreaModifiersList = prevOption?.modifiers.filter(mdf => mdf.definitionType === "TOPPING_AREA")
      const updatedModifiers = (prevOption?.modifiers?.filter(mdf => mdf.definitionType !== 'TOPPING_AREA') || []).map((modifier, index) => {
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
        modifiers: [...updatedModifiers, ...toppingAreaModifiersList],
      };
    });
  };

  const handleDeleteCombination = (modifierIndex, combinedIndex) => {

    const isConfirmed = window.confirm("Are you sure you want to delete this combination?");
    if(isConfirmed){
      setNewOption((prevOption) => {
        const updatedOption = { ...prevOption };
        const updatedModifiers = [...updatedOption.modifiers];

        const updatedModifier = { ...updatedModifiers[modifierIndex] };
        const updatedModifiedPrices = [...updatedModifier.modifiedPrices];

        updatedModifiedPrices.splice(combinedIndex, 1);

        updatedModifier.modifiedPrices = updatedModifiedPrices;

        updatedModifiers[modifierIndex] = updatedModifier;

        updatedOption.modifiers = updatedModifiers;

        return updatedOption;
      });
    }
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
          definitionType: 'BASE'
        },
      ],
    }));
  };

  const handleDeleteModifier = (modifierToDelete) => {
    setNewOption((prevOption) => {
      const updatedModifiers = prevOption.modifiers.filter((modifier) => modifier.id !== modifierToDelete.id);

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
    if(newOption?.modifiers?.filter(mdf => mdf.definitionType !== 'TOPPING_AREA')?.length <= 0){
      alert("Please add modifiers first")
      return
    }
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

  const removeImage = (field) => {
    setNewOption(prev => ({
      ...prev,
      [field]: null
    }))
  }


  const addImage = (imageInfo,field) => {
    setNewOption(prev => ({
      ...prev,
      [field]: imageInfo
    }))
  }


  return (
    <div ref={optionRef}>
      <Col md="12">
      <div className="d-flex flex-column gap-2">
        <Row>
          <Col md={"3"}>
        <div contentEditable   suppressContentEditableWarning={true} className="option-name cursor-pointer"
             onInput={(e) => setNewOption({ ...newOption, name: e.currentTarget.innerText })}>
          {option?.name}
        </div>
            <span contentEditable className="subtitle cursor-pointer" onInput={(e) => setNewOption({ ...newOption, desc: e.currentTarget.innerText })}>
              {option.desc}
            </span>
          </Col>
          <Col md="8" className="d-flex flex-row gap-5">
            <div>

            {toppingAreaModifiers?.length > 0 && (
              <><label>Topping Area Modifiers:</label>
                <ul>
                  {toppingAreaModifiers.map((mdf, index) => (
                    <li key={index}>{mdf.label}</li>
                  ))}
                </ul>
              </>
            )}
      </div>

          <div className="d-flex flex-column ml-8">
            Modifiers
            <CustomCreatableSelect
           selectedModifierFromOption={selectedModifierFromOption}
           setSelectedModifierFromOption={setSelectedModifierFromOption}
           onAddModifier={handleAddModifier}
           optionModifiers={newOption?.modifiers}
           onDeleteModifier={handleDeleteModifier}
           onEditModifier={handleEditModifier}
           discard={discard}
         />
          </div>
            <div>
              {<PrimeButton className="mt-4" onClick={handleOpenPricesModal}>
                Set Prices
              </PrimeButton>}
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
                  {showModifiersOptions? 'X' : 'Add Modified Prices'}
                  </Button>
              </div>
            }
            {showModifiersOptions &&
              <div className="d-flex flex-column gap-3 mt-3">

                <div className="d-flex flex-column justify-content-start gap-3 mb-4 ">
                  {generateDependencyOptions(newOption?.dependsOn, allOptionsExceptCurrent).map((selectedOption, index) => (
                    <div key={index}>
                      Modifier(s) {index + 1}
                      {selectedOption.modifiers && (
                        <Select
                          key={`modifiers-${index}`}
                          options={selectedOption.modifiers.filter(mdf => mdf.definitionType !== "TOPPING_AREA").map((modifier) => ({...modifier, value: modifier.id}))}
                          onChange={(selectedModifiers) => handleModifiersSelectChange(selectedOption.id, selectedModifiers)}
                          // value={selectedOption.modifiers?.filter((modifier) =>
                          //   selectedModifiersForModifiedPrices[selectedOption.id]?.some((selectedModifier) => modifier.id === selectedModifier.id)
                          // ).map(mdf => ({...mdf, value: mdf.id})) || []}
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
            <TabView activeIndex={activeTabIndex} onTabChange={(e) => setActiveTabIndex(e.index)} >

              { newOption?.modifiers?.filter(mdf => mdf.definitionType !== 'TOPPING_AREA')?.map((modifier, index) => {
                console.log(modifier, 'modifiermodifier');
                return (
                  <TabPanel key={index} header={modifier.label}>
                    <div>
                      <Label for={`defaultPrice${index}`}>Default Price:</Label>
                      <InputNumber

                        id={`defaultPrice${index}`}
                        value={modifier?.defaultPrice}
                        onChange={(e) => handleDefaultPriceChange(index, e.value)}
                        mode="decimal"
                        maxFractionDigits={4}
                      />

                    </div>
                    {modifier?.modifiedPrices?.length > 0 && <Table>
                      <thead>
                      <tr>
                        <th>Label</th>
                        <th>Price</th>
                        <th>Action</th>
                      </tr>
                      </thead>
                      <tbody>
                      {modifier?.modifiedPrices?.map((combinedItem: any, combinedIndex) => {
                        const modifiedLabel = getModifierNames(combinedItem.optionsSelected, allOptionsExceptCurrent)
                        return (
                          <tr key={combinedIndex}>
                            <td>
                              {Object.values(modifiedLabel).join(', ')}
                            </td>
                            <td>
                              <InputNumber
                                value={combinedItem.price}
                                onChange={(e) => handleCombinationPriceChange(index, combinedIndex, e.value)}
                                mode="decimal"
                                maxFractionDigits={4}
                              />
                            </td>
                            <td>
                              <Button color="danger" onClick={() => handleDeleteCombination(index, combinedIndex)}>
                                <FontAwesomeIcon onClick={() => handleDeleteCombination(index, combinedIndex)}
                                                 border={false} icon={faTrash}/>
                              </Button>

                            </td>
                          </tr>)
                      })}
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

          <div  className="d-flex flex-row mt-3 gap-1">
            <Attachment
              image={newOption?.builderImage}
              onRemoveImage={removeImage}
              onAddImage={addImage}
              type={"Builder"}
            />
          </div>



          </Col>

            <Col md={"5"} className=" mt-4" >
              <Label for="dependsOn">Depends On:</Label>

                <Select
                  id="dependsOn"
                  isMulti
                  onChange={handleDependsOnChange}
                  options={dependsOnOptions}
                  value={getDependsOnValues()}
                  placeholder='Select the options the current option depends on'
                />
              <div  className="d-flex flex-row mt-3 gap-1">
                <Attachment
                  image={newOption?.icon}
                  onRemoveImage={removeImage}
                  onAddImage={addImage}
                  type={"Icon"}
                />
              </div>
            </Col>
      </div>

      </Col>
      <div className="d-flex justify-content-start gap-3" key={option.id}>
        <Button color="danger" disabled={isUpdating} onClick={handleDelete}>
          Delete
        </Button>

        {dirtyState &&   (
          <>
            <Button color="secondary" disabled={isUpdating} onClick={handleDiscard}>
            Discard
          </Button><Button color="primary" disabled={isUpdating} onClick={handleSave}>
            Save
          </Button>
          </>
        )}

      </div>
    </div>
  );
};

export default NewRequiredOptionInputs;


