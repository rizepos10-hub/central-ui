import React, {useEffect, useState} from 'react';

const CustomSelectForPizza = ({
                                options,
                                selectedModifiersFromOptions,
                        setSelectedModifiersFromOptions,
                                optionId
                      }) => {
  const modifiersOptions = options?.filter(mdf => mdf.definitionType !== 'TOPPING_AREA')?.map((mdf) => ({ ...mdf, label: mdf.label, value: mdf.id, name: mdf.label }));
  const [showModifiers, setShowModifiers] = useState(false)



  const [selectedOption, setSelectedOption] = useState(null);

  useEffect(() => {
    setSelectedOption(selectedModifiersFromOptions[optionId] || null);
  }, [selectedModifiersFromOptions, optionId]);

  const handleSelectChange = (selectedOption) => {
    setSelectedOption(selectedOption);

    setSelectedModifiersFromOptions((prevModifiers) => ({
      ...prevModifiers,
      [optionId]: selectedOption,
    }));
  };

  return (

    <div style={{ minWidth: '20rem', display: 'flex'}}  >
      { <div className="select-container"  onClick={() => setShowModifiers(prev => !prev)}>
        <div tabIndex={0} className="select-option">
          {selectedOption ? selectedOption.label : 'Select Modifier...'}
        </div>
        <div className="options-container" style={{display: showModifiers ? 'block' : 'none'}}  onBlur={() => setShowModifiers(false)}>
          {modifiersOptions?.map((modifier) => (
            <div key={modifier.value} onClick={() => handleSelectChange(modifier)} tabIndex={0} className="option">
              {modifier.label}

            </div>
          ))}
        </div>
      </div>}


    </div>
  );
};

export default CustomSelectForPizza;
