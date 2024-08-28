import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';
import { Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, deleteEntity } from './supplier-return.reducer';

export const SupplierReturnDeleteDialog = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();

  const [loadModal, setLoadModal] = useState(false);

  useEffect(() => {
    dispatch(getEntity(id));
    setLoadModal(true);
  }, []);

  const supplierReturnEntity = useAppSelector(state => state.supplierReturn.entity);
  const updateSuccess = useAppSelector(state => state.supplierReturn.updateSuccess);

  const handleClose = () => {
    navigate(-1);
  };

  useEffect(() => {
    if (updateSuccess && loadModal) {
      handleClose();
      setLoadModal(false);
    }
  }, [updateSuccess]);

  const confirmDelete = () => {
    dispatch(deleteEntity(supplierReturnEntity.id));
  };

  return (
    <Modal isOpen toggle={handleClose}>
      <ModalHeader toggle={handleClose} data-cy="supplierReturnDeleteDialogHeading">
        <Translate contentKey="tempApp.supplierReturn.delete.title">Confirm delete operation</Translate>
      </ModalHeader>
      <ModalBody id="supplierReturns.delete.question">
        <Translate contentKey="tempApp.supplierReturn.delete.question" interpolate={{ id: supplierReturnEntity.id }}>
          Are you sure you want to delete this Supplier?
        </Translate>
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" onClick={handleClose}>
          <FontAwesomeIcon icon="ban" />
          &nbsp;
          <Translate contentKey="common.buttons.cancel">Cancel</Translate>
        </Button>
        <Button id="jhi-confirm-delete-supplierReturn" data-cy="entityConfirmDeleteButton" color="danger" onClick={confirmDelete}>
          <FontAwesomeIcon icon="trash" />
          &nbsp;
          <Translate contentKey="common.buttons.delete">Delete</Translate>
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default SupplierReturnDeleteDialog;
