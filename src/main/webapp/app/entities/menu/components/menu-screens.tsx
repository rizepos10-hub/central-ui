import React, { useEffect, useState, useMemo } from 'react'
import { MdDeleteOutline, MdModeEditOutline } from 'react-icons/md';
import { Translate } from 'react-jhipster';
import { Button, Card, Col, FormGroup, Input, Label, ListGroup, Modal, ModalBody, ModalHeader, Row, Spinner } from 'reactstrap';
import MenuPosPreview from './menu-pos-preview';
import { InputNumber } from 'primereact/inputnumber';
import ItemSelectionModal from '../item-selection-modal';

import { IMenu, IMenuScreen } from 'app/shared/model/menu.model';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Slider } from 'primereact/slider';
import { InputText } from 'primereact/inputtext';
import _, { update } from 'lodash';
import { IItem } from 'app/shared/model/ITEM/item.model';
import { IMenuData } from '../menu-instance';
import { CiGrid41 } from "react-icons/ci";
import { CiGrid2H } from "react-icons/ci";

interface MenuScreensProps {
    menu: IMenu;
    data: IMenuData;
    setData: React.Dispatch<React.SetStateAction<any>>;
    saveEntity: (values?: any) => void
    reset: () => void;
    loading: any;
    updating: any;
}

const MenuScreens: React.FC<MenuScreensProps> = ({
    menu,
    data,
    setData,
    saveEntity,
    reset,
    loading,
    updating
}) => {
    const [selectedMainScreenIndex, setSelectedMainScreenIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState({
        isMainScreenModalOpen: false,
        isSubScreenModalOpen: false,
        isItemModalOpen: false,
        isEditModalOpen: false,
        isPreviewModalOpen: false,
    });
    const [selectedScreenIndex, setSelectedScreenIndex] = useState(null);
    const [selectedItems, setSelectedItems] = useState<IItem[]>([]);
    const [editScreenName, setEditScreenName] = useState('');
    const [editScreenColor, setEditScreenColor] = useState('');
    const [editScreenCols, setEditScreenCols] = useState<number | null>(1);
    const [selectedColorTheme, setSelectedColorTheme] = useState('');
    const [newSubScreenName, setNewSubScreenName] = useState('');
    const [selectedScreenType, setSelectedScreenType] = useState(null);
    const [newSubScreenCols, setNewSubScreenCols] = useState<number | null>(1);
    const [newSubScreenColor, setNewSubScreenColor] = useState('');
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [breadcrumb, setBreadcrumb] = useState<string[]>([]);
    const [subScreenStack, setSubScreenStack] = useState([]);
    const [newMainScreenName, setNewMainScreenName] = useState('');
    const [newMainScreenCols, setNewMainScreenCols] = useState<number>(1);
    const [editingSubScreenId, setEditingSubScreenId] = useState(null);

    const [mainScreen, setMainScreen] = useState<IMenuScreen>({
        id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        numberOfColumns: 1,
        subScreens: []
    })
    // const [currentSubScreens, setCurrentSubScreens] = useState<IMenuScreen[]>([]);
    const currentSubScreens = useMemo(() => {
        return subScreenStack?.[subScreenStack.length - 1]?.subScreens || []
    }, [subScreenStack])

    const cols =
        subScreenStack?.length === 1
            ? mainScreen?.numberOfColumns
            : subScreenStack?.[subScreenStack.length - 1]?.numberOfColumns && subScreenStack?.[subScreenStack.length - 1]?.numberOfColumns > 8
                ? 8
                : subScreenStack?.[subScreenStack.length - 1]?.numberOfColumns || 1;
    const [groupedSubscreens, setGroupedSubscreens] = useState<IMenuScreen[][]>([]);
    const [groupedMainScreens, setGroupedMainScreens] = useState<IMenuScreen[][]>([]);
    // useEffect(() => {
    //     if (mainScreen?.subScreens?.length === 0) return
    //     // setGroupedSubscreens(() => {
    //     //     const initialGroups = [];
    //     //     for (let i = 0; i < currentSubScreens?.length; i += cols) {
    //     //         initialGroups.push(currentSubScreens?.slice(i, i + cols));
    //     //     }
    //     //     return initialGroups;
    //     // })
    // }, [currentSubScreens])


    // useEffect(() => {
    //     setCurrentSubScreens(mainScreen?.subScreens)
    // }, [mainScreen])

    useEffect(() => {
        if (data?.menuScreens) {
            setMainScreen(data?.menuScreens?.[selectedMainScreenIndex])
        }
    }, [data])


    const [draggedItem, setDraggedItem] = useState(null)


    const handleMainScreenAdd = () => {
        setIsModalOpen({
            ...isModalOpen,
            isMainScreenModalOpen: true,
        });
        setSelectedMainScreenIndex(null);
    };

    const openEditModal = (selectedScreen, screenIndex, screenType) => {
        setEditingSubScreenId(selectedScreen.id);
        setEditScreenCols(selectedScreen.numberOfColumns);
        setSelectedScreenIndex(screenIndex);
        setSelectedScreenType(screenType);
        setEditScreenName(selectedScreen.name);
        setEditScreenColor(selectedScreen.backgroundColor);
        setIsModalOpen({ ...isModalOpen, isEditModalOpen: true });
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

    // const findAndRemoveCard = (subScreens, targetSubScreen, subScreenIndex) => {
    //     return subScreens.map(subScreen => {
    //         if (areObjectsEqual(subScreen, targetSubScreen)) {
    //             const cardToRemove = subScreen.subScreens[subScreenIndex];
    //             if (cardToRemove.componentType === 'ITEM') {
    //                 const itemID = cardToRemove?.component?.item?.id;
    //                 const newItemsToDisplay = selectedItems.filter(itm => itm.id !== itemID);
    //                 setSelectedItems(newItemsToDisplay);
    //             }
    //             return {
    //                 ...subScreen,
    //                 subScreens: subScreen.subScreens.filter((_, index) => index !== subScreenIndex),
    //             };
    //         } else if (subScreen.subScreens) {
    //             const updatedNestedSubScreens = findAndRemoveCard(subScreen.subScreens, targetSubScreen, subScreenIndex);
    //             if (updatedNestedSubScreens !== subScreen.subScreens) {
    //                 return {
    //                     ...subScreen,
    //                     subScreens: updatedNestedSubScreens,
    //                 };
    //             }
    //         }
    //         return subScreen;
    //     });
    // };

    const confirm1 = (mainScreenIndex, item) => {
        confirmDialog({
            message: 'Do you want to delete this record?',
            icon: 'pi pi-exclamation-triangle',
            defaultFocus: 'accept',
            accept: () => handleRemoveCard(mainScreenIndex, item),
            // reject
        });
    };

    const confirm2 = (mainScreenIndex, mainScreenName) => {
        confirmDialog({
            message: 'Do you want to delete this record?',
            icon: 'pi pi-exclamation-triangle',
            defaultFocus: 'accept',
            accept: () => handleRemoveMainScreen(mainScreenIndex, mainScreenName),
            // reject
        });
    };
    console.log(subScreenStack, 'subScreenStack')
    const handleRemoveCard = (mainScreenIndex, item) => {
        setData(prevData => {
            const updatedMenuScreens = prevData.menuScreens.map((mainScreen, i) => {
                if (i === mainScreenIndex) {
                    if (subScreenStack.length === 1) {
                        if (item.componentType === 'ITEM') {
                            const itemID = item?.component?.item?.id;
                            const newItemsToDisplay = selectedItems.filter(itm => itm.id !== itemID);
                            setSelectedItems(newItemsToDisplay);
                        }

                        const updatedSubScreens = mainScreen.subScreens.filter(subScreen => subScreen.id !== item.id);
                        return {
                            ...mainScreen,
                            subScreens: updatedSubScreens,
                        };
                    } else {
                        const updatedSubScreenStack = subScreenStack.map(subScreen =>
                            subScreen === subScreenStack[subScreenStack.length - 1]
                                ? {
                                    ...subScreen,
                                    subScreens: subScreen.subScreens.filter(subScreen => subScreen.id !== item.id),
                                }
                                : subScreen
                        );
                        // setSubScreenStack(updatedSubScreenStack);
                        // Update mainScreen.subScreens if necessary
                        const updatedSubScreens = mainScreen.subScreens.map(subScreen => {
                            if (subScreen.id === subScreenStack[subScreenStack.length - 1].id) {
                                return {
                                    ...subScreen,
                                    subScreens: subScreen.subScreens.filter(subScreen => subScreen.id !== item.id),
                                };
                            }
                            return subScreen;
                        });
                        return {
                            ...mainScreen,
                            subScreens: updatedSubScreens,
                        };
                    }
                }
                return mainScreen;
            });


            setSubScreenStack([updatedMenuScreens[selectedMainScreenIndex]])
            return {
                ...prevData,
                menuScreens: updatedMenuScreens,
            };
        });
    };

    function updateSubScreenById(menuScreens, subScreenToUpdate) {
        return menuScreens.map(screen => {
            if (screen.id === subScreenToUpdate.id) {
                // Replace the matching screen with the updated one
                return { ...screen, ...subScreenToUpdate };
            }

            if (screen.subScreens && screen.subScreens.length > 0) {
                // Recursively update within subScreens
                return {
                    ...screen, // Copy the screen
                    subScreens: updateSubScreenById(screen.subScreens, subScreenToUpdate) // Recursively update
                };
            }

            return screen; // Return the original screen if no updates
        });
    }

    const renderSubScreens = (subscreens: IMenuScreen[], mainScreenIndex: number) => {
        const handleDragStart = (e, { rowIndex, itemIndex }) => {
            setDraggedItem({ rowIndex, itemIndex });
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', ''); // Required for Firefox compatibility
        };

        const handleDragOver = (e) => {
            e.preventDefault(); // Necessary to allow dropping
            e.dataTransfer.dropEffect = 'move';
        };

        function updateScreenSubscreens(
            data,
            targetId,
            newSubscreens
        ) {
            return data.map(screen => {
                if (screen.id === targetId) {
                    // Found the screen, return a new object with updated subscreens
                    return { ...screen, subScreens: newSubscreens };
                } else if (screen.subScreens) {
                    // If subscreens exist, recursively update them
                    return {
                        ...screen,
                        subScreens: updateScreenSubscreens(screen.subScreens, targetId, newSubscreens),
                    };
                } else {
                    // Return the screen as is if no changes are needed
                    return screen;
                }
            });
        }

        const handleDrop = (e, { rowIndex: destRowIndex, itemIndex: destItemIndex }) => {
            e.preventDefault();

            if (draggedItem) {
                const { rowIndex: sourceRowIndex, itemIndex: sourceItemIndex } = draggedItem;

                // Avoid unnecessary updates
                if (sourceRowIndex === destRowIndex && sourceItemIndex === destItemIndex) {
                    return;
                }

                // Deep copy of groupedSubscreens
                const newGroupedSubscreens = groupedSubscreens.map((row) => [...row]);

                // Remove item from source
                const [movedItem] = newGroupedSubscreens[sourceRowIndex].splice(sourceItemIndex, 1);

                // Calculate destination index in the flat array
                const destIndexInFlatArray = destRowIndex * cols + destItemIndex;

                // Flatten items
                const flatItems = newGroupedSubscreens.flat();

                const updatedData = updateScreenSubscreens(data?.menuScreens, subScreenStack.at(-1)?.id, flatItems);
                setData({
                    ...data,
                    menuScreens: updatedData
                });


                // Insert moved item at destination
                flatItems.splice(destIndexInFlatArray, 0, movedItem);

                // Regroup items
                const regroupedSubscreens = [];
                for (let i = 0; i < flatItems.length; i += cols) {
                    regroupedSubscreens.push(flatItems.slice(i, i + cols));
                }

                // Update state
                setGroupedSubscreens(regroupedSubscreens);
            }

            // Reset dragged item
            setDraggedItem(null);
        };

        const handleDragEnd = () => {
            setDraggedItem(null);
        };

        if (!subscreens || subscreens.length === 0) {
            return null;
        }

        // Group subscreens into rows based on the number of columns

        function findScreenById(menuScreens, targetId) {
            for (const screen of menuScreens) {
                if (screen.id === targetId) {
                    return screen;
                }
                if (screen.subScreens && screen.subScreens.length > 0) {
                    const found = findScreenById(screen.subScreens, targetId);
                    if (found) {
                        return found;
                    }
                }
            }
            return null;
        }

        const handleRowHeightChange = (value, rowIndex) => {
            let updatedMenuScreens = [...data.menuScreens];


            let subScreenToUpdate = findScreenById(updatedMenuScreens, subScreenStack?.at(-1).id);


            // Ensure rowHeight is initialized as an array for the selected main screen
            if (!subScreenToUpdate.rowHeight) {
                subScreenToUpdate.rowHeight = [];
            }

            // Make a copy of the rowHeight array and update the row height for the current rowIndex
            const updatedRowHeight = [...subScreenToUpdate.rowHeight];

            // Clamp the value between 1 and 2
            const newValue = Math.max(0.5, Math.min(2, value));

            updatedRowHeight[rowIndex] = newValue;

            // Update the subScreenToUpdate with the new rowHeight array
            subScreenToUpdate = {
                ...subScreenToUpdate,
                rowHeight: updatedRowHeight,
            };

            updatedMenuScreens = updateSubScreenById(updatedMenuScreens, subScreenToUpdate);

            setData({
                ...data,
                menuScreens: updatedMenuScreens,
            });
        };

        const handleInputChange = (e, rowIndex) => {
            const value = parseFloat(e.target.value);
            if (!isNaN(value)) {
                handleRowHeightChange(value, rowIndex);
            }
        };
        return (
            <div className="d-flex gap-3 mb-3" onDragOver={e => e.preventDefault()}>
                <Col md={12}>
                    {groupedSubscreens.map((row, rowIndex) => (
                        <React.Fragment key={rowIndex}>
                            <div className="mb-2 d-flex align-items-center">
                                <Slider
                                    value={findScreenById(data?.menuScreens, subScreenStack?.at(-1)?.id)?.rowHeight?.[rowIndex] || 0.5}
                                    onChange={(e) => handleRowHeightChange(e.value, rowIndex)}
                                    min={0.5}
                                    max={2}
                                    step={0.01}
                                    className="w-full"
                                />
                                <InputText
                                    value={findScreenById(data?.menuScreens, subScreenStack?.at(-1).id)?.rowHeight?.[rowIndex] || 0.5}
                                    onChange={(e) => handleInputChange(e, rowIndex)}
                                    className="w-full ml-2"
                                    type="number"
                                    min={0.5}
                                    max={2}
                                    step={0.1}
                                />
                            </div>

                            {/* Render the row with the calculated row height */}
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                                    gridAutoFlow: 'row',
                                    height: `${150 * (findScreenById(data?.menuScreens, subScreenStack?.at(-1).id)?.rowHeight?.[rowIndex] || 1)}px`,
                                }}
                            >
                                {row.map((item, index) => (
                                    <div
                                        key={index}
                                        draggable
                                        className="col"
                                        onDragStart={(e) => handleDragStart(e, { rowIndex, itemIndex: index })}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, { rowIndex, itemIndex: index })}
                                        onDragEnd={handleDragEnd}
                                    >
                                        <div className="d-flex flex-column p-1 cursor-pointer card p-3 h-100">
                                            <div className={'d-flex'}>
                                                <span className="m-0">{item?.componentType}</span>
                                                <div className="ml-auto">
                                                    <MdModeEditOutline size={20} onClick={() => openEditModal(item, index, 'sub')} />
                                                    &nbsp;
                                                    <MdDeleteOutline
                                                        size={20}
                                                        color={'red'}
                                                        onClick={(e) => confirm1(mainScreenIndex, item)}
                                                    />
                                                </div>
                                            </div>

                                            <div
                                                onClick={() => {
                                                    if (item?.componentType === 'SUB_SCREENS') {
                                                        handleNavigateToSubScreen(item);
                                                    }
                                                }}
                                            >
                                                <h4 className="m-0 mb-2">{item?.name}</h4>
                                                <div className="d-flex align-items-center">
                                                    <Button style={{ backgroundColor: item?.backgroundColor, width: '55px', height: '30px', marginRight: '10px' }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </React.Fragment>
                    ))}
                </Col>
            </div>
        );
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

    const findSubScreenByName = (subScreens: IMenuScreen[], name: string) => {
        for (const subScreen of subScreens) {
            if (subScreen.name === name) {
                return subScreen;
            }
        }
        return null;
    };

    const renderCurrentSubScreen = () => {
        console.log(data, 'data')
        console.log(mainScreen, 'mainScreen')
        if (!data.menuScreens || data.menuScreens.length === 0 || selectedMainScreenIndex === null) {
            return null;
        }

        if (!mainScreen || !mainScreen.subScreens || mainScreen.subScreens.length === 0) {
            return null;
        }

        for (let i = 0; i < subScreenStack.length; i++) {
            const nextScreenName = subScreenStack[i].name;
            const nextScreen = findSubScreenByName(currentSubScreens, nextScreenName);

            if (!nextScreen || !nextScreen.subScreens || nextScreen.subScreens.length === 0) {
                break;
            }
            // setCurrentSubScreens(nextScreen.subScreens);
        }
        console.log(currentSubScreens, 'currentSubScreens')
        console.log(selectedMainScreenIndex, 'selectedMainScreenIndex')
        return <div className="mt-3">{renderSubScreens(currentSubScreens, selectedMainScreenIndex)}</div>;
    };

    const handleNavigateToSubScreen = (subscreen: IMenuScreen) => {
        setSubScreenStack(prev => [...prev, subscreen]);
        // setGroupedSubscreens(() => {
        //     const initialGroups = [];
        //     for (let i = 0; i < subscreen.subScreens?.length; i += cols) {
        //         initialGroups.push(subscreen.subScreens?.slice(i, i + cols));
        //     }
        //     return initialGroups;
        // })
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
        return () => {
            reset();
            setBreadcrumb([]);
            setSubScreenStack([]);
            setSelectedMainScreenIndex(0);
        };
    }, [])

    useEffect(() => {
        if (menu) {
            setBreadcrumb([menu?.menuScreens?.[0]?.name]);
            setSubScreenStack([menu?.menuScreens?.[0]]);
        }
    }, [menu]);

    const handleRemoveMainScreen = (mainScreenIndex, mainScreenName) => {
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

    const mainScreenItems = useMemo(() => {
        return mainScreen?.subScreens
            ?.filter(item => item.componentType === 'ITEM')
            .map(item => ({ id: item.component.item.id, name: item.component.item.name, desc: item.component.item.desc }));
    }, [mainScreen])

    useEffect(() => {
        setSelectedItems(mainScreenItems || []);
    }, [mainScreenItems])

    const handleMainDragStart = (index: number) => {
        setSelectedMainScreenIndex(index);
        setDraggedIndex(index);
    };

    const handleMainDragOver = (index: number) => {
        if (index !== draggedIndex) {
            const newData = [...data.menuScreens];
            const [draggedItem] = newData.splice(draggedIndex, 1);
            if (!draggedItem) return;
            newData.splice(index, 0, draggedItem);
            setData({ ...data, menuScreens: newData });
            setDraggedIndex(index);
        }
    };

    const handleMainDragEnd = () => {
        setDraggedIndex(null);
    };

    const mainScreenClickHandler = (globalIndex: number, mainScreen: IMenuScreen) => {
        setSelectedMainScreenIndex(globalIndex);
        setSelectedItems(
            mainScreen?.subScreens
                ?.filter(subScreen => subScreen?.componentType === 'ITEM')
                ?.map(subScreen => subScreen?.component?.item)
        );
        setSubScreenStack([mainScreen]);
        setBreadcrumb(() => [mainScreen.name]);
        setMainScreen(mainScreen);
    };

    const groupMainScreens = (screens: IMenuScreen[], columns: number): IMenuScreen[][] => {
        const grouped: IMenuScreen[][] = [];
        for (let i = 0; i < screens.length; i += columns) {
            const row = screens.slice(i, i + columns).map((item, colIndex) => ({
                ...item,
                rowIndex: colIndex,
            }));
            grouped.push(row);
        }
        console.log(grouped, 'grouped')
        return grouped;
    };

    const handleModalSubmit = ({ empty = false }: { empty?: boolean }) => {
        if (newMainScreenName.trim() === '' && !empty) {
            alert('Main screen name is required.');
            return;
        }

        const updatedData = { ...data };
        const updatedMenuScreens = [...updatedData.menuScreens];
        const hasMainScreenDuplicate = updatedMenuScreens.some(subScreen => subScreen.name === newMainScreenName);

        if (hasMainScreenDuplicate && !empty) {
            alert('Main Screen with the same name already exists.');
            return;
        }

        const newMainScreen: IMenuScreen = {
            id: Math.random().toString(36).substring(2, 15) + Date.now().toString(36).substring(8),
            name: newMainScreenName,
            backgroundColor: selectedColorTheme,
            numberOfColumns: newMainScreenCols || 1,
            managerOnlyAccess: false,
            componentType: 'SUB_SCREENS',
            subScreens: [],
            rowHeight: [],
            empty,
        };
        const newMenuScreens = [...data.menuScreens, newMainScreen];
        const newGroupedMainScreens = groupMainScreens(newMenuScreens, data.numberOfColumns);

        setData({
            ...data,
            menuScreens: [...data.menuScreens, newMainScreen],
        });

        setSubScreenStack([newMainScreen?.subScreens]);
        setSelectedMainScreenIndex(data?.menuScreens?.length);
        setBreadcrumb([newMainScreenName]);
        setIsModalOpen({ ...isModalOpen, isMainScreenModalOpen: false });
        setNewMainScreenName('');
        setSelectedColorTheme('');
        setNewMainScreenCols(1);
        setGroupedMainScreens(newGroupedMainScreens);
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
                            rowHeight: [],
                            id: Math.random().toString(36).substring(2, 15) + Date.now().toString(36).substring(8),
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
                        rowHeight: [],
                        id: Math.random().toString(36).substring(2, 15) + Date.now().toString(36).substring(8),
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
                                    rowHeight: [],
                                    id: Math.random().toString(36).substring(2, 15) + Date.now().toString(36).substring(8),
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
            // setGroupedSubscreens(() => {
            //     const initialGroups = [];
            //     for (let i = 0; i < updatedSubScreenStack[updatedSubScreenStack.length - 1]?.subScreens?.length; i += cols) {
            //         initialGroups.push(updatedSubScreenStack[updatedSubScreenStack.length - 1]?.subScreens?.slice(i, i + cols));
            //     }
            //     return initialGroups;
            // })
        }

        setIsModalOpen({ ...isModalOpen, isSubScreenModalOpen: false });

        setNewSubScreenName('');
        setNewSubScreenColor('');
        setNewSubScreenCols(null);
    };

    useEffect(() => {
        console.log(subScreenStack, 'subScreenStack');
        if (subScreenStack) {
            setGroupedSubscreens(() => {
                const initialGroups = [];
                for (let i = 0; i < subScreenStack[subScreenStack.length - 1]?.subScreens?.length; i += cols) {
                    initialGroups.push(subScreenStack[subScreenStack.length - 1]?.subScreens?.slice(i, i + cols));
                }
                return initialGroups;
            })
        }
    }, [subScreenStack])

    useEffect(() => {
        if (data?.menuScreens && data.menuScreens.length > 0) {
            // Update each screen with the proper rowIndex based on its column position
            const updatedMenuScreens = data.menuScreens.map((item, index) => ({
                ...item,
                rowIndex: index % data.numberOfColumns,
            }));

            // Group the updated screens into rows based on numberOfColumns
            const newGroupedMainScreens: IMenuScreen[][] = [];
            for (let i = 0; i < updatedMenuScreens.length; i += data.numberOfColumns) {
                newGroupedMainScreens.push(updatedMenuScreens.slice(i, i + data.numberOfColumns));
            }

            // Only update data if any item has an outdated rowIndex
            const needUpdate = data.menuScreens.some(
                (item, index) => item.rowIndex !== updatedMenuScreens[index].rowIndex
            );
            if (needUpdate) {
                setData(prevData => ({
                    ...prevData,
                    menuScreens: updatedMenuScreens,
                }));
            }
            setGroupedMainScreens(newGroupedMainScreens);
        }
    }, [data.menuScreens, data.numberOfColumns]);


    const handleRemoveSelectedItems = (itemIds: string[]) => {
        if (selectedMainScreenIndex === null) {
            alert('Please select a main screen first.');
            return;
        }

        const updatedData = { ...data };
        const updatedMenuScreens = [...updatedData.menuScreens];
        let updatedSubScreenStack = subScreenStack.length > 1 ? [...subScreenStack] : undefined;

        if (subScreenStack.length === 1) {
            // Remove all matching items directly from the main screen
            updatedMenuScreens[selectedMainScreenIndex] = {
                ...updatedMenuScreens[selectedMainScreenIndex],
                subScreens: (updatedMenuScreens[selectedMainScreenIndex].subScreens || []).filter(
                    subScreen => !itemIds.includes(subScreen.component?.item?.id)
                ),
            };
        } else {
            // Remove items from the top sub-screen
            const topSubScreen = subScreenStack[subScreenStack.length - 1];
            let currentSubScreens = [...(updatedMenuScreens[selectedMainScreenIndex].subScreens || [])];

            itemIds.forEach(itemId => {
                currentSubScreens = findAndRemoveItem(currentSubScreens, topSubScreen, itemId);
            });

            updatedMenuScreens[selectedMainScreenIndex] = {
                ...updatedMenuScreens[selectedMainScreenIndex],
                subScreens: currentSubScreens,
            };

            updatedSubScreenStack = updatedSubScreenStack?.map(subScreen =>
                subScreen === topSubScreen
                    ? {
                        ...topSubScreen,
                        subScreens: (topSubScreen.subScreens || []).filter(
                            s => !itemIds.includes(s.component?.item?.id)
                        ),
                    }
                    : subScreen
            );
        }

        updatedData.menuScreens = updatedMenuScreens;
        setData(updatedData);

        updatedSubScreenStack = subScreenStack.map(screen => {
            const updatedScreen = findScreenById([updatedMenuScreens[selectedMainScreenIndex]], screen.id);
            return updatedScreen || screen;
        });

        if (updatedSubScreenStack) {
            setSubScreenStack(updatedSubScreenStack);
        }
    };

    const handleAddSelectedItems = (items: IItem[]) => {
        if (selectedMainScreenIndex === null) {
            alert('Please select a main screen first.');
            return;
        }

        const updatedData = { ...data };
        const updatedMenuScreens = [...updatedData.menuScreens];
        let updatedSubScreenStack: IMenuScreen[] = [...subScreenStack];

        items.forEach(item => {
            const newId = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
            const newItemSubScreen: IMenuScreen = {
                id: newId,
                name: item.name,
                backgroundColor: selectedColorTheme,
                managerOnlyAccess: false,
                componentType: 'ITEM',
                component: {
                    item: { id: item.id },
                },
            };

            if (subScreenStack.length === 1) {
                // Directly add to the main screen
                updatedMenuScreens[selectedMainScreenIndex] = {
                    ...updatedMenuScreens[selectedMainScreenIndex],
                    subScreens: [
                        ...(updatedMenuScreens[selectedMainScreenIndex].subScreens || []),
                        newItemSubScreen
                    ],
                };
            } else {
                // Add inside the current top subScreen
                const topSubScreen = subScreenStack[subScreenStack.length - 1];
                updatedMenuScreens[selectedMainScreenIndex] = {
                    ...updatedMenuScreens[selectedMainScreenIndex],
                    subScreens: findAndAddItem(
                        updatedMenuScreens[selectedMainScreenIndex].subScreens,
                        topSubScreen,
                        newItemSubScreen
                    ),
                };

                // updatedSubScreenStack = updatedSubScreenStack?.map(subScreen =>
                //     subScreen === topSubScreen
                //         ? {
                //             ...topSubScreen,
                //             subScreens: [...(topSubScreen.subScreens || []), newItemSubScreen]
                //         }
                //         : subScreen
                // );
            }
        });

        updatedSubScreenStack = subScreenStack.map(screen => {
            const updatedScreen = findScreenById([updatedMenuScreens[selectedMainScreenIndex]], screen.id);
            return updatedScreen || screen;
        });
        updatedData.menuScreens = updatedMenuScreens;
        setData(updatedData);

        if (updatedSubScreenStack) {
            setSubScreenStack(updatedSubScreenStack);
        }
    };

    const handleToggleSelect = (items: IItem[]) => {
        console.log(1, 'awdawdawdwa')
        setSelectedItems(prevSelectedItems => {
            const itemsToAdd: IItem[] = [];
            const itemsToRemove: IItem[] = [];
            let updatedItems = [...prevSelectedItems];

            items.forEach(item => {
                const isSelected = updatedItems.some(selected => selected.id === item.id);
                if (isSelected) {
                    itemsToRemove.push(item);
                } else {
                    itemsToAdd.push(item);
                }
            });

            if (itemsToRemove.length > 0) {
                handleRemoveSelectedItems(itemsToRemove.map(i => i.id));
                updatedItems = updatedItems.filter(selected => !itemsToRemove.some(r => r.id === selected.id));
            }

            if (itemsToAdd.length > 0) {
                handleAddSelectedItems(itemsToAdd);
                updatedItems = [...updatedItems, ...itemsToAdd];
            }

            return updatedItems;
        });
    };

    // useEffect(() => {
    //     if (subScreenStack) {
    //         setSelectedItems(subScreenStack[subScreenStack.length - 1]?.subScreens?.filter(subScreen => subScreen?.componentType === 'ITEM')?.map(subScreen => subScreen?.component?.item))
    //     }
    // }, [subScreenStack])

    function findScreenById(menuScreens, targetId) {
        for (const screen of menuScreens) {
            if (screen.id === targetId) {
                return screen;
            }
            if (screen.subScreens && screen.subScreens.length > 0) {
                const found = findScreenById(screen.subScreens, targetId);
                if (found) return found;
            }
        }
        return null;
    }


    const handleEditScreen = () => {
        if (!editScreenName.trim()) {
            alert('Please enter a screen name.');
            return;
        }

        setData(prevData => {
            const updatedData = { ...prevData };

            if (selectedScreenType === 'main' && selectedScreenIndex !== null) {
                // Update main screen by index
                updatedData.menuScreens = updatedData.menuScreens.map((mainScreen, i) => {
                    if (i === selectedScreenIndex) {
                        return {
                            ...mainScreen,
                            name: editScreenName,
                            backgroundColor: editScreenColor,
                            numberOfColumns: editScreenCols
                        };
                    }
                    return mainScreen;
                });
            } else if (selectedScreenType === 'sub' && selectedMainScreenIndex !== null && editingSubScreenId) {
                // Find the existing subScreen by ID
                const existingSubScreen = findScreenById(updatedData.menuScreens, editingSubScreenId);
                if (existingSubScreen) {
                    const updatedSubScreen = {
                        ...existingSubScreen,
                        name: editScreenName,
                        backgroundColor: editScreenColor,
                        numberOfColumns: editScreenCols
                    };

                    // Update using the existing updateSubScreenById
                    updatedData.menuScreens = updateSubScreenById(updatedData.menuScreens, updatedSubScreen);

                    // Update the subScreenStack
                    const updatedSubScreenStack = subScreenStack.map(subScreen =>
                        subScreen.id === editingSubScreenId ? updatedSubScreen : subScreen
                    );
                    // setSubScreenStack(updatedSubScreenStack);
                }
            }
            setSubScreenStack([updatedData?.menuScreens?.[selectedMainScreenIndex]])

            return updatedData;
        });

        setIsModalOpen({ ...isModalOpen, isEditModalOpen: false });
        setEditingSubScreenId(null);
    };

    const handleMainRowHeightChange = (value: number | [number, number], rowIndex: number) => {
        const newValue = Array.isArray(value) ? value[0] : value;
        setData(prevData => {
            const updatedRowHeights = [...prevData.rowHeight];
            updatedRowHeights[rowIndex] = newValue;
            return { ...prevData, rowHeight: updatedRowHeights };
        });
    };

    const handleMainInputChange = (e: { value: number | [number, number] }, rowIndex: number) => {
        const newValue = Array.isArray(e.value) ? e.value[0] : e.value;
        setData(prevData => {
            const updatedRowHeights = [...prevData.rowHeight];
            updatedRowHeights[rowIndex] = newValue;
            return { ...prevData, rowHeight: updatedRowHeights };
        });
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

    if (loading) {
        return (
            <div>
                <Spinner />
            </div>
        );
    }


    return (
        <>
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
                                onChange={e => {
                                    if (!e.value) {
                                        setNewMainScreenCols(1)
                                    } else {
                                        setNewMainScreenCols(e.value)
                                    }
                                }}
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
                    <Button color="primary" onClick={() => handleModalSubmit({ empty: false })}>
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
                    // filter selected items by componentType and choose the component item 
                    selectedItems={selectedItems}
                    handleToggleSelect={handleToggleSelect}
                    setSelectedItems={setSelectedItems}
                    disbaleUnselect
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

                        <div className={'d-flex flex-column mt-2'}>
                            <Label for="editCols">Cols</Label>
                            <InputNumber id="editCols" min={1} max={12} value={editScreenCols} onChange={e => setEditScreenCols(e.value)} />
                        </div>

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
                        <Translate contentKey={'entity.action.apply'}>Apply</Translate>
                    </Button>
                </ModalBody>
            </Modal>


            <Card>
                <Row style={{ minHeight: '55rem' }}>
                    <Col md="3" className="border-right-1">
                        <div className="d-flex justify-content-between align-items-center w-100">
                            <div className='d-flex flex-column gap-2 w-100'>
                                <div className='w-100'>
                                    <h2 className="pb-3 w-100">
                                        <Translate contentKey={'menus.pos.update.mainScreens'}>Main Screens</Translate>
                                    </h2>
                                </div>
                                <div className='d-flex justify-content-between w-100'>
                                    <div className='d-flex gap-2'>
                                        <Button color="primary" onClick={handleMainScreenAdd}>
                                            <Translate contentKey={'menus.pos.update.buttons.add'}>Add</Translate>
                                        </Button>
                                        <Button color="primary" onClick={() => handleModalSubmit({ empty: true })}>
                                            <Translate contentKey={'menus.pos.update.buttons.blank'}>Blank</Translate>
                                        </Button>
                                    </div>
                                    <div className='d-flex'>
                                        <Button onClick={() => {
                                            setData(prev => {
                                                return {
                                                    ...prev,
                                                    numberOfColumns: 1
                                                }
                                            })
                                        }}>
                                            <CiGrid2H size={20} />
                                        </Button>
                                        <Button onClick={() => {
                                            setData(prev => {
                                                return {
                                                    ...prev,
                                                    numberOfColumns: 2
                                                }
                                            })
                                        }}>
                                            <CiGrid41 size={20} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <hr />
                        </div>
                        <ListGroup className="mt-3">
                            {groupedMainScreens.map((row, rowIndex) => (
                                <React.Fragment key={rowIndex}>
                                    <div className="mb-2 d-flex align-items-center">
                                        <Slider
                                            value={data?.rowHeight?.[rowIndex] || 0.5}
                                            onChange={(e) => handleMainRowHeightChange(e.value, rowIndex)}
                                            min={0.5}
                                            max={2}
                                            step={0.01}
                                            className="w-full"
                                        />
                                        <InputNumber
                                            value={data?.rowHeight?.[rowIndex] || 0.5}
                                            onChange={(e) => handleMainInputChange(e, rowIndex)}
                                            className="w-full ml-2"
                                            type="number"
                                            min={0.5}
                                            max={2}
                                            step={0.1}
                                        />
                                    </div>

                                    <div
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: `repeat(${data?.numberOfColumns}, 1fr)`,
                                            gridAutoFlow: 'row',
                                            height: `${150 * (data?.rowHeight?.[rowIndex] || 1)}px`,
                                        }}
                                    >
                                        {row.map((item, colIndex) => {
                                            const globalIndex = rowIndex * data.numberOfColumns + colIndex;
                                            return (
                                                <div
                                                    key={colIndex}
                                                    className="mb-3"
                                                    draggable
                                                    onClick={() => {
                                                        if (item?.empty) return
                                                        mainScreenClickHandler(globalIndex, item)
                                                    }}
                                                    onDragStart={() => handleMainDragStart(globalIndex)}
                                                    onDragOver={() => handleMainDragOver(globalIndex)}
                                                    onDragEnd={handleMainDragEnd}
                                                >
                                                    <Card
                                                        className="d-flex p-3 cursor-pointer h-100"
                                                        style={
                                                            item.empty
                                                                ? {
                                                                    background:
                                                                        "repeating-linear-gradient(45deg, black 0, black 10px, white 10px, white 20px)",
                                                                }
                                                                : {}
                                                        }
                                                    >
                                                        <div>
                                                            <div className="d-flex justify-content-end">
                                                                {!item?.empty && (
                                                                    <MdModeEditOutline size={20} onClick={() => openEditModal(item, globalIndex, 'main')} />
                                                                )}
                                                                &nbsp;
                                                                <MdDeleteOutline size={20} color={'red'} onClick={() => confirm2(globalIndex, item.name)} />
                                                            </div>
                                                            {!item?.empty && (
                                                                <>
                                                                    <h5 className="m-0 mr-3 mb-2">{item?.name}</h5>
                                                                    <div className="d-flex flex-row justify-content-between">
                                                                        <Button style={{ backgroundColor: item?.backgroundColor, width: '55px', height: '30px' }} />
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </Card>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </React.Fragment>
                            ))}
                            {/* {data.menuScreens?.map((mainScreen, index) => (
                                <div
                                    key={index}
                                    className="mb-3"
                                    draggable
                                    onClick={() => mainScreenClickHandler(index, mainScreen)}
                                    onDragStart={() => handleMainDragStart(index)}
                                    onDragOver={() => handleMainDragOver(index)}
                                    onDragEnd={handleMainDragEnd}
                                >
                                    <Card className="d-flex p-3 cursor-pointer">
                                        <div>
                                            <div className="d-flex justify-content-end">
                                                <MdModeEditOutline size={20} onClick={() => openEditModal(mainScreen, index, 'main')} />
                                                &nbsp;
                                                <MdDeleteOutline size={20} color={'red'} onClick={() => confirm2(index, mainScreen.name)} />
                                            </div>
                                            <h5 className="m-0 mr-3 mb-2">{mainScreen?.name}</h5>
                                            <div className="d-flex flex-row justify-content-between">
                                                <Button style={{ backgroundColor: mainScreen?.backgroundColor, width: '55px', height: '30px' }} />
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            ))} */}
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

                            <Button disabled={!mainScreen} color="primary" onClick={() => handleButtonAdd('Item')} className="ml-2">
                                <Translate contentKey={'menus.pos.update.buttons.addItem'}>Add Item</Translate>
                            </Button>
                            {menu.type === "POS" && (
                                <Button disabled={!mainScreen} color="primary" onClick={() => handleButtonAdd('Sub-screen')} className="ml-2">
                                    <Translate contentKey={'menus.pos.update.buttons.addSubScreen'}>Add SubScreen</Translate>
                                </Button>
                            )}

                            <Button disabled={!mainScreen} onClick={togglePreviewModal} className="mx-2 btn btn-info">
                                <Translate contentKey={'menus.pos.update.buttons.preview'}>Preview</Translate>
                            </Button>

                            <Button disabled={!mainScreen || updating} color="primary" onClick={() => saveEntity()} className="">
                                <Translate contentKey={'entity.action.save'}>Save</Translate>
                            </Button>
                        </div>
                        <div className="mt-3">{renderCurrentSubScreen()}</div>
                    </Col>
                </Row>
            </Card>
        </>
    )
}

export default MenuScreens
