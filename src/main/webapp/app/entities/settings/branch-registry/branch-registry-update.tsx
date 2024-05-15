import { Button, Card, CardBody } from 'reactstrap';
import React, { useEffect } from 'react';
import { IBranchRegistry } from 'app/shared/model/branch-registry.model';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, reset } from 'app/entities/settings/branch-registry/branch-registry.reducer';
import { Link, useParams } from "react-router-dom";
import Till from "app/entities/settings/branch-registry/till/till";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Translate } from "react-jhipster";

const BranchRegistryUpdate = () => {
  const dispatch = useAppDispatch();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const branchRegistry: IBranchRegistry = useAppSelector(state => state.branchRegistry.entity);
  const loading = useAppSelector(state => state.branchRegistry.loading);

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
  }, []);

  return (
    <div className="d-flex flex-column justify-content-between">
      <Card>
        <div className="d-flex justify-content-between align-items-center p-3">
          <h1>{branchRegistry.name}</h1>
          <div>
            <Button onClick={() => {}} className="btn-success ms-2" >
              Activate Till
            </Button>
          </div>
        </div>
        <CardBody>
          <p>Name: {branchRegistry.name}</p>
          <p>Code: {branchRegistry.code}</p>
          <p>Branch: {branchRegistry.branch?.name}</p>
        </CardBody>
      </Card>
      <Till />

      <div>
        <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to="/branch-registry" replace color="info">
          <FontAwesomeIcon icon="arrow-left" />
          &nbsp;
          <span className="d-none d-md-inline">
                  <Translate contentKey="entity.action.back">Back</Translate>
          </span>
        </Button>
      </div>
    </div>
  );
};
export default BranchRegistryUpdate;
