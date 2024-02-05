import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';
import { Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, deleteEntity } from './sales-location.reducer';

export const SalesLocationDeleteDialog = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();

  const [loadModal, setLoadModal] = useState(false);

  useEffect(() => {
    dispatch(getEntity(id));
    setLoadModal(true);
  }, []);

  const salesLocationEntity = useAppSelector(state => state.salesLocation.entity);
  const updateSuccess = useAppSelector(state => state.salesLocation.updateSuccess);

  const handleClose = () => {
    navigate('/inventory/sales-location' + location.search);
  };

  useEffect(() => {
    if (updateSuccess && loadModal) {
      handleClose();
      setLoadModal(false);
    }
  }, [updateSuccess]);

  const confirmDelete = () => {
    dispatch(deleteEntity(salesLocationEntity.id));
  };

  return (
    <Modal isOpen toggle={handleClose}>
      <ModalHeader toggle={handleClose} data-cy="salesLocationDeleteDialogHeading">
        <Translate contentKey="tempApp.salesLocation.delete.title">Confirm delete operation</Translate>
      </ModalHeader>
      <ModalBody id="salesLocations.delete.question">
        <Translate contentKey="tempApp.salesLocation.delete.question" interpolate={{ id: salesLocationEntity.id }}>
          Are you sure you want to delete this Supplier?
        </Translate>
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" onClick={handleClose}>
          <FontAwesomeIcon icon="ban" />
          &nbsp;
          <Translate contentKey="common.buttons.cancel">Cancel</Translate>
        </Button>
        <Button id="jhi-confirm-delete-salesLocation" data-cy="entityConfirmDeleteButton" color="danger" onClick={confirmDelete}>
          <FontAwesomeIcon icon="trash" />
          &nbsp;
          <Translate contentKey="common.buttons.delete">Delete</Translate>
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default SalesLocationDeleteDialog;
