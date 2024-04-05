import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, updateEntity, createEntity, reset, changeEntityField } from "./void-reason.reducer";
import { getEntities as getTaxProfiles } from 'app/entities/settings/tax-profile/tax-profile.reducer';
import { InputText } from "primereact/inputtext";
import { Col, FormGroup, Row, Button, Spinner } from "reactstrap";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {getSortState, Translate} from "react-jhipster";
import {overridePaginationStateWithQueryParams} from "app/shared/util/entity-utils";
import {ITEMS_PER_PAGE} from "app/shared/util/pagination.constants";
import { IVoidReason } from "app/shared/model/void-reason.model"; // Import FormGroup from reactstrap

export const VoidReasonUpdate = () => {
  const dispatch = useAppDispatch();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;
  const navigate = useNavigate();
  const voidReason :IVoidReason = useAppSelector(state => state.voidReason.entity);
  const updateSuccess = useAppSelector(state => state.voidReason.updateSuccess);
  const updating = useAppSelector(state => state.voidReason.updating);
  const loading = useAppSelector(state => state.voidReason.loading);

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const handleClose = () => [
    navigate('/void-reasons')
  ]

  const handleChange = <T extends keyof IVoidReason>(field: T, value: IVoidReason[T]) => {
      dispatch(changeEntityField({field, value}))
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
    dispatch(getTaxProfiles({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));
  }, []);

  useEffect(() => {
    if(updateSuccess){
      handleClose();
    }

    return () => {
      dispatch(reset());
    }
  },[updateSuccess])


  const handleSubmit = (e) => {
    e.preventDefault();
    const entity = {
        ...voidReason
    };

    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }
  };


  if(loading) return <Spinner />;

  return (
    <div className="bg-light">
      <h2> {isNew ? `Add New Void Reason` : `Edit Void Reason ${voidReason.code}` } </h2>
      <Row>
        <form onSubmit={handleSubmit}>
        <Col md="8" className="d-flex flex-column p-3 bg-white">
      <FormGroup>
          <div className="d-flex flex-column mb-3">
            <label htmlFor="code">Code</label>
            <InputText
              id="code"
              value={voidReason.code}
              onChange={(e) => handleChange("code", e.target.value)}
            />
          </div>
          <div className="d-flex flex-column mb-3">


          <label htmlFor="reason">Reason</label>
            <InputText
              id="reason"
              value={voidReason.reason}
              onChange={(e) => handleChange("reason", e.target.value)}
            />
          </div>
      </FormGroup>
        </Col>

        <div className="d-flex justify-content-start align-items-center ga-3 mt-5">
          <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to="/void-reasons" replace color="info">
            <FontAwesomeIcon icon="arrow-left" />
            &nbsp;
            <span className="d-none d-md-inline">
                  <Translate contentKey="entity.action.back">Back</Translate>
                </span>
          </Button>
          &nbsp;

          <Button color="primary" disabled={updating}>
            Save
          </Button>
        </div>
      </form>
    </Row>
  </div>
  );
};

export default VoidReasonUpdate;
