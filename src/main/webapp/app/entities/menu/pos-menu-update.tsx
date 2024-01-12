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
  PopoverBody, CardBody, ModalFooter, Spinner,
} from 'reactstrap';
import {useNavigate, useParams} from "react-router-dom";
import {useAppDispatch, useAppSelector} from "app/config/store";
import {createEntity, duplicateMenu, getEntity, reset, sendEvent, updateEntity} from "app/entities/menu/menu.reducer";
import {getEntities as getBranches} from "app/entities/branch/branch.reducer";
import {getSortState, TextFormat, translate, Translate, ValidatedField, ValidatedForm} from "react-jhipster";
import {ITEMS_PER_PAGE} from "app/shared/util/pagination.constants";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {APP_DATE_FORMAT} from "app/config/constants";
import {convertDateTimeFromServer, convertDateTimeToServer, displayDefaultDateTime} from "app/shared/util/date-utils";
import ItemSelectionModal from "app/entities/menu/item-selection-modal";
import {FaBars} from "react-icons/fa";
import Select from "react-select";
import MenuPosPreview from "app/entities/menu/menu-pos-preview";
import {overridePaginationStateWithQueryParams} from "app/shared/util/entity-utils";
import {getEntities as getMenuCategories} from "app/entities/term/Menu-Category/menu-category.reducer";

function MenuUpdate() {


  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;


  const menuCategories = useAppSelector(state => state.menuCategory.entities);
  const menuEntity = useAppSelector(state => state.menu.entity);
  const loading = useAppSelector(state => state.menu.loading);
  const updating = useAppSelector(state => state.menu.updating);
  const updateSuccess = useAppSelector(state => state.menu.updateSuccess);
  const errorMessage = useAppSelector(state => state.menu.errorMessage);
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

// For Menu Edit Modal
  const [selectedCategory, setSelectedCategory] = useState({id: '', name: ''});
  const branchList = useAppSelector(state => state.branch.entities).map(branch => ({ value: branch.id, label: branch.name }));
  const initialBranches = {label : menuEntity?.branch?.name , value: menuEntity?.branch?.id}
  const [selectedBranches, setSelectedBranches] = useState<any>();
//
  const [data, setData] :any= useState({
    name: '',
    branch: '',
    menuScreens: [],
  });
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [selectedMainScreenIndex, setSelectedMainScreenIndex] = useState(0);
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
    setSelectedMainScreenIndex(null);
  };




  const openEditModal = (selectedScreen, screenIndex, screenType) => {
    setSelectedScreenIndex(screenIndex);
    setSelectedScreenType(screenType);
    setEditScreenName(selectedScreen.name);
    setEditScreenColor(selectedScreen.backgroundColor);
    setIsModalOpen({ ...isModalOpen, isEditModalOpen: true });
  };




  // Updated editSubScreens function
  const handleEditScreen = () => {
    if (!editScreenName.trim()) {
      alert('Please enter a screen name.');
      return;
    }


    setData((prevData) => {
      const updatedData = { ...prevData };
      const updatedMenuScreens = [...updatedData.menuScreens];

      updatedData.menuScreens = updatedMenuScreens.map((mainScreen, i) => {
        if (selectedScreenType === 'main' && i === selectedScreenIndex) {
          return {
            ...mainScreen,
            name: editScreenName,
            backgroundColor: editScreenColor,
          };
        } else if (selectedScreenType === 'sub') {
          if (subScreenStack.length === 1) {
            const topSubScreens = [...mainScreen.subScreens];
            topSubScreens[selectedScreenIndex] = {
              ...topSubScreens[selectedScreenIndex],
              name: editScreenName,
              backgroundColor: editScreenColor,
            };

            return {
              ...mainScreen,
              subScreens: topSubScreens,
            };
          } else {
            const topSubScreen = subScreenStack[subScreenStack.length - 1];

            const updatedSubScreens = editSubScreens(mainScreen.subScreens, topSubScreen, selectedScreenIndex, editScreenName, editScreenColor);

            const updatedSubScreenStack = subScreenStack.map((subScreen) =>
              subScreen === topSubScreen
                ? {
                  ...topSubScreen,
                  subScreens: topSubScreen.subScreens.map((sub, index) =>
                    index === selectedScreenIndex
                      ? {
                        ...sub,
                        name: editScreenName,
                        backgroundColor: editScreenColor,
                      }
                      : sub
                  ),
                }
                : subScreen
            );

            console.log('Updated subScreenStack:', updatedSubScreenStack);
            setSubScreenStack(updatedSubScreenStack)


            return {
              ...mainScreen,
              subScreens: updatedSubScreens,
            };
          }
        }
        return mainScreen;
      });

      return updatedData;
    });



    setIsModalOpen({ ...isModalOpen, isEditModalOpen: false });
  };

  console.log(data, 'data after edit')
  console.log(subScreenStack, 'subscreentStack alone')


  const editSubScreens = (subScreens, targetSubScreen, selectedScreenIndex, editScreenName, editScreenColor) => {
    let nameExists = false;
    return subScreens.map((subScreen, index) => {
      console.log(subScreen, 'kamelsubScreen')
      console.log(targetSubScreen, 'kameltargetSubScreen')

      if (areObjectsEqual(subScreen, targetSubScreen)) {
        console.log(index, 'kamelindex')
        console.log(selectedScreenIndex, 'kamelselectedScreenIndex')
        console.log(subScreen, 'subScreen12332')
        console.log(targetSubScreen[selectedScreenIndex], 'subScreen123324')

        if (subScreen.subScreens) {
          subScreen.subScreens.filter(sub => sub !== subScreen.subScreens[selectedScreenIndex]).forEach((nestedSubScreen) => {
            console.log(nestedSubScreen, 'nestedSubScreen123')
              if (nestedSubScreen.name === editScreenName) {
                nameExists = true
                alert('A sub-screen with the same name already exists.');
                return;
              }
          });
        }

          return {
            ...subScreen,
            subScreens: subScreen.subScreens.map((nestedSubScreen, nestedIndex) => {
              console.log(nestedSubScreen, 'nestedSubScreen')
              if (nestedIndex === selectedScreenIndex && !nameExists) {
                return {
                  ...nestedSubScreen,
                  name: editScreenName,
                  backgroundColor: editScreenColor,
                };
              }
              return nestedSubScreen;
            }),
          };
        }
       else if (subScreen.subScreens) {
        const updatedNestedSubScreens = editSubScreens(subScreen.subScreens, targetSubScreen, selectedScreenIndex, editScreenName, editScreenColor);
        return {
          ...subScreen,
          subScreens: updatedNestedSubScreens,
        };
      }
      return subScreen;
    });
  };








  const handleToggleSelect = (item) => {
    setSelectedItems((prevSelectedItems) => {
      console.log("Before:", prevSelectedItems);
      console.log("Toggling item:", item);

      const isSelected = prevSelectedItems?.some(
        (selected) => selected.id === item.id
      );

      if (isSelected) {
        console.log("Item is selected, removing...");
        handleRemoveSelectedItem(item.id);
        const updatedItems = prevSelectedItems?.filter(
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

    if (newMainScreenName.trim() === '') {
      alert('Main screen name is required.');
      return;
    }

    const updatedData = { ...data };
    const updatedMenuScreens = [...updatedData.menuScreens];
    const hasMainScreenDuplicate = updatedMenuScreens.some((subScreen) => subScreen.name === newMainScreenName);

    if (hasMainScreenDuplicate) {
      alert('Main Screen with the same name already exists.');
      return
    }

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
    setSubScreenStack([newMainScreen?.subscreens])
    setSelectedMainScreenIndex(data?.menuScreens?.length)
    setBreadcrumb([newMainScreenName])
    setIsModalOpen({...isModalOpen, isMainScreenModalOpen: false});
    setNewMainScreenName('');
    setSelectedColorTheme('');
  };



  const handleButtonAdd = (itemType) => {
    if (selectedMainScreenIndex !== null) {
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
      if (areObjectsEqual(subScreen,targetSubScreen)) {
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

      if (areObjectsEqual(subScreen, targetSubScreen)) {

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

    if (selectedMainScreenIndex !== null) {
      const updatedData = { ...data };
      const updatedMenuScreens = [...updatedData.menuScreens];
      let updatedSubScreenStack;

      if (subScreenStack.length === 1) {
        updatedMenuScreens[selectedMainScreenIndex] = {
          ...updatedMenuScreens[selectedMainScreenIndex],
          subScreens: (
            updatedMenuScreens[selectedMainScreenIndex].subScreens || []
          ).filter(subScreen => {
            console.log(subScreen, 'imsubss');
            return subScreen.component?.item?.id !== itemId;
          }),
        };
      } else {
        const topSubScreen = subScreenStack[subScreenStack.length - 1];
        updatedMenuScreens[selectedMainScreenIndex] = {
          ...updatedMenuScreens[selectedMainScreenIndex],
          subScreens: findAndRemoveItem(
            updatedMenuScreens[selectedMainScreenIndex].subScreens,
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
    if (selectedMainScreenIndex !== null) {
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

      if (subScreenStack.length === 1) {
        console.log("Correct");

        updatedMenuScreens[selectedMainScreenIndex] = {
          ...updatedMenuScreens[selectedMainScreenIndex],
          subScreens: [
            ...(updatedMenuScreens[selectedMainScreenIndex].subScreens || []),
            newItemSubScreen,
          ],
        };
      } else {
        const topSubScreen = subScreenStack[subScreenStack.length - 1];
        console.log("Kamel topSubScreen", topSubScreen);

        updatedMenuScreens[selectedMainScreenIndex] = {
          ...updatedMenuScreens[selectedMainScreenIndex],
          subScreens: findAndAddItem(
            updatedMenuScreens[selectedMainScreenIndex].subScreens,
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

  function areObjectsEqual(obj1, obj2) {
    if (obj1 === obj2) {
      return true;
    }

    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
      return false;
    }

    if (obj1 === null || obj2 === null) {
      return false;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
      return false;
    }

    for (const key of keys1) {
      if (!areObjectsEqual(obj1[key], obj2[key])) {
        return false;
      }
    }

    return true;
  }
  console.log(subScreenStack, 'kamelnew')

  const findAndAddSubScreen = (subScreens, targetSubScreen, newSubScreen) => {


    console.log(targetSubScreen, 'kameltarget')
    console.log(newSubScreen, 'kamelnew')
    console.log(subScreens, 'kamelnsubs')

    return subScreens?.map((subScreen) => {
      console.log(subScreen, 'kamel12')
      console.log(targetSubScreen, 'kamel12')

      if (areObjectsEqual(subScreen, targetSubScreen)) {

        console.log(subScreen, 'kamel12')

        return {
          ...subScreen,
          subScreens: [...(subScreen.subScreens || []), newSubScreen],
        };
      } else if (subScreen?.subScreens) {
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



    if (subScreenStack.length === 1){
    const topSubScreens = updatedMenuScreens[selectedMainScreenIndex]?.subScreens;

    console.log(topSubScreens, 'kameltopSubScreens')

    const hasDuplicateOnFirstLevel = topSubScreens?.some((subScreen) => subScreen.name === newSubScreenName);

    if (hasDuplicateOnFirstLevel) {
      alert('Sub-screen with the same name already exists on this level.');
    }
    else {
      console.log("imhere1")
      updatedMenuScreens[selectedMainScreenIndex] = {
        ...updatedMenuScreens[selectedMainScreenIndex],
        subScreens: [
          ...(updatedMenuScreens[selectedMainScreenIndex].subScreens || []),
          {
            name: newSubScreenName,
            backgroundColor: newSubScreenColor,
            componentType: 'SUB_SCREENS',
            managerOnlyAccess: false,
            subScreens: [],
          },
        ],
      }
    }
  } else {
      const topSubScreen = subScreenStack[subScreenStack.length - 1];

      const hasDuplicate = topSubScreen.subScreens.some((subScreen) => subScreen.name === newSubScreenName);
      if (hasDuplicate) {
        alert('Sub-screen with the same name already exists on this level.');
      }
      else{
        updatedMenuScreens[selectedMainScreenIndex] = {
          ...updatedMenuScreens[selectedMainScreenIndex],
          subScreens: findAndAddSubScreen(
            updatedMenuScreens[selectedMainScreenIndex].subScreens,
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
          subScreen === topSubScreen && subScreen
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




  const findAndRemoveCard = (subScreens, targetSubScreen, subScreenIndex) => {
    return subScreens.map((subScreen) => {
      if (areObjectsEqual(subScreen, targetSubScreen)) {
        const cardToRemove = subScreen.subScreens[subScreenIndex]
        if(cardToRemove.componentType === "ITEM"){
          const itemID = cardToRemove?.component?.item?.id
          const newItemsToDisplay = selectedItems.filter(itm => itm.id !== itemID)
          setSelectedItems(newItemsToDisplay)
        }
        return {
          ...subScreen,
          subScreens: subScreen.subScreens.filter((_, index) => index !== subScreenIndex),
        };
      } else if (subScreen.subScreens) {
        const updatedNestedSubScreens = findAndRemoveCard(
          subScreen.subScreens,
          targetSubScreen,
          subScreenIndex
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



  const handleRemoveCard = (mainScreenIndex, subScreenIndex) => {
    setData((prevData) => {
      const updatedMenuScreens = prevData.menuScreens.map((mainScreen, i) => {
        if (i === mainScreenIndex) {
          if (subScreenStack.length === 1) {
            const cardToRemove = mainScreen.subScreens[subScreenIndex]
            if(cardToRemove.componentType === "ITEM"){
              const itemID = cardToRemove?.component?.item?.id
              const newItemsToDisplay = selectedItems.filter(itm => itm.id !== itemID)
              setSelectedItems(newItemsToDisplay)
            }

            const updatedSubScreens = mainScreen.subScreens.filter(
              (subScreen, j) => j !== subScreenIndex
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
            const topSubScreen = subScreenStack[subScreenStack.length - 1];
            const updatedSubScreens = findAndRemoveCard(
              mainScreen.subScreens,
              topSubScreen,
              subScreenIndex
            );
            return {
              ...mainScreen,
              subScreens: updatedSubScreens,
            };
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
      <div className="container mb-3" onDragOver={(e) => e.preventDefault()}>
        <div className="row">
          {subscreens.map((item, index) => (
            <div
              key={index}
              className="col-md-6 mb-3"
              draggable
              onDragStart={() => handleSubDragStart(mainScreenIndex, index)}
              onDragOver={(e) => handleSubDragOver( index, e)}
              onDragEnd={handleSubDragEnd}
            >
              <div className="d-flex flex-column p-1 cursor-pointer">
                <Card className="mb-3 position-relative">
                  <div className="d-flex justify-content-end">
                    <FaBars onClick={() => openEditModal(item, index, 'sub')} />
                  </div>
                  <div
                    onClick={() => {
                      if (item.componentType === 'SUB_SCREENS') {
                        handleNavigateToSubScreen(item);
                      }
                    }}
                  >
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
            </div>
          ))}
        </div>
      </div>
    );
  };
  const handleSubDragStart = (mainIndex, subIndex) => {
    setSelectedMainScreenIndex(mainIndex);
    setDraggedIndex( subIndex );
  };

  const handleSubDragOver = (subIndex, e) => {
    e.preventDefault();

    setData((prevData) => {
      const updatedData = { ...prevData };
      const updatedMenuScreens = [...updatedData.menuScreens];
      const targetMainScreen = updatedMenuScreens[selectedMainScreenIndex];

      if (subIndex === draggedIndex) {
        return updatedData;
      }

      if (subScreenStack.length === 1) {
        const targetSubScreens = [...targetMainScreen.subScreens];
        const [draggedItem] = targetSubScreens.splice(draggedIndex, 1);

        targetSubScreens.splice(subIndex, 0, draggedItem);
        updatedMenuScreens[selectedMainScreenIndex] = { ...targetMainScreen, subScreens: targetSubScreens };
      } else {
        const updatedSubscreenStack = [...subScreenStack];
        const topSubScreen = updatedSubscreenStack[updatedSubscreenStack.length - 1];

        const updatedSubScreens = updateSubScreens(targetMainScreen.subScreens, topSubScreen, subIndex);

        const lastSubScreenInSubScreenStack = [...(topSubScreen?.subScreens || [])];
        const [draggedItem] = lastSubScreenInSubScreenStack.splice(draggedIndex, 1);

        lastSubScreenInSubScreenStack.splice(subIndex, 0, draggedItem);
        updatedSubscreenStack[updatedSubscreenStack.length - 1] = { ...topSubScreen, subScreens: lastSubScreenInSubScreenStack };

        console.log('Updated subScreenStack:', lastSubScreenInSubScreenStack);
        setSubScreenStack(updatedSubscreenStack);
        updatedMenuScreens[selectedMainScreenIndex] = { ...targetMainScreen, subScreens: updatedSubScreens };
      }

      setDraggedIndex(subIndex);
      return { ...updatedData, menuScreens: updatedMenuScreens };
    });
  };

  const updateSubScreens = (subScreens, targetSubScreen, dropIndex) => {
    return subScreens.map((subScreen, index) => {
      if (areObjectsEqual(subScreen, targetSubScreen)) {
        const updatedSubScreens = [...subScreen.subScreens];
        const [draggedItem] = updatedSubScreens.splice(draggedIndex, 1);
        updatedSubScreens.splice(dropIndex, 0, draggedItem);

        return {
          ...subScreen,
          subScreens: updatedSubScreens,
        };
      } else if (subScreen.subScreens) {
        const updatedNestedSubScreens = updateSubScreens(subScreen.subScreens, targetSubScreen, dropIndex);
        return {
          ...subScreen,
          subScreens: updatedNestedSubScreens,
        };
      }
      return subScreen;
    });
  };




  const handleSubDragEnd = () => {
    setDraggedIndex(null);
  };



  console.log("component rendered ")


  const findSubScreenByName = (subScreens, name) => {
    for (const subScreen of subScreens) {
      if (subScreen.name === name) {
        return subScreen;
      }
    }
    return null;
  };

  const renderCurrentSubScreen = () => {

    if (!data.menuScreens || data.menuScreens.length === 0 || selectedMainScreenIndex === null) {
      return null;
    }

    const mainScreen = data.menuScreens[selectedMainScreenIndex];

    if (!mainScreen || !mainScreen.subScreens || mainScreen.subScreens.length === 0) {
      return null;
    }

    let currentSubScreens = mainScreen.subScreens;

    for (let i = 1; i < subScreenStack.length; i++) {
      const nextScreenName = subScreenStack[i].name;
      const nextScreen = findSubScreenByName(currentSubScreens, nextScreenName);

      if (!nextScreen || !nextScreen.subScreens) {
        break;
      }

      currentSubScreens = nextScreen.subScreens;
    }

    return (
      <div className="ml-3">
        {renderSubScreens(currentSubScreens, selectedMainScreenIndex)}
      </div>
    );
  };



  console.log(breadcrumb, 'breadcr')


  const handleNavigateToSubScreen = (subscreen) => {

    console.log(subscreen, "subscreenoo")

    setSubScreenStack((prev) => [...prev, subscreen]);

    const updatedBreadcrumb = [...breadcrumb, subscreen.name];
    setBreadcrumb(updatedBreadcrumb);

    const subScreenItems = subscreen.subScreens.filter((item) => item.componentType === "ITEM")
      .map((item) =>({ id :item.component.item.id , name: item.component.item.name, desc: item.component.item.desc}))

    console.log(subScreenItems, 'subScreenItems')

    setSelectedItems(subScreenItems || [])
  };
  const navigateToBreadcrumbItem = (index) => {
    if (index >= 0 && index < breadcrumb.length) {

      const newSubScreenStack = subScreenStack.slice(0, index + 1)
      setSubScreenStack(newSubScreenStack);
      const newBreadcrumb = breadcrumb.slice(0, index + 1);
      setBreadcrumb(newBreadcrumb);
    }
  };


  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id))
    }
    dispatch(getBranches({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }))
    dispatch(getMenuCategories({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));



    return () => {
      reset()
      setBreadcrumb([])
      setSubScreenStack([])
      setSelectedMainScreenIndex(0)
    }
  }, [id,updateSuccess]);

  useEffect(() => {
    console.log("rendered12")
    if (menuEntity && menuEntity.id) {
      let newData = {
        name: menuEntity.name,
        branch: menuEntity.branch,
        menuScreens: menuEntity.menuScreens ,
      };
      if (menuEntity?.category){
        setSelectedCategory(menuEntity.category)
      }
      if (menuEntity?.branch){
        setSelectedBranches({label: menuEntity?.branch?.name , value: menuEntity?.branch?.id})
      }
      setData(newData);
      setBreadcrumb([menuEntity?.menuScreens?.[0]?.name]);
      setSubScreenStack([menuEntity?.menuScreens?.[0]]);

    }
  }, [menuEntity,updateSuccess]);



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

  const handleRemoveMainScreen = (mainScreenIndex, mainScreenName) => {
    const updatedMenuScreens = [...data.menuScreens];
    updatedMenuScreens.splice(mainScreenIndex, 1);
    console.log(mainScreenName, 'kamel')
    console.log( breadcrumb[0], 'kamel1')

    if(mainScreenName === breadcrumb[0]){
      setBreadcrumb([])
    }
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

      const handleCategoryChange = (selectedCtgry) => {

        setSelectedCategory(selectedCtgry);
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
      category:selectedCategory,
      menuScreens: data.menuScreens,
      item: data?.item?.map(item => ({id: item.id}))
    };

    if (isNew) {
      dispatch(createEntity(updatedMenuEntity));
    } else {
      dispatch(updateEntity(updatedMenuEntity));
    }

    setIsModalOpen({...isModalOpen, isEditModalOpen: false});
    setIsModalOpen({...isModalOpen, isMenuModalOpen: false});
  };

      if(loading){
        return <div>
          <Spinner />
        </div>
      }
  console.log(breadcrumb, 'breadcrumb')
  console.log(selectedItems, 'selectedItems')

  console.log(menuEntity, 'menuEntity')
  console.log(data, 'dataa')

  const handleMainDragStart = (index) => {
    setSelectedMainScreenIndex(index)
    setDraggedIndex(index);
  };

  const handleMainDragOver = (index) => {
    if (index !== draggedIndex) {
      const newData = [...data.menuScreens];
      const [draggedItem] = newData.splice(draggedIndex, 1);
      newData.splice(index, 0, draggedItem);
      setData({ ...data, menuScreens: newData });
      setDraggedIndex(index);
      setSelectedMainScreenIndex(index)
    }
  };

  const handleMainDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="mt-5" >
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
            <Translate contentKey="tempApp.menu.branch">Branch</Translate>: {menuEntity.branch? menuEntity.branch?.name : ''}
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
            <Translate contentKey="tempApp.menu.menuUrl">Menu URl</Translate>:  {menuEntity.menuUrl? menuEntity.menuUrl : ''}
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
                <div
                  key={index}
                  className="mb-3"
                  draggable
                  onDragStart={() => handleMainDragStart(index)}
                  onDragOver={() => handleMainDragOver(index)}
                  onDragEnd={handleMainDragEnd}
                >
                  <Card className="d-flex p-3 cursor-pointer">
                  <div  onClick={() => {
                    const mainScreenItems = mainScreen?.subScreens?.filter((item) => item.componentType === "ITEM")
                      .map((item) =>({ id :item.component.item.id , name: item.component.item.name, desc: item.component.item.desc}))
                    setSelectedItems(mainScreenItems || [])
                    setSelectedMainScreenIndex(index)
                    setSubScreenStack([mainScreen]);
                    setBreadcrumb(() => [mainScreen.name]);

                  }}>
                    <div className="d-flex justify-content-end" >
                      <FaBars  onClick={() => openEditModal(mainScreen, index, 'main')} />
                    </div>
                    <h5 className="m-0 mr-3 mb-2">{mainScreen.name}</h5>
                    <div className='d-flex flex-row justify-content-between'>
                      <Button
                        style={{ backgroundColor: mainScreen.backgroundColor, width: '55px', height: '30px' }}
                      />
                      <div>{`Buttons - ${mainScreen.subScreens?.length ?? 0}`}</div>
                    </div>

                    </div>
                    <div className="d-flex justify-content-end">
                      <Button color="danger" size="sm" onClick={() => handleRemoveMainScreen(index, mainScreen.name)}>
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
              <Col md="8">
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
              </Col>

              <Col>
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
                <Button color="primary" disabled={updating} onClick={handleSaveClick} className="">
                  Save
                </Button>
              </div>
              </Col>
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
            <MenuPosPreview data={data} />
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
              required
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

      {isModalOpen.isItemModalOpen && <ItemSelectionModal
        isOpen={isModalOpen.isItemModalOpen}
        toggle={() => setIsModalOpen({...isModalOpen, isItemModalOpen: !isModalOpen.isItemModalOpen})}
        selectedItems={selectedItems}
        handleToggleSelect={handleToggleSelect}
      />}




      <Modal isOpen={isModalOpen.isEditModalOpen} toggle={() => setIsModalOpen({ ...isModalOpen, isEditModalOpen: false })}>
        <ModalHeader toggle={() => setIsModalOpen({ ...isModalOpen, isEditModalOpen: false })}>
          Edit
        </ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label for="subScreenName">Name</Label>
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

      {isModalOpen.isMenuModalOpen && (
        <Modal isOpen={isModalOpen.isMenuModalOpen} className="modal-lg"
            >
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

            <div className="mb-3">
              Category
              <Select
                value={selectedCategory}
                onChange={handleCategoryChange}
                options={menuCategories}
                getOptionLabel={option => option.name}
                getOptionValue={option => option.id}
                />
            </div>
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

    </div>
  );
}

export default MenuUpdate;
