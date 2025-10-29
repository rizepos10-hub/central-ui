import React, { useEffect, useState } from 'react';
import { useParams } from "react-router-dom";
import { getEntity, updateEntity } from "app/entities/settings/floor-plans/floor-plan/floor-plan.reducer";
import { useAppDispatch, useAppSelector } from "app/config/store";
import { getEntities as getTables } from "app/entities/settings/floor-plans/tables/table.reducer";
import { getEntity as getDeffaultSettings } from "app/entities/settings/floor-plans/floor-plan-settings/floor-plan-settings.reducer"
import { IFloorPlan } from "app/shared/model/FLOOR-PLAN/floor-plan.model";
import { IFloorPlanTable } from "app/shared/model/FLOOR-PLAN/floor-plan-table.model";
import { overridePaginationStateWithQueryParams } from "app/shared/util/entity-utils";
import { getSortState } from "react-jhipster";
import { ITEMS_PER_PAGE } from "app/shared/util/pagination.constants";
import Select from 'app/shared/components/select/select';
import SectionModal from "app/entities/settings/floor-plans/floor-plan/floor-plan-new-section-modal";
import { isEqual } from "lodash";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { X, Pencil } from 'lucide-react';
import { toast } from 'react-toastify';

const FloorPlanManageUpdate = () => {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const floorPlanSettingsEntity = useAppSelector(state => state.floorPlanSettings.entity);
  const {
    tableImage: defaultTableImage,
    tableDimensions: defaultTableDimensions,
    sectionBackground: defaultSectionBackground,
    sectionDimensions: defaultSectionsDimensions
  } = floorPlanSettingsEntity;

  const floorPlanEntity = useAppSelector(state => state.floorPlan.entity);
  const { branch: floorPlanBranch } = floorPlanEntity;

  const updateSuccess = useAppSelector(state => state.floorPlan.updateSuccess);
  const floorPlanTablesList: IFloorPlanTable[] = useAppSelector(state => state.floorPlanTable.entities)
    .filter(table => table?.branch?.id === floorPlanBranch?.id);
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );
  const [hoveredTableIndex, setHoveredTableIndex] = useState(null);
  const [tableModalIsOpen, setTableModalIsOpen] = useState(false);
  const [sectionModalIsOpen, setSectionModalIsOpen] = useState(false);
  const [selectedTableDetail, setSelectedTableDetail] = useState({
    table: null,
    numberOfSeats: null,
    position: {
      x: 0,
      y: 0,
    },
  });
  const [selectedSectionIndex, setSelectedSectionIndex] = useState("0");
  const [floorPlan, setFloorPlan] = useState<IFloorPlan>();
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [initialState, setInitialState] = useState<any>()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<{section: any, index: number} | null>(null);
  const [editCapacityModalOpen, setEditCapacityModalOpen] = useState(false);
  const [selectedTableForEdit, setSelectedTableForEdit] = useState<{tableDetail: any, index: number} | null>(null);
  const [newCapacity, setNewCapacity] = useState<number | null>(null);
  const [editSectionModalOpen, setEditSectionModalOpen] = useState(false);
  const [sectionToEdit, setSectionToEdit] = useState<{section: any, index: number} | null>(null);

  const [sectionDimensions, setSectionDimensions]: any = useState({
    width: null,
    height: null
  })

  const excludedTableIds = floorPlan?.sections?.flatMap(section =>
    section?.tableDetails?.map(tableDetail => tableDetail?.table?.id)
  );
  const filteredTablesList: IFloorPlanTable[] = floorPlanTablesList?.filter(
    table => !excludedTableIds?.includes(table.id)
  );

  const openTableModal = () => {
    if (filteredTablesList?.length === 0) {
      toast.error("There are no tables available to add to this section.");
      return;
    }
    setTableModalIsOpen(true);
  };

  const closeTableModal = () => {
    setTableModalIsOpen(false);
  };

  const openSectionModal = () => {
    setSectionModalIsOpen(true);
  };

  const closeSectionModal = () => {
    setSectionModalIsOpen(false);
  };

  const handleSectionChange = (value: string) => {
    setSelectedSectionIndex(value);
  }

  const handleAddSection = (newSection) => {
    if (newSection?.name.trim() === "") {
      toast.error("Please enter section name.");
      return;
    }
    closeSectionModal();

    const updatedSections = [...floorPlan.sections, newSection];
    setFloorPlan((prev) => ({
      ...prev,
      sections: updatedSections
    }));
  };

  const openEditSectionModal = (e, section, index) => {
    e.stopPropagation();
    setSectionToEdit({ section, index });
    setEditSectionModalOpen(true);
  };

  const handleUpdateSection = (updatedSection) => {
    if (!sectionToEdit) return;

    if (updatedSection?.name.trim() === "") {
      toast.error("Please enter section name.");
      return;
    }

    setFloorPlan((prev) => {
      const updatedSections = [...prev.sections];
      updatedSections[sectionToEdit.index] = updatedSection;
      return {
        ...prev,
        sections: updatedSections,
      };
    });

    // Update the section dimensions state as well
    setSectionDimensions((prev) => {
      const updatedDimensions = [...prev];
      updatedDimensions[sectionToEdit.index] = {
        width: updatedSection.dimensions.width.toString(),
        height: updatedSection.dimensions.height.toString(),
      };
      return updatedDimensions;
    });

    setEditSectionModalOpen(false);
    setSectionToEdit(null);
  }

  const handleKeyDown = (e) => {
    // Allow numeric keys, Backspace, Arrow keys, and non-numeric keys when Control key is pressed
    if (!(e.key === 'Backspace' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || /^\d$/.test(e.key) || e.ctrlKey)) {
      e.preventDefault();
    }
  };

  const handleSectionWidthChange = (e, index) => {
    const newWidth = e.target.value;
    setSectionDimensions((prev) => {
      const updatedDimensions = [...prev];
      updatedDimensions[index] = { ...updatedDimensions[index], width: newWidth };
      return updatedDimensions;
    });
  };

  const handleSectionHeightChange = (e, index) => {
    const newHeight = e.target.value;
    setSectionDimensions((prev) => {
      const updatedDimensions = [...prev];
      updatedDimensions[index] = { ...updatedDimensions[index], height: newHeight };
      return updatedDimensions;
    });
  };

  const handleSectionWidthBlur = (index) => {
    const newWidth = parseInt(sectionDimensions[index]?.width, 10);

    const tablesOutsideBounds = floorPlan?.sections?.[index]?.tableDetails?.some((tableDetail) => {
      const tableRightEdge = tableDetail.position.x + tableDetail.table.dimensions.width;
      return tableRightEdge > newWidth;
    });

    if (tablesOutsideBounds) {
      toast.error("Cannot change width, some tables are outside the new bounds.");
    } else {
      setFloorPlan((prev) => ({
        ...prev,
        sections: prev.sections.map((section, sectionIndex) => {
          if (sectionIndex === index) {
            return {
              ...section,
              dimensions: {
                ...section.dimensions,
                width: newWidth,
              },
            };
          }
          return section;
        }),
      }));
    }
  };

  const handleSectionHeightBlur = (index) => {
    const newHeight = parseInt(sectionDimensions[index]?.height, 10);

    const tablesOutsideBounds = floorPlan?.sections?.[index]?.tableDetails?.some((tableDetail) => {
      const tableBottomEdge = tableDetail.position.y + tableDetail.table.dimensions.height;
      return tableBottomEdge > newHeight;
    });

    if (tablesOutsideBounds) {
      toast.error("Cannot change height, some tables are outside the new bounds.");
    } else {
      setFloorPlan((prev) => ({
        ...prev,
        sections: prev.sections.map((section, sectionIndex) => {
          if (sectionIndex === index) {
            return {
              ...section,
              dimensions: {
                ...section.dimensions,
                height: newHeight,
              },
            };
          }
          return section;
        }),
      }));
    }
  };

  const handleSectionVisibleChange = (checked: boolean) => {
    const index = parseInt(selectedSectionIndex);
    setFloorPlan((prev) => ({
      ...prev,
      sections: prev.sections.map((section, idx) => {
        if (idx === index) {
          return {
            ...section,
            visible: checked
          };
        }
        return section;
      }),
    }));
  };

  const confirmRemoveSection = (e, section, index) => {
    e.stopPropagation();
    setSectionToDelete({ section, index });
    setShowDeleteConfirm(true);
  };

  const handleRemoveSection = () => {
    if (!sectionToDelete) return;

    setFloorPlan((prev) => {
      const updatedSections = [...prev.sections];
      updatedSections.splice(sectionToDelete.index, 1);
      return {
        ...prev,
        sections: updatedSections,
      };
    });

    setShowDeleteConfirm(false);
    setSectionToDelete(null);
  };

  const handleAddTable = () => {
    if (!selectedTableDetail || !selectedTableDetail.table || !selectedTableDetail.numberOfSeats) {
      toast.error("Please fill in all the fields.");
      return;
    }
    if (selectedTableDetail.numberOfSeats < 1) {
      toast.error("Capacity must be at least 1.");
      return;
    }
    closeTableModal();
    if (selectedTableDetail) {
      const index = parseInt(selectedSectionIndex);
      setFloorPlan((prev) => {
        const updatedSections = [...(prev.sections || [])];
        const updatedSection = {
          ...updatedSections[index],
          tableDetails: [...(updatedSections[index]?.tableDetails || []), selectedTableDetail],
        };
        updatedSections[index] = updatedSection;
        return {
          ...prev,
          sections: updatedSections,
        };
      });
      setSelectedTableDetail({
        table: null,
        numberOfSeats: null,
        position: {
          x: null,
          y: null,
        }
      });
    }
  };

  const handleRemoveTable = (e, tableDetail, index) => {
    e.stopPropagation();
    const sectionIdx = parseInt(selectedSectionIndex);

    setFloorPlan((prev) => {
      const updatedSections = [...(prev.sections || [])];
      const updatedTableDetails = [...(updatedSections[sectionIdx]?.tableDetails || [])];

      updatedTableDetails.splice(index, 1);

      updatedSections[sectionIdx] = {
        ...updatedSections[sectionIdx],
        tableDetails: updatedTableDetails,
      };

      return {
        ...prev,
        sections: updatedSections,
      };
    });
  };

  const openEditCapacityModal = (e, tableDetail, index) => {
    e.stopPropagation();
    setSelectedTableForEdit({ tableDetail, index });
    setNewCapacity(tableDetail.numberOfSeats);
    setEditCapacityModalOpen(true);
  };

  const handleUpdateCapacity = () => {
    if (!selectedTableForEdit || !newCapacity || newCapacity < 1) {
      toast.error("Please enter a valid capacity (minimum 1).");
      return;
    }

    const sectionIdx = parseInt(selectedSectionIndex);
    setFloorPlan((prev) => {
      const updatedSections = [...(prev.sections || [])];
      const updatedTableDetails = [...(updatedSections[sectionIdx]?.tableDetails || [])];

      updatedTableDetails[selectedTableForEdit.index] = {
        ...updatedTableDetails[selectedTableForEdit.index],
        numberOfSeats: newCapacity,
      };

      updatedSections[sectionIdx] = {
        ...updatedSections[sectionIdx],
        tableDetails: updatedTableDetails,
      };

      return {
        ...prev,
        sections: updatedSections,
      };
    });

    setEditCapacityModalOpen(false);
    setSelectedTableForEdit(null);
    setNewCapacity(null);
  };

  const handleMouseDown = (e, clickedTable, index) => {
    e.preventDefault();

    const initialMousePosition = { x: e.clientX, y: e.clientY };
    const initialTablePosition = { x: clickedTable.position?.x, y: clickedTable.position?.y };

    e.target.style.cursor = 'grabbing';

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - initialMousePosition.x;
      const deltaY = e.clientY - initialMousePosition.y;

      const newTablePosition = {
        x: initialTablePosition.x + deltaX,
        y: initialTablePosition.y + deltaY,
      };

      // Ensure the new position is within the container boundaries
      const maxX = boardDimensions?.width - clickedTable.table.dimensions.width;
      const maxY = boardDimensions?.height - clickedTable.table.dimensions.height;

      const clampedPosition = {
        x: Math.max(0, Math.min(newTablePosition.x, maxX)),
        y: Math.max(0, Math.min(newTablePosition.y, maxY)),
      };

      const sectionIdx = parseInt(selectedSectionIndex);
      setFloorPlan((prev) => {
        const updatedSections = [...(prev.sections || [])];
        const updatedTableDetails = [...(updatedSections[sectionIdx]?.tableDetails || [])];
        const updatedTableDetailIndex = index

        if (updatedTableDetailIndex !== -1) {
          updatedTableDetails[updatedTableDetailIndex] = {
            ...clickedTable,
            position: clampedPosition,
          };
        }

        updatedSections[sectionIdx] = {
          ...updatedSections[sectionIdx],
          tableDetails: updatedTableDetails,
        };

        return {
          ...prev,
          sections: updatedSections,
        };
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      e.target.style.cursor = 'grab';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const sectionIdx = parseInt(selectedSectionIndex);
  const selectedSection = floorPlan?.sections?.[sectionIdx];
  const boardDimensions = selectedSection?.dimensions ?? null;
  const sectionBackground = selectedSection?.backgroundImage?.url ?? defaultSectionBackground;

  useEffect(() => {
    dispatch(getDeffaultSettings())
    Promise.all([
      dispatch(getEntity(id)),
      dispatch(
        getTables({
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`,
        })
      ),
    ])
      .then(([entityAction]: any) => {
        const floorPlanData = entityAction?.payload?.data;
        const sectionsArray = floorPlanData?.sections ?? [];
        const sortedSections = [...sectionsArray].sort((a, b) => a.order - b.order);
        const floorPlanSortedSection = { ...floorPlanData, sections: sortedSections };
        setFloorPlan(floorPlanSortedSection);
        const initialDimensions = sortedSections.map((section) => ({
          width: section.dimensions.width.toString(),
          height: section.dimensions.height.toString(),
        }));
        setSectionDimensions(initialDimensions);
        setInitialState({
          floorPlan: floorPlanSortedSection,
          sectionDimensions: initialDimensions
        });
      })

  }, [id, updateSuccess]);

  useEffect(() => {
    const toBeCompared = {
      floorPlan,
      sectionDimensions
    }
    setIsFormDirty(!isEqual(toBeCompared, initialState));
  }, [floorPlan, sectionDimensions, initialState]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
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

  const saveEntity = () => {
    const savedEntity = {
      ...floorPlan,
      sections: floorPlan?.sections.map((section, index) => ({
        ...section,
        order: index + 1
      }))
    }

    dispatch(updateEntity(savedEntity))
  }

  return (
    <Card className="overflow-scroll">
      <CardHeader>
        <div className="flex justify-between items-start mb-5">
          <div>
            <CardTitle className="text-2xl">Floor Plan Management</CardTitle>
            <h3 className="text-lg mt-2">{floorPlan?.name} <span className="text-sm text-muted-foreground">{floorPlan?.branch?.name?.trim()}</span></h3>
          </div>
          <Button onClick={openSectionModal} className="h-8 text-xs">Add New Section</Button>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={selectedSectionIndex} onValueChange={handleSectionChange}>
          <TabsList className="mb-4">
            {floorPlan?.sections?.map((section, index) => (
              <TabsTrigger key={index} value={index.toString()} className="relative group pr-8">
                {section.name}
                <button
                  className="absolute top-1/2 -translate-y-1/2 right-6 h-4 w-4 rounded-full bg-primary text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                  onClick={(e) => openEditSectionModal(e, section, index)}
                  title="Edit section"
                >
                  <Pencil className="h-2.5 w-2.5" />
                </button>
                <button
                  className="absolute top-1/2 -translate-y-1/2 right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                  onClick={(e) => confirmRemoveSection(e, section, index)}
                  title="Delete section"
                >
                  <X className="h-3 w-3" />
                </button>
              </TabsTrigger>
            ))}
          </TabsList>

          {floorPlan?.sections?.map((section, index) => (
            <TabsContent key={index} value={index.toString()} className="space-y-4">
              {floorPlan?.sections?.[sectionIdx] && (
                <div className="flex flex-wrap gap-3 items-center">
                  <Button
                    onClick={openTableModal}
                    variant="outline"
                    className="h-8 text-xs"
                  >
                    + table
                  </Button>

                  <Label className="text-sm font-semibold">Dimensions</Label>

                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">width</Label>
                      <Input
                        type="text"
                        className="h-7 w-24 text-xs"
                        placeholder="Width"
                        value={sectionDimensions[sectionIdx]?.width}
                        onChange={(e) => handleSectionWidthChange(e, sectionIdx)}
                        onBlur={() => handleSectionWidthBlur(sectionIdx)}
                      />
                      <span className="text-xs text-muted-foreground">px</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Label className="text-xs">height</Label>
                      <Input
                        type="text"
                        className="h-7 w-24 text-xs"
                        placeholder="Height"
                        value={sectionDimensions[sectionIdx]?.height}
                        onChange={(e) => handleSectionHeightChange(e, sectionIdx)}
                        onBlur={() => handleSectionHeightBlur(sectionIdx)}
                      />
                      <span className="text-xs text-muted-foreground">px</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    <Label className="text-xs">Visible</Label>
                    <Checkbox
                      checked={floorPlan?.sections?.[sectionIdx]?.visible || false}
                      onCheckedChange={handleSectionVisibleChange}
                    />
                  </div>

                  <Button onClick={saveEntity} className="h-8 text-xs">Save</Button>
                </div>
              )}

              {boardDimensions && (
                <div
                  className="mt-5 relative border border-black"
                  style={{
                    width: `${boardDimensions?.width}px`,
                    height: `${boardDimensions?.height}px`,
                  }}
                >
                  {sectionBackground && (
                    <img
                      src={sectionBackground}
                      alt={selectedSection?.name}
                      width={`${boardDimensions?.width}px`}
                      height={`${boardDimensions?.height}px`}
                      className="absolute top-0 left-0 pointer-events-none"
                      style={{ zIndex: 0 }}
                    />
                  )}
                  {floorPlan?.sections?.[sectionIdx]?.tableDetails?.map((tableDetail: any, idx) => (
                    <div
                      key={idx}
                      className="absolute bg-blue-500 cursor-grab flex flex-col justify-center items-center text-white"
                      style={{
                        left: `${tableDetail.position?.x}px`,
                        top: `${tableDetail.position?.y}px`,
                        width: `${tableDetail.table?.dimensions.width}px`,
                        height: `${tableDetail.table?.dimensions.height}px`,
                        zIndex: 10,
                      }}
                      onMouseDown={(e) => handleMouseDown(e, tableDetail, idx)}
                      onMouseEnter={() => setHoveredTableIndex(idx)}
                      onMouseLeave={() => setHoveredTableIndex(null)}
                    >
                      <div className="overflow-hidden whitespace-nowrap text-ellipsis text-sm font-semibold">
                        {tableDetail?.table?.name}
                      </div>
                      <div className="text-xs mt-1 flex items-center gap-1">
                        <span className="cursor-pointer hover:underline" onClick={(e) => openEditCapacityModal(e, tableDetail, idx)}>
                          {tableDetail?.numberOfSeats} {tableDetail?.numberOfSeats === 1 ? 'seat' : 'seats'}
                        </span>
                      </div>
                      {hoveredTableIndex === idx && (
                        <button
                          className="absolute -top-3 right-0 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs"
                          onClick={(e) => handleRemoveTable(e, tableDetail, idx)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>

      {/* Table Modal */}
      <Dialog open={tableModalIsOpen} onOpenChange={setTableModalIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Table</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs">Choose Table</Label>
              <Select
                options={filteredTablesList}
                getOptionValue={option => option.id}
                getOptionLabel={option => option.name}
                onChange={(option) => setSelectedTableDetail((prev) => ({
                  ...prev,
                  table: option
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Choose Capacity</Label>
              <Input
                type="number"
                min={1}
                className="h-8 text-xs"
                onChange={(e) => setSelectedTableDetail((prev) => ({
                  ...prev,
                  numberOfSeats: parseInt(e.target.value)
                }))}
                value={selectedTableDetail?.numberOfSeats || ''}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddTable();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeTableModal} className="h-8 text-xs">
              Cancel
            </Button>
            <Button onClick={handleAddTable} className="h-8 text-xs">Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Section Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this section?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveSection}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Capacity Modal */}
      <Dialog open={editCapacityModalOpen} onOpenChange={setEditCapacityModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Table Capacity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs">Table: {selectedTableForEdit?.tableDetail?.table?.name}</Label>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Number of Seats</Label>
              <Input
                type="number"
                min={1}
                className="h-8 text-xs"
                value={newCapacity ?? ''}
                onChange={(e) => setNewCapacity(parseInt(e.target.value) ?? null)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUpdateCapacity();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCapacityModalOpen(false)} className="h-8 text-xs">
              Cancel
            </Button>
            <Button onClick={handleUpdateCapacity} className="h-8 text-xs">
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Section Modal */}
      {sectionModalIsOpen && (
        <SectionModal
          isOpen={sectionModalIsOpen}
          onClose={closeSectionModal}
          initialDimensions={defaultSectionsDimensions}
          onAddSection={handleAddSection}
        />
      )}

      {/* Edit Section Modal */}
      {editSectionModalOpen && sectionToEdit && (
        <SectionModal
          isOpen={editSectionModalOpen}
          onClose={() => {
            setEditSectionModalOpen(false);
            setSectionToEdit(null);
          }}
          initialDimensions={defaultSectionsDimensions}
          onAddSection={handleUpdateSection}
          existingSection={sectionToEdit.section}
          isEditMode={true}
        />
      )}
    </Card>
  );
};

export default FloorPlanManageUpdate;
