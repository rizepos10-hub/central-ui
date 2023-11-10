import React, {useEffect, useState} from 'react';
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";

const CustomSelect = ({modifiers,onAddModifier,selectedModifierOption,setSelectedModifierOption}) => {

  const modifiersOptions = modifiers.map(mdf => ({label: mdf.label, value: mdf.id}))
  const [options, setOptions] = useState(modifiersOptions || []);
  const [newOption, setNewOption] = useState('');
  const [isAddingNewOption, setIsAddingNewOption] = useState(false);





  const generateDropdownOptions = () => {

    return [...options, {label : '+', value: '+'}]
  };
  console.log(modifiers, 'modifiers')

  const handleSelectChange = (e) => {
    const selectedOption = e.target.value;

    setSelectedModifierOption(selectedOption);

    if (selectedOption === '+') {
      setIsAddingNewOption(true);
    } else {
      setIsAddingNewOption(false);
    }
  };

  const handleNewOptionChange = (e) => {
    setNewOption(e.target.value);
  };

  const handleAddOption = () => {
    if(newOption.trim() === ""){
      alert("Please enter your new option")
      return
    }
    setOptions([...options, newOption]);
    onAddModifier(newOption)
    setNewOption('');
    console.log(newOption, 'newOption')
    setSelectedModifierOption(newOption)
    setIsAddingNewOption(false);
  };

  return (
    <div>
      <Dropdown
        style={{minWidth: "15rem"}}
        placeholder="Select a Modifier"
        value={selectedModifierOption}
        options={generateDropdownOptions()}
        onChange={handleSelectChange}
      />

      {isAddingNewOption && (
        <div>
          <InputText value={newOption} onChange={handleNewOptionChange} />
          <Button onClick={handleAddOption}>Add</Button>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
