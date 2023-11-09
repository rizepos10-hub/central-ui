import React, { useState } from 'react';
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";

const CustomSelect = ({selectedOption, setSelectedOption,OptionProps}) => {
  const [options, setOptions] = useState([OptionProps]);
  const [newOption, setNewOption] = useState('');
  const [isAddingNewOption, setIsAddingNewOption] = useState(false);


  const generateDropdownOptions = () => {
    return [...options, '+'].map(opt => ({ label: opt, value: opt }));
  };

  const handleSelectChange = (e) => {
    const selectedOption = e.target.value;

    setSelectedOption(selectedOption);

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
    setNewOption('');
    setSelectedOption(newOption)
    setIsAddingNewOption(false);
  };

  return (
    <div>
      <Dropdown
        style={{minWidth: "15rem"}}
        value={selectedOption}
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
