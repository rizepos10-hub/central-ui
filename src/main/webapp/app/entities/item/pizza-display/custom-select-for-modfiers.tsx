import React, {useEffect, useState} from 'react';

const CustomSelectForPizza = ({

                                selectedModifiersFromOptions,
                                setSelectedModifiersFromOptions,
                                option,
                                selectOptions,
                                optionMinWidth = null,
                                check = true,
                                missingRequiredOptionIds
                      }) => {
  const [showModifiers, setShowModifiers] = useState(false)


  const initialSelectModifiers = selectedModifiersFromOptions[option.id]?.map(mdfId => findModifierById(option, mdfId));


  const initialSelect = check ? initialSelectModifiers?.find(modifier => modifier?.definitionType === "TOPPING_SIZE")
  : initialSelectModifiers?.find(modifier => modifier?.definitionType !== "TOPPING_SIZE") ;




  const [selectedOption, setSelectedOption] = useState(initialSelect);






  console.log(initialSelectModifiers, 'initialSelectModifiers')



  function findModifierById(option, modifier) {
    return option?.modifiers.find(mdf => mdf.id === modifier.modifierId) || null;
  }


  const handleSelectChange = (selectedOption) => {
    setSelectedOption(selectedOption);

    setSelectedModifiersFromOptions((prevModifiers) => ({
      ...prevModifiers,
      [option.id]:
      [...(prevModifiers[option.id] || []).filter((modifier) => findModifierById(option,modifier)?.definitionType === 'TOPPING_AREA'),
        {modifierId : selectedOption.id , alwaysCalculated: true}],
    }));
  };

  return (

    <div style={{ minWidth: `${optionMinWidth ? optionMinWidth : '20 rem'}`, display: 'flex'}}  >
      <div className="d-flex flex-column">
      {missingRequiredOptionIds.includes(option.id) && (
        <div className="alert alert-danger text-sm " role="alert">
         Please select this required option.
        </div>
      )}
      { <div className="select-container"  onClick={() => setShowModifiers(prev => !prev)}>
        <div tabIndex={0} className="select-option">
          {selectedOption ? selectedOption.label : 'Select Modifier...'}
        </div>
        <div className="options-container" style={{display: showModifiers ? 'block' : 'none'}}  onBlur={() => setShowModifiers(false)}>
          {selectOptions?.map((modifier) => (
            <div key={modifier.id} onClick={() => handleSelectChange(modifier)} tabIndex={0} className="option">
              {modifier.label}

            </div>
          ))}
        </div>
      </div>}

      </div>
    </div>
  );
};

export default CustomSelectForPizza;
