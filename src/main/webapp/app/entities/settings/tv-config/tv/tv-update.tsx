import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormGroup, Label, Input } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, changeEntityField, reset } from './tv.reducer';
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import { getEntities as getTvDisplays } from "app/entities/settings/tv-config/tv-display/tv-display.reducer";
import { InputText } from "primereact/inputtext";
import { getSortState, Translate } from "react-jhipster";
import Select from "react-select";
import { overridePaginationStateWithQueryParams } from "app/shared/util/entity-utils";
import { ITEMS_PER_PAGE } from "app/shared/util/pagination.constants";
import { InputNumber } from "primereact/inputnumber";

export const TVUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;


  const branchList = useAppSelector(state => state.branch.entities)
  const tvDisplayList = useAppSelector(state => state.tvDisplay.entities)
  const tv = useAppSelector(state => state.tv.entity);
  const loading = useAppSelector(state => state.tv.loading);
  const updating = useAppSelector(state => state.tv.updating);
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

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
    }));

    dispatch(getTvDisplays({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: paginationState.sort
    }))
  }, []);

  const handleBranchChange = (selectedBranch) => {
    dispatch(changeEntityField({ name: "branch", value: selectedBranch }))
  }

  const handleDisplayChange = (display) => {
    dispatch(changeEntityField({ name: "tvDisplay", value: display }))
  }

  const handleChange = e => {
    const { name, value } = e.target;
    dispatch(changeEntityField({ name, value }))
  };

  const handleDimensionChange = (type, e) => {
    dispatch(changeEntityField({ name: "dimensions", value: { ...tv.dimensions, [type]: e.value, } }))
  };

  const saveEntity = (e, createNew = false) => {
    e.preventDefault()
    const entity = {
      ...tv,
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
            navigate(`/tv/${newId}/edit`)
          }
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/tv/new`)
        }
      })
    }
  };

  return (
    <div>
      <Row>
        <Col md="8">
          <h2>{isNew ? "Add New Tv" : "Edit Tv"}</h2>
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
                    <Translate contentKey={"tempApp.tv.name"}>Name</Translate>
                  </label>
                  <InputText
                    type="text"
                    name="name"
                    required={true}
                    id="floor-plan-name"
                    value={tv.name || ''}
                    onChange={handleChange}
                  />
                </div>
                <div className={"d-flex flex-column"}>
                  <label className={"mt-5"}>
                    <Translate contentKey={"tempApp.tv.dimensions"}>Dimensions</Translate>
                  </label>
                  <div className={"d-flex flex-column gap-3 my-2"}>
                    <div className="p-inputgroup w-full md:w-11rem">
                      <span className="p-inputgroup-addon">
                        <Translate contentKey={"tempApp.tv.width"}>Width</Translate>
                      </span>
                      <InputNumber
                        size={2}
                        maxFractionDigits={2}
                        name="dimension-width"
                        required={true}
                        value={tv?.dimensions?.width || 0}
                        onChange={(e) => handleDimensionChange("width", e)}
                      />
                      <span className="p-inputgroup-addon">px</span>
                    </div>

                    <div className="p-inputgroup w-full md:w-11rem">
                      <span className="p-inputgroup-addon">
                        <Translate contentKey={"tempApp.tv.height"}>Height</Translate>
                      </span>
                      <InputNumber
                        size={2}
                        maxFractionDigits={2}
                        name="dimension-width"
                        required={true}
                        value={tv?.dimensions?.height || 0}
                        onChange={(e) => handleDimensionChange("height", e)}
                      />
                      <span className="p-inputgroup-addon">px</span>

                    </div>
                  </div>

                </div>

                <div className={"d-flex flex-column"}>
                  <label className={"mt-2"}>
                    <Translate contentKey={"tempApp.tv.branch"}>Branch</Translate>
                  </label>
                  <Select
                    options={branchList}
                    onChange={handleBranchChange}
                    getOptionValue={option => option.id}
                    getOptionLabel={option => option.name}
                    name={"branch"}
                    value={tv.branch || null}
                  />
                </div>

                <div className={"d-flex flex-column"}>
                  <label className={"mt-2"}>
                    <Translate contentKey={"tempApp.tv.display"}>Tv Display</Translate>
                  </label>
                  <Select
                    options={tvDisplayList}
                    onChange={handleDisplayChange}
                    getOptionValue={option => option.id}
                    getOptionLabel={option => option.name}
                    name={"tvDisplay"}
                    value={tv.tvDisplay || null}
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

export default TVUpdate;
