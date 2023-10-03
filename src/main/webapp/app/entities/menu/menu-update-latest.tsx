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
  PopoverBody, CardBody, ModalFooter,
} from 'reactstrap';
import {useNavigate, useParams} from "react-router-dom";
import {useAppDispatch, useAppSelector} from "app/config/store";
import {createEntity, duplicateMenu, getEntity, reset, sendEvent, updateEntity} from "app/entities/menu/menu.reducer";
import {getEntities as getBranches} from "app/entities/branch/branch.reducer";
import {getEntities as getTerms} from "app/entities/term/term.reducer";
import {getSortState, TextFormat, translate, Translate, ValidatedField, ValidatedForm} from "react-jhipster";
import {ITEMS_PER_PAGE} from "app/shared/util/pagination.constants";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {APP_DATE_FORMAT} from "app/config/constants";
import {convertDateTimeFromServer, convertDateTimeToServer, displayDefaultDateTime} from "app/shared/util/date-utils";
import ItemSelectionModal from "app/entities/menu/item-selection-modal";
import {FaBars} from "react-icons/fa";
import Select from "react-select";
import MenuPreview from "app/entities/menu/menu-preview";

function MenuUpdate() {


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

// For Menu Edit Modal
  const [selectedCategory, setSelectedCategory] = useState();
  const branchList = useAppSelector(state => state.branch.entities).map(branch => ({ value: branch.id, label: branch.name }));
  const initialBranches = {label : menuEntity?.branch?.name , value: menuEntity?.branch?.id}
  const [selectedBranches, setSelectedBranches] = useState<any>();
//
  const [data, setData] :any= useState({
    name: '',
    branch: '',
    menuScreens: [],
  });
  const [selectedMainScreen, setSelectedMainScreen] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState({
    isMenuModalOpen: false,
    isMainScreenModalOpen: false,
    isSubScreenModalOpen: false,
    isItemModalOpen: false,
    isEditModalOpen: false,
    isPreviewModalOpen: false,

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

  useEffect(() => {
    console.log("Data updated: ", data);
  }, [data]);


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
    setSelectedItems((prevSelectedItems) => {
      console.log("Before:", prevSelectedItems);
      console.log("Toggling item:", item);

      const isSelected = prevSelectedItems.some(
        (selected) => selected.id === item.id
      );

      if (isSelected) {
        console.log("Item is selected, removing...");
        handleRemoveSelectedItem(item.id);
        const updatedItems = prevSelectedItems.filter(
          (selected) => selected.id !== item.id
        );
        console.log("After removal:", updatedItems);
        return updatedItems;
      }

      console.log("Item is not selected, adding...");
      handleAddSelectedItem(item);
      const updatedItems = [...prevSelectedItems, item];
      console.log("After adding:", updatedItems);
      return updatedItems;
    });
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


  const togglePreviewModal = () => {
    setIsModalOpen({
      ...isModalOpen,
      isPreviewModalOpen: !isModalOpen.isPreviewModalOpen,
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

  const findAndRemoveItem = (subScreens, targetSubScreen, itemId) => {
    console.log("im here1")
    return subScreens.map((subScreen) => {
      if (subScreen.name === targetSubScreen.name) {
        console.log("im here11", subScreen.name, targetSubScreen.name)
        console.log("im here11", subScreen.name, targetSubScreen.name)

        return {
          ...subScreen,
          subScreens: (subScreen.subScreens || []).filter(sub => {
            console.log(sub, 'im here1subb')
            console.log(itemId, 'im here1subb')

            sub.component?.item?.id !== itemId
          }),
        };
      } else if (subScreen.subScreens) {
        const updatedNestedSubScreens = findAndRemoveItem(
          subScreen.subScreens,
          targetSubScreen,
          itemId
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

  const findAndAddItem = (subScreens, targetSubScreen, newItem) => {
    return subScreens.map((subScreen) => {
      if (subScreen.name === targetSubScreen.name) {

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

  const handleRemoveSelectedItem = (itemId) => {
    console.log("Handling removal of item with ID:", itemId);

    if (selectedMainScreen !== null) {
      const updatedData = { ...data };
      const updatedMenuScreens = [...updatedData.menuScreens];
      let updatedSubScreenStack;

      if (subScreenStack.length === 0) {
        updatedMenuScreens[selectedMainScreen] = {
          ...updatedMenuScreens[selectedMainScreen],
          subScreens: (
            updatedMenuScreens[selectedMainScreen].subScreens || []
          ).filter(subScreen => {
            console.log(subScreen, 'imsubss');
            return subScreen.component?.item?.id !== itemId;
          }),
        };
      } else {
        const topSubScreen = subScreenStack[subScreenStack.length - 1];
        updatedMenuScreens[selectedMainScreen] = {
          ...updatedMenuScreens[selectedMainScreen],
          subScreens: findAndRemoveItem(
            updatedMenuScreens[selectedMainScreen].subScreens,
            topSubScreen,
            itemId
          ),
        };

        // Update the subScreenStack to remove the sub-screen with itemId
        updatedSubScreenStack = subScreenStack.map((subScreen) =>
          subScreen === topSubScreen
            ? {
              ...topSubScreen,
              subScreens: topSubScreen.subScreens.filter(subScreen => subScreen.component?.item?.id !== itemId),
            }
            : subScreen
        );
      }

      updatedData.menuScreens = updatedMenuScreens;
      setData(updatedData);

      if (updatedSubScreenStack) {
        setSubScreenStack(updatedSubScreenStack);
      }
    } else {
      alert('Please select a main screen first.');
    }
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

      let updatedSubScreenStack;

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

        updatedSubScreenStack = subScreenStack.map((subScreen) =>
          subScreen === topSubScreen
            ? { ...topSubScreen, subScreens: [...(topSubScreen.subScreens || []), newItemSubScreen] }
            : subScreen
        );
      }
      updatedData.menuScreens = updatedMenuScreens;

      console.log(updatedData, 'updatddd')

      setData(updatedData);

      if(updatedSubScreenStack){
        setSubScreenStack(updatedSubScreenStack);
      }
    } else {
      alert('Please select a main screen first.');
    }
  };


  const findAndAddSubScreen = (subScreens, targetSubScreen, newSubScreen) => {
    return subScreens.map((subScreen) => {
      if (subScreen.name === targetSubScreen.name) {
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

    let updatedSubScreenStack;


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
      updatedSubScreenStack = subScreenStack.map((subScreen) =>
        subScreen === topSubScreen
          ? { ...topSubScreen, subScreens: [...(topSubScreen.subScreens || []), {
              name: newSubScreenName,
              backgroundColor: newSubScreenColor,
              componentType: 'SUB_SCREENS',
              managerOnlyAccess: false,
              subScreens: [],
            }] }
          : subScreen
      );
    }

    updatedData.menuScreens = updatedMenuScreens;



    setData(updatedData);
    if(updatedSubScreenStack){
      setSubScreenStack(updatedSubScreenStack);
    }

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
            const isMainScreenInStack = subScreenStack.includes(mainScreen);

            if (isMainScreenInStack) {
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
            } else {
              const updatedSubScreenStack = subScreenStack.map((subScreen) =>
                subScreen === subScreenStack[subScreenStack.length - 1]
                  ? {
                    ...subScreen,
                    subScreens: subScreen.subScreens.filter(
                      (item, k) => k !== subScreenIndex
                    ),
                  }
                  : subScreen
              );

              setSubScreenStack(updatedSubScreenStack);
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
    console.log("Rendering with subscreens: ", subscreens);

    if (!subscreens || subscreens.length === 0) {
      return null;
    }

    console.log(subscreens, 'hellloizz');

    return (
      <div className="d-flex flex-wrap mb-3">
        {subscreens.map((item, index) => (
          <div key={index} className="d-flex flex-column p-1 cursor-pointer mb-3">
            <Card
              style={{ width: '390px' }}
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
    console.log(subScreenStack, 'subScreenStacksubScreenStack')

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
  const navigateToBreadcrumbItem = (index) => {
    if (index >= 0 && index < breadcrumb.length) {
      const newSubScreenStack = [...subScreenStack]
      newSubScreenStack.slice(0, index );
      setSubScreenStack(newSubScreenStack);
      const newBreadcrumb = breadcrumb.slice(0, index + 1);
      setBreadcrumb(newBreadcrumb);
    }
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
      if (menuEntity?.category){
        setSelectedCategory(menuEntity.category.name)
      }
      if (menuEntity?.branch){
        setSelectedBranches({label: menuEntity?.branch?.name , value: menuEntity?.branch?.id})
      }
      setData(newData);
    }
  }, [menuEntity]);



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


  // For Menu Edit Modal

  const defaultValues = () =>
    isNew
      ? {
        createdDate: displayDefaultDateTime(),
        lastModifiedDate: displayDefaultDateTime(),
      }
      : {
        ...menuEntity,
        createdDate: convertDateTimeFromServer(menuEntity.createdDate),
        lastModifiedDate: convertDateTimeFromServer(menuEntity.lastModifiedDate),
        category: selectedCategory
      };

      const handleCategoryChange = (event) => {
        console.log(event.target.value, 'change')
        setSelectedCategory(event.target.value);
      };

      const handleBranchChange = (selectedBranches) => {
        console.log(selectedBranches, 'lol branch')
        setSelectedBranches(selectedBranches);
      }

  const saveEntity = (values = null) => {
    if (!data.name) {
      alert('Please enter a menu name.');
      return;
    }
    console.log(values, 'values')
    if(values) {
      values.createdDate = convertDateTimeToServer(values.createdDate);
      values.lastModifiedDate = convertDateTimeToServer(values.lastModifiedDate)
    }

    const { ...restValues } = values;

    const updatedMenuEntity = {
      ...menuEntity,
      ...restValues,
      name: data.name,
      branch: { id: selectedBranches.value },
      category: selectedCategory ? terms.find((it) => it.name === selectedCategory) : null,
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
            <Button color="primary" onClick={() => setIsModalOpen({ ...isModalOpen, isMenuModalOpen: true })}>
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
            <Translate contentKey="tempApp.menu.branch">Branch</Translate>: {menuEntity.branch?.name ? menuEntity.branch?.name : ''}
          </p>
          <p>
            <Translate contentKey="tempApp.menu.createdAt">Created At</Translate>:{' '}
            {menuEntity.createdDate ? <TextFormat value={menuEntity.createdDate} type="date" format={APP_DATE_FORMAT} /> : null}
          </p>
          <p>
            <Translate contentKey="tempApp.menu.updatedAt">Updated At</Translate>:{' '}
            {menuEntity.lastModifiedDate ? <TextFormat value={menuEntity.lastModifiedDate} type="date" format={APP_DATE_FORMAT} /> : null}
          </p>
          <p>
            <Translate contentKey="tempApp.menu.menuUrl">Menu URl</Translate>
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
                    onClick={() => {
                      setSelectedMainScreen(index)
                      setSubScreenStack([mainScreen]);
                      setBreadcrumb([mainScreen.name]);
                    }}

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

                  <h2>
                {breadcrumb?.length > 0 &&
                  breadcrumb.map((breadcrumbTitle, index) => (
                    <span
                      key={index}
                      className="cursor-pointer"
                      onClick={() => navigateToBreadcrumbItem(index)}
                    >
          {breadcrumbTitle}
                      {index < breadcrumb.length - 1 && ' / '}
        </span>
                  ))}

              </h2>
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
                <Button onClick={togglePreviewModal} className="mx-2 btn btn-info">
                  Preview
                </Button>
                <Button color="primary" onClick={handleSaveClick} className="">
                  Save
                </Button>
              </div>
            </div>
            <ListGroup className="mt-3">{renderCurrentSubScreen()}</ListGroup>
          </Col>


        </Row>
      </Card>




        <Modal isOpen={isModalOpen.isPreviewModalOpen} className="modal-xl"

               toggle={() => setIsModalOpen({ ...isModalOpen, isPreviewModalOpen: !isModalOpen.isPreviewModalOpen })}>
          <ModalHeader toggle={() => setIsModalOpen({ ...isModalOpen, isPreviewModalOpen: !isModalOpen.isPreviewModalOpen })}>
            Preview Modal
          </ModalHeader>
          <ModalBody  style={{ minWidth: '100%', minHeight: '60vh' }}>
            <MenuPreview data={data} />
          </ModalBody>
        </Modal>


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

      {isModalOpen.isMenuModalOpen && ( <Modal isOpen={isModalOpen.isMenuModalOpen} className="modal-lg"
             toggle={() => setIsModalOpen({ ...isModalOpen, isMenuModalOpen: !isModalOpen.isMenuModalOpen })} >
        <ModalHeader  toggle={() => setIsModalOpen({ ...isModalOpen, isMenuModalOpen: !isModalOpen.isMenuModalOpen })} >
          <Translate contentKey="tempApp.menu.home.createOrEditLabel">Create or edit a Menu</Translate>
        </ModalHeader>
        <ModalBody>
          <ValidatedForm defaultValues={defaultValues()} onSubmit={saveEntity}>

            <ValidatedField
              label={translate('tempApp.menu.name')}
              id="menu-name"
              name="name"
              data-cy="name"
              type="text"
              validate={{
                required: { value: true, message: translate('entity.validation.required') },
                maxLength: { value: 100, message: translate('entity.validation.maxlength', { max: 100 }) },
              }}
            />
            <ValidatedField
              label={translate('tempApp.menu.menuUrl')}
              id="menu-menuUrl"
              name="menuUrl"
              data-cy="menuUrl"
              type="text"

            />
            <div className="mb-3">
              Branches
              <Select defaultValue={initialBranches}
                      onChange={handleBranchChange} options={branchList} />
            </div>
            <ValidatedField
              id="menu-category"
              name="category"
              data-cy="category"
              label={translate('tempApp.menu.category')}
              type="select"
              required
              value={selectedCategory}
              onChange={handleCategoryChange}
            >
              {terms
                ? terms.map((otherEntity) => (
                  <option key={otherEntity.id} value={otherEntity.name}>
                    {otherEntity.name}
                  </option>
                ))
                : null}

            </ValidatedField>
            <Button  id="cancel-save" data-cy="entityCreateCancelButton"
                     onClick={() => setIsModalOpen({ ...isModalOpen, isMenuModalOpen: !isModalOpen.isMenuModalOpen })} replace color="info">
              <FontAwesomeIcon icon="arrow-left"/>
              &nbsp;
              <span className="d-none d-md-inline">
                          <Translate contentKey="entity.action.back">Back</Translate>
                        </span>
            </Button>
            &nbsp;
            <Button color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit"
                    disabled={updating}>
              <FontAwesomeIcon icon="save"/>
              &nbsp;
              <Translate contentKey="entity.action.save">Save</Translate>
            </Button>
          </ValidatedForm>

        </ModalBody>

      </Modal>)}

    </Container>
  );
}

export default MenuUpdate;
