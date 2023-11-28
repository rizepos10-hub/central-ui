import React, {useEffect, useState} from 'react';
import CustomSelectForPizza from "app/entities/item/pizza-display/custom-select-for-modfiers";

function ToppingOptions ({option,selectedModifiersFromOptions,setSelectedModifiersFromOptions, missingRequiredOptionIds}) {


  console.log(option, 'modifiersmodifiers')
  const [showNextProp, setShowNextProp] = useState(false);

  const [isIconHovered, setIsIconHovered] = useState({left: false, middle: false, right: false,});
  const [isIconClicked, setIsIconClicked] = useState({left: false, middle: true, right: false,});


  const toppingAreaModifiers = option?.modifiers?.filter(mdf => mdf.definitionType === 'TOPPING_AREA') || [];
  const left = toppingAreaModifiers.find((mdf) => mdf.label === 'LEFT');
  const full = toppingAreaModifiers.find((mdf) => mdf.label === 'FULL');
  const right = toppingAreaModifiers.find((mdf) => mdf.label === 'RIGHT');

  console.log(toppingAreaModifiers, 'toppingAreaModifiers')
  console.log(left, 'left')
  console.log(right, 'right')






  function findModifierById(option, modifer) {
    return option?.modifiers.find(mdf => mdf.id === modifer.modifierId) || null;
  }

  const toggleSecondSection = () => {
    setShowNextProp((s) => !s);

    setSelectedModifiersFromOptions((prevModifiers) => {
      const updatedModifiers = { ...prevModifiers };
      if (option.id in updatedModifiers) {
        delete updatedModifiers[option.id];
      }else{
        setSelectedModifiersFromOptions((prevModifiers) => {
          const updatedModifiers = { ...prevModifiers };

          const toppingAreaModifiers = option?.modifiers?.filter(mdf => mdf.definitionType === 'TOPPING_AREA') || [];
          const toppingSizeModifiers = option?.modifiers?.filter(mdf => mdf.definitionType === 'TOPPING_SIZE') || [];

          // Filter existing modifiers by definition type
          updatedModifiers[option.id] = (prevModifiers[option.id] || [])
            .filter((modifier) => findModifierById(option, modifier)?.definitionType !== 'TOPPING_AREA');

          // Add the new modifier ID based on definition type
          if (toppingAreaModifiers.length > 0) {

            updatedModifiers[option.id].push({ modifierId: full.id, alwaysCalculated:true });
          }
          if (toppingSizeModifiers.length > 0) {
            console.log(toppingSizeModifiers[0].id, 'toppingSizeModifiers[0].id')
            updatedModifiers[option.id].push({modifierId: toppingSizeModifiers[0].id, alwaysCalculated:true});
          }

          return updatedModifiers;
        });
      }
      return updatedModifiers;
    });

  };

  function leftIconMouseEnterHandler () {
    setIsIconHovered((prevState) => ({
      ...prevState,
      left: true,
      middle: false,
      right: false,
    }));
  }


  function iconMouseLeaveHandler () {
    setIsIconHovered((prevState) => ({
      ...prevState,
      left: false,
      middle: false,
      right: false,
    }));
  }

  function middleIconMouseEnterHandler () {
    setIsIconHovered((prevState) => ({
      ...prevState,
      left: false,
      middle: true,
      right: false,
    }));
  }

  function rightIconMouseEnterHandler () {
    // When middle icon is hovered
    setIsIconHovered((prevState) => ({
      ...prevState,
      left: false,
      middle: false,
      right: true,
    }));
  }

  function leftIconClickHandler () {
    setIsIconClicked((prevState) => ({
      ...prevState,
      left: true,
      middle: false,
      right: false,
    }));

    setSelectedModifiersFromOptions((prevModifiers) => ({
      ...prevModifiers,
      [option.id]:  [...(prevModifiers[option.id] || [])
        .filter((modifier) => findModifierById(option,modifier)?.definitionType !== 'TOPPING_AREA'),
        {modifierId: left.id , alwaysCalculated: true }],
    }));

  }

  function middleIconClickHandler () {
    setIsIconClicked((prevState) => ({
      ...prevState,
      left: false,
      middle: true,
      right: false,
    }));

    setSelectedModifiersFromOptions((prevModifiers) => ({
      ...prevModifiers,
      [option.id]:  [...(prevModifiers[option.id] || [])
        .filter((modifier) => findModifierById(option,modifier)?.definitionType !== 'TOPPING_AREA'),
        { modifierId: full.id, alwaysCalculated: true }],

    }));
  }

  function rightIconClickHandler () {
    setIsIconClicked((prevState) => ({
      ...prevState,
      left: false,
      middle: false,
      right: true,
    }));

    setSelectedModifiersFromOptions((prevModifiers) => ({
      ...prevModifiers,
      [option.id]:  [...(prevModifiers[option.id] || [])
        .filter((modifier) => findModifierById(option,modifier)?.definitionType !== 'TOPPING_AREA'),
        { modifierId: right.id, alwaysCalculated: true } ],
    }));
  }

  console.log(missingRequiredOptionIds.includes(option.id), 'missingRequiredOptionIds includes')
  console.log(missingRequiredOptionIds, 'missingRequiredOptionIds ids')
  console.log(option, 'missingRequiredOptionIds option')


  return (
    <div className="container">
      {missingRequiredOptionIds.includes(option.id) && (
        <div className="alert alert-danger" role="alert">
          Please select all required options for {option.id}.
        </div>
      )}
      <div onClick={toggleSecondSection} className="border" style={{display:"table",cursor:"pointer", width:"100%" }} >
        <div style={{width:"45px", height:"45px",display: "table-cell", border: "px solid #000", padding: "5px"}}>
          <img style={{width:"40px", height:"40px"}} alt="builder img" src={option?.icon?.url}/>
        </div>
        <div style={{display: "table-cell", border: "px solid #000", padding: "5px"}}>
          {option?.name}
        </div>
        {selectedModifiersFromOptions[option.id]  &&
          < div style={{width:"24px", display: "table-cell", border: "px solid #000", padding: "5px"}}>
            <img style={{width:"16px", height:"16px"}} src="content/images/check.png"/>
          </div>
        }
      </div>

      {/*the below section*/}
      {(selectedModifiersFromOptions[option.id]) && (
        <div  className="border" style={{display:"table", width:"100%" }} >
          {/*the dropdown*/}
          <div  style={{padding:"5px", position: 'absolute', display: "table-cell",borderRight:"2px",  width:"24px", height:"45px"}}>

            <CustomSelectForPizza
              key={option.id}
              selectedModifiersFromOptions={selectedModifiersFromOptions}
              setSelectedModifiersFromOptions={setSelectedModifiersFromOptions}
              selectOptions={option?.modifiers?.filter(mdf => mdf.definitionType === 'TOPPING_SIZE')}
              option={option}
              optionMinWidth={'14rem'}
              check={true}
              missingRequiredOptionIds={[]}
            />
          </div>
          {/*pizza icons*/}

          <div  style={{borderLeft: "1px solid #dee2e6" , display: "table-cell", padding: "5px", width:"25%", height:"24px"}}>
            <div style={{  display: "flex", justifyContent: "center", alignItems: "center"}}>

              {left && <div className="custom-control custom-radio"
                    style={{display: "inline-block", padding: "10px", textAlign: "center"}}>
                <input type="radio" id="radio1" name="customRadio" className="d-none custom-control-input"/>
                <label onMouseEnter={leftIconMouseEnterHandler}
                       onMouseLeave={iconMouseLeaveHandler}
                       onClick={leftIconClickHandler}
                       className="custom-control-label cursor-pointer" htmlFor="radio1">
                  <img
                    src={isIconHovered?.left || isIconClicked?.left ? "content/images/left-red-circle.svg" : "content/images/left-gray-circle.svg"}
                    alt="Option 1"
                    className="radio-image"
                    style={{width: "20px"}}/>
                </label>
              </div>}

              {full && <div className="custom-control custom-radio"
                    style={{display: "inline-block", padding: "10px", textAlign: "center"}}>
                <input type="radio" id="radio1" name="customRadio" className="d-none custom-control-input"/>
                <label className="custom-control-label cursor-pointer"
                       onMouseEnter={middleIconMouseEnterHandler}
                       onMouseLeave={iconMouseLeaveHandler}
                       onClick={middleIconClickHandler}
                       htmlFor="radio1">
                  <img
                    src={isIconHovered?.middle || isIconClicked?.middle ? "content/images/red-circle.svg" : "content/images/gray-circle.svg"}
                    alt="Option 1" className="radio-image" style={{width: "20px"}}/>
                </label>
              </div>}

              {right && <div className="custom-control custom-radio"
                    style={{display: "inline-block", padding: "10px", textAlign: "center"}}>
                <input type="radio" id="radio1" name="customRadio" className="d-none custom-control-input"/>
                <label
                  onMouseEnter={rightIconMouseEnterHandler}
                  onMouseLeave={iconMouseLeaveHandler}
                  onClick={rightIconClickHandler}
                  className="custom-control-label cursor-pointer" htmlFor="radio1">
                  <img
                    src={isIconHovered?.right || isIconClicked?.right ? "content/images/right-red-circle.svg" : "content/images/right-gray-circle.svg"}
                    alt="Option 1" className="radio-image" style={{width: "20px"}}/>
                </label>
              </div>}
            </div>

          </div>
        </div>
      )}
    </div>
  );

}

export default ToppingOptions;
