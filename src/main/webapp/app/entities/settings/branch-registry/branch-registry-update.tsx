import { Button, Card, CardBody, Spinner } from "reactstrap";
import React, { useEffect, useState } from "react";
import { IBranchRegistry } from 'app/shared/model/branch-registry.model';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, reset } from 'app/entities/settings/branch-registry/branch-registry.reducer';
import { Link, useParams } from "react-router-dom";
import TillsTable, { PreviousTill } from "app/entities/settings/branch-registry/till/previous-till";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Translate } from "react-jhipster";
import { closeEntity as closeTill} from "app/entities/settings/branch-registry/till/till.reducer";

import CurrentTill from "app/entities/settings/branch-registry/till/current-till";
import ActivateTillModal from "app/entities/settings/branch-registry/till/activate-till-modal";

const BranchRegistryUpdate = ({ isRegisterClosure }: { isRegisterClosure?: boolean }) => {
  const dispatch = useAppDispatch();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const branchRegistry: IBranchRegistry = useAppSelector(state => state.branchRegistry.entity);
  const loading = useAppSelector(state => state.branchRegistry.loading);
  const updateTillSuccess = useAppSelector(state => state.till.updateSuccess);

  const closeTillRequested = branchRegistry.openTill?.status === "CLOSE_REQUESTED";


  const handleCloseTill = () => dispatch(closeTill(branchRegistry?.openTill?.id));

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
  }, [updateTillSuccess]);

  if(loading){
    return <Spinner />;
  }

  return (
    <div className="d-flex flex-column justify-content-between">
      <Card>
        <div className="d-flex justify-content-between align-items-center p-3">
          <h1>{branchRegistry.name}</h1>
          {branchRegistry.openTill ?
            <div>
              <Button
                disabled={closeTillRequested}
                onClick={handleCloseTill}
                className="btn-success ms-2"
              >
                {closeTillRequested ? "Close Requested" : "Request Close"}
              </Button>
            </div> : null}

        </div>
        <CardBody>
          <p>
            <strong>Name:</strong> {branchRegistry.name}
          </p>
          <p>
            <strong>Code:</strong> {branchRegistry.code}
          </p>
          <p>
            <strong>Branch:</strong> {branchRegistry.branch?.name}
          </p>
          <p>
            <strong>Current Till</strong>
            {branchRegistry?.openTill ? <CurrentTill till={branchRegistry?.openTill} /> : null}
          </p>
        </CardBody>
      </Card>

      <PreviousTill isRegisterClosure={isRegisterClosure} registryId={id} />

      {/* {showModal && <ActivateTillModal registryId={id} toggle={toggleModal} isOpen={showModal} />} */}

      <div className={'mt-3'}>
        <Button
          tag={Link} id="cancel-save" data-cy="entityCreateCancelButton"
          to={isRegisterClosure ? "/analytics/register-closure" : "/branch-registry"} replace color="info"
        >
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
