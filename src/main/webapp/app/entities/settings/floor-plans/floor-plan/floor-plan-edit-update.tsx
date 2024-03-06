import React, {useEffect, useState} from 'react';
import {
  Card,
  Col,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Popover,
  PopoverBody,
  PopoverHeader,
  Row
} from "reactstrap";
import {TabPanel, TabView} from "primereact/tabview";
import {useParams} from "react-router-dom";
import {getEntity, updateEntity} from "app/entities/settings/floor-plans/floor-plan/floor-plan.reducer";
import {useAppDispatch, useAppSelector} from "app/config/store";
import {getEntities as getTables} from "app/entities/settings/floor-plans/tables/table.reducer";
import {Button} from "primereact/button";
import {InputNumber} from "primereact/inputnumber";
import {IFloorPlan} from "app/shared/model/FLOOR-PLAN/floor-plan.model";
import {Checkbox} from "primereact/checkbox";
import {IFloorPlanTable} from "app/shared/model/FLOOR-PLAN/floor-plan-table.model";
import {overridePaginationStateWithQueryParams} from "app/shared/util/entity-utils";
import {getSortState} from "react-jhipster";
import {ITEMS_PER_PAGE} from "app/shared/util/pagination.constants";
import tables from "app/entities/settings/floor-plans/tables";
import Select from "react-select";
import {InputText} from "primereact/inputtext";
import {IBranch} from "app/shared/model/branch.model";
import {Divider} from "primereact/divider";




const FloorPlanEditUpdate = () => {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const floorPlanEntity = useAppSelector(state => state.floorPlan.entity);
  const {branch: floorPlanBranch} = floorPlanEntity;
  console.log(floorPlanBranch, 'floorPlanBranch')


  const updateSuccess = useAppSelector(state => state.floorPlan.updateSuccess);

  const [floorPlan, setFloorPlan] = useState<IFloorPlan>();

  console.log(floorPlan, 'floorplano')
  console.log(floorPlanEntity, 'floorPlanEntity')

  const handleChange = (e) => {
    const {name, value} = e.target
    setFloorPlan((prevState) => ({
      ...prevState,
      [name] : value
    }))
  };

  useEffect(() => {

    dispatch(getEntity(id));
    setFloorPlan(floorPlanEntity)

  }, [id,updateSuccess,floorPlanEntity?.id]);

  const saveEntity = () => {
    const savedEntity = {
      ...floorPlan
    }
    dispatch(updateEntity(savedEntity))
  }



  return (

    <Row>
      <Row>
        <Col md="8">
          <h1 >
            {`Floor Plan / ${floorPlanEntity?.name}`}
          </h1>
        </Col>
      </Row>
      <Col md="8"  className="d-flex flex-column p-3  bg-white">
        <div className={"mb-5 mt-2"}>
          <h4>
            Edit Your floor plan details
          </h4>
          <hr style={{ borderColor: 'red', margin: '10px 0' }} />
        </div>
    <div className="d-flex flex-column justify-content-center align-items-center mt-5">
      <InputText name={"name"} value={floorPlan?.name} size={70} className={"py-3"} placeholder="Floor Plan Name" onChange={handleChange} />
    </div>
      <div className="d-flex flex-column justify-content-center align-items-center mt-5" style={{minWidth: "30%"}}>
        <div style={{width: "100%"}}>

          <div className={"w-full d-flex justify-content-center gap-3 my-3"}>
            <h3> <strong>Make it active for {floorPlan?.branch?.name}</strong></h3>
            <Checkbox
              checked={floorPlan?.active}
              className={"mt-1"}
              onChange={(e) => setFloorPlan((prev) => ({...prev, active: e.checked}))}
            />
          </div>
        </div>
      </div>
        <div className="mt-4 ml-auto">
          <Button label="submit" type={"submit"} onClick={saveEntity} />
        </div>
     </Col>
    </Row>
  );
};

export default FloorPlanEditUpdate;
