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
import CustomSelectForPizza from "app/entities/item/pizza-display/custom-select-for-modfiers";
import ToppingOptions from "app/entities/item/pizza-display/topping-options";
import {Button} from "primereact/button";

const Pizza = ({selectedModifiersFromOptions, setSelectedModifiersFromOptions}) => {

  const dispatch = useAppDispatch()
  const itemDefinitions = useAppSelector(state => state.itemDefinitions.entities)
  const pizzaDefinition = itemDefinitions.find(item => item.definitionType === "PIZZA")
  const pizzaDefinitionLoading = useAppSelector(state => state.itemDefinitions.loading)


  console.log(pizzaDefinition, 'pizzaDefinition12')
  const [groups, setGroups] = useState([]);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(null);

  const allOptions = groups.flatMap(group => group.options)

  const optionsMap = allOptions.reduce((map, option) => {
    map[option.id] = option;
    return map;
  }, {});


  const optionIds = Object.keys(selectedModifiersFromOptions);

  const retrievedOptionsBuilderUrl = optionIds.map(optionId => optionsMap[optionId].builderImage?.url);







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


  console.log(selectedModifiersFromOptions, 'selectedModifiersFromOptions')
  console.log(allOptions, 'allOptionsallOptions')


  const handleTabChange = (e) => {
      setSelectedGroupIndex(e.index);
  };

  if(pizzaDefinitionLoading){
    return <Spinner />
  }

  return (
    <Row>
      <Col md={4}>
        <div className="d-flex justify-content-center text-4xl" style={{color: '#ffc107'}}>
          Create A Pizza
        </div>
        <div>
          <div className="position-relative w-full d-block"
            style={{height: '50vh', maxWidth: '100vw',margin: '1rem auto'}}>
            <div>
              {
                retrievedOptionsBuilderUrl?.map((optionObj, index) => (
                  <div key={index}
                       className="position-absolute"
                       style={{top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden', zIndex: 2}}>

                    <img
                         src={optionObj}
                         alt=""
                         className="position-absolute"
                         style={{opacity: 1, height: 'auto',top: 0, left: 0, width: '100%'  }}
                    />

                    <img
                      src={optionObj}
                      alt=""
                      className="position-absolute"
                      style={{opacity: 1, height: 'auto',top: 0, left: 0, width: '100%'  }}
                    />

                  </div>

                ))}
            </div>
            <img
              src="https://assets.gabrielpizza.com/static/img/builder/pizza.png"
              alt=""
              className="w-full h-auto"
            />

          </div>
        </div>
      </Col>

      <Col md={8}>


          <Row>
            {groups.length > 0 && (
              <Col md="12">
                <TabView  activeIndex={selectedGroupIndex} scrollable onTabChange={handleTabChange}>
                  {groups.map((tab, index) => (
                    <TabPanel key={index}
                              header={<div >
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
                    <h6>
                      {groups[selectedGroupIndex]?.desc}
                    </h6>
                  </div>
                  <div className="d-flex flex-column gap-3">
                    {groups[selectedGroupIndex]?.options?.filter(opt => opt.definitionType === 'BASE').map((option, index) => {
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
                                selectOptions={option.modifiers}
                                option={option}
                                check={false}
                              />
                            )}

                          </Col>
                          {index < groups[selectedGroupIndex]?.options?.length - 1 && (
                            <hr className="my-5 border border-dark"/>
                          )}
                        </Row>
                      );
                    })}
                  </div>
                  <div className="d-flex gap-3 mb-4">
                    <h6>
                      {groups[selectedGroupIndex]?.additionalDesc }
                    </h6>
                  </div>
                  <div className="d-flex flex-wrap  my-5">
                    {groups[selectedGroupIndex]?.options?.filter(opt => opt.definitionType === 'TOPPING').map((option, index) => (
                      <div key={option.id} className="col-md-6 mb-8">
                        <ToppingOptions
                          key={option.id}
                          option={option}
                          selectedModifiersFromOptions={selectedModifiersFromOptions}
                          setSelectedModifiersFromOptions={setSelectedModifiersFromOptions}
                          allOptions={allOptions}
                        />
                      </div>
                    ))}
                  </div>

                </>
              )}
            </Col>
          </Row>
          {groups[selectedGroupIndex + 1] &&
            <div className="d-flex justify-content-center">
            <Button type="button" label={`Add Some ${groups[selectedGroupIndex + 1]?.name}`}
                    onClick={() => setSelectedGroupIndex(prev => prev + 1)}/>
          </div>}
      </Col>
    </Row>
  );
};

export default Pizza;
