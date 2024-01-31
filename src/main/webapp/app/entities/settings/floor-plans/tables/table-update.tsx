import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormGroup, Label, Input } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset } from './table.reducer';
import {getEntities as getBranches} from "app/entities/branch/branch.reducer";
import {InputText} from "primereact/inputtext";
import {getSortState, Translate} from "react-jhipster";
import Attachment from "app/shared/layout/attachment/attachment";
import Select from "react-select";
import {overridePaginationStateWithQueryParams} from "app/shared/util/entity-utils";
import {ITEMS_PER_PAGE} from "app/shared/util/pagination.constants";
import {InputNumber} from "primereact/inputnumber";
import {IFloorPlanTable} from "app/shared/model/FLOOR-PLAN/floor-plan-table.model";

export const FloorPlanTableUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const [floorPlanTable, setFloorPlanTable] = useState<IFloorPlanTable>({
    name: '',
    image: null,
    branch: null,
    dimensions: null
  });

  const branchList = useAppSelector(state => state.branch.entities)
  const floorPlanTableEntity = useAppSelector(state => state.floorPlanTable.entity);
  const loading = useAppSelector(state => state.floorPlanTable.loading);
  const updating = useAppSelector(state => state.floorPlanTable.updating);
  const updateSuccess = useAppSelector(state => state.floorPlanTable.updateSuccess);
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );
  console.log(floorPlanTable, 'floorPlanTable')
  const handleClose = () => {
    navigate('/floor-plan/table' + location.search);
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
    dispatch(getBranches({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: paginationState.sort
    }))
  }, []);

  useEffect(() => {
    if (updateSuccess) {
      handleClose();
    }
    if(floorPlanTableEntity){
      setFloorPlanTable(floorPlanTableEntity)
    }
  }, [updateSuccess, floorPlanTableEntity?.name]);

  const handleBranchChange = (selectedBranch) => {
    setFloorPlanTable(prevState => ({...prevState, branch: selectedBranch}))
  }

  const handleChange = e => {
    const { name, value } = e.target;
    setFloorPlanTable(prevState => ({ ...prevState, [name]: value }));
  };

  const handleDimensionChange = (type, e) => {
    setFloorPlanTable((prevState) => ({
      ...prevState, dimensions: {...prevState.dimensions, [type]: e.value,},}));
  };

  const removeImage = () => {
    setFloorPlanTable(prev => ({
      ...prev,
      image: null
    }))
  }


  const addImage = (imageInfo) => {
    console.log(imageInfo, 'imageInfo')
    setFloorPlanTable(prev => ({
      ...prev,
      image: imageInfo
    }))
  }


  const saveEntity = (e) => {
    e.preventDefault()
    const entity = {
      ...floorPlanTable,
    };

    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }
  };

  return (
    <div>
      <Row>
        <Col md="8">
          <h2>{isNew ?  "Add New Size" : "Edit Size"}</h2>
        </Col>
      </Row>
      <Row>
        <Col md="8" className="d-flex flex-column p-3 bg-white">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <form onSubmit={saveEntity}>
              <FormGroup>
                <div className={"d-flex flex-column gap-0"}>
                <label  className={"mt-5"}>
                  <Translate contentKey={"tempApp.table.name"}>Name</Translate>
                </label>
                <InputText
                  type="text"
                  name="name"
                  required={true}
                  id="floor-plan-name"
                  value={floorPlanTable.name || ''}
                  onChange={handleChange}
                />
                </div>
                <div className={"d-flex flex-column"}>
                  <label  className={"mt-5"}>
                    <Translate contentKey={"tempApp.table.dimensions"}>Dimensions</Translate>
                  </label>
                  <div className={"d-flex flex-column gap-3 my-2"}>
                    <div className="p-inputgroup w-full md:w-10rem">
                      <span className="p-inputgroup-addon">
                      <Translate contentKey={"tempApp.table.width"}>Width</Translate>
                    </span>
                      <InputNumber
                      size={1}
                      maxFractionDigits={2}
                      name="dimension-width"
                      required={true}
                      value={floorPlanTable?.dimensions?.width || 0}
                      onChange={(e) => handleDimensionChange("width",e)}
                    />
                      <span className="p-inputgroup-addon">px</span>
                    </div>

                    <div className="p-inputgroup w-full md:w-10rem">
                      <span className="p-inputgroup-addon">
                        <Translate contentKey={"tempApp.table.height"}>Height</Translate>
                      </span>
                      <InputNumber
                        size={1}
                        maxFractionDigits={2}
                        name="dimension-width"
                        required={true}
                        value={floorPlanTable?.dimensions?.height || 0}
                        onChange={(e) => handleDimensionChange("height",e)}
                      />
                      <span className="p-inputgroup-addon">px</span>

                    </div>
                  </div>

                </div>
                <div className={"d-flex flex-column"}>
                  <label className={"mt-2"}>
                    <Translate contentKey={"tempApp.table.branch"}>Branch</Translate>
                  </label>
                 <Select
                   options={branchList}
                   onChange={handleBranchChange}
                   getOptionValue={option => option.id}
                   getOptionLabel={option => option.name}
                   name={"branch"}
                   value={floorPlanTable.branch}
                   />
                </div>
                <div className={"d-flex flex-column"}>
                  <label  className={"mt-2"}>
                    <Translate contentKey={"tempApp.table.image"}>Image</Translate>
                  </label>
                  <Attachment
                    image={floorPlanTable.image}
                    onRemoveImage={removeImage}
                    onAddImage={addImage}
                    type={null}
                  />
                </div>
              </FormGroup>
              <Button tag={Link} to="/floor-plan/table" replace color="info">
                <FontAwesomeIcon icon="arrow-left" />
                &nbsp;Back
              </Button>
              &nbsp;
              <Button color="primary" type="submit" disabled={updating}>
                <FontAwesomeIcon icon="save" />
                &nbsp;Save
              </Button>
            </form>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default FloorPlanTableUpdate;
