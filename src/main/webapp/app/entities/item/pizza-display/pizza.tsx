import React, {useEffect, useState} from 'react';
import {
  Row,
  Col,
  Card,
  CardBody, Spinner,
} from 'reactstrap';

import {TabPanel, TabView} from "primereact/tabview";
import {useAppDispatch, useAppSelector} from "app/config/store";

import {
  checkAndFetchPizzaDefinition,
} from "app/entities/pizza-group/utils";
import {Dropdown} from "primereact/dropdown";
import CustomSelectForPizza from "app/entities/item/pizza-display/custom-select-for-modfiers";

const Pizza = () => {


  const dispatch = useAppDispatch()



  const itemDefinitions = useAppSelector(state => state.itemDefinitions.entities)
  const pizzaDefinition = itemDefinitions.find(item => item.definitionType === "PIZZA")
  const pizzaDefinitionLoading = useAppSelector(state => state.itemDefinitions.loading)

  const updateSuccess = useAppSelector(state => state.itemDefinitions.updateSuccess)
  const isUpdating = useAppSelector(state => state.itemDefinitions.updating)

  const [selectedModifiersFromOptions, setSelectedModifiersFromOptions]  = useState([]);

  console.log(pizzaDefinition, 'pizzaDefinition12')
  const [groups, setGroups] = useState([]);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(null);




  useEffect(() => {
    checkAndFetchPizzaDefinition(dispatch)

  }, []);



  useEffect(() => {
    if (pizzaDefinition?.groups?.length > 0) {
      console.log("helloworld");
      setGroups(pizzaDefinition?.groups);
      setSelectedGroupIndex(0)
    }
  }, [pizzaDefinition]);



  const group = groups[selectedGroupIndex]

  const handleTabChange = (e) => {
      setSelectedGroupIndex(e.index);
  };


















  console.log(groups, 'groupsgroups')




  if(pizzaDefinitionLoading){
    return <Spinner />
  }



  return (
    <Row>
      <h1>Pizza Definitions</h1>
      <Card>
        <CardBody>

          <Row>
            {groups.length > 0 && (
              <Col md="8">
                <TabView  activeIndex={selectedGroupIndex} scrollable onTabChange={handleTabChange}>
                  {groups.map((tab, index) => (
                    <TabPanel key={index}
                              header={<div style={{ outlineColor: '#eee189', userSelect: 'text' }}>
                                {tab.name}
                              </div>} />
                  ))}
                </TabView>
              </Col>
            )}
          </Row>

          <Row className="mt-3">
            <div className="d-flex justify-content-end">

            </div>
            <Col xs="12" style={{ minHeight: '20rem' }}>

              {selectedGroupIndex !== null && (
                <>
                  <div className="d-flex gap-3 mb-4">
                    <h4>
                      {groups[selectedGroupIndex]?.desc || 'default group description'}
                    </h4>
                  </div>
                  <div className="d-flex flex-column gap-3">
                    <h3>Base Options</h3>
                    {groups[selectedGroupIndex]?.options?.filter(opt => opt.definitionType === 'BASE').map((option) => {
                      return (
                        <Row key={option.id}>
                          <Col md={"6"}>
                            <div className="option-name ">
                              {option?.name}
                            </div>
                            <span className="subtitle ">
                              {option.desc}
                           </span>
                         </Col>
                          <Col md={"6"}>
                            {option.modifiers.length > 0 && (
                              <CustomSelectForPizza
                                key={option.id}
                                selectedModifiersFromOptions={selectedModifiersFromOptions}
                                setSelectedModifiersFromOptions={setSelectedModifiersFromOptions}
                                options={option.modifiers}
                                optionId={option.id}
                              />
                            )}
                          </Col>
                        </Row>
                      );
                    })}
                  </div>
                  <hr className="my-9" style={{ height: '2px', border: '1px solid #f00' }} />
                  <div className="d-flex flex-column gap-3 mt-5">
                    <h4>Topping Options</h4>
                    {groups[selectedGroupIndex]?.options?.filter(opt => opt.definitionType === 'TOPPING').map((option, index) => (
                      <React.Fragment key={option.id}>
                        <Dropdown

                        />
                        {index < groups[selectedGroupIndex]?.options?.length - 1 && (
                          <hr className="my-5 border border-dark"/>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </>
              )}
            </Col>
          </Row>
        </CardBody>
      </Card>
    </Row>
  );
};

export default Pizza;
