import React, { useEffect, useState, useMemo } from 'react'
import { Trash2, Edit2, Grid2X2, Columns2 } from 'lucide-react';
import { Translate } from 'react-jhipster';
import MenuPosPreview from './menu-pos-preview';
import ItemSelectionModal from '../item-selection-modal';

import { IMenu, IMenuScreen, IFontProperties } from 'app/shared/model/menu.model';
import _, { update } from 'lodash';
import { IItem } from 'app/shared/model/ITEM/item.model';
import { IMenuData } from '../menu-instance';
import MediaLibrary from 'app/shared/components/media-library/media-library';
import { transformAttachmentStructure } from 'app/shared/util/attachment-utils';
import { IAttachment } from 'app/shared/model/attachment.model';

import { ColorPicker } from 'primereact/colorpicker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Loader2 } from 'lucide-react';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import Select from 'app/shared/components/select/select';

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
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'card' | 'mainScreen', index: number, item?: any, name?: string } | null>(null);
    const [selectedScreenIndex, setSelectedScreenIndex] = useState(null);
    const [selectedItems, setSelectedItems] = useState<IItem[]>([]);
    const [editScreenName, setEditScreenName] = useState('');
    const [editScreenIsPizza, setEditScreenIsPizza] = useState(false);
    const [mainScreenImage, setMainScreenImage] = useState<IAttachment>();
    const [editScreenColor, setEditScreenColor] = useState('');
    const [editScreenCols, setEditScreenCols] = useState<number | null>(1);
    const [selectedColorTheme, setSelectedColorTheme] = useState('');
    const [newSubScreenName, setNewSubScreenName] = useState('');
    const [selectedScreenType, setSelectedScreenType] = useState(null);
    const [newSubScreenCols, setNewSubScreenCols] = useState<number | null>(1);
    const [newSubScreenColor, setNewSubScreenColor] = useState('');
    const [newSubScreenIsPizza, setNewSubScreenIsPizza] = useState(false);
    const [newSubScreenImage, setNewSubScreenImage] = useState<IAttachment>();
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [breadcrumb, setBreadcrumb] = useState<string[]>([]);
    const [subScreenStack, setSubScreenStack] = useState([]);
    const [newMainScreenName, setNewMainScreenName] = useState('');
    const [newMainScreenCols, setNewMainScreenCols] = useState<number>(1);
    const [newMainScreenIsPizza, setNewMainScreenIsPizza] = useState(false);
    const [newMainScreenImage, setNewMainScreenImage] = useState<IAttachment>();
    const [newMainScreenFontFamily, setNewMainScreenFontFamily] = useState('Montserrat');
    const [newMainScreenBold, setNewMainScreenBold] = useState(false);
    const [newMainScreenItalic, setNewMainScreenItalic] = useState(false);
    const [newMainScreenFontColor, setNewMainScreenFontColor] = useState('#000000');
    const [newMainScreenFontSize, setNewMainScreenFontSize] = useState(14);
    const [editingSubScreenId, setEditingSubScreenId] = useState(null);
    const [newSubScreenFontFamily, setNewSubScreenFontFamily] = useState('Montserrat');
    const [newSubScreenBold, setNewSubScreenBold] = useState(false);
    const [newSubScreenItalic, setNewSubScreenItalic] = useState(false);
    const [newSubScreenFontColor, setNewSubScreenFontColor] = useState('#000000');
    const [newSubScreenFontSize, setNewSubScreenFontSize] = useState(14);
    const [editScreenFontFamily, setEditScreenFontFamily] = useState('Montserrat');
    const [editScreenBold, setEditScreenBold] = useState(false);
    const [editScreenItalic, setEditScreenItalic] = useState(false);
    const [editScreenFontColor, setEditScreenFontColor] = useState('#000000');
    const [editScreenFontSize, setEditScreenFontSize] = useState(14);
    const [editScreenUseDefaultFont, setEditScreenUseDefaultFont] = useState(false);

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
        if (data?.menuScreens && selectedMainScreenIndex !== null && data?.menuScreens?.[selectedMainScreenIndex]) {
            const selectedScreen = data?.menuScreens?.[selectedMainScreenIndex];
            setMainScreen(selectedScreen);

            // Only reset subScreenStack if it's empty or if we're changing the selected main screen
            // Don't reset if we're navigated into sub-screens (subScreenStack.length > 1)
            if (subScreenStack.length === 0 || (subScreenStack.length === 1 && subScreenStack[0]?.id !== selectedScreen.id)) {
                setSubScreenStack([selectedScreen]);
                setBreadcrumb([selectedScreen.name]);
            } else if (subScreenStack.length >= 1) {
                // Update the existing subScreenStack with fresh data from the updated menuScreens
                const updatedSubScreenStack = subScreenStack.map(screen => {
                    const updatedScreen = findScreenById([selectedScreen], screen.id);
                    return updatedScreen || screen;
                });
                setSubScreenStack(updatedSubScreenStack);
            }
        }
    }, [data, selectedMainScreenIndex])


    const [draggedItem, setDraggedItem] = useState(null)


    const handleMainScreenAdd = () => {
        setIsModalOpen({
            ...isModalOpen,
            isMainScreenModalOpen: true,
        });
        setSelectedMainScreenIndex(null);
        setNewMainScreenFontFamily('Montserrat');
        setNewMainScreenBold(false);
        setNewMainScreenItalic(false);
        setNewMainScreenFontColor('#000000');
        setNewMainScreenFontSize(14);
    };

    const openEditModal = (selectedScreen, screenIndex, screenType, ancestorChain: IMenuScreen[] = []) => {
        setEditingSubScreenId(selectedScreen.id);
        setEditScreenCols(selectedScreen.numberOfColumns);
        setSelectedScreenIndex(screenIndex);
        setSelectedScreenType(screenType);
        setEditScreenName(selectedScreen.name);
        setEditScreenColor(selectedScreen.backgroundColor);
        setEditScreenIsPizza(selectedScreen.isPizza);
        setMainScreenImage(selectedScreen.attachment);
        const useDefaultFont = selectedScreen?.fontProperties == null;
        setEditScreenUseDefaultFont(useDefaultFont);
        const effective = useDefaultFont ? getEffectiveFontProperties(selectedScreen, ancestorChain) : selectedScreen.fontProperties;
        setEditScreenFontFamily(effective?.fontFamily ?? 'Montserrat');
        setEditScreenBold(!!effective?.bold);
        setEditScreenItalic(!!effective?.italic);
        setEditScreenFontColor(effective?.color ?? '#000000');
        setEditScreenFontSize(typeof effective?.fontSize === 'number' ? effective.fontSize : 14);
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
                                isPizza: editScreenIsPizza,
                                attachment: mainScreenImage,
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
                    subScreens: (subScreen.subScreens || []).filter(sub =>
                        sub.component?.item?.id !== itemId
                    ),
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
        setDeleteTarget({ type: 'card', index: mainScreenIndex, item });
        setDeleteConfirmOpen(true);
    };

    const confirm2 = (mainScreenIndex, mainScreenName) => {
        setDeleteTarget({ type: 'mainScreen', index: mainScreenIndex, name: mainScreenName });
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = () => {
        if (deleteTarget?.type === 'card') {
            handleRemoveCard(deleteTarget.index, deleteTarget.item);
        } else if (deleteTarget?.type === 'mainScreen') {
            handleRemoveMainScreen(deleteTarget.index, deleteTarget.name);
        }
        setDeleteConfirmOpen(false);
        setDeleteTarget(null);
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


            // Update subScreenStack with fresh data instead of resetting it
            const updatedSubScreenStack = subScreenStack.map(screen => {
                const updatedScreen = findScreenById([updatedMenuScreens[selectedMainScreenIndex]], screen.id);
                return updatedScreen || screen;
            });
            setSubScreenStack(updatedSubScreenStack);

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

        const handleInputChange = (e: any, rowIndex: number) => {
            const rawValue = e.target.value;
            const value = parseFloat(rawValue);
            if (!isNaN(value)) {
                handleRowHeightChange(value, rowIndex);
            }
        };

        return (
            <div className="flex gap-2 mb-2" onDragOver={e => e.preventDefault()}>
                <div className="w-full space-y-3">
                    {groupedSubscreens.map((row, rowIndex) => (
                        <React.Fragment key={rowIndex}>
                            <div className="mb-2 flex items-center gap-2 bg-background p-2 rounded-md border border-border/50">
                                <Slider
                                    value={[findScreenById(data?.menuScreens, subScreenStack?.at(-1)?.id)?.rowHeight?.[rowIndex] || 1]}
                                    onValueChange={(value) => handleRowHeightChange(value[0], rowIndex)}
                                    min={0.5}
                                    max={2}
                                    step={0.01}
                                    className="flex-1"
                                />
                                <Input
                                    type="number"
                                    value={
                                        findScreenById(data?.menuScreens, subScreenStack?.at(-1).id)?.rowHeight?.[rowIndex] || 1
                                    }
                                    onChange={(e) => handleInputChange(e, rowIndex)}
                                    className="w-16 h-7 text-xs"
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
                                    gap: '0.75rem'
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
                                        <Card className={`flex flex-col p-0 cursor-pointer h-full transition-all hover:shadow-md border-2 hover:border-primary/50 overflow-visible relative`}>
                                            <div className="flex items-center justify-between p-2 pb-1 shrink-0">
                                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                                    {item?.componentType === 'SUB_SCREENS' ? 'Screen' : 'Item'}
                                                </span>
                                                <div className="flex gap-1">
                                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-muted" onClick={() => openEditModal(item, index, 'sub', subScreenStack)}>
                                                        <Edit2 className="h-3 w-3" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10" onClick={(e) => confirm1(mainScreenIndex, item)}>
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <div
                                                onClick={() => {
                                                    if (item?.componentType === 'SUB_SCREENS') {
                                                        handleNavigateToSubScreen(item);
                                                    }
                                                }}
                                                className="flex-1 flex flex-col items-center justify-center px-2 pb-2 min-h-0 overflow-visible"
                                            >
                                                <h4 className="text-sm font-semibold w-full text-center line-clamp-2 break-words h-full flex items-center justify-center" style={getFontStyle(getInheritedFontProperties(subScreenStack))}>{item?.name}</h4>
                                                {item?.numberOfColumns && (
                                                    <span className="text-xs text-muted-foreground mt-1">{item.numberOfColumns} col{item.numberOfColumns > 1 ? 's' : ''}</span>
                                                )}
                                            </div>
                                            <div style={{ backgroundColor: item?.backgroundColor || '#94a3b8' }} className="w-full h-1.5 mt-auto" />
                                        </Card>
                                    </div>
                                ))}
                            </div>
                        </React.Fragment>
                    ))}
                </div>
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

    const currentScreenItems = useMemo(() => {
        // Get items from the current screen level (either main screen or current sub-screen)
        const currentScreen = subScreenStack[subScreenStack.length - 1];
        return currentScreen?.subScreens
            ?.filter(item => item.componentType === 'ITEM')
            .map(item => ({ id: item.component.item.id, name: item.component.item.name, desc: item.component.item.desc }));
    }, [subScreenStack])

    useEffect(() => {
        setSelectedItems(currentScreenItems || []);
    }, [currentScreenItems])

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
            isPizza: newMainScreenIsPizza,
            attachment: newMainScreenImage,
            fontProperties: buildFontProperties({
                fontFamily: newMainScreenFontFamily,
                bold: newMainScreenBold,
                italic: newMainScreenItalic,
                color: newMainScreenFontColor,
                fontSize: newMainScreenFontSize,
            }),
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
        setNewMainScreenIsPizza(false);
        setNewMainScreenImage(undefined);
        setNewMainScreenFontFamily('Montserrat');
        setNewMainScreenBold(false);
        setNewMainScreenItalic(false);
        setNewMainScreenFontColor('#000000');
        setNewMainScreenFontSize(14);
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
                            isPizza: newSubScreenIsPizza,
                            attachment: newSubScreenImage,
                            fontProperties: buildFontProperties({
                                fontFamily: newSubScreenFontFamily,
                                bold: newSubScreenBold,
                                italic: newSubScreenItalic,
                                color: newSubScreenFontColor,
                                fontSize: newSubScreenFontSize,
                            }),
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
                        isPizza: newSubScreenIsPizza,
                        attachment: newSubScreenImage,
                        fontProperties: buildFontProperties({
                            fontFamily: newSubScreenFontFamily,
                            bold: newSubScreenBold,
                            italic: newSubScreenItalic,
                            color: newSubScreenFontColor,
                            fontSize: newSubScreenFontSize,
                        }),
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
                                    isPizza: newSubScreenIsPizza,
                                    attachment: newSubScreenImage,
                                    fontProperties: buildFontProperties({
                                        fontFamily: newSubScreenFontFamily,
                                        bold: newSubScreenBold,
                                        italic: newSubScreenItalic,
                                        color: newSubScreenFontColor,
                                        fontSize: newSubScreenFontSize,
                                    }),
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
        setNewSubScreenIsPizza(false);
        setNewSubScreenImage(undefined);
        setNewSubScreenFontFamily('Montserrat');
        setNewSubScreenBold(false);
        setNewSubScreenItalic(false);
        setNewSubScreenFontColor('#000000');
        setNewSubScreenFontSize(14);
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
                            numberOfColumns: editScreenCols,
                            isPizza: editScreenIsPizza,
                            attachment: mainScreenImage,
                            fontProperties: editScreenUseDefaultFont ? null : buildFontProperties(
                                {
                                    fontFamily: editScreenFontFamily,
                                    bold: editScreenBold,
                                    italic: editScreenItalic,
                                    color: editScreenFontColor,
                                    fontSize: editScreenFontSize,
                                },
                                mainScreen.fontProperties
                            ),
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
                        numberOfColumns: editScreenCols,
                        isPizza: editScreenIsPizza,
                        attachment: mainScreenImage,
                        fontProperties: editScreenUseDefaultFont ? null : buildFontProperties(
                            {
                                fontFamily: editScreenFontFamily,
                                bold: editScreenBold,
                                italic: editScreenItalic,
                                color: editScreenFontColor,
                                fontSize: editScreenFontSize,
                            },
                            existingSubScreen.fontProperties
                        ),
                    };

                    // Update using the existing updateSubScreenById
                    updatedData.menuScreens = updateSubScreenById(updatedData.menuScreens, updatedSubScreen);

                    // Update the subScreenStack with the updated sub-screen
                    const updatedSubScreenStack = subScreenStack.map(subScreen =>
                        subScreen.id === editingSubScreenId ? updatedSubScreen : subScreen
                    );
                    setSubScreenStack(updatedSubScreenStack);
                }
            }

            return updatedData;
        });

        setIsModalOpen({ ...isModalOpen, isEditModalOpen: false });
        setEditingSubScreenId(null);
        setEditScreenFontFamily('Montserrat');
        setEditScreenFontColor('#000000');
        setEditScreenFontSize(14);
        setEditScreenUseDefaultFont(false);
    };

    const handleMainRowHeightChange = (value: number | [number, number], rowIndex: number) => {
        const newValue = Array.isArray(value) ? value[0] : value;
        setData(prevData => {
            const updatedRowHeights = [...prevData.rowHeight];
            updatedRowHeights[rowIndex] = newValue;
            return { ...prevData, rowHeight: updatedRowHeights };
        });
    };


    const handleMainInputChange = (e: any, rowIndex: number) => {
        const rawValue = e.value !== undefined ? e.value : e.target.value;
        const value = parseFloat(rawValue);
        if (!isNaN(value)) {
            setData(prevData => {
                const updatedRowHeights = [...prevData.rowHeight];
                updatedRowHeights[rowIndex] = value;
                return { ...prevData, rowHeight: updatedRowHeights };
            });
        }
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
    const fontFamilyOptions = [
        { value: 'Montserrat', label: 'Montserrat' },
        { value: 'Open_Sans', label: 'Open_Sans' },
        { value: 'Roboto', label: 'Roboto' },
        { value: 'Tinos', label: 'Tinos' },
    ];
    const resolveFontFamilyOption = (value: string) => fontFamilyOptions.find(option => option.value === value) || null;
    const defaultFontSize = 14;
    const defaultFontColor = '#000000';
    const defaultFontProperties: IFontProperties = {
        fontFamily: 'Montserrat',
        fontSize: defaultFontSize,
        bold: false,
        italic: false,
        color: defaultFontColor,
    };

    /** First non-null fontProperties from screen then ancestors (root → parent). Used for sub-screens/items. */
    const getEffectiveFontProperties = (screen: IMenuScreen, ancestorChain: IMenuScreen[]): IFontProperties => {
        if (screen?.fontProperties != null) return screen.fontProperties;
        for (let i = ancestorChain.length - 1; i >= 0; i--) {
            if (ancestorChain[i]?.fontProperties != null) return ancestorChain[i].fontProperties;
        }
        return defaultFontProperties;
    };

    /** First non-null fontProperties from ancestors only (not the screen itself). Use for the screen card label. */
    const getInheritedFontProperties = (ancestorChain: IMenuScreen[]): IFontProperties => {
        for (let i = ancestorChain.length - 1; i >= 0; i--) {
            if (ancestorChain[i]?.fontProperties != null) return ancestorChain[i].fontProperties;
        }
        return defaultFontProperties;
    };

    /** Inline style for a screen label from effective font properties. */
    const getFontStyle = (font: IFontProperties): React.CSSProperties => ({
        fontFamily: font.fontFamily,
        fontSize: font.fontSize,
        fontWeight: font.bold ? 'bold' : 'normal',
        fontStyle: font.italic ? 'italic' : 'normal',
        color: font.color,
    });

    const buildFontProperties = (options: { fontFamily: string; bold: boolean; italic: boolean; color?: string; fontSize?: number }, existing?: any) => ({
        fontFamily: options.fontFamily,
        fontSize: typeof options.fontSize === 'number' ? options.fontSize : (typeof existing?.fontSize === 'number' ? existing.fontSize : defaultFontSize),
        bold: options.bold,
        italic: options.italic,
        color: options.color ?? existing?.color ?? defaultFontColor,
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }


    return (
        <PageWrapper>
            <Dialog open={isModalOpen.isPreviewModalOpen} onOpenChange={(open) => setIsModalOpen({ ...isModalOpen, isPreviewModalOpen: open })}>
                <DialogContent className="max-w-7xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold">
                            <Translate contentKey={'menus.pos.update.modals.preview.title'}>Screen Preview</Translate>
                        </DialogTitle>
                    </DialogHeader>
                    <div style={{ minWidth: '100%', minHeight: '60vh' }} className="py-2">
                        <MenuPosPreview data={data} />
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isModalOpen.isMainScreenModalOpen} onOpenChange={(open) => setIsModalOpen({ ...isModalOpen, isMainScreenModalOpen: open })}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold">
                            <Translate contentKey={'menus.pos.update.modals.mainScreen.title'}>Add new main screen</Translate>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="mainScreenName" className="text-xs font-medium">
                                <Translate contentKey={'menus.pos.update.modals.mainScreen.name'}>Main screen name</Translate>
                            </Label>
                            <Input
                                type="text"
                                id="mainScreenName"
                                required
                                value={newMainScreenName}
                                onChange={e => setNewMainScreenName(e.target.value)}
                                className="h-9 text-sm"
                                placeholder="Enter screen name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newMainScreenFontFamily" className="text-xs font-medium">Font Family</Label>
                            <Select
                                inputId="newMainScreenFontFamily"
                                options={fontFamilyOptions}
                                value={resolveFontFamilyOption(newMainScreenFontFamily)}
                                onChange={(option: any) => setNewMainScreenFontFamily(option?.value || 'Montserrat')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-medium">Font Size</Label>
                            <Input
                                type="number"
                                min={8}
                                max={72}
                                value={newMainScreenFontSize}
                                onChange={e => setNewMainScreenFontSize(parseInt(e.target.value, 10) || 14)}
                                className="h-9 text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-medium">Font Color</Label>
                            <div className="flex items-center gap-2">
                                <ColorPicker
                                    value={newMainScreenFontColor.replace('#', '')}
                                    onChange={e => setNewMainScreenFontColor(e.value ? `#${e.value}` : '#000000')}
                                    format="hex"
                                    appendTo="self"
                                />
                                <Input
                                    value={newMainScreenFontColor}
                                    onChange={e => setNewMainScreenFontColor(e.target.value)}
                                    placeholder="#000000"
                                    className="h-9 text-sm flex-1"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="newMainScreenBold"
                                    checked={newMainScreenBold}
                                    onCheckedChange={checked => setNewMainScreenBold(!!checked)}
                                />
                                <Label htmlFor="newMainScreenBold" className="text-sm font-medium cursor-pointer">
                                    Bold
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="newMainScreenItalic"
                                    checked={newMainScreenItalic}
                                    onCheckedChange={checked => setNewMainScreenItalic(!!checked)}
                                />
                                <Label htmlFor="newMainScreenItalic" className="text-sm font-medium cursor-pointer">
                                    Italic
                                </Label>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="newMainScreenCols" className="text-xs font-medium">Number of columns</Label>
                            <Input
                                type="number"
                                id="newMainScreenCols"
                                value={newMainScreenCols}
                                min={1}
                                max={12}
                                onChange={e => {
                                    const val = parseInt(e.target.value);
                                    setNewMainScreenCols(val || 1);
                                }}
                                className="h-9 text-sm"
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="newMainScreenIsPizza"
                                checked={newMainScreenIsPizza}
                                onCheckedChange={(checked) => setNewMainScreenIsPizza(!!checked)}
                            />
                            <Label htmlFor="newMainScreenIsPizza" className="text-sm font-medium cursor-pointer">
                                <Translate contentKey={'menus.pos.update.modals.mainScreen.isPizza'}>Is Pizza</Translate>
                            </Label>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="newMainScreenImage" className="text-xs font-medium">
                                <Translate contentKey={'menus.pos.update.modals.mainScreen.image'}>Image</Translate>
                            </Label>
                            <div className="flex flex-wrap">
                                <MediaLibrary
                                    handleFilesSelectCallback={files =>
                                        setNewMainScreenImage(
                                            transformAttachmentStructure(files, 'toIAttachment')[0]
                                        )
                                    }
                                    defaultValues={transformAttachmentStructure(newMainScreenImage ? [newMainScreenImage] : [], 'toFileLibraryListItem')}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="colorTheme" className="text-xs font-medium">
                                <Translate contentKey={'menus.pos.update.modals.mainScreen.color'}>Select color theme</Translate>
                            </Label>
                            <div className="flex flex-wrap gap-2">
                                {colorThemes.map((color, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        style={{ backgroundColor: color }}
                                        className={`w-16 h-9 rounded-md border-2 transition-all hover:scale-105 ${selectedColorTheme === color ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}`}
                                        onClick={() => setSelectedColorTheme(color)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" size="sm" className="h-9 text-xs font-medium" onClick={() => setIsModalOpen({ ...isModalOpen, isMainScreenModalOpen: false })}>
                            Cancel
                        </Button>
                        <Button size="sm" className="h-9 text-xs font-medium" onClick={() => handleModalSubmit({ empty: false })}>
                            <Translate contentKey={'menus.pos.update.modals.mainScreen.add'}>Add Main Screen</Translate>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isModalOpen.isSubScreenModalOpen} onOpenChange={(open) => setIsModalOpen({ ...isModalOpen, isSubScreenModalOpen: open })}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold">
                            <Translate contentKey={'menus.pos.update.modals.subScreen.title'}>Add new sub-screen</Translate>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="subScreenName" className="text-xs font-medium">
                                <Translate contentKey={'menus.pos.update.modals.subScreen.name'}>Sub-screen name</Translate>
                            </Label>
                            <Input
                                type="text"
                                id="subScreenName"
                                value={newSubScreenName}
                                onChange={e => setNewSubScreenName(e.target.value)}
                                className="h-9 text-sm"
                                placeholder="Enter sub-screen name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newSubScreenFontFamily" className="text-xs font-medium">Font Family</Label>
                            <Select
                                inputId="newSubScreenFontFamily"
                                options={fontFamilyOptions}
                                value={resolveFontFamilyOption(newSubScreenFontFamily)}
                                onChange={(option: any) => setNewSubScreenFontFamily(option?.value || 'Montserrat')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-medium">Font Size</Label>
                            <Input
                                type="number"
                                min={8}
                                max={72}
                                value={newSubScreenFontSize}
                                onChange={e => setNewSubScreenFontSize(parseInt(e.target.value, 10) || 14)}
                                className="h-9 text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-medium">Font Color</Label>
                            <div className="flex items-center gap-2">
                                <ColorPicker
                                    value={newSubScreenFontColor.replace('#', '')}
                                    onChange={e => setNewSubScreenFontColor(e.value ? `#${e.value}` : '#000000')}
                                    format="hex"
                                    appendTo="self"
                                />
                                <Input
                                    value={newSubScreenFontColor}
                                    onChange={e => setNewSubScreenFontColor(e.target.value)}
                                    placeholder="#000000"
                                    className="h-9 text-sm flex-1"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="newSubScreenBold"
                                    checked={newSubScreenBold}
                                    onCheckedChange={checked => setNewSubScreenBold(!!checked)}
                                />
                                <Label htmlFor="newSubScreenBold" className="text-sm font-medium cursor-pointer">
                                    Bold
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="newSubScreenItalic"
                                    checked={newSubScreenItalic}
                                    onCheckedChange={checked => setNewSubScreenItalic(!!checked)}
                                />
                                <Label htmlFor="newSubScreenItalic" className="text-sm font-medium cursor-pointer">
                                    Italic
                                </Label>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="subScreenColumns" className="text-xs font-medium">Number of columns</Label>
                            <Input
                                type="number"
                                id="subScreenColumns"
                                min={1}
                                max={12}
                                value={newSubScreenCols || 1}
                                onChange={e => setNewSubScreenCols(parseInt(e.target.value) ?? 1)}
                                className="h-9 text-sm"
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="newSubScreenIsPizza"
                                checked={newSubScreenIsPizza}
                                onCheckedChange={(checked) => setNewSubScreenIsPizza(!!checked)}
                            />
                            <Label htmlFor="newSubScreenIsPizza" className="text-sm font-medium cursor-pointer">
                                <Translate contentKey={'menus.pos.update.modals.subScreen.isPizza'}>Is Pizza</Translate>
                            </Label>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="newSubScreenImage" className="text-xs font-medium">
                                <Translate contentKey={'menus.pos.update.modals.subScreen.image'}>Image</Translate>
                            </Label>
                            <div className="flex flex-wrap">
                                <MediaLibrary
                                    handleFilesSelectCallback={files =>
                                        setNewSubScreenImage(
                                            transformAttachmentStructure(files, 'toIAttachment')[0]
                                        )
                                    }
                                    defaultValues={transformAttachmentStructure(newSubScreenImage ? [newSubScreenImage] : [], 'toFileLibraryListItem')}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="subScreenColor" className="text-xs font-medium">
                                <Translate contentKey={'menus.pos.update.modals.subScreen.color'}>Select color theme</Translate>
                            </Label>
                            <div className="flex flex-wrap gap-2">
                                {colorThemes.map((color, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        style={{ backgroundColor: color }}
                                        className={`w-16 h-9 rounded-md border-2 transition-all hover:scale-105 ${newSubScreenColor === color ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}`}
                                        onClick={() => setNewSubScreenColor(color)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" size="sm" className="h-9 text-xs font-medium" onClick={() => setIsModalOpen({ ...isModalOpen, isSubScreenModalOpen: false })}>
                            Cancel
                        </Button>
                        <Button size="sm" className="h-9 text-xs font-medium" onClick={handleSubScreenModalSubmit}>
                            <Translate contentKey={'menus.pos.update.modals.subScreen.add'}>Add Sub-Screen</Translate>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {isModalOpen.isItemModalOpen && (
                <ItemSelectionModal
                    isOpen={isModalOpen.isItemModalOpen}
                    toggle={() => setIsModalOpen({ ...isModalOpen, isItemModalOpen: !isModalOpen.isItemModalOpen })}
                    // filter selected items by componentType and choose the component item
                    selectedItems={selectedItems}
                    handleToggleSelect={handleToggleSelect}
                    setSelectedItems={setSelectedItems}
                />
            )}

            <Dialog open={isModalOpen.isEditModalOpen} onOpenChange={(open) => setIsModalOpen({ ...isModalOpen, isEditModalOpen: open })}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold">
                            <Translate contentKey={'menus.pos.update.modals.editScreen.title'}>Edit Screen</Translate>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="editScreenName" className="text-xs font-medium">
                                <Translate contentKey={'menus.pos.update.modals.editScreen.name'}>Name</Translate>
                            </Label>
                            <Input
                                type="text"
                                id="editScreenName"
                                value={editScreenName}
                                onChange={e => setEditScreenName(e.target.value)}
                                className="h-9 text-sm"
                                placeholder="Enter screen name"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="editScreenUseDefaultFont"
                                checked={editScreenUseDefaultFont}
                                onCheckedChange={checked => setEditScreenUseDefaultFont(!!checked)}
                            />
                            <Label htmlFor="editScreenUseDefaultFont" className="text-sm font-medium cursor-pointer">
                                Use default font (inherit from parent)
                            </Label>
                        </div>
                        {!editScreenUseDefaultFont && (
                        <>
                        <div className="space-y-2">
                            <Label htmlFor="editScreenFontFamily" className="text-xs font-medium">Font Family</Label>
                            <Select
                                inputId="editScreenFontFamily"
                                options={fontFamilyOptions}
                                value={resolveFontFamilyOption(editScreenFontFamily)}
                                onChange={(option: any) => setEditScreenFontFamily(option?.value || 'Montserrat')}
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="editScreenBold"
                                    checked={editScreenBold}
                                    onCheckedChange={checked => setEditScreenBold(!!checked)}
                                />
                                <Label htmlFor="editScreenBold" className="text-sm font-medium cursor-pointer">
                                    Bold
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="editScreenItalic"
                                    checked={editScreenItalic}
                                    onCheckedChange={checked => setEditScreenItalic(!!checked)}
                                />
                                <Label htmlFor="editScreenItalic" className="text-sm font-medium cursor-pointer">
                                    Italic
                                </Label>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-medium">Font Size</Label>
                            <Input
                                type="number"
                                min={8}
                                max={72}
                                value={editScreenFontSize}
                                onChange={e => setEditScreenFontSize(parseInt(e.target.value, 10) || 14)}
                                className="h-9 text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-medium">Font Color</Label>
                            <div className="flex items-center gap-2">
                                <ColorPicker
                                    value={editScreenFontColor.replace('#', '')}
                                    onChange={e => setEditScreenFontColor(e.value ? `#${e.value}` : '#000000')}
                                    format="hex"
                                    appendTo="self"
                                />
                                <Input
                                    value={editScreenFontColor}
                                    onChange={e => setEditScreenFontColor(e.target.value)}
                                    placeholder="#000000"
                                    className="h-9 text-sm flex-1"
                                />
                            </div>
                        </div>
                        </>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="editCols" className="text-xs font-medium">Number of columns</Label>
                            <Input
                                type="number"
                                id="editCols"
                                min={1}
                                max={12}
                                value={editScreenCols || 1}
                                onChange={e => setEditScreenCols(parseInt(e.target.value) ?? 1)}
                                className="h-9 text-sm"
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="isPizza"
                                checked={editScreenIsPizza}
                                onCheckedChange={(checked) => setEditScreenIsPizza(!!checked)}
                            />
                            <Label htmlFor="isPizza" className="text-sm font-medium cursor-pointer">
                                <Translate contentKey={'menus.pos.update.modals.editScreen.isPizza'}>Is Pizza</Translate>
                            </Label>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="editScreenImage" className="text-xs font-medium">
                                <Translate contentKey={'menus.pos.update.modals.editScreen.image'}>Image</Translate>
                            </Label>
                            <div className="flex flex-wrap">
                                <MediaLibrary
                                    handleFilesSelectCallback={files =>
                                        setMainScreenImage(
                                            transformAttachmentStructure(files, 'toIAttachment')[0]
                                        )
                                    }
                                    defaultValues={transformAttachmentStructure(mainScreenImage ? [mainScreenImage] : [], 'toFileLibraryListItem')}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="editScreenColor" className="text-xs font-medium">
                                <Translate contentKey={'menus.pos.update.modals.editScreen.color'}>Select color theme</Translate>
                            </Label>
                            <div className="flex flex-wrap gap-2">
                                {colorThemes.map((color, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        style={{ backgroundColor: color }}
                                        className={`w-16 h-9 rounded-md border-2 transition-all hover:scale-105 ${editScreenColor === color ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}`}
                                        onClick={() => setEditScreenColor(color)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 text-xs font-medium"
                            onClick={() => setIsModalOpen({ ...isModalOpen, isEditModalOpen: false })}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            className="h-9 text-xs font-medium"
                            onClick={e => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleEditScreen();
                            }}
                        >
                            <Translate contentKey={'entity.action.apply'}>Apply Changes</Translate>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-semibold">
                            <Translate contentKey="entity.delete.title">Confirm delete operation</Translate>
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm">
                            Are you sure you want to delete this? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel asChild>
                            <Button variant="outline" size="sm" className="h-9 text-xs font-medium">
                                <Translate contentKey="entity.action.cancel">Cancel</Translate>
                            </Button>
                        </AlertDialogCancel>
                        <AlertDialogAction asChild>
                            <Button variant="destructive" size="sm" className="h-9 text-xs font-medium" onClick={handleConfirmDelete}>
                                <Trash2 className="h-3 w-3 mr-1.5" />
                                <Translate contentKey="entity.action.delete">Delete</Translate>
                            </Button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Card className="p-0 overflow-hidden shadow-sm">
                <div className="grid grid-cols-12 gap-0" style={{ minHeight: '55rem' }}>
                    <div className="col-span-3 border-r border-border flex flex-col bg-muted/20">
                        <div className="flex items-center justify-between p-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                            <h2 className="text-sm font-semibold tracking-tight">
                                <Translate contentKey={'menus.pos.update.mainScreens'}>Main Screens</Translate>
                            </h2>
                            <div className="flex gap-1">
                                <Button
                                    size="sm"
                                    variant={data?.numberOfColumns === 1 ? "secondary" : "outline"}
                                    className="h-7 w-7 p-0"
                                    onClick={() => {
                                        setData(prev => ({
                                            ...prev,
                                            numberOfColumns: 1
                                        }))
                                    }}
                                >
                                    <Columns2 className="h-3 w-3" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant={data?.numberOfColumns === 2 ? "secondary" : "outline"}
                                    className="h-7 w-7 p-0"
                                    onClick={() => {
                                        setData(prev => ({
                                            ...prev,
                                            numberOfColumns: 2
                                        }))
                                    }}
                                >
                                    <Grid2X2 className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                        <div className="p-3 flex gap-2 border-b border-border bg-background">
                            <Button size="sm" className="h-8 text-xs flex-1 font-medium" onClick={handleMainScreenAdd}>
                                <Translate contentKey={'menus.pos.update.buttons.add'}>Add</Translate>
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 text-xs flex-1 font-medium" onClick={() => handleModalSubmit({ empty: true })}>
                                <Translate contentKey={'menus.pos.update.buttons.blank'}>Blank</Translate>
                            </Button>
                        </div>
                        <div className="flex-1 overflow-auto p-3 space-y-3">
                            {groupedMainScreens.map((row, rowIndex) => (
                                <React.Fragment key={rowIndex}>
                                    <div className="mb-2 flex items-center gap-2 bg-background p-2 rounded-md border border-border/50">
                                        <Slider
                                            value={[data?.rowHeight?.[rowIndex] || 1]}
                                            onValueChange={(value) => handleMainRowHeightChange(value[0], rowIndex)}
                                            min={0.5}
                                            max={2}
                                            step={0.01}
                                            className="flex-1"
                                        />
                                        <Input
                                            type="number"
                                            value={data?.rowHeight?.[rowIndex] || 1}
                                            onChange={(e) => handleMainInputChange(e, rowIndex)}
                                            className="w-16 h-7 text-xs"
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
                                            gap: '0.75rem'
                                        }}
                                        className="mb-3"
                                    >
                                        {row.map((item, colIndex) => {
                                            const globalIndex = rowIndex * data.numberOfColumns + colIndex;
                                            return (
                                                <div
                                                    key={colIndex}
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
                                                        className={`flex flex-col p-0 cursor-pointer h-full transition-all hover:shadow-md border-2 overflow-visible relative ${
                                                            selectedMainScreenIndex === globalIndex && !item.empty
                                                                ? 'border-primary shadow-md'
                                                                : 'border-border/60 hover:border-primary/50'
                                                        }`}
                                                        style={
                                                            item.empty
                                                                ? {
                                                                    background:
                                                                        "repeating-linear-gradient(45deg, hsl(var(--muted)) 0, hsl(var(--muted)) 10px, hsl(var(--background)) 10px, hsl(var(--background)) 20px)",
                                                                }
                                                                : {}
                                                        }
                                                    >
                                                        <div className="w-full flex-1 flex flex-col min-h-0">
                                                            <div className="flex justify-end gap-1 p-2 pb-1 shrink-0">
                                                                {!item?.empty && (
                                                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-muted" onClick={() => openEditModal(item, globalIndex, 'main')}>
                                                                        <Edit2 className="h-3 w-3" />
                                                                    </Button>
                                                                )}
                                                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10" onClick={() => confirm2(globalIndex, item.name)}>
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                            {!item?.empty && (
                                                                <>
                                                                    <div className="flex-1 flex flex-col items-center justify-center px-2 pb-2 min-h-0 overflow-visible">
                                                                        <h5 className="text-sm font-semibold w-full text-center line-clamp-2 break-words" style={getFontStyle(getInheritedFontProperties([]))}>{item?.name}</h5>
                                                                        {item?.numberOfColumns && (
                                                                            <span className="text-xs text-muted-foreground mt-1">{item.numberOfColumns} col{item.numberOfColumns > 1 ? 's' : ''}</span>
                                                                        )}
                                                                    </div>
                                                                    <div style={{ backgroundColor: item?.backgroundColor || '#94a3b8' }} className="w-full h-1.5 mt-auto" />
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
                        </div>
                    </div>
                    <div className="col-span-9 border-l border-border bg-background">
                        <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between p-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <h2 className="text-sm font-semibold tracking-tight truncate">
                                        {breadcrumb?.length > 0 &&
                                            breadcrumb.map((breadcrumbTitle, index) => (
                                                <span
                                                    key={index}
                                                    className="cursor-pointer hover:text-primary transition-colors inline-flex items-center"
                                                    onClick={() => navigateToBreadcrumbItem(index)}
                                                >
                                                    {breadcrumbTitle}
                                                    {index < breadcrumb.length - 1 && <span className="mx-1 text-muted-foreground">/</span>}
                                                </span>
                                            ))}
                                    </h2>
                                </div>

                                <div className="flex gap-2 shrink-0">
                                    <Button disabled={!mainScreen} variant="outline" size="sm" className="h-8 text-xs px-3 font-medium" onClick={() => handleButtonAdd('Item')}>
                                        <Translate contentKey={'menus.pos.update.buttons.addItem'}>Add Item</Translate>
                                    </Button>
                                    {menu.type === "POS" && (
                                        <Button disabled={!mainScreen} variant="outline" size="sm" className="h-8 text-xs px-3 font-medium" onClick={() => handleButtonAdd('Sub-screen')}>
                                            <Translate contentKey={'menus.pos.update.buttons.addSubScreen'}>Add SubScreen</Translate>
                                        </Button>
                                    )}

                                    <Button disabled={!mainScreen} variant="secondary" size="sm" className="h-8 text-xs px-3 font-medium" onClick={togglePreviewModal}>
                                        <Translate contentKey={'menus.pos.update.buttons.preview'}>Preview</Translate>
                                    </Button>

                                    <Button disabled={!mainScreen || updating} size="sm" className="h-8 text-xs px-3 font-medium" onClick={() => saveEntity()}>
                                        {updating && <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />}
                                        <Translate contentKey={'entity.action.save'}>Save</Translate>
                                    </Button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto p-3 bg-muted/10">{renderCurrentSubScreen()}</div>
                        </div>
                    </div>
                </div>
            </Card>
        </PageWrapper>
    )
}

export default MenuScreens
