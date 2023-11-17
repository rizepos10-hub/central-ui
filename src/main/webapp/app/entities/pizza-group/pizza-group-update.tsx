import React, {useEffect, useRef, useState} from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  CardBody, Button, Spinner, Popover, PopoverHeader, PopoverBody,
} from 'reactstrap';
import { InputText } from "primereact/inputtext";
import { TabMenu } from "primereact/tabmenu";
import {Button as PrimeButton} from 'primereact/button'

import {TabPanel, TabView} from "primereact/tabview";
import {useAppDispatch, useAppSelector} from "app/config/store";
import {
  createDefinitionGroup,
  createDefinitionGroupOption,
  deleteDefinitionGroup,
  editDefinitionGroup,
  editDefinitionGroupOption,
  getEntityByType
} from "app/entities/item-definitions/item-definitions.reducer";
import {
  addNewOption,
  checkAndFetchPizzaDefinition,
  createDefinitions, deleteGroup, emptyGroupValues
} from "app/entities/pizza-group/utils";
import OptionComponent from "app/entities/pizza-group/option-component";
import NewOptionalOptionInputs from "app/entities/pizza-group/add-new-optional-option";

const PizzaGroupUpdate = () => {


  const dispatch = useAppDispatch()



  const newOptionRef = useRef(null);
  const itemDefinitions = useAppSelector(state => state.itemDefinitions.entities)
  const pizzaDefinition = itemDefinitions.find(item => item.definitionType === "PIZZA")
  const pizzaDefinitionLoading = useAppSelector(state => state.itemDefinitions.loading)

  const updateSuccess = useAppSelector(state => state.itemDefinitions.updateSuccess)
  const isUpdating = useAppSelector(state => state.itemDefinitions.updating)


  console.log(pizzaDefinition, 'pizzaDefinition')
  const [groups, setGroups] = useState([]);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(null);
  const [newGroup, setNewGroup] = useState(emptyGroupValues);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [isDirty, setIsDirty] = useState(false);


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
    if (isDirty && e.index !== selectedGroupIndex) {
      if (window.confirm('Discard changes?')) {
        setNewGroup(emptyGroupValues);
        checkAndFetchPizzaDefinition(dispatch)
        setIsDirty(false);
        setSelectedGroupIndex(e.index);
      }
    }else{
      setSelectedGroupIndex(e.index);
    }
  };


  const handleAddNewGroupInputs = (e) => {
    if (isDirty && e.index !== selectedGroupIndex) {
      if (window.confirm('Discard changes?')) {
        setNewGroup(emptyGroupValues);
        checkAndFetchPizzaDefinition(dispatch)
        setIsDirty(false);
        setSelectedGroupIndex(null);
        setIsAddingGroup((prev) => !prev);
      }
    }else{
      setSelectedGroupIndex(null);
      setIsAddingGroup((prev) => !prev);

    }
  };
  const handleNewGroupChange = (fieldName, value) => {
    setNewGroup({ ...newGroup, [fieldName]: value });
  };

  const addNewGroup = () => {
    if (newGroup.name.trim() === '') {
     alert("Please Enter group name")
     return
    }
    setSelectedGroupIndex(groups.length);
    setNewGroup(emptyGroupValues);
    setIsAddingGroup(false);
    dispatch(createDefinitionGroup({ group: newGroup, id: pizzaDefinition.id })).then((res: any) => setGroups(res.payload.data.groups));
  };



  const handleSaveGroup = () => {
    const updatedGroup = { ...groups[selectedGroupIndex] };

    if (newGroup.name !== undefined && newGroup.name.trim() !== '') {
      updatedGroup.name = newGroup.name;
    }
    if (newGroup.desc !== undefined && newGroup.desc.trim() !== '') {
      updatedGroup.desc = newGroup.desc;
    }
    dispatch(editDefinitionGroup({ group: updatedGroup, id: pizzaDefinition.id }));

    setIsDirty(false);
  };



  const handleDeleteGroup = () => {
    const confirmDelete = window.confirm("Are you sure you want to delete this group?");

    if (confirmDelete) {
      const updatedGroups = deleteGroup(groups, selectedGroupIndex);

      setSelectedGroupIndex(updatedGroups.length > 0 ? 0 : null);

      setGroups(updatedGroups);

      dispatch(deleteDefinitionGroup({ groupId: group.id, id: pizzaDefinition.id }));
    }
  };


  const handleButtonAdd = () => {
    if (selectedGroupIndex === null){
      alert("please select a group first")
      return
    }
    handleAddNewOption();

  };

  const handleAddNewOption = async () => {
      const order = groups[selectedGroupIndex]?.options?.length + 1
      const updatedGroups = await addNewOption( selectedGroupIndex, dispatch, pizzaDefinition, group, order);
      setGroups(updatedGroups);

      setTimeout(() => {
      if (newOptionRef.current) {
        newOptionRef.current.scrollIntoView({  behavior: "smooth", block: "start", inline: "nearest"});
      }
    }, 100);

  };

  console.log(groups, 'groupsgroups')



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
            {groups.length > 0 && (
              <Col md="8">
                <TabView  activeIndex={selectedGroupIndex} scrollable onTabChange={(e) => {
                  handleTabChange(e)
                  isAddingGroup && setIsAddingGroup(false)
                }}>
                  {groups.map((tab, index) => (
                    <TabPanel key={index}
                              header={<div style={{ outlineColor: '#eee189', userSelect: 'text' }} contentEditable
                                           onInput={(e) => {
                                             setNewGroup({...newGroup, name: e.currentTarget.innerText})
                                             setIsDirty(true)}}>
                              {tab.name}
                            </div>} />
                  ))}
                </TabView>
              </Col>
            )}
            <Col md='4' >
                  <button
                    className="btn btn-primary ml-2 mb-1"
                    onClick={handleAddNewGroupInputs}
                  >
                    +
                  </button>

              {isDirty && <Button color="success" className="mx-2" onClick={handleSaveGroup}>
                Save
              </Button>}
              {selectedGroupIndex !== null && <Button
                color="danger"
                className="ml-2"
                onClick={handleDeleteGroup}
              >
                Delete Group
              </Button>}


            </Col>
            <Row>
            </Row>
          </Row>

          <Row className="mt-3">
            <div className="d-flex justify-content-end">

            </div>
            <Col xs="12" style={{ minHeight: '20rem' }}>


              {isAddingGroup && (

                  <div className="d-flex flex-column w-3">
                    <InputText
                      type="text"
                      className="mb-1"
                      placeholder="Enter Group Name"
                      value={newGroup.name}
                      onChange={(e) => handleNewGroupChange('name', e.target.value)}/>
                    <div className="d-flex">

                <InputText
                  type="text"
                  className="mb-1"
                  placeholder="Enter Group Description"
                  value={newGroup.desc}
                  onChange={(e) => handleNewGroupChange('desc', e.target.value)}
                />
                    <PrimeButton
                      className="btn btn-primary ml-2 mb-1"
                      onClick={addNewGroup}
                    >
                      Add Group
                    </PrimeButton>
                    </div>
                    </div>
              )}
              {selectedGroupIndex !== null && (
                <>
                  <div className="d-flex gap-3">
                    <h2>Options</h2>
                    <div>
                      <Button color="primary" id="addOption" disabled={isUpdating} onClick={handleButtonAdd} className="ml-2">
                        Add Option
                      </Button>
                    </div>

                  </div>
                  <h4 contentEditable
                      style={{outlineColor: '#eee189',  userSelect: 'text'}}
                      onInput={(e) => {
                        setNewGroup({...newGroup, desc: e.currentTarget.innerText});
                        setIsDirty(true);
                      }}>
                  {groups[selectedGroupIndex]?.desc || 'default group description'}
                </h4>
                  <div className="d-flex flex-column gap-3">
                    {groups[selectedGroupIndex]?.options?.map((option, index) => (
                      <React.Fragment key={option.id}>
                        <OptionComponent
                          optionRef={index === groups[selectedGroupIndex]?.options?.length - 1 ? newOptionRef : null}
                          option={option}
                          pizzaDefinition={pizzaDefinition}
                          groupId={group.id}
                          groups={groups}
                          onOptionDelete={handleOptionDelete}
                          onOptionSave={handleSaveUpdatedOption}/>
                        {index < groups[selectedGroupIndex]?.options?.length - 1 && (
                          <hr className="my-5 border border-dark"/>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </>
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
