import React, {useState} from 'react';

function OptionalContainer () {

  const [showNextProp, setShowNextProp] = useState(false);

  const [isIconHovered, setIsIconHovered] = useState({left: false, middle: false, right: false,});
  const [isIconClicked, setIsIconCliked] = useState({left: false, middle: false, right: false,});

  const toggleSecondSection = () => {
    setShowNextProp((s) => !s);
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
    setIsIconCliked((prevState) => ({
      ...prevState,
      left: true,
      middle: false,
      right: false,
    }));

  }

  function middleIconClickHandler () {
    setIsIconCliked((prevState) => ({
      ...prevState,
      left: false,
      middle: true,
      right: false,
    }));
  }

  function rightIconClickHandler () {
    setIsIconCliked((prevState) => ({
      ...prevState,
      left: false,
      middle: false,
      right: true,
    }));
  }

  return (
    <div className="container">
      <div onClick={toggleSecondSection} className="border" style={{display:"table",cursor:"pointer", width:"100%" }} >
          <div style={{width:"45px", height:"45px",display: "table-cell", border: "px solid #000", padding: "5px"}}>
            <img style={{width:"40px", height:"40px"}} src="https://assets.gabrielpizza.com/static/img/builder/toppings/MOD11.png"/>
          </div>
          <div style={{display: "table-cell", border: "px solid #000", padding: "5px"}}>
            Anchovies
          </div>
        {showNextProp &&
          < div style={{width:"24px", display: "table-cell", border: "px solid #000", padding: "5px"}}>
            <img style={{width:"16px", height:"16px"}} src="content/images/check.png"/>
          </div>
        }
      </div>

      {/*the below section*/}
      {showNextProp && (
        <div  className="border" style={{display:"table", width:"100%" }} >
          {/*the dropdown*/}
          <div  style={{padding:"5px", display: "table-cell",borderRight:"2px",  width:"24px", height:"45px"}}>
            <select style={{width:"100%",height:"100%", cursor:"pointer",outline: "none", border:"none", background:"transparent" }} id="dropdown">
              <option value="apple">Regular</option>
              <option value="banana">Extra</option>
              <option value="cherry">Easy</option>
            </select>
          </div>
          {/*pizza icons*/}
          <div  style={{borderLeft: "1px solid #dee2e6" , display: "table-cell", padding: "5px", width:"25%", height:"24px"}}>
            <div style={{  display: "flex", justifyContent: "center", alignItems: "center"}}>

              <div className="custom-control custom-radio" style={{display: "inline-block",  padding: "10px", textAlign:"center"}}>
                <input type="radio" id="radio1" name="customRadio" className="d-none custom-control-input"/>
                <label onMouseEnter={leftIconMouseEnterHandler}
                       onMouseLeave={iconMouseLeaveHandler}
                       onClick={leftIconClickHandler}
                       className="custom-control-label cursor-pointer" htmlFor="radio1">
                  <img
                    src={isIconHovered?.left || isIconClicked?.left ? "content/images/left-red-circle.svg" : "content/images/left-gray-circle.svg"}
                    alt="Option 1"
                    className="radio-image"
                    style={{width:"20px"}}/>
                </label>
              </div>

              <div className="custom-control custom-radio" style={{display: "inline-block", padding: "10px", textAlign:"center"}}>
                <input type="radio" id="radio1" name="customRadio" className="d-none custom-control-input"/>
                <label className="custom-control-label cursor-pointer"
                       onMouseEnter={middleIconMouseEnterHandler}
                       onMouseLeave={iconMouseLeaveHandler}
                       onClick={middleIconClickHandler}
                       htmlFor="radio1">
                  <img src={isIconHovered?.middle || isIconClicked?.middle ? "content/images/red-circle.svg": "content/images/gray-circle.svg"} alt="Option 1" className="radio-image" style={{width:"20px"}}/>
                </label>
              </div>

              <div className="custom-control custom-radio" style={{display: "inline-block", padding: "10px", textAlign:"center"}}>
                <input type="radio" id="radio1" name="customRadio" className="d-none custom-control-input"/>
                <label
                  onMouseEnter={rightIconMouseEnterHandler}
                  onMouseLeave={iconMouseLeaveHandler}
                  onClick={rightIconClickHandler}
                  className="custom-control-label cursor-pointer" htmlFor="radio1">
                  <img src={isIconHovered?.right || isIconClicked?.right ? "content/images/right-red-circle.svg": "content/images/right-gray-circle.svg"} alt="Option 1" className="radio-image" style={{width:"20px"}}/>
                </label>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );

}

export default OptionalContainer;
