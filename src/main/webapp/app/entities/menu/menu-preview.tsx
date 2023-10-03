import React, {useEffect, useState} from 'react';
import {Col, Container, Row} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';



const MenuPreview = ({data}) => {
  const [subScreensList, setSubScreensList] = useState([]);
  useEffect(() => {
  }, []);
  function mainScreenBtnClickHandler (mainScreen: any) {
    setSubScreensList( [mainScreen]);
  }
  function subScreenBtnClickHandler(subScreen: any) {
    if(subScreen?.componentType === "SUB_SCREENS"){
      setSubScreensList((prev) => [...prev,subScreen]);
    }
  }
  function  subScreenLinkClickHandler(index: number) {
    if(index < subScreensList.length-1){// check if the clicked link is not the last one
      const newList = subScreensList;
      newList.splice(index+1);
      setSubScreensList(() => [...newList])
    }
  }
  return (
    <Container>
      <Row className="gap-2">
        <Col  xs={3} sm={3} md={3} lg={3} xl={3}  className="rounded-top p-0" style={{height:"510px",backgroundColor: "#fcecdd", overflowY: 'auto'}}>
          {data?.menuScreens.map((mainScreen, index) => (
            <div  key={index} onClick={() => mainScreenBtnClickHandler(mainScreen)} style={{marginBottom: '1px',backgroundColor: mainScreen?.backgroundColor, cursor:"pointer"}} className="p-4 pt-5 pb-5   text-white text-center">
              {mainScreen?.name}
            </div>
          ))}
        </Col>
        <Col  xs={8} sm={8} md={8} lg={8} xl={8} style={{backgroundColor: "#fcecdd", height:"510px", overflowY: 'auto'}}>
          {
            <>
              <div style={{ display: 'flex' }}  >
                {subScreensList.map((subScreen, index) => (
                  <div onClick={() => subScreenLinkClickHandler(index)}  key={index} className="text-black text-center ml-2" style={{cursor:"pointer", position: "relative"}}>
                    {index>0 &&
                      <span> / </span>
                    }
                    {subScreen?.name}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent:'center'}}  >
                {
                  subScreensList[subScreensList.length-1]?.subScreens?.map((subScreen, index) => (
                    <div key={index} onClick={() => subScreenBtnClickHandler(subScreen)} style={{marginBottom: '1px',borderBottom:`2px solid ${subScreen.backgroundColor}` , backgroundColor:"white", cursor:"pointer", height:"100px"}} className="p-3 col-5 m-3 text-black rounded-top text-center ">
                      {subScreen?.name}
                      {subScreen?.componentType === "SUB_SCREENS" &&
                        <div>
                          <FontAwesomeIcon icon={faArrowRight} />
                        </div>
                      }
                    </div>
                  ))}
              </div>
            </>
          }
        </Col>
      </Row>
    </Container>
  );
};
export default MenuPreview;
