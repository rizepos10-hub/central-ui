import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormGroup, Label, Input } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset } from './table.reducer';
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import { InputText } from "primereact/inputtext";
import { getSortState, Translate } from "react-jhipster";
import Attachment from "app/shared/components/attachment/attachment";
import Select from "react-select";
import { overridePaginationStateWithQueryParams } from "app/shared/util/entity-utils";
import { ITEMS_PER_PAGE } from "app/shared/util/pagination.constants";
import { InputNumber } from "primereact/inputnumber";
import { IFloorPlanTable } from "app/shared/model/FLOOR-PLAN/floor-plan-table.model";
import { transformAttachmentStructure } from 'app/shared/util/attachment-utils';
import MediaLibrary from 'app/shared/components/media-library/media-library';

const FloorPlanTableUpdate = () => {
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
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );
  console.log(floorPlanTable, 'floorPlanTable')
  const handleClose = () => {
    navigate(-1);
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
    if (floorPlanTableEntity) {
      setFloorPlanTable(floorPlanTableEntity)
    }
  }, [floorPlanTableEntity?.name]);

  const handleBranchChange = (selectedBranch) => {
    setFloorPlanTable(prevState => ({ ...prevState, branch: selectedBranch }))
  }

  const handleChange = e => {
    const { name, value } = e.target;
    setFloorPlanTable(prevState => ({ ...prevState, [name]: value }));
  };

  const handleDimensionChange = (type, e) => {
    setFloorPlanTable((prevState) => ({
      ...prevState, dimensions: { ...prevState.dimensions, [type]: e.value, },
    }));
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


  const saveEntity = (e, createNew = false) => {
    e.preventDefault()
    const entity = {
      ...floorPlanTable,
    };

    if (isNew) {
      dispatch(createEntity(entity)).then((res) => {
        if (createNew) {
          dispatch(reset());
        } else {
          const payload = res?.payload as any;
          const newId = payload?.data?.id;

          // @ts-expect-error -- unknown type
          if (!res?.error) {
            navigate(`/floor-plan/table/${newId}/edit`)
          }
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/floor-plan/table/new`)
        }
      })
    }
  };

  return (
    <div>
      <Row>
        <Col md="8">
          <h2>{isNew ? "Add New Foor Plan" : "Edit Foor Plan"}</h2>
        </Col>
      </Row>
      <Row>
        <Col md="8" className="d-flex flex-column p-3 bg-white">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <form>
              <FormGroup>
                <div className={"d-flex flex-column gap-0"}>
                  <label className={"mt-5"}>
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
                  <label className={"mt-5"}>
                    <Translate contentKey={"tempApp.table.dimensions"}>Dimensions</Translate>
                  </label>
                  <div className={"d-flex flex-column gap-3 my-2"}>
                    <div className="p-inputgroup w-full md:w-14rem">
                      <span className="p-inputgroup-addon">
                        <Translate contentKey={"tempApp.table.width"}>Width</Translate>
                      </span>
                      <InputNumber
                        size={3}
                        maxFractionDigits={2}
                        name="dimension-width"
                        required={true}
                        value={floorPlanTable?.dimensions?.width || 0}
                        onChange={(e) => handleDimensionChange("width", e)}
                      />
                      <span className="p-inputgroup-addon">px</span>
                    </div>

                    <div className="p-inputgroup w-full md:w-14rem">
                      <span className="p-inputgroup-addon">
                        <Translate contentKey={"tempApp.table.height"}>Height</Translate>
                      </span>
                      <InputNumber
                        size={3}
                        maxFractionDigits={2}
                        name="dimension-width"
                        required={true}
                        value={floorPlanTable?.dimensions?.height || 0}
                        onChange={(e) => handleDimensionChange("height", e)}
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
                    value={floorPlanTable.branch || null}
                  />
                </div>
                <div className={"d-flex flex-column"}>
                  <label className={"mt-2"}>
                    <Translate contentKey={"tempApp.table.image"}>Image</Translate>
                  </label>
                  <MediaLibrary
                    handleFilesSelectCallback={(files) => addImage(transformAttachmentStructure(files, 'toIAttachment')[0])}
                    defaultValues={transformAttachmentStructure(floorPlanTable.image ? [floorPlanTable.image] : [], 'toFileLibraryListItem')}
                  />
                </div>
              </FormGroup>
              <Button id="cancel-save" data-cy="entityCreateCancelButton" onClick={() => navigate(-1)} color="info">
                <FontAwesomeIcon icon="arrow-left" />
                &nbsp;
                <span className="d-none d-md-inline">
                  <Translate contentKey="entity.action.back">Back</Translate>
                </span>
              </Button>
              &nbsp;
              <Button onClick={saveEntity} color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                <FontAwesomeIcon icon="save" />
                &nbsp;
                <Translate contentKey="entity.action.save">Save</Translate>
              </Button>
              &nbsp;
              <Button onClick={(e) => saveEntity(e, true)} color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                <FontAwesomeIcon icon="save" />
                &nbsp;
                <Translate contentKey="entity.action.saveandnew">Save & create</Translate>
              </Button>
            </form>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default FloorPlanTableUpdate;
