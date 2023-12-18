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
import {getEntity, updateEntity} from "app/entities/settings/floor-plans/floor-plan.reducer";
import {useAppDispatch, useAppSelector} from "app/config/store";
import {getEntities as getTables} from "app/entities/settings/floor-plans/tables/table.reducer";
import {Button} from "primereact/button";
import {InputNumber} from "primereact/inputnumber";
import {IFloorPlan, IFloorPlanSection} from "app/shared/model/floor-plan.model";
import {Checkbox} from "primereact/checkbox";
import {IFloorPlanTable} from "app/shared/model/floor-plan-table.model";
import {overridePaginationStateWithQueryParams} from "app/shared/util/entity-utils";
import {getSortState} from "react-jhipster";
import {ITEMS_PER_PAGE} from "app/shared/util/pagination.constants";
import tables from "app/entities/settings/floor-plans/tables";
import Select from "react-select";
import {InputText} from "primereact/inputtext";




const FloorPlanManageUpdate = () => {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const floorPlanEntity = useAppSelector(state => state.floorPlan.entity);
  const {branch: floorPlanBranch} = floorPlanEntity;
  console.log(floorPlanEntity, 'floorPlanEntity')

  const updateSuccess = useAppSelector(state => state.floorPlan.updateSuccess);
  const floorPlanTablesList: IFloorPlanTable[] = useAppSelector(state => state.floorPlanTable.entities)
    .filter(table => table?.branch?.id === floorPlanBranch?.id);
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );
  const [hoveredTableIndex, setHoveredTableIndex] = useState(null);
  const [tableModalIsOpen, setTableModalIsOpen] = useState(false);
  const [sectionModalIsOpen, setSectionModalIsOpen] = useState(false);
  const [newSection, setNewSection] = useState<IFloorPlanSection>()
  const [selectedTableDetail, setSelectedTableDetail] = useState({
    table: null,
    numberOfSeats: null,
    position: {
      x: null,
      y: null,
    },
  });
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(0);
  const [floorPlan, setFloorPlan] = useState<IFloorPlan>();

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

  const handleAddSection = () => {
    closeSectionModal()
    const updatedSections = [...floorPlan.sections, newSection]
    setFloorPlan((prev) => ({
      ...prev,
      sections: updatedSections
    }))
    setNewSection({})
  }

  const handleRemoveSection = (e, section, index) => {
    e.stopPropagation();
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


  useEffect(() => {
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
        setFloorPlan(entityAction.payload.data);
      })

  }, [id,updateSuccess]);

  const saveEntity = () => {
    const savedEntity = {
      ...floorPlan
    }

    console.log(savedEntity, 'savedEntity')
    dispatch(updateEntity(savedEntity))
  }



  return (
    <Card
    style={{overflow: "scroll"}}
    >
      <div className={"d-flex justify-content-between mb-5"}>
      <h2>Floor Plan Management</h2>

        <Button onClick={openSectionModal}>Add New Section</Button>
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
            <InputNumber
              size={12}
              placeholder={"Width"}
              maxFractionDigits={2}
              name="dimension-width"
              required={true}
              value={floorPlan?.sections?.[selectedSectionIndex]?.dimensions?.width || null}
              onChange={(e) =>
                setFloorPlan((prev) => ({
                  ...prev,
                  sections: [
                    {
                      ...prev.sections?.[selectedSectionIndex],
                      dimensions: {
                        ...prev.sections?.[0]?.dimensions,
                        width: e.value,
                      },
                    },
                    ...(prev.sections || []).slice(1),
                  ],
                }))
              }
            />
            <span className="p-inputgroup-addon">px</span>
          </div>
          <div className="p-inputgroup w-full md:w-10rem">
                <span className="p-inputgroup-addon">
                  height
              </span>
            <InputNumber
              placeholder={"Height"}
              size={12}
              maxFractionDigits={2}
              required={true}
              value={floorPlan?.sections?.[selectedSectionIndex]?.dimensions?.height || null}
              onChange={(e) =>
                setFloorPlan((prev) => ({
                  ...prev,
                  sections: [
                    {
                      ...prev.sections?.[selectedSectionIndex],
                      dimensions: {
                        ...prev.sections[selectedSectionIndex]?.dimensions,
                        height: e.value,
                      },
                    },
                    ...(prev.sections || []).slice(1),
                  ],
                }))
              }
            />
            <span className="p-inputgroup-addon">px</span>
          </div>
        </div>
        <div className={"d-flex ml-auto mt-2"}>

          <label className={"mr-3"}>
            Visible
          </label>
          <div className={'mx-3'}>
            <Checkbox
              key={selectedSectionIndex}
              checked={floorPlan?.sections?.[selectedSectionIndex]?.visible || false}
              onChange={(e) => setFloorPlan((prev) => ({
                ...prev,
                sections: [
                  {
                    ...prev?.sections?.[selectedSectionIndex],
                    visible: e.checked,
                  }, ...(prev?.sections || []).slice(1),
                ],
              }))}/>
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
      </div>
      ) : null}
      <Modal
        isOpen={sectionModalIsOpen}
        contentlabel="Tables Modal"
      >
        <ModalHeader toggle={closeSectionModal}>Add New Section </ModalHeader>
        <ModalBody>
          <div className="d-flex flex-column justify-content-center align-items-center mt-5" style={{minWidth: "50%"}}>
            <div className={"d-flex flex-column w-75"}>
              <div className={"d-flex  justify-content-between"}>
                <label  className={"mt-5"}>
                  Section Name
                </label>
                <InputText
                  type="text"
                  size={35}
                  className={"mt-4"}
                  name="name"
                  required={true}
                  id="floor-plan-name"
                  value={newSection?.name || ''}
                  onChange={(e) =>
                    setNewSection((prev) => ({
                      ...prev,
                          name: e.target.value
                    }))}
                />
              </div>
              <div className={"d-flex  justify-content-between mt-5"}>
                <label>
                  Dimensions
                </label>
                <div className={"d-flex gap-4"}>
                  <InputNumber
                    size={12}
                    placeholder={"Width"}
                    maxFractionDigits={2}
                    className={"mb-5 "}
                    name="dimension-width"
                    required={true}
                    value={newSection?.dimensions?.width || null}
                    onChange={(e) =>
                      setNewSection((prev) => ({
                        ...prev,
                        dimensions: {
                          ...prev?.dimensions,
                          width: e.value,
                        },
                      }))
                    }
                  />
                  <InputNumber
                    placeholder={"Height"}
                    size={12}
                    className={"mb-5 "}
                    maxFractionDigits={2}
                    required={true}
                    value={newSection?.dimensions?.height || null}
                    onChange={(e) =>
                      setNewSection((prev) => ({
                        ...prev,
                            dimensions: {
                              ...prev?.dimensions,
                              height: e.value,
                            },
                      }))
                    }
                  />
                </div>
              </div>

              <div className={"d-flex gap-8"}>
                <label className={"mt-2"}>
                  Visible
                </label>
                <div className={"ml-7 mt-1"}>
                  <Checkbox
                    checked={newSection?.visible}
                    className={"mt-1"}
                    onChange={(e) =>
                      setNewSection((prev) => ({
                            ...prev,
                            visible: e.checked,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button label="Add" onClick={handleAddSection}/>
        </ModalFooter>
      </Modal>
    </Card>
  );
};

export default FloorPlanManageUpdate;
