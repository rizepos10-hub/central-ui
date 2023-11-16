import React, { useEffect, useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';

const CustomSelect = ({ optionModifiers, onAddModifier, onDeleteModifier, onEditModifier, selectedModifierOption, setSelectedModifierOption }) => {
  const modifiersOptions = optionModifiers.map((mdf) => ({ label: mdf.label, value: mdf.id }));
  const [modifiers, setModifiers] = useState(modifiersOptions || []);
  const [newModifier, setNewModifier] = useState('');
  const [isAddingNewModifier, setIsAddingNewModifier] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const generateDropdownOptions = () => {
    return [...modifiers, { label: '+', value: '+' }];
  };

  const handleSelectChange = (e) => {
    const selectedOption = e.target.value;

    setSelectedModifierOption(selectedOption);

    if (selectedOption === '+') {
      setIsAddingNewModifier(true);
    } else {
      setIsAddingNewModifier(false);
    }
  };

  const handleModifierLabelChange = (e) => {
    setNewModifier(e.target.value);
  };

  const handleAddModifiers = () => {
    if (newModifier.trim() === '') {
      alert('Please enter your new modifiers');
      return;
    }
    setModifiers([...modifiers, { label: newModifier, value: newModifier }]);
    onAddModifier({ label: newModifier, value: newModifier });
    setNewModifier('');
    setSelectedModifierOption(newModifier);
    setIsAddingNewModifier(false);
  };

  const handleDeleteModifier = () => {
    const updatedModifiers = modifiers.filter((modifier) => modifier.value !== selectedModifierOption);
    setModifiers(updatedModifiers);
    setIsEditing(false)
    onDeleteModifier(selectedModifierOption);
    setSelectedModifierOption('');
  };

  const handleEditModifier = () => {
    setIsEditing(true);
  };
  const handleSaveEdit = () => {
    const updatedModifiers = modifiers.map((modifier) => modifier.value === selectedModifierOption ? {...modifier, label: newModifier} : modifier)
    setModifiers(updatedModifiers)
    setIsEditing(false);
    onEditModifier({ oldModifierId: selectedModifierOption, newLabel: newModifier });
    setSelectedModifierOption(newModifier);
    setNewModifier('');
  };

  const handleCancel = () => {
    setIsEditing(false)
    setIsAddingNewModifier(false)
  }

  return (
    <div>

      <Dropdown
        style={{ minWidth: '15rem' }}
        placeholder="Select a Modifier"
        value={selectedModifierOption}
        options={generateDropdownOptions()}
        onChange={handleSelectChange}
      />
      { (isEditing || isAddingNewModifier) ? (
        <Button onClick={handleCancel} label="Cancel" severity="help" raised />
      ):
      (
        <Button severity="danger" raised  onClick={handleDeleteModifier} disabled={!selectedModifierOption}>
          Delete
        </Button>
      )}
      {isAddingNewModifier ? (
        <div>
          <InputText value={newModifier} onChange={handleModifierLabelChange} />
          <Button onClick={handleAddModifiers}>Add</Button>
        </div>
      ) :
        isEditing ? (
            <div>
              <InputText value={newModifier} onChange={handleModifierLabelChange} />
              <Button severity="secondary" onClick={handleSaveEdit}>Save</Button>
            </div>
          ) : (
        <div className="d-flex justify-content-between">

          <Button  severity="secondary" onClick={handleEditModifier} disabled={!selectedModifierOption}>
            Edit
          </Button>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
