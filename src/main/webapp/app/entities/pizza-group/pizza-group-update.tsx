import React, {useEffect, useState} from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  CardBody, Button, Spinner, Popover, PopoverHeader, PopoverBody,
} from 'reactstrap';
import { InputText } from "primereact/inputtext";
import { TabMenu } from "primereact/tabmenu";
import {TabPanel, TabView} from "primereact/tabview";
import {useAppDispatch, useAppSelector} from "app/config/store";
import {
  createDefinitionGroup, createDefinitionGroupOption, editDefinitionGroupOption,
  getEntityByType
} from "app/entities/item-definitions/item-definitions.reducer";
import {
  checkAndFetchPizzaDefinition,
  createDefinitions
} from "app/entities/pizza-group/utils";
import NewRequiredOptionInputs from "app/entities/pizza-group/add-new-required-option";
import NewOptionalOptionInputs from "app/entities/pizza-group/add-new-optional-option";

const PizzaGroupUpdate = () => {


  const disptach = useAppDispatch()


  const itemDefinitions = useAppSelector(state => state.itemDefinitions.entities)
  const pizzaDefinition = itemDefinitions.find(item => item.definitionType === "PIZZA")
  const pizzaDefinitionLoading = useAppSelector(state => state.itemDefinitions.loading)

  const updateSuccess = useAppSelector(state => state.itemDefinitions.updateSuccess)


  console.log(pizzaDefinition, 'pizzaDefinition')
  const [groups, setGroups] = useState([]);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    desc: '',
    additionalDesc: '',
    requiredOptions: [],
    optionalOptions: [],
  });
  const [isAddingGroup, setIsAddingGroup] = useState(false);


  const group = groups[selectedGroupIndex]
  const handleNewGroupChange = (fieldName, value) => {
    setNewGroup({ ...newGroup, [fieldName]: value });
  };

  const addNewGroup = () => {
    if (newGroup.name.trim() !== '') {
      setGroups([...groups, newGroup]);
      setSelectedGroupIndex(groups.length);
      setNewGroup({
        name: '',
        desc: '',
        additionalDesc: '',
        requiredOptions: [],
        optionalOptions: [],
      });
      setIsAddingGroup(false);
    }
    disptach(createDefinitionGroup({ group: newGroup, id: pizzaDefinition.id }));
  };




  useEffect(() => {
    checkAndFetchPizzaDefinition(disptach)

  }, []);

  useEffect(() => {
    if (pizzaDefinition?.groups?.length > 0) {
      console.log("helloworld");
      setGroups(pizzaDefinition?.groups);
      setSelectedGroupIndex(0)
    }
  }, [pizzaDefinition]);


  const handleButtonAdd = (optionType) => {
    if (selectedGroupIndex === null){
      alert("please select a group first")
      return
    }
    if (optionType === 'required-option') {
      handleAddNewRequiredOption();
    }
    else if (optionType === 'optional-option') {
      handleAddNewOptionalOption();
    }
  };

  const handleAddNewRequiredOption = () => {
    const newOption = {
      affectOtherOption: false,
      name: 'default name',
      desc: 'default description',
      order: null,
      definitionType: "BASE",
      modifiers: [],
      dependsOn: [],
    }

    setGroups((prevGroups) => {
      const updatedGroups = [...prevGroups];
      const updatedGroup = { ...updatedGroups[selectedGroupIndex] };
      updatedGroup.options = [...updatedGroup.options, newOption];
      updatedGroups[selectedGroupIndex] = updatedGroup;
      return updatedGroups;
    });
    disptach(createDefinitionGroupOption({ option: newOption, id: pizzaDefinition.id, groupId: group.id }))

  };

  const handleAddNewOptionalOption = () => {
    const newOption = {
      affectOtherOption: false,
      name: 'default name',
      desc: 'default description',
      order: null,
      definitionType: "TOPPING",
      modifiers: [],
      dependsOn: [],
    }



    disptach(createDefinitionGroupOption({ option: newOption, id: pizzaDefinition.id, groupId: group.id }))

  };

  const handleOptionDelete = (deletedOptionId) => {
    setGroups((prevGroups) => {
      return prevGroups.map((group, index) => {
        if (index === selectedGroupIndex) {
          return {
            ...group,
            options: group.options.filter((option) => option.id !== deletedOptionId),
          };
        }
        return group;
      });
    });
  };

  const handleSaveUpdatedOption = (updatedOption) => {
    setGroups((prevGroups) => {
      const updatedGroups = prevGroups.map((group, index) => {
        if (index === selectedGroupIndex) {
          return {
            ...group,
            options: group.options.map((opt) =>
              opt.id === updatedOption.id ? updatedOption : opt
            ),
          };
        }
        return group;
      });
      return updatedGroups;
    });
  };


  if(pizzaDefinitionLoading){
    return <Spinner />
  }



  return (
    <Container>
      <h1>Pizza Definitions</h1>
      <Card>
        <CardBody>
          <Row>
            {groups.length > 0 &&
              <Col md="8">
                {/* <TabMenu  model={groups.map(grp => ({label : grp.name}))} activeIndex={selectedGroupIndex} onTabChange={(e) => setSelectedGroupIndex(e.index)} /> */}
                <TabView activeIndex={selectedGroupIndex} scrollable onTabChange={(e) => setSelectedGroupIndex(e.index)}>
                  {groups.map((tab,index) => {
                    return (
                        <TabPanel header={tab.name} />
                    );
                  })}
                </TabView>

              </Col>
            }
            <Col md='4' >

            <button
              className="btn btn-primary ml-2 mb-1"
              onClick={() => {
                setIsAddingGroup((prev) => !prev);
                setSelectedGroupIndex(null);
              }}
            >
              +
            </button>
              <Button color="primary" id="addButton" onClick={() => setPopoverOpen(!popoverOpen)} className="ml-2">
                Add Button
              </Button>
              <Popover isOpen={popoverOpen} target="addButton" toggle={() => setPopoverOpen(!popoverOpen)}>
                <PopoverHeader>Add Button</PopoverHeader>
                <PopoverBody>
                  <p onClick={() => {
                    handleButtonAdd('required-option')
                    setPopoverOpen(false)
                  }} className="p-2" style={{ cursor: 'pointer' }}>
                    Required Option
                  </p>
                  <p onClick={() => {
                    handleButtonAdd('optional-option')
                    setPopoverOpen(false)
                  }} className="p-2" style={{ cursor: 'pointer' }}>
                    Optional Option
                  </p>
                </PopoverBody>
              </Popover>
              {isAddingGroup && (
                <>
                  <InputText
                  type="text"
                  className="mb-1"
                  placeholder="Enter Group Name"
                  value={newGroup.name}
                  onChange={(e) => handleNewGroupChange('name', e.target.value)}/>
                  <button
                    className="btn btn-primary ml-2 mb-1"
                    onClick={addNewGroup}
                  >
                    Add Group
                  </button>
                </>
              )}
            </Col>
            <Row>
            </Row>
          </Row>

          <Row className="mt-3">
            <div className="d-flex justify-content-end">

            </div>
            <Col xs="12" style={{ minHeight: '20rem' }}>
              <h2>Required Options</h2>

              {isAddingGroup && (
                <InputText
                  type="text"
                  className="mb-1"
                  placeholder="Enter Group Description"
                  value={newGroup.desc}
                  onChange={(e) => handleNewGroupChange('desc', e.target.value)}
                />
              )}
              <h4 >{groups[selectedGroupIndex]?.desc}</h4>
              {selectedGroupIndex !== null && (
                <div className="d-flex flex-column gap-3">
                  {groups[selectedGroupIndex]?.options?.map((option, index) => (
                    <React.Fragment key={option.id}>
                      <NewRequiredOptionInputs
                        option={option}
                        pizzaDefinition={pizzaDefinition}
                        groupId={group.id}
                        groups={groups}
                        onOptionDelete={handleOptionDelete}
                        onOptionSave={handleSaveUpdatedOption}
                      />
                      {index < groups[selectedGroupIndex]?.options?.length - 1 && (
                        <hr className="my-5 border border-dark" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
              {/* {showOptionInputs.requiredOption && selectedGroupIndex !== null && <Row> */}
              {/*   <NewRequiredOptionInputs */}
              {/*     showOptionInputs={showOptionInputs.requiredOption} */}
              {/*     onClose={() => setShowOptionInputs((prev) => ({...prev, requiredOption: false}))} */}
              {/*     onSave={handleSaveNewOption} */}

              {/*   /> */}
              {/* </Row>  } */}
            </Col>

          </Row>


          {/* <Row> */}
          {/*   <Col xs="12" style={{minHeight: '20rem'}}> */}

          {/*   <h2>Optional Options</h2> */}

          {/*     {isAddingGroup && ( */}
          {/*       <InputText */}
          {/*         type="text" */}
          {/*         className="mb-1" */}
          {/*         placeholder="Enter Group Description" */}
          {/*         value={newGroup.additionalDesc} */}
          {/*         onChange={(e) => handleNewGroupChange('additionalDesc', e.target.value)} */}
          {/*       /> */}
          {/*     )} */}
          {/*     <h4 contentEditable={true}>{groups[selectedGroupIndex]?.additionalDesc}</h4> */}


          {/*     {selectedGroupIndex !== null && */}

          {/*       groups[selectedGroupIndex]?.options?.map((option) => ( */}
          {/*         <div key={option.id}> */}
          {/*           <h4>{option.desc}</h4> */}
          {/*           {option.name} */}
          {/*         </div> */}
          {/*       ))} */}

          {/*   </Col> */}
          {/* </Row> */}

        </CardBody>
      </Card>




      {/* <NewOptionalOptionInputs */}
      {/*   showOptionInputs={showOptionInputs.optionalOption} */}
      {/*   onClose={() =>  setShowOptionInputs((prev) => ({...prev, optionalOption: false}))} */}
      {/*   onSave={handleSaveNewOption} */}
      {/* /> */}
    </Container>
  );
};

export default PizzaGroupUpdate;
