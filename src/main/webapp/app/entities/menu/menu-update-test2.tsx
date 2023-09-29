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
import {FaBars} from "react-icons/fa";

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
  const [selectedScreenIndex, setSelectedScreenIndex] = useState(null);
  const [selectedScreenType, setSelectedScreenType] = useState(null);
  const [editScreenName, setEditScreenName] = useState('');
  const [editScreenColor, setEditScreenColor] = useState('');
  const [breadcrumb, setBreadcrumb] = useState([]);


  const [subScreenStack, setSubScreenStack] = useState([]);

  const handleMainScreenAdd = () => {
    setIsModalOpen({
      ...isModalOpen,
      isMainScreenModalOpen: true,
    });
    setSelectedMainScreen(null);
  };



  const openEditModal = (selectedScreen, screenIndex, screenType) => {
    setSelectedScreenIndex(screenIndex);
    setSelectedScreenType(screenType);
    setEditScreenName(selectedScreen.name);
    setEditScreenColor(selectedScreen.backgroundColor);
    setIsModalOpen({ ...isModalOpen, isEditModalOpen: true });
  };




  const handleEditScreen = () => {
    if (!editScreenName.trim()) {
      alert('Please enter a screen name.');
      return;
    }
console.log(editScreenColor, 'editScreenColor' )
    setData((prevData) => {
      const updatedMenuScreens = prevData.menuScreens.map((mainScreen, i) => {
        console.log("im here1")
        console.log("im here1",mainScreen)
        console.log("im here1", i)
        console.log("im here1", selectedScreenIndex)



          if (selectedScreenType === 'main') {
            console.log("im here3")

            return {
              ...mainScreen,
              name: editScreenName,
              backgroundColor: editScreenColor,
            };
          } else if (selectedScreenType === 'sub') {
            console.log("im here")
            const updatedSubScreens = mainScreen.subScreens.map((subScreen, j) => {
              console.log("im here", j)
              console.log("im here selectedScreenIndex", selectedScreenIndex)

              if (j === selectedScreenIndex) {
                console.log("im here", j)
                console.log("im here selectedScreenIndex", selectedScreenIndex)

                return {
                  ...subScreen,
                  name: editScreenName,
                  backgroundColor: editScreenColor,
                };
              }
              return subScreen;
            });
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

    setIsModalOpen({ ...isModalOpen, isEditModalOpen: false });
  };








  const handleToggleSelect = (item) => {
    setSelectedItems((prevSelectedItems) => [...prevSelectedItems, item]);
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
  const findAndAddItem = (subScreens, targetSubScreen, newItem) => {
    return subScreens.map((subScreen) => {
      if (subScreen === targetSubScreen) {
        return {
          ...subScreen,
          subScreens: [...(subScreen.subScreens || []), newItem],
        };
      } else if (subScreen.subScreens) {
        const updatedNestedSubScreens = findAndAddItem(
          subScreen.subScreens,
          targetSubScreen,
          newItem
        );
        if (updatedNestedSubScreens !== subScreen.subScreens) {
          return {
            ...subScreen,
            subScreens: updatedNestedSubScreens,
          };
        }
      }
      return subScreen;
    });
  };

  const handleAddSelectedItem = (item) => {
    console.log("I entered here");
    if (selectedMainScreen !== null) {
      const newItemSubScreen = {
        name: item.name,
        backgroundColor: selectedColorTheme,
        managerOnlyAccess: false,
        componentType: 'ITEM',
        component: {
          item: { id: item.id },
        },
      };

      const updatedData = { ...data };
      const updatedMenuScreens = [...updatedData.menuScreens];

      if (subScreenStack.length === 0) {
        console.log("Correct");

        updatedMenuScreens[selectedMainScreen] = {
          ...updatedMenuScreens[selectedMainScreen],
          subScreens: [
            ...(updatedMenuScreens[selectedMainScreen].subScreens || []),
            newItemSubScreen,
          ],
        };
      } else {
        const topSubScreen = subScreenStack[subScreenStack.length - 1];
        console.log("Kamel topSubScreen", topSubScreen);

        updatedMenuScreens[selectedMainScreen] = {
          ...updatedMenuScreens[selectedMainScreen],
          subScreens: findAndAddItem(
            updatedMenuScreens[selectedMainScreen].subScreens,
            topSubScreen,
            newItemSubScreen
          ),
        };
      }

      updatedData.menuScreens = updatedMenuScreens;

      setData(updatedData);
    } else {
      alert('Please select a main screen first.');
    }
  };

  const findAndAddSubScreen = (subScreens, targetSubScreen, newSubScreen) => {
    return subScreens.map((subScreen) => {
      if (subScreen === targetSubScreen) {
        return {
          ...subScreen,
          subScreens: [...(subScreen.subScreens || []), newSubScreen],
        };
      } else if (subScreen.subScreens) {
        const updatedNestedSubScreens = findAndAddSubScreen(
          subScreen.subScreens,
          targetSubScreen,
          newSubScreen
        );
        if (updatedNestedSubScreens !== subScreen.subScreens) {
          return {
            ...subScreen,
            subScreens: updatedNestedSubScreens,
          };
        }
      }
      return subScreen;
    });
  };

  const handleSubScreenModalSubmit = () => {
    if (!newSubScreenName.trim()) {
      alert('Please enter a sub-screen name.');
      return;
    }

    const updatedData = { ...data };
    const updatedMenuScreens = [...updatedData.menuScreens];

    if (subScreenStack.length === 0) {
      console.log("imhere1")
      updatedMenuScreens[selectedMainScreen] = {
        ...updatedMenuScreens[selectedMainScreen],
        subScreens: [
          ...(updatedMenuScreens[selectedMainScreen].subScreens || []),
          {
            name: newSubScreenName,
            backgroundColor: newSubScreenColor,
            componentType: 'SUB_SCREENS',
            managerOnlyAccess: false,
            subScreens: [],
          },
        ],
      };

    } else {
      const topSubScreen = subScreenStack[subScreenStack.length - 1];

      updatedMenuScreens[selectedMainScreen] = {
        ...updatedMenuScreens[selectedMainScreen],
        subScreens: findAndAddSubScreen(
          updatedMenuScreens[selectedMainScreen].subScreens,
          topSubScreen,
          {
            name: newSubScreenName,
            backgroundColor: newSubScreenColor,
            componentType: 'SUB_SCREENS',
            managerOnlyAccess: false,
            subScreens: [],
          }
        ),
      };
    }

    updatedData.menuScreens = updatedMenuScreens;

    setData(updatedData);

    setIsModalOpen({ ...isModalOpen, isSubScreenModalOpen: false });

    setNewSubScreenName('');
    setNewSubScreenColor('');
  };







  const handleRemoveCard = (mainScreenIndex, subScreenIndex) => {
    setData((prevData) => {
      const updatedMenuScreens = prevData.menuScreens.map((mainScreen, i) => {
        if (i === mainScreenIndex) {
          if (subScreenStack.length === 0) {
            const updatedSubScreens = mainScreen.subScreens.filter(
              (subScreen, j) => j !== subScreenIndex
            );
            return {
              ...mainScreen,
              subScreens: updatedSubScreens,
            };
          } else {
            const topSubScreen = subScreenStack[subScreenStack.length - 1];
            if (mainScreen === topSubScreen) {
              const updatedSubScreens = mainScreen.subScreens.map(
                (subScreen, j) => {
                  if (j === subScreenIndex) {
                    return {
                      ...subScreen,
                      subScreens: subScreen.subScreens.filter(
                        (item, k) => k !== subScreenIndex
                      ),
                    };
                  }
                  return subScreen;
                }
              );
              return {
                ...mainScreen,
                subScreens: updatedSubScreens,
              };
            }
          }
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

    console.log(subscreens, 'hellloizz');

    return (
      <div className="d-flex flex-wrap mb-3">
        {subscreens.map((item, index) => (
          <div key={index} className="d-flex flex-column p-1 cursor-pointer mb-3">
            <Card
              style={{ width: '400px' }}
              className="mb-3 position-relative"
            >
                <div className="d-flex justify-content-end">
                  <FaBars onClick={() => openEditModal(item, index, 'sub')} />
                </div>
              <div  onClick={() => {
                if (item.componentType === 'SUB_SCREENS') {
                  handleNavigateToSubScreen(item);
                }
              }}>


              <h4 className="m-0 mb-2">{item.name}</h4>
                <div className="d-flex align-items-center">
                  <Button
                    style={{ backgroundColor: item.backgroundColor, width: '55px', height: '30px', marginRight: '10px' }}
                  />
                  <span className="m-0">{item.componentType}</span>
                </div>
              </div>
              <div className="d-flex justify-content-end">
                <Button
                  color="danger"
                  size="sm"
                  onClick={() => handleRemoveCard(mainScreenIndex, index)}
                >
                  Remove
                </Button>
              </div>
            </Card>
          </div>
        ))}
      </div>
    );
  };



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

    return (
      <div>
        <div className="ml-3">
          {renderSubScreens(subScreenStack[subScreenStack.length - 1].subScreens, selectedMainScreen)}
        </div>
      </div>
    );
  };

  console.log(breadcrumb, 'breadcr')


  const handleNavigateToSubScreen = (subscreen) => {

    setSubScreenStack((prev) => [...prev, subscreen]);

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
    <Container className="mt-5" >
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
      <Card >
        <Row style={{ minHeight: '55rem' }}>
          <Col md="4" className="border-right-1">
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

                    <div className="d-flex justify-content-end">
                      <FaBars onClick={() => openEditModal(mainScreen, index, 'main')} />
                    </div>
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




      <Modal isOpen={isModalOpen.isEditModalOpen} toggle={() => setIsModalOpen({ ...isModalOpen, isEditModalOpen: false })}>
        <ModalHeader toggle={() => setIsModalOpen({ ...isModalOpen, isEditModalOpen: false })}>
          Edit Sub-Screen
        </ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label for="subScreenName">Sub-screen name</Label>
            <Input
              type="text"
              id="subScreenName"
              value={editScreenName}
              onChange={(e) => setEditScreenName(e.target.value)}
            />
          </FormGroup>
          <FormGroup>
            <Label for="subScreenColor">Select color theme</Label>
            <div className="d-flex flex-wrap mt-3">
              {colorThemes.map((color, index) => (
                <Button
                  key={index}
                  style={{ backgroundColor: color, width: '55px', height: '30px', border: 'none', marginRight: '10px', marginBottom: '10px' }}
                  className={editScreenColor === color ? 'active' : ''}
                  onClick={() => setEditScreenColor(color)}
                ></Button>
              ))}
            </div>
          </FormGroup>
          <Button color="primary" onClick={handleEditScreen}>Save</Button>
        </ModalBody>
      </Modal>

    </Container>
  );
}

export default LargeCard;
