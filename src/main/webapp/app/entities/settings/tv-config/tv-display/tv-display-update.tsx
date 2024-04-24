import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormGroup } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, changeEntityField, reset } from './tv-display.reducer';
import {InputText} from "primereact/inputtext";
import {getSortState, Translate} from "react-jhipster";
import {overridePaginationStateWithQueryParams} from "app/shared/util/entity-utils";
import {ITEMS_PER_PAGE} from "app/shared/util/pagination.constants";
import {ITvDisplay} from "app/shared/model/TV/tv-display.model";

export const TvDisplayUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const tvDisplay :ITvDisplay = useAppSelector(state => state.tvDisplay.entity);
  const loading = useAppSelector(state => state.tvDisplay.loading);
  const updating = useAppSelector(state => state.tvDisplay.updating);
  const updateSuccess = useAppSelector(state => state.tvDisplay.updateSuccess);
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );
  const handleClose = () => {
    navigate('/tv-display' + location.search);
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }

  }, []);

  useEffect(() => {
    if (updateSuccess) {
      handleClose();
    }
  }, [updateSuccess]);


  const handleChange = e => {
    const { name, value } = e.target;
    dispatch(changeEntityField({name, value}))
  };



  const saveEntity = (e) => {
    e.preventDefault()
    const entity = {
      ...tvDisplay,
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
          <h2>{isNew ?  "Add New Tv Display" : "Edit Tv Display"}</h2>
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
                    <Translate contentKey={"tempApp.tvDisplay.name"}>Name</Translate>
                  </label>
                  <InputText
                    type="text"
                    name="name"
                    required={true}
                    id="floor-plan-name"
                    value={tvDisplay.name || ''}
                    onChange={handleChange}
                  />
                </div>

              </FormGroup>
              <Button tag={Link} to="/tv-display" replace color="info">
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

export default TvDisplayUpdate;
