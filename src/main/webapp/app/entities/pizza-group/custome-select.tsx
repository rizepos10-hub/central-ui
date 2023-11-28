import React, { useEffect, useState } from 'react';
import "./required-option.css"
import {Button} from "primereact/button";
import {InputText} from "primereact/inputtext";
import {faTrash} from "@fortawesome/free-solid-svg-icons/faTrash";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faPencilAlt} from "@fortawesome/free-solid-svg-icons/faPencilAlt";
const CustomSelect = ({
                        optionModifiers,
                        onAddModifier,
                        onDeleteModifier,
                        onEditModifier,
                        selectedModifierFromOption,
                        setSelectedModifierFromOption,
  discard
                      }) => {
  const modifiersOptions = optionModifiers?.filter(mdf => mdf.definitionType !== 'TOPPING_AREA')?.map((mdf) => ({ ...mdf, label: mdf.label, value: mdf.id, name: mdf.label }));
  const [modifiers, setModifiers] = useState(  []);
  const [newModifierLabel, setNewModifierLabel] = useState('');
  const [showModifiers, setShowModifiers] = useState(false)
  const [isAddingNewModifier, setIsAddingNewModifier] = useState(false);
  const [isEditing, setIsEditing] = useState(false);





  useEffect(() => {
    console.log("hereeee")
    setModifiers(() => ([
      ...modifiersOptions || [], {label: '+', value: '+'}
    ]))
  },[discard,optionModifiers])

  const handleSelectChange = (selectedOption) => {
    setSelectedModifierFromOption(selectedOption);
console.log(selectedOption, 'selectedOption')
    if (selectedOption.value === '+') {
      setIsAddingNewModifier(true);
    } else {
      setIsAddingNewModifier(false);
    }
  };

  const handleModifierLabelChange = (e) => {
    const newLabel = e.target.value
    setNewModifierLabel(newLabel)

  };

  const handleAddModifiers = () => {
    if (newModifierLabel.trim() === '') {
      alert('Please enter your new modifiers');
      return;
    }

    setModifiers([...modifiers, { label: newModifierLabel, value: newModifierLabel }]);
    onAddModifier(newModifierLabel);
    setNewModifierLabel('');
    setSelectedModifierFromOption({label: newModifierLabel});
    setIsAddingNewModifier(false);
  };

  const handleDeleteModifier = (deletedModifier) => {
    const updatedModifiers = modifiers.filter((modifier) => modifier.value !== deletedModifier.value);
    setModifiers(updatedModifiers);
    setIsEditing(false);
    onDeleteModifier(deletedModifier);
    setSelectedModifierFromOption('');
  };

  const handleEditModifier = () => {
    setNewModifierLabel(selectedModifierFromOption.label)
    setIsEditing(prev => !prev);
  };

  const handleSaveEdit = () => {
    const updatedModifiers = modifiers.map((modifier) =>
      modifier.value === selectedModifierFromOption.value ? { ...modifier, label: newModifierLabel } : modifier
    );
    setModifiers(updatedModifiers);
    setIsEditing(false);
    onEditModifier({ oldModifierId: selectedModifierFromOption.value, newLabel: newModifierLabel });
    setSelectedModifierFromOption((prev) => ({...prev, label:newModifierLabel}));
    setNewModifierLabel('');
  };



  return (

    <div style={{ minWidth: '20rem', display: 'flex', flexDirection: `${isAddingNewModifier? 'column' : 'row'}` }}  >
      {!isEditing && <div className="select-container"  onClick={() => setShowModifiers(prev => !prev)}>
        <div tabIndex={0} className="select-option">
          {selectedModifierFromOption?.label || "Select Modifier..."}
        </div>
        <div className="options-container" style={{display: showModifiers ? 'block' : 'none'}}  onBlur={() => setShowModifiers(false)}>
          {modifiers?.map((modifier) => (
            <div key={modifier.value} onClick={() => handleSelectChange(modifier)} tabIndex={0} className="option">
              {modifier.label}
              {modifier.label !== '+' &&
                <Button style={{padding: 'revert'}} severity="danger" onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteModifier(modifier)
                }}>
                  X
                </Button>}
            </div>
          ))}
        </div>
      </div>}

      {isEditing && (
        <div className="p-inputgroup">
          <InputText value={newModifierLabel} onChange={handleModifierLabelChange} />
          <Button onClick={handleSaveEdit}>Confirm</Button>
        </div>
      )}
      {selectedModifierFromOption && selectedModifierFromOption.label !== '+' &&
        <div className="mx-2">
          <Button severity={"secondary"} style={{marginTop: `${!isEditing ? '5px': ''}`}} onClick={handleEditModifier}>
            {isEditing ? "Cancel" : <FontAwesomeIcon  icon={faPencilAlt}/>}
          </Button>
        </div>}

      {isAddingNewModifier && (
        <div className="w-full my-3">
          <div className="d-flex gap-2">
            <InputText value={newModifierLabel} onChange={handleModifierLabelChange} />
            <Button onClick={handleAddModifiers}>Add Modifier</Button>
          </div>
        </div>
      )}


    </div>
  );
};

export default CustomSelect;
