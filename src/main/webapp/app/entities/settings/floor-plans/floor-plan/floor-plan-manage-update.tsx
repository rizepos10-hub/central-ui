import React, {useEffect, useMemo, useState} from 'react';
import {
  Card,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "reactstrap";
import {TabPanel, TabView} from "primereact/tabview";
import {useParams} from "react-router-dom";
import {getEntity, updateEntity} from "app/entities/settings/floor-plans/floor-plan/floor-plan.reducer";
import {useAppDispatch, useAppSelector} from "app/config/store";
import {getEntities as getTables} from "app/entities/settings/floor-plans/tables/table.reducer";
import {getEntity as getDeffaultSettings} from "app/entities/settings/floor-plans/floor-plan-settings/floor-plan-settings.reducer"
import {Button} from "primereact/button";
import {InputNumber} from "primereact/inputnumber";
import {IFloorPlan} from "app/shared/model/floor-plan.model";
import {Checkbox} from "primereact/checkbox";
import {IFloorPlanTable} from "app/shared/model/floor-plan-table.model";
import {overridePaginationStateWithQueryParams} from "app/shared/util/entity-utils";
import {getSortState} from "react-jhipster";
import {ITEMS_PER_PAGE} from "app/shared/util/pagination.constants";
import Select from "react-select";
import SectionModal from "app/entities/settings/floor-plans/floor-plan/floor-plan-new-section-modal";
import {InputText} from "primereact/inputtext";




const FloorPlanManageUpdate = () => {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const floorPlanSettingsEntity = useAppSelector(state => state.floorPlanSettings.entity);
  const {
    tableImage: defaultTableImage,
    tableDimensions: defaultTableDimensions,
    sectionBackground: defaultSectionBackground,
    sectionsDimensions: defaultSectionsDimensions
  } = floorPlanSettingsEntity
  const floorPlanEntity = useAppSelector(state => state.floorPlan.entity);
  const {branch: floorPlanBranch} = floorPlanEntity;


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
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(0);
  const [floorPlan, setFloorPlan] = useState<IFloorPlan>();

  const [sectionDimensions, setSectionDimensions]:any = useState({
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
    if(filteredTablesList?.length === 0){
      alert("No Tables To Add");
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

  const handleSectionChange = (e) => {
    setSelectedSectionIndex(e.index);
  }



  const handleAddSection = (newSection) => {
    if(newSection?.name.trim() === ""){
      alert("Please enter section name")
      return
    }
    closeSectionModal()

    const updatedSections = [...floorPlan.sections, newSection]
    setFloorPlan((prev) => ({
      ...prev,
      sections: updatedSections
    }))
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
      alert("Cannot change width, some tables are outside the new bounds.");
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
      alert("Cannot change height, some tables are outside the new bounds.");
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



  // const handleSectionWidthChange = (e) => {
  //   const newWidth = parseInt(e.target.value, 10);
  //   setSectionDimensions((prev) => ({
  //     ...prev,
  //     width: newWidth
  //   }))
  //
  // };

  // const handleSectionHeightChange = (e) => {
  //   const newHeight =  parseInt(e.target.value, 10);
  //   console.log(e.originalEvent, 'eewre')
  //
  //   const tablesOutsideBounds = floorPlan?.sections?.[selectedSectionIndex]?.tableDetails?.some((tableDetail) => {
  //     const tableBottomEdge = tableDetail.position.y + tableDetail.table.dimensions.height;
  //     return tableBottomEdge > newHeight;
  //   });
  //
  //   if (tablesOutsideBounds) {
  //     alert("Cannot change height, some tables are outside the new bounds.");
  //     return;
  //   }
  //
  //   setFloorPlan((prev) => ({
  //     ...prev,
  //     sections: prev.sections.map((section, index) => {
  //       if (index === selectedSectionIndex) {
  //         return {
  //           ...section,
  //           dimensions: {
  //             ...section.dimensions,
  //             height: newHeight,
  //           },
  //         };
  //       }
  //       return section;
  //     }),
  //   }));
  // };

  const handleSectionVisibleChange = (e) => {
    const isVisible = e.checked;

    setFloorPlan((prev) => ({
      ...prev,
      sections: prev.sections.map((section, index) => {
        if (index === selectedSectionIndex) {
          return {
            ...section,
            visible: isVisible
          };
        }
        return section;
      }),
    }));
  };


  const handleRemoveSection = (e, section, index) => {
    e.stopPropagation();
    console.log(section, 'section')

    const confirmRemove = window.confirm("Are you sure you want to remove this section?");
    if(confirmRemove){
      setFloorPlan((prev) => {
        const updatedSections = [...prev.sections];
        updatedSections.splice(index, 1);
        return {
          ...prev,
          sections: updatedSections,
        };
      });
    }
  };


  const handleAddTable = () => {
    if (!selectedTableDetail || !selectedTableDetail.table || !selectedTableDetail.numberOfSeats) {
      alert("Please fill in all the fields");
      return;
    }
    closeTableModal();
    if (selectedTableDetail) {
      setFloorPlan((prev) => {
        const updatedSections = [...(prev.sections || [])];
        const updatedSection = {
          ...updatedSections[selectedSectionIndex],
          tableDetails: [...(updatedSections[selectedSectionIndex]?.tableDetails || []), selectedTableDetail],
        };
        updatedSections[selectedSectionIndex] = updatedSection;
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

    setFloorPlan((prev) => {
      const updatedSections = [...(prev.sections || [])];
      const updatedTableDetails = [...(updatedSections[selectedSectionIndex]?.tableDetails || [])];

      updatedTableDetails.splice(index, 1);

      updatedSections[selectedSectionIndex] = {
        ...updatedSections[selectedSectionIndex],
        tableDetails: updatedTableDetails,
      };

      return {
        ...prev,
        sections: updatedSections,
      };
    });
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

      setFloorPlan((prev) => {
        const updatedSections = [...(prev.sections || [])];
        const updatedTableDetails = [...(updatedSections[selectedSectionIndex]?.tableDetails || [])];
        const updatedTableDetailIndex = index

        if (updatedTableDetailIndex !== -1) {
          updatedTableDetails[updatedTableDetailIndex] = {
            ...clickedTable,
            position: clampedPosition,
          };
        }

        updatedSections[selectedSectionIndex] = {
          ...updatedSections[selectedSectionIndex],
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

  const selectedSection = floorPlan?.sections?.[selectedSectionIndex];
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
      .then(([entityAction]:any) => {
        console.log(entityAction.payload.data, 'entityAction.payload.data')
        const floorPlanData = entityAction?.payload?.data;
        const sectionsArray = floorPlanData?.sections ?? [];
        const sortedSections = [...sectionsArray].sort((a, b) => a.order - b.order);
        const floorPlanSortedSection = {...floorPlanData, sections: sortedSections};
        console.log(floorPlanSortedSection, 'floorPlanSortedSection')
        setFloorPlan(floorPlanSortedSection);
        const initialDimensions = sortedSections.map((section) => ({
          width: section.dimensions.width.toString(),
          height: section.dimensions.height.toString(),
        }));
        setSectionDimensions(initialDimensions);
      })

  }, [id,updateSuccess]);




  const saveEntity = () => {
    const savedEntity = {
      ...floorPlan,
      sections: floorPlan?.sections.map((section, index) => ({
        ...section,
        order: index + 1
      }))
    }

    console.log(savedEntity, 'savedEntity')
    dispatch(updateEntity(savedEntity))
  }


console.log(floorPlan, 'floorPlanfloorPlan')
  return (
    <Card
    style={{overflow: "scroll"}}
    >
      <div className={"d-flex justify-content-between mb-5"}>
        <div>
      <h2>Floor Plan Management</h2>
      <h3>{floorPlan?.name} <span className={"text-sm"}>{floorPlan?.branch?.name?.trim()}</span></h3>

        </div>
        <div className={"ml-auto"}>
        <Button onClick={openSectionModal}>Add New Section</Button>
        </div>
      </div>
      <TabView scrollable activeIndex={selectedSectionIndex} onTabChange={handleSectionChange}>

        {floorPlan?.sections?.map((section,index) => {
          return <TabPanel  key={index}
                            header={
                               <div className={"relative"}>
                                 {section.name}
                                   <div
                                     style={{
                                       position: 'absolute',
                                       top: '-15px',
                                       right: '-14px',
                                       cursor: 'pointer',
                                       padding: "5px",
                                       fontSize: "13px"
                                     }}
                                     onClick={(e) => {
                                       handleRemoveSection(e, section, index)
                                     }}
                                   >
                                     X
                                   </div>
                               </div>
          }/>})}
      </TabView>
      {floorPlan?.sections?.[selectedSectionIndex] ? (
        <div className={"d-flex  gap-3 mb-1"}>
        <div>
          <Button id={"ModalButton"} className={"font-bold"} label={"+ table"} onClick={openTableModal}/>
          <Modal
            isOpen={tableModalIsOpen}
            contentlabel="Tables Modal"
          >
            <ModalHeader toggle={closeTableModal}/>
            <ModalBody>
              <div className={"d-flex flex-column gap-4"}>
                <label>
                  Choose Table
                </label>
                <Select
                  options={filteredTablesList}
                  required={true}
                  getOptionValue={option => option.id}
                  getOptionLabel={option => option.name}
                  onChange={(option) => setSelectedTableDetail((prev) => ({
                    ...prev,
                    table: option
                  }))}
                />
                <label>
                  Choose Capacity
                </label>
                <InputNumber
                  required={true}
                  onChange={(e) => setSelectedTableDetail((prev) => ({
                    ...prev,
                    numberOfSeats: e.value
                  }))}
                  value={selectedTableDetail?.numberOfSeats}
                />

              </div>
            </ModalBody>
            <ModalFooter>
              <Button label="Add" onClick={handleAddTable}/>
            </ModalFooter>
          </Modal>
        </div>
        <label className={"mt-2"}>
          <strong>
            Dimensions
          </strong>
        </label>
        <div className={"d-flex gap-4"}>
          <div className="p-inputgroup w-full md:w-10rem">
            <span className="p-inputgroup-addon">
                  width
              </span>
            <InputText
              size={12}
              placeholder={"Width"}
              name={`dimension-width-${selectedSectionIndex}`}
              required={true}
              value={sectionDimensions[selectedSectionIndex]?.width}
              onChange={(e) => handleSectionWidthChange(e, selectedSectionIndex)}
              onBlur={() => handleSectionWidthBlur(selectedSectionIndex)} // Separate onBlur handler
            />
            <span className="p-inputgroup-addon">px</span>
          </div>
          <div className="p-inputgroup w-full md:w-10rem">
                <span className="p-inputgroup-addon">
                  height
              </span>
            <InputText
              placeholder={"Height"}
              size={12}
              required={true}
              value={sectionDimensions[selectedSectionIndex]?.height}
              onChange={(e) => handleSectionHeightChange(e, selectedSectionIndex)}
              onBlur={() => handleSectionHeightBlur(selectedSectionIndex)} // Separate onBlur handler
            />
            <span className="p-inputgroup-addon">px</span>
          </div>

          {/* <div className="p-inputgroup w-full md:w-10rem"> */}

          {/*   <InputNumber */}
          {/*     placeholder={"Height"} */}
          {/*     size={12} */}
          {/*     maxFractionDigits={2} */}
          {/*     required={true} */}
          {/*     value={floorPlan?.sections?.[selectedSectionIndex]?.dimensions?.height || null} */}
          {/*     onChange={handleSectionHeightChange} */}
          {/*   /> */}

          {/* </div> */}

        </div>
        <div className={"d-flex ml-auto mt-2"}>

          <label className={"mr-3"}>
            Visible
          </label>
          <div className={'mx-3'}>
            <Checkbox
              key={selectedSectionIndex}
              checked={floorPlan?.sections?.[selectedSectionIndex]?.visible || false}
              onChange={handleSectionVisibleChange}

            />
          </div>
        </div>
        <div className={"mb-1"}>
          <Button label="Save" type={"submit"} onClick={saveEntity}/>
        </div>
      </div> ): null}
      {boardDimensions ? (
        <div
        className={"mt-5"}
        style={{
          position: 'relative',
          width: `${boardDimensions?.width}px`,
          height: `${boardDimensions?.height}px`,
          border: '1px solid #000',
        }}
      >

        {floorPlan?.sections?.[selectedSectionIndex]?.tableDetails?.map((tableDetail: any, index) => {
          return (
            <div
              key={index}
              style={{
                position: 'absolute',
                left: `${tableDetail.position?.x}px`,
                top: `${tableDetail.position?.y}px`,
                width: `${tableDetail.table?.dimensions.width}px`,
                height: `${tableDetail.table?.dimensions.height}px`,
                backgroundColor: 'blue',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: "-moz-initial"
              }}
              onMouseDown={(e) => handleMouseDown(e, tableDetail, index)}
              onMouseEnter={() => setHoveredTableIndex(index)}
              onMouseLeave={() => setHoveredTableIndex(null)}
            >
              <div
                style={{
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                }}
              >
                {tableDetail?.table?.name}
              </div>
              {hoveredTableIndex === index && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-15px',
                    right: '0',
                    cursor: 'pointer',
                    fontSize: "15px"
                  }}
                  onClick={(e) => {
                    handleRemoveTable(e, tableDetail, index);
                  }}
                >
                  X
                </div>
              )}
            </div>
          )
        })}
          {sectionBackground ? <img
            src={sectionBackground}
            alt={selectedSection?.name}
            width={`${boardDimensions?.width}px`}
            height={`${boardDimensions?.height}px`}
          /> : null}
      </div>
      ) : null}
      {/* New Section Modal */}
      {sectionModalIsOpen && <SectionModal isOpen={sectionModalIsOpen} onClose={closeSectionModal} onAddSection={handleAddSection}/>}
    </Card>
  );
};

export default FloorPlanManageUpdate;
