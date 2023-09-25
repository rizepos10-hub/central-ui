import React, {useEffect, useState} from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  ListGroup,
  Modal,
  ModalHeader,
  ModalBody,
  Input,
  Label,
  FormGroup,
  Popover,
  PopoverHeader,
  PopoverBody,
} from 'reactstrap';
import {useParams} from "react-router-dom";
import {useAppDispatch, useAppSelector} from "app/config/store";
import {getEntity, reset} from "app/entities/menu/menu.reducer";
import {getEntities as getBranches} from "app/entities/branch/branch.reducer";
import {getEntities as getTerms} from "app/entities/term/term.reducer";
import {getEntities as getItems} from "app/entities/item/item.reducer";
import {overridePaginationStateWithQueryParams} from "app/shared/util/entity-utils";
import {getSortState} from "react-jhipster";
import {ITEMS_PER_PAGE} from "app/shared/util/pagination.constants";

function LargeCard() {


  const dispatch = useAppDispatch();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  // const terms = useAppSelector(state => state.term.entities)
  // const itemList = useAppSelector(state => state.item.entities);
  // const menuEntity = useAppSelector(state => state.menu.entity);
  // const loading = useAppSelector(state => state.menu.loading);
  // const updating = useAppSelector(state => state.menu.updating);
  // const updateSuccess = useAppSelector(state => state.menu.updateSuccess);
  // const errorMessage = useAppSelector(state => state.menu.errorMessage);
  //




  const [data, setData] = useState({
    name: '',
    branch: '',
    menuScreens: [],
  });
  const [selectedMainScreen, setSelectedMainScreen] = useState(null);
  const [selectedSubScreen, setSelectedSubScreen] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMainScreenName, setNewMainScreenName] = useState('');
  const [selectedColorTheme, setSelectedColorTheme] = useState('');
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [subScreenModalOpen, setSubScreenModalOpen] = useState(false);
  const [newSubScreenName, setNewSubScreenName] = useState('');
  const [newSubScreenColor, setNewSubScreenColor] = useState('');
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [editSubScreenName, setEditSubScreenName] = useState('');
  const [editSubScreenColor, setEditSubScreenColor] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editedSubScreen, setEditedSubScreen] :any = useState({});
  const [editSubScreen, setEditSubScreen] = useState(null);
  const [editSubScreenIndex, setEditSubScreenIndex] = useState(null);
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );
  const handleMainScreenAdd = () => {
    setIsModalOpen(true);
    setSelectedMainScreen(null);
  };

  const existingItems = [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
    { id: 3, name: 'Item 3' },
  ];


  const openEditModal = (selectedSubScreen) => {
    console.log(selectedSubScreen, 'lol')
    setEditSubScreen(selectedSubScreen);
    setEditSubScreenName(selectedSubScreen.name);
    setEditSubScreenColor(selectedSubScreen.background);

    // Open the edit modal
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditedSubScreen({});
    setIsEditModalOpen(false);
  };

  const handleEditSubScreen = () => {
    const updatedMenuScreens = [...data.menuScreens];

    const selectedSubScreen = editSubScreen;

    selectedSubScreen.name = editSubScreenName;
    selectedSubScreen.background = editSubScreenColor;


    setData({
      ...data,
      menuScreens: updatedMenuScreens,
    });

    console.log(data, 'data')
    setIsEditModalOpen(false);
  };

  const handleAddSelectedItem = (item) => {
    if (selectedMainScreen !== null) {
      const newItemSubScreen = {
        name: item.name,
        background: selectedColorTheme,
        managerOnlyAccess: '',
        componentType: 'ITEM',
        component: {
          url: '',
        },
      };

      const updatedMenuScreens = [...data.menuScreens];

      updatedMenuScreens[selectedMainScreen].subscreens.push(newItemSubScreen);

      setData({
        ...data,
        menuScreens: updatedMenuScreens,
      });

      setIsItemModalOpen(false);
      setSelectedItems([]);
    } else {
      alert('Please select a main screen first.');
    }
  };

  const handleSearchInputChange = (e) => {
    const searchTerm = e.target.value;
    setSearchTerm(searchTerm);

    const filtered = existingItems.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredItems(filtered);
  };


  const togglePopover = () => {
    setPopoverOpen(!popoverOpen);
  };

  const toggleSubScreenModal = () => {
    setSubScreenModalOpen(!subScreenModalOpen);
  };

  const colorThemes = [
    '#007bff', '#dc3545', '#28a745', '#fd7e14', '#6610f2', '#e83e8c',
    '#17a2b8', '#20c997', '#ffc107', '#6c757d', '#856404', '#6c757d'
  ];

  const handleModalSubmit = () => {
    const newMainScreen = {
      name: newMainScreenName,
      background: selectedColorTheme,
      managerOnlyAccess: '',
      subscreens: [],
    };

    setData({
      ...data,
      menuScreens: [...data.menuScreens, newMainScreen],
    });

    setIsModalOpen(false);
    setNewMainScreenName('');
    setSelectedColorTheme('');
  };



  const handleButtonAdd = (item) => {
    if (item === 'Sub-screen') {
      togglePopover();
      setSubScreenModalOpen(true);
    }else if(item === "Item"){
      setIsItemModalOpen(true);
      setFilteredItems(existingItems);
    }
  };

  const handleSubScreenModalSubmit = () => {
    if (!newSubScreenName.trim()) {
      alert('Please enter a sub-screen name.');
      return;
    }

    const newSubScreen = {
      name: newSubScreenName,
      background: newSubScreenColor,
      managerOnlyAccess: '',
      componentType: 'SUB-SCREEN',
      component: {
        url: '',
      },
    };

    const updatedMenuScreens = [...data.menuScreens];

    if (selectedMainScreen !== null) {
      const mainScreen = updatedMenuScreens[selectedMainScreen];
      mainScreen.subscreens.push(newSubScreen);
      updatedMenuScreens[selectedMainScreen] = mainScreen;
    }

    setData({
      ...data,
      menuScreens: updatedMenuScreens,
    });

    setSubScreenModalOpen(false);
    setNewSubScreenName('');
    setNewSubScreenColor('');
  };




  // useEffect(() => {
  //   if (isNew) {
  //     dispatch(reset());
  //   } else {
  //     dispatch(getEntity(id))
  //   }
  //   dispatch(getBranches({}))
  //   dispatch(getTerms({}));
  //   dispatch(getItems({
  //     page: paginationState.activePage - 1,
  //     size: paginationState.itemsPerPage,
  //     sort: `${paginationState.sort},${paginationState.order}`,
  //   }));
  //
  //
  //   return () => {
  //     reset()
  //   }
  // }, []);
  //
  // useEffect(() => {
  //   if (menuEntity && menuEntity.id) {
  //     // Assuming your menuEntity has properties like 'name' and 'branch'
  //     const newData = {
  //       name: menuEntity.name,
  //       branch: menuEntity.branch,
  //       // You can set other properties here based on your menuEntity structure
  //       menuScreens: menuEntity.screens || [], // Assuming screens is an array
  //     };
  //
  //     // Update the data state with the menuEntity data
  //     setData(newData);
  //   }
  //   console.log(data, 'dataa')
  // }, [menuEntity]);
  // console.log(menuEntity, 'menuEntity')

  return (
    <Container className="mt-5">
      <Card>
        <Row>
          <Col md="4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2 className="border- border-dark pb-3">Main Screens</h2>
                <Button color="primary" onClick={handleMainScreenAdd}>Add</Button>
              </div>
              <hr />
            </div>
            <ListGroup className="mt-3">
              {data.menuScreens.map((mainScreen, index) => (
                <div key={index} className="mb-3">
                  <Card
                    onClick={() => setSelectedMainScreen(index)}
                    className="d-flex p-3 cursor-pointer"

                  >
                    <h5 className="m-0 mr-3 mb-2">{mainScreen.name}</h5>
                    <div className='d-flex flex-row justify-content-between'>
                      <Button
                        style={{ backgroundColor: mainScreen.background, width: '55px', height: '30px' }}
                      />
                      <div>{`Buttons - ${mainScreen.subscreens.length}`}</div>
                    </div>
                  </Card>
                </div>
              ))}
            </ListGroup>
          </Col>
          <Col md="8" className="border-left">
            <div className="d-flex justify-content-between">
              <h2>{selectedMainScreen !== null ? data.menuScreens[selectedMainScreen].name : 'Sub Screens'}</h2>
              <Button color="primary" id="addButton" onClick={() => togglePopover()} className="ml-2">
                Add Button
              </Button>

              <Popover isOpen={popoverOpen} target="addButton" toggle={togglePopover}>
                <PopoverHeader>Add Button</PopoverHeader>
                <PopoverBody>
                  <p
                    onClick={() => handleButtonAdd('Item')}
                    className={`p-2 mb-2 ${selectedSubScreen === 'Item' ? 'bg-primary text-white' : ''}`}
                    style={{ cursor: 'pointer' }}
                  >
                    Item
                  </p>
                  <p
                    onClick={() => handleButtonAdd('Sub-screen')}
                    className={`p-2 mb-2 ${selectedSubScreen === 'Sub-screen' ? 'bg-primary text-white' : ''}`}
                    style={{ cursor: 'pointer' }}
                  >
                    Sub-screen
                  </p>
                </PopoverBody>
              </Popover>
            </div>
            <ListGroup className="mt-3">
              {selectedMainScreen !== null &&
                data.menuScreens[selectedMainScreen].subscreens.map((item, index) => (
                  <div key={index} className="mb-3">
                    <Card
                      className="d-flex p-3 cursor-pointer"
                    >
                      <h5 className="m-0 mr-3 mb-2">{item.name}</h5>
                      <div className="d-flex align-items-center">
                        <Button
                          style={{
                            backgroundColor: item.background,
                            width: '55px',
                            height: '30px',
                          }}
                        />
                        <p className=" ml-3 ">{item.componentType}</p>
                      </div>
                      <div className="ml-auto">
                        <Button onClick={() => openEditModal(item)}>Edit</Button>
                      </div>
                    </Card>
                  </div>
                ))}
            </ListGroup>
          </Col>
        </Row>
      </Card>

      <Modal isOpen={isModalOpen} toggle={() => setIsModalOpen(!isModalOpen)}>
        <ModalHeader toggle={() => setIsModalOpen(!isModalOpen)}>Add new main screen</ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label for="mainScreenName">Main screen name</Label>
            <Input
              type="text"
              id="mainScreenName"
              value={newMainScreenName}
              onChange={(e) => setNewMainScreenName(e.target.value)}
            />
          </FormGroup>
          <FormGroup>
            <Label for="colorTheme">Select color theme</Label>
            <div className="d-flex flex-wrap mt-3">
              {colorThemes.map((color, index) => (
                <Button
                  key={index}
                  style={{ backgroundColor: color, width: '55px', height: '30px', border: 'none', marginRight: '10px', marginBottom: '10px' }}
                  className={selectedColorTheme === color ? 'active' : ''}
                  onClick={() => setSelectedColorTheme(color)}
                ></Button>
              ))}
            </div>
          </FormGroup>
          <Button color="primary" onClick={handleModalSubmit}>Add Main Screen</Button>
        </ModalBody>
      </Modal>

      <Modal isOpen={subScreenModalOpen} toggle={toggleSubScreenModal}>
        <ModalHeader toggle={toggleSubScreenModal}>Add new sub-screen</ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label for="subScreenName">Sub-screen name</Label>
            <Input
              type="text"
              id="subScreenName"
              value={newSubScreenName}
              onChange={(e) => setNewSubScreenName(e.target.value)}
            />
          </FormGroup>
          <FormGroup>
            <Label for="subScreenColor">Select color theme</Label>
            <div className="d-flex flex-wrap mt-3">
              {colorThemes.map((color, index) => (
                <Button
                  key={index}
                  style={{ backgroundColor: color, width: '55px', height: '30px', border: 'none', marginRight: '10px', marginBottom: '10px' }}
                  className={newSubScreenColor === color ? 'active' : ''}
                  onClick={() => setNewSubScreenColor(color)}
                ></Button>
              ))}
            </div>
          </FormGroup>
          <Button color="primary" onClick={handleSubScreenModalSubmit}>Add Sub-Screen</Button>
        </ModalBody>
      </Modal>

      <Modal size="lg" isOpen={isItemModalOpen} toggle={() => setIsItemModalOpen(!isItemModalOpen)}>
        <ModalHeader toggle={() => setIsItemModalOpen(!isItemModalOpen)}>
          Add Existing Item
        </ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label for="searchItem">Search Item</Label>
            <Input
              type="text"
              id="searchItem"
              value={searchTerm}
              onChange={handleSearchInputChange}
            />
          </FormGroup>
          <table className="table">
            <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Action</th>
            </tr>
            </thead>
            <tbody>
            {filteredItems.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.name}</td>
                <td>
                  <Button
                    color="primary"
                    onClick={() => {

                      handleAddSelectedItem(item);
                      alert(`Added "${item.name}" to your data`);
                      setIsItemModalOpen(false);
                    }}
                  >
                    Select
                  </Button>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        </ModalBody>
      </Modal>
      <Modal isOpen={isEditModalOpen} toggle={() => setIsEditModalOpen(!isEditModalOpen)}>
        <ModalHeader toggle={() => setIsEditModalOpen(!isEditModalOpen)}>Edit Sub-Screen</ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label for="subScreenName">Sub-screen name</Label>
            <Input
              type="text"
              id="subScreenName"
              value={editSubScreenName}
              onChange={(e) => setEditSubScreenName(e.target.value)}
            />
          </FormGroup>
          <FormGroup>
            <Label for="subScreenColor">Select color theme</Label>
            <div className="d-flex flex-wrap mt-3">
              {colorThemes.map((color, index) => (
                <Button
                  key={index}
                  style={{ backgroundColor: color, width: '55px', height: '30px', border: 'none', marginRight: '10px', marginBottom: '10px' }}
                  className={editSubScreenColor === color ? 'active' : ''}
                  onClick={() => setEditSubScreenColor(color)}
                ></Button>
              ))}
            </div>
          </FormGroup>
          <Button color="primary" onClick={handleEditSubScreen}>Save</Button>
        </ModalBody>
      </Modal>
    </Container>
  );
}

export default LargeCard;
