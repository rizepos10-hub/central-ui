import React, {useEffect, useState} from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  CardBody, Button, Spinner,
} from 'reactstrap';
import { InputText } from "primereact/inputtext";
import { TabMenu } from "primereact/tabmenu";
import {TabPanel, TabView} from "primereact/tabview";
import NewRequiredOptionModal from "app/entities/pizza-group/add-new-required-option";
import NewOptionalOptionModal from "app/entities/pizza-group/add-new-optional-option";
import {useAppDispatch, useAppSelector} from "app/config/store";
import {
  createDefinitionGroup,
  getEntityByType
} from "app/entities/item-definitions/item-definitions.reducer";
import {toast} from "react-toastify";
import {
  checkAndFetchPizzaDefinition,
  createDefinitions
} from "app/entities/pizza-group/utils";

const PizzaGroupUpdate = () => {


  const disptach = useAppDispatch()

  const itemDefinitions = useAppSelector(state => state.itemDefinitions.entities)
  const pizzaDefinition = itemDefinitions.find(item => item.definitionType === "PIZZA")
  const pizzaDefinitionLoading = useAppSelector(state => state.itemDefinitions.loading)



  console.log(pizzaDefinition, 'pizzaDefinition')
  const [groups, setGroups] = useState([]);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(null);
  const [newGroup, setNewGroup] = useState({
    name: '',
    desc: '',
    additionalDesc: '',
    requiredOptions: [],
    optionalOptions: [],
  });
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [showModal, setShowModal] = useState({
    requiredOption: false,
    optionalOption: false,
  });

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
  const handleAddNewRequiredOption = () => {
    setShowModal((prev) => ({
      ...prev,
      requiredOption: true,
    }));
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


  const handleAddNewOptionalOption = () => {
    setShowModal((prev) => ({
      ...prev,
      optionalOption: true,
    }));
  };

  const handleSaveNewOption = (newOption) => {

    console.log('New option data:', newOption);
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
                <TabMenu model={groups.map(grp => ({label : grp.name}))} activeIndex={selectedGroupIndex} onTabChange={(e) => setSelectedGroupIndex(e.index)} />
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
              <h4 contentEditable={true}>{groups[selectedGroupIndex]?.desc}</h4>

              {selectedGroupIndex !== null && (
                <>
                  {groups[selectedGroupIndex]?.requiredOptions?.map((option) => (
                    <Card key={option.id} className="mb-2">
                      <h4>{option.name}</h4>
                      {option.desc}
                      <InputText type="select" className="mt-2">
                        {option.modifiers.map((modifier) => (
                          <option key={modifier.id} value={modifier.id}>
                            {modifier.label}
                          </option>
                        ))}
                      </InputText>
                    </Card>
                  ))}
                </>
              )}
              <Button color="primary" onClick={handleAddNewRequiredOption}>Add New Required Option</Button>
            </Col>

          </Row>


          <Row>
            <Col xs="12" style={{minHeight: '20rem'}}>

            <h2>Optional Options</h2>

              {isAddingGroup && (
                <InputText
                  type="text"
                  className="mb-1"
                  placeholder="Enter Group Description"
                  value={newGroup.additionalDesc}
                  onChange={(e) => handleNewGroupChange('additionalDesc', e.target.value)}
                />
              )}
              <h4 contentEditable={true}>{groups[selectedGroupIndex]?.additionalDesc}</h4>


              {selectedGroupIndex !== null &&

                groups[selectedGroupIndex]?.optionalOptions.map((option) => (
                  <div key={option.id}>
                    <h4>{option.desc}</h4>
                    {option.name}
                  </div>
                ))}
              <Button color="primary" onClick={handleAddNewOptionalOption}>Add New Optional Option</Button>

            </Col>
          </Row>

        </CardBody>
      </Card>



      <NewRequiredOptionModal
        showModal={showModal.requiredOption}
        onClose={() =>  setShowModal((prev) => ({...prev, requiredOption: false}))}
        onSave={handleSaveNewOption}
      />
      <NewOptionalOptionModal
        showModal={showModal.optionalOption}
        onClose={() =>  setShowModal((prev) => ({...prev, optionalOption: false}))}
        onSave={handleSaveNewOption}
      />
    </Container>
  );
};

export default PizzaGroupUpdate;
