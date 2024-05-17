import { Button, Card, CardBody } from 'reactstrap';
import React, { useEffect, useState } from "react";
import { IBranchRegistry } from 'app/shared/model/branch-registry.model';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, reset } from 'app/entities/settings/branch-registry/branch-registry.reducer';
import { Link, useParams } from "react-router-dom";
import TillsTable, { PreviousTill } from "app/entities/settings/branch-registry/till/previous-till";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Translate } from "react-jhipster";
import ActivateTillModal from "app/entities/settings/branch-registry/till/activate-till-modal";
import { closeEntity as closeTill} from "app/entities/settings/branch-registry/till/till.reducer";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Calendar } from "primereact/calendar";
import { convertDateTimeFromServer } from "app/shared/util/date-utils";
import CurrentTill from "app/entities/settings/branch-registry/till/current-till";

const BranchRegistryUpdate = () => {
  const dispatch = useAppDispatch();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const branchRegistry: IBranchRegistry = useAppSelector(state => state.branchRegistry.entity);
  const loading = useAppSelector(state => state.branchRegistry.loading);
  const updateTillSuccess = useAppSelector(state => state.till.updateSuccess);
  const [showModal, setShowModal] = useState(false);

  const closeTillRequested = branchRegistry.openTill?.status === "CLOSE_REQUESTED";

  const toggleModal = () => setShowModal(prev => !prev);

  const handleCloseTill = () => dispatch(closeTill(branchRegistry?.openTill?.id));

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
  }, [updateTillSuccess]);

  return (
    <div className="d-flex flex-column justify-content-between">
      <Card>
        <div className="d-flex justify-content-between align-items-center p-3">
          <h1>{branchRegistry.name}</h1>
          <div>
            <Button disabled={closeTillRequested} onClick={!branchRegistry?.openTill?.status ? toggleModal : handleCloseTill} className="btn-success ms-2" >
              {!branchRegistry.openTill ? "Activate Till" : closeTillRequested ? "Close Requested" : "Request Close"}
            </Button>
          </div>
        </div>
        <CardBody>
          <p><strong>Name:</strong> {branchRegistry.name}</p>
          <p><strong>Code:</strong> {branchRegistry.code}</p>
          <p><strong>Branch:</strong> {branchRegistry.branch?.name}</p>
          <p><strong>Current Till</strong>
            { branchRegistry?.openTill ?
              <CurrentTill till={branchRegistry?.openTill} />
              :
              null
            }
          </p>

        </CardBody>
      </Card>

      <PreviousTill registryId={id} />

      {showModal &&
        <ActivateTillModal registryId={id} toggle={toggleModal} isOpen={showModal} />
      }

      <div className={"mt-3"}>
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
