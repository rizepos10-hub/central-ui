import React, { useEffect, useState } from 'react';
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
  CardBody,
  ModalFooter,
  Spinner,
  CardHeader,
} from 'reactstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { createEntity, duplicateMenu, getEntity, reset, sendEvent, updateEntity } from 'app/entities/menu/menu.reducer';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import { getSortState, TextFormat, translate, Translate, ValidatedField, ValidatedForm } from 'react-jhipster';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { APP_DATE_FORMAT } from 'app/config/constants';
import { convertDateTimeFromServer, convertDateTimeToServer, displayDefaultDateTime } from 'app/shared/util/date-utils';
import ItemSelectionModal from 'app/entities/menu/item-selection-modal';
import { FaBars } from 'react-icons/fa';
import { MdDeleteOutline, MdModeEditOutline } from 'react-icons/md';
import Select from 'react-select';
import MenuPosPreview from 'app/entities/menu/menu-pos-preview';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { getEntities as getMenuCategories } from 'app/entities/term/Menu-Category/menu-category.reducer';
import { InputText } from 'primereact/inputtext';
import { isEqual } from 'lodash';
import { InputNumber } from 'primereact/inputnumber';

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
  const [selectedCategory, setSelectedCategory] = useState({ id: '', name: '' });
  const branchList = useAppSelector(state => state.branch.entities).map(branch => ({ value: branch.id, label: branch.name }));
  const initialBranches = { label: menuEntity?.branch?.name, value: menuEntity?.branch?.id };
  const [selectedBranches, setSelectedBranches] = useState<any>();
  //
  const [data, setData]: any = useState({
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
  const [newMainScreenCols, setNewMainScreenCols] = useState<number | null>(1);
  const [selectedColorTheme, setSelectedColorTheme] = useState('');
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [newSubScreenName, setNewSubScreenName] = useState('');
  const [newSubScreenCols, setNewSubScreenCols] = useState<number | null>(1);
  const [newSubScreenColor, setNewSubScreenColor] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedScreenIndex, setSelectedScreenIndex] = useState(null);
  const [selectedScreenType, setSelectedScreenType] = useState(null);
  const [editScreenName, setEditScreenName] = useState('');
  const [editScreenColor, setEditScreenColor] = useState('');
  const [editScreenCols, setEditScreenCols] = useState<number | null>(1);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [isFormDirty, setIsFormDirty] = useState(false);

  const [subScreenStack, setSubScreenStack] = useState([]);

  const handleMainScreenAdd = () => {
    setIsModalOpen({
      ...isModalOpen,
      isMainScreenModalOpen: true,
    });
    setSelectedMainScreenIndex(null);
  };

  const openEditModal = (selectedScreen, screenIndex, screenType) => {
    setEditScreenCols(selectedScreen.numberOfColumns);
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

    setData(prevData => {
      const updatedData = { ...prevData };
      const updatedMenuScreens = [...updatedData.menuScreens];

      updatedData.menuScreens = updatedMenuScreens.map((mainScreen, i) => {
        if (selectedScreenType === 'main' && i === selectedScreenIndex) {
          return {
            ...mainScreen,
            name: editScreenName,
            backgroundColor: editScreenColor,
            numberOfColumns: editScreenCols,
          };
        } else if (selectedScreenType === 'sub' && i === selectedMainScreenIndex) {
          if (subScreenStack.length === 1) {
            const topSubScreens = [...mainScreen.subScreens];
            topSubScreens[selectedScreenIndex] = {
              ...topSubScreens[selectedScreenIndex],
              name: editScreenName,
              backgroundColor: editScreenColor,
              numberOfColumns: editScreenCols,
            };

            return {
              ...mainScreen,
              subScreens: topSubScreens,
            };
          } else {
            const topSubScreen = subScreenStack[subScreenStack.length - 1];

            const updatedSubScreens = editSubScreens(mainScreen.subScreens, topSubScreen);

            const updatedSubScreenStack = subScreenStack.map(subScreen =>
              subScreen === topSubScreen
                ? {
                    ...topSubScreen,
                    subScreens: topSubScreen.subScreens.map((sub, index) =>
                      index === selectedScreenIndex
                        ? {
                            ...sub,
                            name: editScreenName,
                            backgroundColor: editScreenColor,
                            numberOfColumns: editScreenCols,
                          }
                        : sub
                    ),
                  }
                : subScreen
            );

            setSubScreenStack(updatedSubScreenStack);
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

  const editSubScreens = (subScreens, targetSubScreen) => {
    let nameExists = false;
    return subScreens.map((subScreen, index) => {
      if (areObjectsEqual(subScreen, targetSubScreen)) {
        if (subScreen.subScreens) {
          subScreen.subScreens
            .filter(sub => sub !== subScreen.subScreens[selectedScreenIndex])
            .forEach(nestedSubScreen => {
              if (nestedSubScreen.name === editScreenName) {
                nameExists = true;
                alert('A sub-screen with the same name already exists.');
                return;
              }
            });
        }

        return {
          ...subScreen,
          subScreens: subScreen.subScreens.map((nestedSubScreen, nestedIndex) => {
            if (nestedIndex === selectedScreenIndex && !nameExists) {
              return {
                ...nestedSubScreen,
                name: editScreenName,
                backgroundColor: editScreenColor,
                numberOfColumns: editScreenCols,
              };
            }
            return nestedSubScreen;
          }),
        };
      } else if (subScreen.subScreens) {
        const updatedNestedSubScreens = editSubScreens(subScreen.subScreens, targetSubScreen);
        return {
          ...subScreen,
          subScreens: updatedNestedSubScreens,
        };
      }
      return subScreen;
    });
  };

  const handleToggleSelect = item => {
    setSelectedItems(prevSelectedItems => {
      const isSelected = prevSelectedItems?.some(selected => selected.id === item.id);
      if (isSelected) {
        handleRemoveSelectedItem(item.id);
        const updatedItems = prevSelectedItems?.filter(selected => selected.id !== item.id);
        return updatedItems;
      }
      handleAddSelectedItem(item);
      const updatedItems = [...prevSelectedItems, item];
      return updatedItems;
    });
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
    '#007bff',
    '#dc3545',
    '#28a745',
    '#fd7e14',
    '#6610f2',
    '#e83e8c',
    '#17a2b8',
    '#20c997',
    '#ffc107',
    '#6c757d',
    '#856404',
    '#6c757d',
  ];

  const handleModalSubmit = () => {
    if (newMainScreenName.trim() === '') {
      alert('Main screen name is required.');
      return;
    }

    const updatedData = { ...data };
    const updatedMenuScreens = [...updatedData.menuScreens];
    const hasMainScreenDuplicate = updatedMenuScreens.some(subScreen => subScreen.name === newMainScreenName);

    if (hasMainScreenDuplicate) {
      alert('Main Screen with the same name already exists.');
      return;
    }

    const newMainScreen = {
      name: newMainScreenName,
      backgroundColor: selectedColorTheme,
      numberOfColumns: newMainScreenCols,
      managerOnlyAccess: '',
      componentType: 'SUB_SCREENS',
      subscreens: [],
    };
    setData({
      ...data,
      menuScreens: [...data.menuScreens, newMainScreen],
    });
    setSubScreenStack([newMainScreen?.subscreens]);
    setSelectedMainScreenIndex(data?.menuScreens?.length);
    setBreadcrumb([newMainScreenName]);
    setIsModalOpen({ ...isModalOpen, isMainScreenModalOpen: false });
    setNewMainScreenName('');
    setSelectedColorTheme('');
    setNewMainScreenCols(null);
  };

  const handleButtonAdd = itemType => {
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
    return subScreens.map(subScreen => {
      if (areObjectsEqual(subScreen, targetSubScreen)) {
        return {
          ...subScreen,
          subScreens: (subScreen.subScreens || []).filter(sub => {
            sub.component?.item?.id !== itemId;
          }),
        };
      } else if (subScreen.subScreens) {
        const updatedNestedSubScreens = findAndRemoveItem(subScreen.subScreens, targetSubScreen, itemId);
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
    return subScreens.map(subScreen => {
      if (areObjectsEqual(subScreen, targetSubScreen)) {
        return {
          ...subScreen,
          subScreens: [...(subScreen.subScreens || []), newItem],
        };
      } else if (subScreen.subScreens) {
        const updatedNestedSubScreens = findAndAddItem(subScreen.subScreens, targetSubScreen, newItem);
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

  const handleRemoveSelectedItem = itemId => {
    if (selectedMainScreenIndex !== null) {
      const updatedData = { ...data };
      const updatedMenuScreens = [...updatedData.menuScreens];
      let updatedSubScreenStack;

      if (subScreenStack.length === 1) {
        updatedMenuScreens[selectedMainScreenIndex] = {
          ...updatedMenuScreens[selectedMainScreenIndex],
          subScreens: (updatedMenuScreens[selectedMainScreenIndex].subScreens || []).filter(subScreen => {
            return subScreen.component?.item?.id !== itemId;
          }),
        };
      } else {
        const topSubScreen = subScreenStack[subScreenStack.length - 1];
        updatedMenuScreens[selectedMainScreenIndex] = {
          ...updatedMenuScreens[selectedMainScreenIndex],
          subScreens: findAndRemoveItem(updatedMenuScreens[selectedMainScreenIndex].subScreens, topSubScreen, itemId),
        };

        // Update the subScreenStack to remove the sub-screen with itemId
        updatedSubScreenStack = subScreenStack.map(subScreen =>
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

  const handleAddSelectedItem = item => {
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
        updatedMenuScreens[selectedMainScreenIndex] = {
          ...updatedMenuScreens[selectedMainScreenIndex],
          subScreens: [...(updatedMenuScreens[selectedMainScreenIndex].subScreens || []), newItemSubScreen],
        };
      } else {
        const topSubScreen = subScreenStack[subScreenStack.length - 1];

        updatedMenuScreens[selectedMainScreenIndex] = {
          ...updatedMenuScreens[selectedMainScreenIndex],
          subScreens: findAndAddItem(updatedMenuScreens[selectedMainScreenIndex].subScreens, topSubScreen, newItemSubScreen),
        };

        updatedSubScreenStack = subScreenStack.map(subScreen =>
          subScreen === topSubScreen ? { ...topSubScreen, subScreens: [...(topSubScreen.subScreens || []), newItemSubScreen] } : subScreen
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

  const findAndAddSubScreen = (subScreens, targetSubScreen, newSubScreen) => {
    return subScreens?.map(subScreen => {
      if (areObjectsEqual(subScreen, targetSubScreen)) {
        return {
          ...subScreen,
          subScreens: [...(subScreen.subScreens || []), newSubScreen],
        };
      } else if (subScreen?.subScreens) {
        const updatedNestedSubScreens = findAndAddSubScreen(subScreen.subScreens, targetSubScreen, newSubScreen);
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

    if (subScreenStack.length === 1) {
      const topSubScreens = updatedMenuScreens[selectedMainScreenIndex]?.subScreens;
      const hasDuplicateOnFirstLevel = topSubScreens?.some(subScreen => subScreen.name === newSubScreenName);

      if (hasDuplicateOnFirstLevel) {
        alert('Sub-screen with the same name already exists on this level.');
      } else {
        updatedMenuScreens[selectedMainScreenIndex] = {
          ...updatedMenuScreens[selectedMainScreenIndex],
          subScreens: [
            ...(updatedMenuScreens[selectedMainScreenIndex].subScreens || []),
            {
              name: newSubScreenName,
              backgroundColor: newSubScreenColor,
              numberOfColumns: newSubScreenCols,
              componentType: 'SUB_SCREENS',
              managerOnlyAccess: false,
              subScreens: [],
            },
          ],
        };
      }
    } else {
      const topSubScreen = subScreenStack[subScreenStack.length - 1];
      const hasDuplicate = topSubScreen.subScreens.some(subScreen => subScreen.name === newSubScreenName);
      if (hasDuplicate) {
        alert('Sub-screen with the same name already exists on this level.');
      } else {
        updatedMenuScreens[selectedMainScreenIndex] = {
          ...updatedMenuScreens[selectedMainScreenIndex],
          subScreens: findAndAddSubScreen(updatedMenuScreens[selectedMainScreenIndex].subScreens, topSubScreen, {
            name: newSubScreenName,
            backgroundColor: newSubScreenColor,
            numberOfColumns: newSubScreenCols,
            componentType: 'SUB_SCREENS',
            managerOnlyAccess: false,
            subScreens: [],
          }),
        };
        updatedSubScreenStack = subScreenStack.map(subScreen =>
          subScreen === topSubScreen && subScreen
            ? {
                ...topSubScreen,
                subScreens: [
                  ...(topSubScreen.subScreens || []),
                  {
                    name: newSubScreenName,
                    backgroundColor: newSubScreenColor,
                    numberOfColumns: newSubScreenCols,
                    componentType: 'SUB_SCREENS',
                    managerOnlyAccess: false,
                    subScreens: [],
                  },
                ],
              }
            : subScreen
        );
      }
    }

    updatedData.menuScreens = updatedMenuScreens;

    setData(updatedData);
    if (updatedSubScreenStack) {
      setSubScreenStack(updatedSubScreenStack);
    }

    setIsModalOpen({ ...isModalOpen, isSubScreenModalOpen: false });

    setNewSubScreenName('');
    setNewSubScreenColor('');
    setNewSubScreenCols(null);
  };

  const findAndRemoveCard = (subScreens, targetSubScreen, subScreenIndex) => {
    return subScreens.map(subScreen => {
      if (areObjectsEqual(subScreen, targetSubScreen)) {
        const cardToRemove = subScreen.subScreens[subScreenIndex];
        if (cardToRemove.componentType === 'ITEM') {
          const itemID = cardToRemove?.component?.item?.id;
          const newItemsToDisplay = selectedItems.filter(itm => itm.id !== itemID);
          setSelectedItems(newItemsToDisplay);
        }
        return {
          ...subScreen,
          subScreens: subScreen.subScreens.filter((_, index) => index !== subScreenIndex),
        };
      } else if (subScreen.subScreens) {
        const updatedNestedSubScreens = findAndRemoveCard(subScreen.subScreens, targetSubScreen, subScreenIndex);
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

  const handleRemoveCard = (mainScreenIndex, subScreenIndex, item) => {
    const isConfirmed = window.confirm(`Are you sure you want to remove ${item?.name}`);
    if (!isConfirmed) return;
    setData(prevData => {
      const updatedMenuScreens = prevData.menuScreens.map((mainScreen, i) => {
        if (i === mainScreenIndex) {
          if (subScreenStack.length === 1) {
            const cardToRemove = mainScreen.subScreens[subScreenIndex];
            if (cardToRemove.componentType === 'ITEM') {
              const itemID = cardToRemove?.component?.item?.id;
              const newItemsToDisplay = selectedItems.filter(itm => itm.id !== itemID);
              setSelectedItems(newItemsToDisplay);
            }

            const updatedSubScreens = mainScreen.subScreens.filter((subScreen, j) => j !== subScreenIndex);
            return {
              ...mainScreen,
              subScreens: updatedSubScreens,
            };
          } else {
            const updatedSubScreenStack = subScreenStack.map(subScreen =>
              subScreen === subScreenStack[subScreenStack.length - 1]
                ? {
                    ...subScreen,
                    subScreens: subScreen.subScreens.filter((item, k) => k !== subScreenIndex),
                  }
                : subScreen
            );
            setSubScreenStack(updatedSubScreenStack);
            const topSubScreen = subScreenStack[subScreenStack.length - 1];
            const updatedSubScreens = findAndRemoveCard(mainScreen.subScreens, topSubScreen, subScreenIndex);
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

    if (!subscreens || subscreens.length === 0) {
      return null;
    }
    const mainScreen = data?.menuScreens?.[selectedMainScreenIndex];

    const cols =
      subScreenStack?.length === 1
        ? mainScreen.numberOfColumns
        : subScreenStack?.[subScreenStack.length - 1]?.numberOfColumns && subScreenStack?.[subScreenStack.length - 1]?.numberOfColumns > 8
        ? 8
        : subScreenStack?.[subScreenStack.length - 1]?.numberOfColumns || 1;

    const columnStyle = {
      display: 'grid',
      gridTemplateColumns: `repeat(${cols},  1fr)`,
      gridAutoFlow: 'row',
    };

    return (
      <div className="d-flex gap-3 mb-3" onDragOver={e => e.preventDefault()}>
        <Col md={12}>
          <div style={columnStyle}>
            {subscreens.map((item, index) => (
              <div
                key={index}
                draggable
                className={'col'}
                onDragStart={() => handleSubDragStart(mainScreenIndex, index)}
                onDragOver={e => handleSubDragOver(index, e)}
                onDragEnd={handleSubDragEnd}
              >
                <div className="d-flex flex-column p-1 cursor-pointer card p-3">
                  <div className={'d-flex'}>
                    <span className="m-0">{item.componentType}</span>
                    <div className="ml-auto">
                      <MdModeEditOutline size={20} onClick={() => openEditModal(item, index, 'sub')} />
                      &nbsp;
                      <MdDeleteOutline size={20} color={'red'} onClick={() => handleRemoveCard(mainScreenIndex, index, item)} />
                    </div>
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
                      <Button style={{ backgroundColor: item.backgroundColor, width: '55px', height: '30px', marginRight: '10px' }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Col>
      </div>
    );
  };

  const handleSubDragStart = (mainIndex, subIndex) => {
    setSelectedMainScreenIndex(mainIndex);
    setDraggedIndex(subIndex);
  };

  const handleSubDragOver = (subIndex, e) => {
    e.preventDefault();

    setData(prevData => {
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

    return <div className="mt-3">{renderSubScreens(currentSubScreens, selectedMainScreenIndex)}</div>;
  };


  const handleNavigateToSubScreen = subscreen => {
    setSubScreenStack(prev => [...prev, subscreen]);

    const updatedBreadcrumb = [...breadcrumb, subscreen.name];
    setBreadcrumb(updatedBreadcrumb);

    const subScreenItems = subscreen.subScreens
      .filter(item => item.componentType === 'ITEM')
      .map(item => ({ id: item.component.item.id, name: item.component.item.name, desc: item.component.item.desc }));

    setSelectedItems(subScreenItems || []);
  };
  const navigateToBreadcrumbItem = index => {
    if (index >= 0 && index < breadcrumb.length) {
      const newSubScreenStack = subScreenStack.slice(0, index + 1);
      setSubScreenStack(newSubScreenStack);
      const newBreadcrumb = breadcrumb.slice(0, index + 1);
      setBreadcrumb(newBreadcrumb);
    }
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
    dispatch(
      getBranches({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      })
    );
    dispatch(
      getMenuCategories({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      })
    );

    return () => {
      reset();
      setBreadcrumb([]);
      setSubScreenStack([]);
      setSelectedMainScreenIndex(0);
    };
  }, [id, updateSuccess]);

  useEffect(() => {
    if (menuEntity && menuEntity.id) {
      const newData = {
        name: menuEntity.name,
        branch: menuEntity.branch,
        menuScreens: menuEntity.menuScreens,
      };
      if (menuEntity?.category) {
        setSelectedCategory(menuEntity.category);
      }
      if (menuEntity?.branch) {
        setSelectedBranches({ label: menuEntity?.branch?.name, value: menuEntity?.branch?.id });
      }
      setData(newData);
      setBreadcrumb([menuEntity?.menuScreens?.[0]?.name]);
      setSubScreenStack([menuEntity?.menuScreens?.[0]]);
    }
  }, [menuEntity, updateSuccess]);

  useEffect(() => {
    const initialFormData = {
      name: menuEntity.name,
      branch: menuEntity.branch,
      menuScreens: menuEntity.menuScreens,
    };
    setIsFormDirty(!isEqual(data, initialFormData));
  }, [data, menuEntity?.name, menuEntity?.menuScreens, menuEntity?.branch?.id]);

  useEffect(() => {
    const handleBeforeUnload = e => {
      if (isFormDirty) {
        const confirmationMessage = 'You have unsaved changes. Are you sure you want to leave?';
        e.returnValue = confirmationMessage;
        return confirmationMessage;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isFormDirty]);

  const handleDuplicateAction = () => {
    const isConfirmed = window.confirm('Are you sure you want to duplicate this menu?');

    if (isConfirmed) {
      dispatch(duplicateMenu(id))
        .then((result: any) => {
          if (result?.payload?.id) {
            navigate(`/menu/${result.payload.id}/POS/edit?page=1&sort=id,asc`);
          } else {
            console.error('Failed to duplicate menu: No ID returned');
          }
        })
        .catch(error => {
          console.error('Error duplicating menu:', error);
        });
    }
  };

  const handleRemoveMainScreen = (mainScreenIndex, mainScreenName) => {
    const isConfirmed = window.confirm(`Are you sure you want to remove ${mainScreenName}`);
    if (!isConfirmed) return;
    const updatedMenuScreens = [...data.menuScreens];
    updatedMenuScreens.splice(mainScreenIndex, 1);

    if (mainScreenName === breadcrumb[0]) {
      setBreadcrumb([]);
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
          category: selectedCategory,
        };

  const handleCategoryChange = selectedCtgry => {
    setSelectedCategory(selectedCtgry);
  };

  const handleBranchChange = selectedBranches => {
    setSelectedBranches(selectedBranches);
  };

  const saveEntity = (values = null) => {
    if (!data.name) {
      alert('Please enter a menu name.');
      return;
    }
    if (values) {
      values.createdDate = convertDateTimeToServer(values.createdDate);
      values.lastModifiedDate = convertDateTimeToServer(values.lastModifiedDate);
    }

    const { ...restValues } = values;
    const updatedMenuEntity = {
      ...menuEntity,
      ...restValues,
      name: data.name,
      branch: { id: selectedBranches.value },
      category: selectedCategory,
      menuScreens: data.menuScreens,
      item: data?.item?.map(item => ({ id: item.id })),
    };

    if (isNew) {
      dispatch(createEntity(updatedMenuEntity));
    } else {
      dispatch(updateEntity(updatedMenuEntity));
    }
    setIsModalOpen({ ...isModalOpen, isEditModalOpen: false });
    setIsModalOpen({ ...isModalOpen, isMenuModalOpen: false });
  };

  if (loading) {
    return (
      <div>
        <Spinner />
      </div>
    );
  }

  const handleMainDragStart = index => {
    setSelectedMainScreenIndex(index);
    setDraggedIndex(index);
  };

  const handleMainDragOver = index => {
    if (index !== draggedIndex) {
      const newData = [...data.menuScreens];
      const [draggedItem] = newData.splice(draggedIndex, 1);
      newData.splice(index, 0, draggedItem);
      setData({ ...data, menuScreens: newData });
      setDraggedIndex(index);
      setSelectedMainScreenIndex(index);
    }
  };

  const handleMainDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="mt-5">
      <Card>
        <div className="d-flex justify-content-between align-items-center p-3">
          <h1>{menuEntity.name}</h1>
          <div>
            <Button color="primary" onClick={() => setIsModalOpen({ ...isModalOpen, isMenuModalOpen: true })}>
              <FontAwesomeIcon icon="pencil-alt" />{' '}
              <span className="d-none d-md-inline">
                <Translate contentKey="menus.shared.update.edit.buttons.edit">Edit</Translate>
              </span>
            </Button>
            <Button onClick={() => dispatch(sendEvent(id))} className="btn-success ms-2" style={{ fontFamily: 'fantasy' }}>
              <Translate contentKey="menus.shared.update.edit.buttons.trigger">Trigger</Translate>
            </Button>
            <Button onClick={handleDuplicateAction} className="btn-success ms-2" style={{ fontFamily: 'fantasy' }}>
              <Translate contentKey="menus.shared.update.edit.buttons.duplicate">Duplicate Menu</Translate>
            </Button>
          </div>
        </div>
        <CardBody>
          <p>
            <Translate contentKey="menus.shared.update.edit.branch">Branch</Translate>: {menuEntity.branch ? menuEntity.branch?.name : ''}
          </p>
          <p>
            <Translate contentKey="menus.shared.update.edit.createdAt">Created At</Translate>:{' '}
            {menuEntity.createdDate ? <TextFormat value={menuEntity.createdDate} type="date" format={APP_DATE_FORMAT} /> : null}
          </p>
          <p>
            <Translate contentKey="menus.shared.update.edit.updatedAt">Updated At</Translate>:{' '}
            {menuEntity.lastModifiedDate ? <TextFormat value={menuEntity.lastModifiedDate} type="date" format={APP_DATE_FORMAT} /> : null}
          </p>
          <p>
            <Translate contentKey="menus.shared.update.edit.url">Menu URl</Translate>: {menuEntity.menuUrl ? menuEntity.menuUrl : ''}
          </p>
          <p>
            <Translate contentKey="menus.shared.update.category">Category</Translate>: {menuEntity.category ? menuEntity.category.name : ''}
          </p>
        </CardBody>
      </Card>
      <Card>
        <Row style={{ minHeight: '55rem' }}>
          <Col md="3" className="border-right-1">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2 className="border- border-dark pb-3">
                  <Translate contentKey={'menus.pos.update.mainScreens'}>Main Screens</Translate>
                </h2>
                <Button color="primary" onClick={handleMainScreenAdd}>
                  <Translate contentKey={'menus.pos.update.buttons.add'}>Add</Translate>
                </Button>
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
                    <div
                      onClick={() => {
                        const mainScreenItems = mainScreen?.subScreens
                          ?.filter(item => item.componentType === 'ITEM')
                          .map(item => ({ id: item.component.item.id, name: item.component.item.name, desc: item.component.item.desc }));
                        setSelectedItems(mainScreenItems || []);
                        setSelectedMainScreenIndex(index);
                        setSubScreenStack([mainScreen]);
                        setBreadcrumb(() => [mainScreen.name]);
                      }}
                    >
                      <div className="d-flex justify-content-end">
                        <MdModeEditOutline size={20} onClick={() => openEditModal(mainScreen, index, 'main')} />
                        &nbsp;
                        <MdDeleteOutline size={20} color={'red'} onClick={() => handleRemoveMainScreen(index, mainScreen.name)} />
                      </div>
                      <h5 className="m-0 mr-3 mb-2">{mainScreen.name}</h5>
                      <div className="d-flex flex-row justify-content-between">
                        <Button style={{ backgroundColor: mainScreen.backgroundColor, width: '55px', height: '30px' }} />
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </ListGroup>
          </Col>
          <Col md="9" className="border-left">
            <div className="d-flex justify-content-between">
              <Col md="8">
                <h2>
                  {breadcrumb?.length > 0 &&
                    breadcrumb.map((breadcrumbTitle, index) => (
                      <span key={index} className="cursor-pointer" onClick={() => navigateToBreadcrumbItem(index)}>
                        {breadcrumbTitle}
                        {index < breadcrumb.length - 1 && ' / '}
                      </span>
                    ))}
                </h2>
              </Col>

              <Button color="primary" onClick={() => handleButtonAdd('Item')} className="ml-2">
                <Translate contentKey={'menus.pos.update.buttons.addItem'}>Add Item</Translate>
              </Button>
              <Button color="primary" onClick={() => handleButtonAdd('Sub-screen')} className="ml-2">
                <Translate contentKey={'menus.pos.update.buttons.addSubScreen'}>Add SubScreen</Translate>
              </Button>

              <Button onClick={togglePreviewModal} className="mx-2 btn btn-info">
                <Translate contentKey={'menus.pos.update.buttons.preview'}>Preview</Translate>
              </Button>
              <Button color="primary" disabled={updating} onClick={handleSaveClick} className="">
                <Translate contentKey={'entity.action.save'}>Save</Translate>
              </Button>
            </div>
            <div className="mt-3">{renderCurrentSubScreen()}</div>
          </Col>
        </Row>
      </Card>

      <Modal
        isOpen={isModalOpen.isPreviewModalOpen}
        className="modal-xl"
        toggle={() => setIsModalOpen({ ...isModalOpen, isPreviewModalOpen: !isModalOpen.isPreviewModalOpen })}
      >
        <ModalHeader toggle={() => setIsModalOpen({ ...isModalOpen, isPreviewModalOpen: !isModalOpen.isPreviewModalOpen })}>
          <Translate contentKey={'menus.pos.update.modals.preview.title'}>Screen Preview</Translate>
        </ModalHeader>
        <ModalBody style={{ minWidth: '100%', minHeight: '60vh' }}>
          <MenuPosPreview data={data} />
        </ModalBody>
      </Modal>

      <Modal
        isOpen={isModalOpen.isMainScreenModalOpen}
        toggle={() => setIsModalOpen({ ...isModalOpen, isMainScreenModalOpen: !isModalOpen.isMainScreenModalOpen })}
      >
        <ModalHeader toggle={() => setIsModalOpen({ ...isModalOpen, isMainScreenModalOpen: !isModalOpen.isMainScreenModalOpen })}>
          <Translate contentKey={'menus.pos.update.modals.mainScreen.title'}>Add new main screen</Translate>
        </ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label for="mainScreenName">
              <Translate contentKey={'menus.pos.update.modals.mainScreen.name'}>Main screen name</Translate>
            </Label>
            <Input
              type="text"
              id="mainScreenName"
              required
              value={newMainScreenName}
              onChange={e => setNewMainScreenName(e.target.value)}
            />

            <div className={'d-flex flex-column mt-2'}>
              <Label for="newMainScreenCols">Main screen cols</Label>
              <InputNumber
                id="newMainScreenCols"
                value={newMainScreenCols}
                min={1}
                max={12}
                onChange={e => setNewMainScreenCols(e.value)}
              />
            </div>

            <Label for="colorTheme">
              <Translate contentKey={'menus.pos.update.modals.mainScreen.color'}>Select color theme</Translate>
            </Label>
            <div className="d-flex flex-wrap mt-3">
              {colorThemes.map((color, index) => (
                <Button
                  key={index}
                  style={{
                    backgroundColor: color,
                    width: '55px',
                    height: '30px',
                    border: 'none',
                    marginRight: '10px',
                    marginBottom: '10px',
                  }}
                  className={selectedColorTheme === color ? 'active' : ''}
                  onClick={() => setSelectedColorTheme(color)}
                ></Button>
              ))}
            </div>
          </FormGroup>
          <Button color="primary" onClick={handleModalSubmit}>
            <Translate contentKey={'menus.pos.update.modals.mainScreen.add'}>Add Main Screen</Translate>
          </Button>
        </ModalBody>
      </Modal>

      <Modal
        isOpen={isModalOpen.isSubScreenModalOpen}
        toggle={() => setIsModalOpen({ ...isModalOpen, isSubScreenModalOpen: !isModalOpen.isSubScreenModalOpen })}
      >
        <ModalHeader toggle={() => setIsModalOpen({ ...isModalOpen, isSubScreenModalOpen: !isModalOpen.isSubScreenModalOpen })}>
          <Translate contentKey={'menus.pos.update.modals.subScreen.title'}>Add new sub-screen</Translate>
        </ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label for="subScreenName">
              <Translate contentKey={'menus.pos.update.modals.subScreen.name'}>Sub-screen name</Translate>
            </Label>
            <Input type="text" id="subScreenName" value={newSubScreenName} onChange={e => setNewSubScreenName(e.target.value)} />

            <div className={'d-flex flex-column mt-2'}>
              <Label for="subScreenColumns">Sub-screen Cols</Label>
              <InputNumber id="subScreenColumns" min={1} max={12} value={newSubScreenCols} onChange={e => setNewSubScreenCols(e.value)} />
            </div>

            <Label for="subScreenColor">
              <Translate contentKey={'menus.pos.update.modals.subScreen.color'}>Select color theme</Translate>
            </Label>
            <div className="d-flex flex-wrap mt-3">
              {colorThemes.map((color, index) => (
                <Button
                  key={index}
                  style={{
                    backgroundColor: color,
                    width: '55px',
                    height: '30px',
                    border: 'none',
                    marginRight: '10px',
                    marginBottom: '10px',
                  }}
                  className={newSubScreenColor === color ? 'active' : ''}
                  onClick={() => setNewSubScreenColor(color)}
                ></Button>
              ))}
            </div>
          </FormGroup>
          <Button color="primary" onClick={handleSubScreenModalSubmit}>
            <Translate contentKey={'menus.pos.update.modals.subScreen.add'}>Add Sub-Screen</Translate>
          </Button>
        </ModalBody>
      </Modal>

      {isModalOpen.isItemModalOpen && (
        <ItemSelectionModal
          isOpen={isModalOpen.isItemModalOpen}
          toggle={() => setIsModalOpen({ ...isModalOpen, isItemModalOpen: !isModalOpen.isItemModalOpen })}
          selectedItems={selectedItems}
          handleToggleSelect={handleToggleSelect}
        />
      )}

      <Modal isOpen={isModalOpen.isEditModalOpen} toggle={() => setIsModalOpen({ ...isModalOpen, isEditModalOpen: false })}>
        <ModalHeader toggle={() => setIsModalOpen({ ...isModalOpen, isEditModalOpen: false })}>
          <Translate contentKey={'menus.pos.update.modals.editScreen.title'}>Edit</Translate>
        </ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label for="subScreenName">
              <Translate contentKey={'menus.pos.update.modals.editScreen.name'}>Name</Translate>
            </Label>
            <Input type="text" id="subScreenName" value={editScreenName} onChange={e => setEditScreenName(e.target.value)} />

            {editScreenCols ? (
              <div className={'d-flex flex-column mt-2'}>
                <Label for="editCols">Cols</Label>
                <InputNumber id="editCols" min={1} max={12} value={editScreenCols} onChange={e => setEditScreenCols(e.value)} />
              </div>
            ) : null}

            <Label for="subScreenColor">
              <Translate contentKey={'menus.pos.update.modals.editScreen.color'}>Select color theme</Translate>
            </Label>
            <div className="d-flex flex-wrap mt-3">
              {colorThemes.map((color, index) => (
                <Button
                  key={index}
                  style={{
                    backgroundColor: color,
                    width: '55px',
                    height: '30px',
                    border: 'none',
                    marginRight: '10px',
                    marginBottom: '10px',
                  }}
                  className={editScreenColor === color ? 'active' : ''}
                  onClick={() => setEditScreenColor(color)}
                ></Button>
              ))}
            </div>
          </FormGroup>
          <Button
            color="primary"
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              handleEditScreen();
            }}
          >
            <Translate contentKey={'entity.action.save'}>Save</Translate>
          </Button>
        </ModalBody>
      </Modal>

      {isModalOpen.isMenuModalOpen && (
        <Modal isOpen={isModalOpen.isMenuModalOpen} className="modal-lg">
          <ModalHeader toggle={() => setIsModalOpen({ ...isModalOpen, isMenuModalOpen: !isModalOpen.isMenuModalOpen })}>
            <Translate contentKey="menus.shared.update.edit.title">Create or edit a Menu</Translate>
          </ModalHeader>
          <ModalBody>
            <ValidatedForm defaultValues={defaultValues()} onSubmit={saveEntity}>
              <div className={'d-flex flex-column gap-2'}>
                <label>
                  <Translate contentKey={'menus.shared.update.name'}>Name</Translate>
                </label>
                <InputText
                  type="text"
                  name="name"
                  id="name"
                  required={true}
                  placeholder="Menu Name"
                  value={data.name || ''}
                  onChange={e => setData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <ValidatedField label={translate('menus.shared.update.url')} id="menu-menuUrl" name="menuUrl" data-cy="menuUrl" type="text" />
              <div className="mb-3">
                {translate('menus.shared.update.branches')}
                <Select defaultValue={initialBranches} onChange={handleBranchChange} options={branchList} />
              </div>
              <div className="mb-3">
                {translate('menus.shared.update.category')}
                <Select
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  options={menuCategories}
                  getOptionLabel={option => option.name}
                  getOptionValue={option => option.id}
                />
              </div>
              <Button
                id="cancel-save"
                data-cy="entityCreateCancelButton"
                onClick={() => setIsModalOpen({ ...isModalOpen, isMenuModalOpen: !isModalOpen.isMenuModalOpen })}
                replace
                color="info"
              >
                <FontAwesomeIcon icon="arrow-left" />
                &nbsp;
                <span className="d-none d-md-inline">
                  <Translate contentKey="entity.action.back">Back</Translate>
                </span>
              </Button>
              &nbsp;
              <Button color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                <FontAwesomeIcon icon="save" />
                &nbsp;
                <Translate contentKey="entity.action.save">Save</Translate>
              </Button>
            </ValidatedForm>
          </ModalBody>
        </Modal>
      )}
    </div>
  );
}

export default MenuUpdate;
