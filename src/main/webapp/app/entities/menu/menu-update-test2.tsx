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
  PopoverBody, CardBody,
} from 'reactstrap';
import {useNavigate, useParams} from "react-router-dom";
import {useAppDispatch, useAppSelector} from "app/config/store";
import {createEntity, duplicateMenu, getEntity, reset, sendEvent, updateEntity} from "app/entities/menu/menu.reducer";
import {getEntities as getBranches} from "app/entities/branch/branch.reducer";
import {getEntities as getTerms} from "app/entities/term/term.reducer";
import {getItemsSummary} from "app/entities/item/item.reducer";
import {overridePaginationStateWithQueryParams} from "app/shared/util/entity-utils";
import {getSortState, TextFormat, Translate} from "react-jhipster";
import {ITEMS_PER_PAGE} from "app/shared/util/pagination.constants";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {APP_DATE_FORMAT} from "app/config/constants";
import {convertDateTimeToServer} from "app/shared/util/date-utils";
import ItemSelectionModal from "app/entities/menu/item-selection-modal";
import {it} from "date-fns/locale";

function LargeCard() {


  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const terms = useAppSelector(state => state.term.entities)
  const menuEntity = useAppSelector(state => state.menu.entity);
  const loading = useAppSelector(state => state.menu.loading);
  const updating = useAppSelector(state => state.menu.updating);
  const updateSuccess = useAppSelector(state => state.menu.updateSuccess);
  const errorMessage = useAppSelector(state => state.menu.errorMessage);





  const [data, setData] :any= useState({
    name: '',
    branch: '',
    menuScreens: [],
  });
  const [selectedMainScreen, setSelectedMainScreen] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState({
    isMainScreenModalOpen: false,
    isSubScreenModalOpen: false,
    isItemModalOpen: false,
    isEditModalOpen: false,
  });
  const [newMainScreenName, setNewMainScreenName] = useState('');
  const [selectedColorTheme, setSelectedColorTheme] = useState('');
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [newSubScreenName, setNewSubScreenName] = useState('');
  const [newSubScreenColor, setNewSubScreenColor] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [editSubScreenName, setEditSubScreenName] = useState('');
  const [editSubScreenColor, setEditSubScreenColor] = useState('');
  const [breadcrumb, setBreadcrumb] = useState([]);

  const [editSubScreen, setEditSubScreen] = useState(null);
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );
  const [subScreenStack, setSubScreenStack] = useState([]);

  const handleMainScreenAdd = () => {
    setIsModalOpen({
      ...isModalOpen,
      isMainScreenModalOpen: true,
    });
    setSelectedMainScreen(null);
  };



  const openEditModal = (selectedSubScreen) => {
    console.log(selectedSubScreen, 'lol')
    setEditSubScreen(selectedSubScreen);
    setEditSubScreenName(selectedSubScreen.name);
    setEditSubScreenColor(selectedSubScreen.backgroundColor);

    setIsModalOpen({...isModalOpen, isEditModalOpen: true});

  };



  const handleEditSubScreen = () => {
    if (!editSubScreenName.trim()) {
      alert('Please enter a sub-screen name.');
      return;
    }

    const updatedMenuScreens = [...data.menuScreens];

    if (editSubScreen !== null) {

      editSubScreen.name = editSubScreenName;
      editSubScreen.backgroundColor = editSubScreenColor;

      setData({
        ...data,
        menuScreens: updatedMenuScreens,
      });
    }

    setIsModalOpen({...isModalOpen, isEditModalOpen: false});

  };




  const handleAddSelectedItem = (item) => {
    if (selectedMainScreen !== null) {
      const newItemSubScreen = {
        name: item.name,
        backgroundColor: selectedColorTheme,
        managerOnlyAccess: false,
        componentType: 'ITEM',
        component: {
          item: { id : item.id},
        },
      };

      const updatedMenuScreens = data.menuScreens.map((menuScreen, index) => {
        if (index === selectedMainScreen) {
          const newMenuScreen = {
            ...menuScreen,
            subScreens: [
              ...(menuScreen.subScreens || []),
              newItemSubScreen,
            ],
          };
          return newMenuScreen;
        }
        return menuScreen;
      });

      setData({
        ...data,
        menuScreens: updatedMenuScreens,
      });

    } else {
      alert('Please select a main screen first.');
    }
  };



  const handleToggleSelect = (item) => {
    setSelectedItems((prevSelectedItems) => {
      console.log(prevSelectedItems, 'prevSelectedItems')
      return [ ...prevSelectedItems,item ]
    });
    handleAddSelectedItem(item)
  };

  const togglePopover = () => {
    setPopoverOpen(!popoverOpen);
  };

  const toggleSubScreenModal = () => {
    setIsModalOpen({
      ...isModalOpen,
      isSubScreenModalOpen: !isModalOpen.isSubScreenModalOpen,
    });
  };

  const handleSaveClick = () => {
    saveEntity();
  };

  const colorThemes = [
    '#007bff', '#dc3545', '#28a745', '#fd7e14', '#6610f2', '#e83e8c',
    '#17a2b8', '#20c997', '#ffc107', '#6c757d', '#856404', '#6c757d'
  ];

    const handleModalSubmit = () => {
      const newMainScreen = {
        name: newMainScreenName,
        backgroundColor: selectedColorTheme,
        managerOnlyAccess: '',
        componentType: "SUB_SCREENS",

        subscreens: [],
      };

      setData({
        ...data,
        menuScreens: [...data.menuScreens, newMainScreen],
      });

      setIsModalOpen({...isModalOpen, isMainScreenModalOpen: false});
      setNewMainScreenName('');
      setSelectedColorTheme('');
    };



  const handleButtonAdd = (itemType) => {
    if (selectedMainScreen !== null) {
      if (itemType === 'Sub-screen') {
        toggleSubScreenModal();
      } else if (itemType === 'Item') {
        setIsModalOpen({
          ...isModalOpen,
          isItemModalOpen: true,
        });
      }
    } else {
      alert('Please select a main screen first.');
    }
  };

  const handleSubScreenModalSubmit = () => {
    if (!newSubScreenName.trim()) {
      alert('Please enter a sub-screen name.');
      return;
    }

    const updatedMenuScreens = data.menuScreens.map((menuScreen, index) => {
      console.log(index, 'kamel', menuScreen, 'kamel1')
      if (index === selectedMainScreen) {
        const newMenuScreen = {
          ...menuScreen,
          subScreens: [
            ...(menuScreen.subScreens || []),
            {
              name: newSubScreenName,
              backgroundColor: newSubScreenColor,
              componentType: 'SUB_SCREENS',
              managerOnlyAccess: false,
              subScreens: [],
            },
          ],
        };
        return newMenuScreen;
      }
      return menuScreen;
    });

    setData({
      ...data,
      menuScreens: updatedMenuScreens,
    });

    setIsModalOpen({...isModalOpen, isSubScreenModalOpen: false});

    setNewSubScreenName('');
    setNewSubScreenColor('');
  };




  const handleRemoveCard = (mainScreenIndex, subScreenIndex) => {
    setData((prevData) => {
      const updatedMenuScreens = prevData.menuScreens.map((mainScreen, i) => {
        if (i === mainScreenIndex) {
          const updatedSubScreens = [...mainScreen.subScreens];
          updatedSubScreens.splice(subScreenIndex, 1);
          return {
            ...mainScreen,
            subScreens: updatedSubScreens,
          };
        }
        return mainScreen;
      });

      return {
        ...prevData,
        menuScreens: updatedMenuScreens,
      };
    });
  };





  const renderSubScreens = (subscreens, mainScreenIndex) => {
    if (!subscreens || subscreens.length === 0) {
      return null;
    }

    return subscreens.map((item, index) => {
      if (!item) {
        return null;
      }

      return (
        <div key={index} className="mb-3">
          <Card
            className="d-flex p-3 cursor-pointer"
            onClick={() => {
              if (item.componentType === 'SUB_SCREENS') {
                handleNavigateToSubScreen(item);
              }
            }}
          >
            <h5 className="m-0 mr-3 mb-2">{item.name}</h5>

          </Card>
          <Button
            color="danger"
            size="sm"
            onClick={() => handleRemoveCard(mainScreenIndex, index)}
          >
            Remove
          </Button>
        </div>
      );
    });
  };

// ...

  const renderCurrentSubScreen = () => {
    if (!data.menuScreens || data.menuScreens.length === 0 || selectedMainScreen === null) {
      return null;
    }

    const mainScreen = data.menuScreens[selectedMainScreen];

    if (!mainScreen || !mainScreen.subScreens || mainScreen.subScreens.length === 0) {
      return null;
    }

    if (subScreenStack.length === 0) {
      return renderSubScreens(mainScreen.subScreens, selectedMainScreen);
    }

    return subScreenStack.map((subscreen, index) => {
      return (
        <div key={index}>
          <div className="ml-3">
            {renderSubScreens(subscreen?.subScreens, selectedMainScreen)}
          </div>
        </div>
      );
    });
  };


  const handleNavigateToSubScreen = (subscreen) => {

    const updatedStack = [...subScreenStack, subscreen];
    setSubScreenStack(updatedStack);
console.log(subScreenStack, 'subScreenStack1')
    const updatedBreadcrumb = [...breadcrumb, subscreen.name];
    setBreadcrumb(updatedBreadcrumb);
  };





  const navigateBack = () => {

    const updatedStack = [...subScreenStack];
    updatedStack.pop();
    setSubScreenStack(updatedStack);

    const updatedBreadcrumb = [...breadcrumb];
    updatedBreadcrumb.pop();
    setBreadcrumb(updatedBreadcrumb);

  };








  console.log('subScreenStack:', subScreenStack);

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id))
    }
    dispatch(getBranches({}))
    dispatch(getTerms({}));
    {isModalOpen.isItemModalOpen &&
      dispatch(getItemsSummary({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      }));
    }


    return () => {
      reset()
    }
  }, []);

  useEffect(() => {
    if (menuEntity && menuEntity.id) {
      const newData = {
        name: menuEntity.name,
        branch: menuEntity.branch,
        menuScreens: menuEntity.menuScreens ,
      };

      setData(newData);
    }
  }, [menuEntity]);


  useEffect(() => {
    if (selectedMainScreen !== null) {
      const mainScreenName = data.menuScreens[selectedMainScreen]?.name;
      const updatedBreadcrumb = [mainScreenName];
      setBreadcrumb(updatedBreadcrumb);
    }
  }, [selectedMainScreen]);

  const handleDuplicateAction = () => {
    const isConfirmed = window.confirm('Are you sure you want to duplicate this menu?');

    if (isConfirmed) {
      dispatch(duplicateMenu(id))
        .then((result:any) => {
          console.log('Duplicate successful:', result);

          if (result?.payload?.id) {
            navigate(`/menu/${result.payload.id}/edit`);
          } else {
            console.error('Failed to duplicate menu: No ID returned');
          }

        })
        .catch(error => {
          console.error('Error duplicating menu:', error);
        });
    }
  };
  console.log(data, 'hello')

  const handleRemoveMainScreen = (mainScreenIndex) => {
    const updatedMenuScreens = [...data.menuScreens];
    updatedMenuScreens.splice(mainScreenIndex, 1);

    setData({
      ...data,
      menuScreens: updatedMenuScreens,
    });
  };
  const saveEntity = () => {
    if (!data.name) {
      alert('Please enter a menu name.');
      return;
    }
    const updatedMenuEntity = {
      ...menuEntity,
      name: data.name,
      branch: data.branch,
      menuScreens: data.menuScreens,
    };

    if (isNew) {
      dispatch(createEntity(updatedMenuEntity));
    } else {
      dispatch(updateEntity(updatedMenuEntity));
    }

    setIsModalOpen({...isModalOpen, isEditModalOpen: false});
  };

  console.log(menuEntity, 'menuEntity')
  console.log(data, 'dataa')

  return (
    <Container className="mt-5">
      <Card>
        <div className="d-flex justify-content-between align-items-center p-3">
          <h1>{menuEntity.name}</h1>
          <div>
            <Button color="primary" onClick={() => {}}>
              <FontAwesomeIcon icon="pencil-alt" />{' '}
              <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.edit">Edit</Translate>
          </span>
            </Button>
            <Button onClick={() => dispatch(sendEvent(id))} className="btn-success ms-2" style={{ fontFamily: 'fantasy' }}>
              Trigger
            </Button>
            <Button onClick={handleDuplicateAction} className="btn-success ms-2" style={{ fontFamily: 'fantasy' }}>
              Duplicate Menu
            </Button>
          </div>
        </div>
        <CardBody>
          <p>
            <Translate contentKey="tempApp.menu.createdAt">Created At</Translate>:{' '}
            {menuEntity.createdDate ? <TextFormat value={menuEntity.createdDate} type="date" format={APP_DATE_FORMAT} /> : null}
          </p>
          <p>
            <Translate contentKey="tempApp.menu.updatedAt">Updated At</Translate>:{' '}
            {menuEntity.lastModifiedDate ? <TextFormat value={menuEntity.lastModifiedDate} type="date" format={APP_DATE_FORMAT} /> : null}
          </p>
          <p>
            <Translate contentKey="tempApp.menu.menuUrl">Menu URl</Translate>: {menuEntity.menuUrl ? menuEntity.menuUrl : ''}
          </p>
          <p>
            <Translate contentKey="tempApp.menu.category">Category</Translate>: {menuEntity.category ? menuEntity.category.name : ''}
          </p>
        </CardBody>
      </Card>
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
              {data.menuScreens?.map((mainScreen, index) => (
                <div key={index} className="mb-3">
                  <Card
                    onClick={() =>  setSelectedMainScreen(index)}

                    className="d-flex p-3 cursor-pointer"

                  >
                    <h5 className="m-0 mr-3 mb-2">{mainScreen.name}</h5>
                    <div className='d-flex flex-row justify-content-between'>
                      <Button
                        style={{ backgroundColor: mainScreen.backgroundColor, width: '55px', height: '30px' }}
                      />
                      <div>{`Buttons - ${mainScreen.subScreens?.length ?? 0}`}</div>
                      <Button color="danger" size="sm" onClick={() => handleRemoveMainScreen(index)}>
                        Remove
                      </Button>
                    </div>
                  </Card>
                </div>
              ))}
            </ListGroup>
          </Col>
          <Col md="8" className="border-left">
            <div className="d-flex justify-content-between">
              <h2>{breadcrumb?.join(' / ') || 'Sub Screens'}</h2>
              {subScreenStack?.length > 0 && (
                <button onClick={navigateBack} className="btn btn-primary">
                  Back
                </button>
              )}

                <div>
                  <Button color="primary" id="addButton" onClick={() => setPopoverOpen(!popoverOpen)} className="ml-2">
                    Add Button
                  </Button>
                  <Popover isOpen={popoverOpen} target="addButton" toggle={() => setPopoverOpen(!popoverOpen)}>
                    <PopoverHeader>Add Button</PopoverHeader>
                    <PopoverBody>
                      <p onClick={() => {
                        handleButtonAdd('Sub-screen')
                        setPopoverOpen(false)
                      }} className="p-2" style={{ cursor: 'pointer' }}>
                        Sub-screen
                      </p>
                      <p onClick={() => {
                        handleButtonAdd('Item')
                        setPopoverOpen(false)
                      }} className="p-2" style={{ cursor: 'pointer' }}>
                        Item
                      </p>
                    </PopoverBody>
                  </Popover>
                  <Button color="primary" onClick={handleSaveClick} className="ml-2">
                    Save
                  </Button>
                </div>
            </div>
            <ListGroup className="mt-3">{renderCurrentSubScreen()}</ListGroup>
          </Col>


        </Row>
      </Card>

      <Modal isOpen={isModalOpen.isMainScreenModalOpen}
             toggle={() => setIsModalOpen({ ...isModalOpen, isMainScreenModalOpen: !isModalOpen.isMainScreenModalOpen })}>
        <ModalHeader toggle={() => setIsModalOpen({ ...isModalOpen, isMainScreenModalOpen: !isModalOpen.isMainScreenModalOpen })}>
          Add new main screen
        </ModalHeader>
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

      <Modal isOpen={isModalOpen.isSubScreenModalOpen}
             toggle={() => setIsModalOpen({ ...isModalOpen, isSubScreenModalOpen: !isModalOpen.isSubScreenModalOpen })}>
        <ModalHeader toggle={() => setIsModalOpen({ ...isModalOpen, isSubScreenModalOpen: !isModalOpen.isSubScreenModalOpen })}>
          Add new sub-screen
        </ModalHeader>
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

      <ItemSelectionModal
        isOpen={isModalOpen.isItemModalOpen}
        toggle={() => setIsModalOpen({ ...isModalOpen, isItemModalOpen: !isModalOpen.isItemModalOpen })}
        selectedItems={selectedItems}
        handleToggleSelect={handleToggleSelect}
      />




      <Modal isOpen={isModalOpen.isEditModalOpen}
             toggle={() => setIsModalOpen({ ...isModalOpen, isEditModalOpen: !isModalOpen.isEditModalOpen })}>
        <ModalHeader toggle={() => setIsModalOpen({ ...isModalOpen, isEditModalOpen: !isModalOpen.isEditModalOpen })}>
          Edit Sub-Screen
        </ModalHeader>
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
