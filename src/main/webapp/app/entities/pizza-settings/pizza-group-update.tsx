import React, { useEffect, useRef, useState } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  CardBody, Button, Spinner, Popover, PopoverHeader, PopoverBody,
} from 'reactstrap';
import { InputText } from "primereact/inputtext";
import { TabMenu } from "primereact/tabmenu";
import { Button as PrimeButton } from 'primereact/button'

import { TabPanel, TabView } from "primereact/tabview";
import { useAppDispatch, useAppSelector } from "app/config/store";
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
} from "app/entities/pizza-settings/utils";
import OptionComponent from "app/entities/pizza-settings/option-component";
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';

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
  const [popoverOpen, setPopoverOpen] = useState(false);



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

  const confirm1 = (e) => {
    confirmDialog({
      message: 'Are you sure you want to proceed?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      defaultFocus: 'accept',
      accept: () => discardChanges(e)
    });
  };

  const discardChanges = (e) => {
    setNewGroup(emptyGroupValues);
    checkAndFetchPizzaDefinition(dispatch)
    setIsDirty(false);
    setSelectedGroupIndex(e.index);
  }

  const handleTabChange = (e) => {
    if (isDirty && e.index !== selectedGroupIndex) {
      confirm1(e)
    } else {
      setSelectedGroupIndex(e.index);
    }
  };

  const confirm2 = (e) => {
    confirmDialog({
      message: 'Are you sure you want to proceed?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      defaultFocus: 'accept',
      accept: () => discardChanges2(e)
    });
  };

  const discardChanges2 = (e) => {
    setNewGroup(emptyGroupValues);
    checkAndFetchPizzaDefinition(dispatch)
    setIsDirty(false);
    setSelectedGroupIndex(null);
    setIsAddingGroup((prev) => !prev);
  }

  const handleAddNewGroupInputs = (e) => {
    if (isDirty && e.index !== selectedGroupIndex) {
      confirm2(e)
    } else {
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
    if (newGroup.additionalDesc !== undefined && newGroup.additionalDesc.trim() !== '') {
      updatedGroup.additionalDesc = newGroup.additionalDesc;
    }
    dispatch(editDefinitionGroup({ group: updatedGroup, id: pizzaDefinition.id }));

    setIsDirty(false);
  };


  const confirm3 = () => {
    confirmDialog({
      message: 'Are you sure you want to proceed?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      defaultFocus: 'accept',
      accept: () => handleDeleteGroup()
    });
  };

  const handleDeleteGroup = () => {
    const updatedGroups = deleteGroup(groups, selectedGroupIndex);

    setSelectedGroupIndex(updatedGroups.length > 0 ? 0 : null);

    setGroups(updatedGroups);

    dispatch(deleteDefinitionGroup({ groupId: group.id, id: pizzaDefinition.id }));
  };


  const handleButtonAdd = (type) => {
    if (selectedGroupIndex === null) {
      alert("please select a group first")
      return
    }
    handleAddNewOption(type);

  };

  const handleAddNewOption = async (type) => {
    const order = groups[selectedGroupIndex]?.options?.length + 1
    const updatedGroups = await addNewOption(selectedGroupIndex, dispatch, pizzaDefinition, group, order, type);
    setGroups(updatedGroups);


    setTimeout(() => {
      if (newOptionRef.current) {
        newOptionRef.current.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
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

  if (pizzaDefinitionLoading) {
    return <Spinner />
  }

  return (
    <Row>
      <ConfirmDialog />
      <h1>Pizza Definitions</h1>
      <Card>
        <CardBody>
          <Row>
            {groups.length > 0 && (
              <Col md="8">
                <TabView activeIndex={selectedGroupIndex} scrollable onTabChange={(e) => {
                  handleTabChange(e)
                  isAddingGroup && setIsAddingGroup(false)
                }}>
                  {groups.map((tab, index) => (
                    <TabPanel key={index}
                      header={<div style={{ outlineColor: '#eee189', userSelect: 'text' }} contentEditable
                        onInput={(e) => {
                          setNewGroup({ ...newGroup, name: e.currentTarget.innerText })
                          setIsDirty(true)
                        }}>
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

              {isDirty && <Button color="primary" className="mx-2" onClick={handleSaveGroup}>
                Save
              </Button>}
              {selectedGroupIndex !== null && <Button
                color="danger"
                className="ml-2"
                onClick={confirm3}
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
                    onChange={(e) => handleNewGroupChange('name', e.target.value)} />

                  <InputText
                    type="text"
                    className="mb-1"
                    placeholder="Enter Group Description"
                    value={newGroup.desc}
                    onChange={(e) => handleNewGroupChange('desc', e.target.value)}
                  />

                  <div className="d-flex">

                    <InputText
                      type="text"
                      className="mb-1"
                      placeholder="Enter Second Desc"
                      value={newGroup.additionalDesc}
                      onChange={(e) => handleNewGroupChange('additionalDesc', e.target.value)}
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
                  <div className="d-flex gap-3 mb-4">
                    <h2 contentEditable
                      className="cursor-pointer"
                      style={{ outlineColor: '#eee189', userSelect: 'text' }}
                      onInput={(e) => {
                        setNewGroup({ ...newGroup, desc: e.currentTarget.innerText });
                        setIsDirty(true);
                      }}>
                      {groups[selectedGroupIndex]?.desc || 'default group description'}
                    </h2>
                    <div>
                      <Button color="primary" id="addOption" disabled={isUpdating} onClick={() => setPopoverOpen(prev => !prev)} className="ml-2">
                        Add Option
                      </Button>
                      <Popover isOpen={popoverOpen} target="addOption" toggle={() => setPopoverOpen(!popoverOpen)}>
                        <PopoverHeader>Add Button</PopoverHeader>
                        <PopoverBody>
                          <p onClick={() => {
                            handleButtonAdd('BASE')
                            setPopoverOpen(false)
                          }} className="p-2" style={{ cursor: 'pointer' }}>
                            Base Option
                          </p>
                          <p onClick={() => {
                            handleButtonAdd('TOPPING')
                            setPopoverOpen(false)
                          }} className="p-2" style={{ cursor: 'pointer' }}>
                            Topping Option
                          </p>
                        </PopoverBody>
                      </Popover>
                    </div>

                  </div>

                  <div className="d-flex flex-column gap-3">

                    <h3>Base Options</h3>
                    {groups[selectedGroupIndex]?.options?.filter(opt => opt.definitionType === 'BASE').length > 0 ? (
                      groups[selectedGroupIndex]?.options?.filter(opt => opt.definitionType === 'BASE').map((option, index) => (
                        <React.Fragment key={option.id}>
                          <OptionComponent
                            optionRef={index === groups[selectedGroupIndex]?.options.filter(opt => opt.definitionType === 'BASE')?.length - 1 ? newOptionRef : null}
                            option={option}
                            pizzaDefinition={pizzaDefinition}
                            groupId={group.id}
                            groups={groups}
                            onOptionDelete={handleOptionDelete}
                            onOptionSave={handleSaveUpdatedOption} />
                          {index < groups[selectedGroupIndex]?.options?.length - 1 && (
                            <hr className="my-5 border border-dark" />
                          )}
                        </React.Fragment>
                      ))
                    ) : (
                      <p>No base options available.</p>
                    )}
                  </div>


                  <hr className="my-9" style={{ height: '2px', border: '1px solid #f00' }} />

                  <div className="d-flex flex-column gap-3 mt-5">
                    <h2 contentEditable
                      className="cursor-pointer"
                      style={{ outlineColor: '#eee189', userSelect: 'text' }}
                      onInput={(e) => {
                        setNewGroup({ ...newGroup, additionalDesc: e.currentTarget.innerText });
                        setIsDirty(true);
                      }}>
                      {groups[selectedGroupIndex]?.additionalDesc || ' Second group description'}
                    </h2>
                    <h3>Topping Options</h3>
                    {groups[selectedGroupIndex]?.options?.filter(opt => opt.definitionType === 'TOPPING').length > 0 ? (
                      groups[selectedGroupIndex]?.options?.filter(opt => opt.definitionType === 'TOPPING').map((option, index) => (
                        <React.Fragment key={option.id}>
                          <OptionComponent
                            optionRef={index === groups[selectedGroupIndex]?.options?.filter(opt => opt.definitionType === 'TOPPING').length - 1 ? newOptionRef : null}
                            option={option}
                            pizzaDefinition={pizzaDefinition}
                            groupId={group.id}
                            groups={groups}
                            onOptionDelete={handleOptionDelete}
                            onOptionSave={handleSaveUpdatedOption} />
                          {index < groups[selectedGroupIndex]?.options?.length - 1 && (
                            <hr className="my-5 border border-dark" />
                          )}
                        </React.Fragment>
                      ))
                    ) : (
                      <p>No topping options available.</p>
                    )}
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
    </Row>
  );
};

export default PizzaGroupUpdate;
