import React, {useState, useRef, useEffect} from 'react';
import { Steps } from 'primereact/steps';
import { MenuItem } from 'primereact/menuitem';
import {InputText} from "primereact/inputtext";
import {Button} from "primereact/button";
import {IFloorPlan} from "app/shared/model/floor-plan.model";
import {getEntities as getBranches} from "app/entities/branch/branch.reducer";
import {useAppDispatch, useAppSelector} from "app/config/store";
import {overridePaginationStateWithQueryParams} from "app/shared/util/entity-utils";
import {getSortState, Translate} from "react-jhipster";
import {ITEMS_PER_PAGE} from "app/shared/util/pagination.constants";
import Select from "react-select";
import {IBranch} from "app/shared/model/branch.model";
import {FormGroup, Row} from "reactstrap";
import {Checkbox} from "primereact/checkbox";
import {InputNumber} from "primereact/inputnumber";
import Attachment from "app/shared/layout/attachment/attachment";
import {createEntity} from "app/entities/settings/floor-plans/floor-plan.reducer";
import {useNavigate} from "react-router-dom";

const items: MenuItem[] = [
  {
    label: 'Name Your Floor Plan',
  },
  {
    label: 'Choose Your Branch',
  },
  {
    label: 'Create Your First Section',
  },

];
const CreateFloorPlan = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [newFloorPlan, setNewFloorPlan] = useState<IFloorPlan>({
    active: false,
  })
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );
  const branchList = useAppSelector(state => state.branch.entities);
  const newFloorPlanEntity = useAppSelector(state => state.floorPlan.entity);
  const updateSuccess = useAppSelector(state => state.floorPlan.updateSuccess);



  const removeImage = () => {
    setNewFloorPlan(prev => ({
      ...prev,
      sections: [
        {
          ...prev?.sections?.[0],
          backgroundImage: null,
        },
        ...(prev.sections || []).slice(1),
      ],
    }));
  };


  const addImage = (imageInfo) => {
    setNewFloorPlan(prev => ({
      ...prev,
      sections: [
        {
          ...prev?.sections?.[0],
          backgroundImage: imageInfo,
        },
        ...(prev.sections || []).slice(1),
      ],
    }));
  };


  const handleChange = (e) => {
    const {name, value} = e.target
    setNewFloorPlan((prevState) => ({
      ...prevState,
      [name] : value
    }))
  };

  useEffect(() => {
    if(activeIndex === 1){
      dispatch(getBranches({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`
      }))
    }
    const { id: newFloorPanId } = newFloorPlanEntity;
    console.log(updateSuccess, newFloorPanId, "hello world")
    if (updateSuccess && newFloorPanId) {
      navigate(`/floor-plan/${newFloorPanId}/manage?page=1&sort=id,asc`);
    }
  },[activeIndex,updateSuccess])

  console.log(newFloorPlan, "size={70}")

  const saveEntity = (e) => {
    e.preventDefault()
    const entity = {
      ...newFloorPlan,
    };

    dispatch(createEntity(entity));

  };

  return (
    <Row className="card ">
      <Steps model={items} activeIndex={activeIndex} onSelect={(e) => setActiveIndex(e.index)} readOnly={false} />
      <div className={"d-flex justify-content-center"}>

      {/*   Displaying content of the first step */}
      {activeIndex === 0 ? (
        <div className="d-flex flex-column justify-content-center align-items-center mt-5">
          <InputText name={"name"} value={newFloorPlan?.name} size={70} className={"py-3"} placeholder="Floor Plan Name" onChange={handleChange} />
          <div className="mt-1 ml-auto">
            <Button label="Next" onClick={() => setActiveIndex((prev) => prev + 1)} />
          </div>
        </div>
      ) : null}

        {/*   Displaying content of the second step */}

      {activeIndex === 1 ? (
        <div className="d-flex flex-column justify-content-center align-items-center mt-5" style={{minWidth: "30%"}}>
          <div style={{width: "100%"}}>
          <Select
            name={"branch"}
            options={branchList}
            getOptionLabel={(option: IBranch) => option.name}
            getOptionValue={(option: IBranch) => option.id}
            value={newFloorPlan?.branch}
            placeholder="Branch Name"
            onChange={(selectedBranch: IBranch) => setNewFloorPlan((prev) => ({...prev, branch: selectedBranch}))}
          />
            <div className={"w-full d-flex gap-3 my-3"}>
             <h3> <strong>Make it active for {newFloorPlan?.branch?.name || "selected branch"}</strong></h3>
              <Checkbox
                checked={newFloorPlan.active}
                className={"mt-1"}
                onChange={(e) => setNewFloorPlan((prev) => ({...prev, active: e.checked}))}
              />
            </div>
          </div>
          <div className="mt-1 ml-auto">
            <Button label="Next" onClick={() => setActiveIndex((prev) => prev + 1)} />
          </div>
        </div>
      ) : null}


        {/*   Displaying content of the third step */}
        {activeIndex === 2 ? (
          <div className="d-flex flex-column justify-content-center align-items-center mt-5" style={{minWidth: "50%"}}>
            <h3 className={"align-self-start"}>Your First Section Info</h3>
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
                  value={newFloorPlan.sections?.[0]?.name || ''}
                  onChange={(e) =>
                    setNewFloorPlan((prev) => ({
                      ...prev,
                      sections: [
                          {
                          ...prev.sections?.[0],
                          name: e.target.value,
                          order: 1,
                          },
                        ...(prev.sections || []).slice(1),
                      ],
                    }))
                  }
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
                      value={newFloorPlan?.sections?.[0]?.dimensions?.width || null}
                      onChange={(e) =>
                        setNewFloorPlan((prev) => ({
                          ...prev,
                          sections: [
                            {
                              ...prev.sections?.[0],
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
                    <InputNumber
                      placeholder={"Height"}
                      size={12}
                      className={"mb-5 "}

                      maxFractionDigits={2}
                      required={true}
                      value={newFloorPlan?.sections?.[0]?.dimensions?.height || null}
                      onChange={(e) =>
                        setNewFloorPlan((prev) => ({
                          ...prev,
                          sections: [
                            {
                              ...prev.sections?.[0],
                              dimensions: {
                                ...prev.sections[0]?.dimensions,
                                height: e.value,
                              },
                            },
                            ...(prev.sections || []).slice(1),
                          ],
                        }))
                      }
                    />
                </div>
              </div>
              <div className={"d-flex flex-column"}>
                <label  className={"mt-2"}>
                  <Translate contentKey={"tempApp.table.image"}>Image</Translate>
                </label>
                <Attachment
                  image={newFloorPlan?.sections?.[0]?.backgroundImage}
                  onRemoveImage={removeImage}
                  onAddImage={addImage}
                />
              </div>
              <div className={"d-flex gap-8"}>
                <label className={"mt-2"}>
                  Visible
                </label>
                <div className={"ml-7 mt-1"}>
                <Checkbox
                  checked={newFloorPlan.sections?.[0]?.visible || false}
                  className={"mt-1"}
                  onChange={(e) =>
                    setNewFloorPlan((prev) => ({
                      ...prev,
                      sections: [
                        {
                          ...prev.sections?.[0],
                          visible: e.checked,
                        }, ...(prev.sections || []).slice(1),
                      ],
                    }))
                  }
                />
              </div>
            </div>
          </div>
            <div className="mt-1 ml-auto">
              <Button label="submit" type={"submit"} onClick={saveEntity} />
            </div>
          </div>
        ) : null}

      </div>
    </Row>
  )
}
export  default CreateFloorPlan
