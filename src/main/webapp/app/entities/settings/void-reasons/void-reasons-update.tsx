import React, { useState, useEffect } from 'react';
import {Link,  useParams} from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, updateEntity, createEntity, reset } from './void-reasons.reducer';
import { getEntities as getTaxProfiles } from '../tax-profiles/tax-profile.reducer';
import { InputText } from "primereact/inputtext";
import {Col, FormGroup, Row,Button} from 'reactstrap';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {getSortState, Translate} from "react-jhipster";
import {overridePaginationStateWithQueryParams} from "app/shared/util/entity-utils";
import {ITEMS_PER_PAGE} from "app/shared/util/pagination.constants"; // Import FormGroup from reactstrap

export const VoidReasonsUpdate = () => {
  const dispatch = useAppDispatch();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;


  const voidReasonsEntity = useAppSelector(state => state.voidReasons.entity);

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const [code, setCode] = useState('');
  const [reason, setReason] = useState('');


  const handleNameChange = (e) => {
    setCode(e.target.value);
  };

  const handleAccountingIdChange = (e) => {
    setReason(e.target.value);
  };



  const handleSubmit = () => {
    const formData = {
      id: id ? id : null,
      code: code,
      reason: reason !== '' ? reason : null,
    };

    if (isNew) {
      dispatch(createEntity(formData));
    } else {
      dispatch(updateEntity(formData));
    }
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
    if (voidReasonsEntity) {
      setCode(voidReasonsEntity.code);
      setReason(voidReasonsEntity.reason);

    }

  }, [voidReasonsEntity]);

  return (
    <div className="bg-light">
      <h2> {isNew ? `Add New Void Reason` : `Edit Void Reason ${voidReasonsEntity.code}` } </h2>
      <Row>
        <Col md="8" className="d-flex flex-column p-3 bg-white">
      <FormGroup>
          <div className="d-flex flex-column mb-3">
            <label htmlFor="code">Code</label>
            <InputText id="code" value={code} onChange={handleNameChange} />
          </div>
          <div className="d-flex flex-column mb-3">


          <label htmlFor="reason">Reason</label>
            <InputText id="reason" value={reason} onChange={handleAccountingIdChange} />
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

          <Button color="primary" onClick={handleSubmit}>
            Save
          </Button>
        </div>
      </Row>
    </div>
  );
};

export default VoidReasonsUpdate;
