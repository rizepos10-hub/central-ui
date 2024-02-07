import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';
import { Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, deleteEntity } from './purchase-order.reducer';

export const PurchaseOrderDeleteDialog = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();

  const [loadModal, setLoadModal] = useState(false);

  useEffect(() => {
    dispatch(getEntity(id));
    setLoadModal(true);
  }, []);

  const purchaseOrderEntity = useAppSelector(state => state.purchaseOrder.entity);
  const updateSuccess = useAppSelector(state => state.purchaseOrder.updateSuccess);

  const handleClose = () => {
    navigate('/inventory/purchase-order' + location.search);
  };

  useEffect(() => {
    if (updateSuccess && loadModal) {
      handleClose();
      setLoadModal(false);
    }
  }, [updateSuccess]);

  const confirmDelete = () => {
    dispatch(deleteEntity(purchaseOrderEntity.id));
  };

  return (
    <Modal isOpen toggle={handleClose}>
      <ModalHeader toggle={handleClose} data-cy="purchaseOrderDeleteDialogHeading">
        <Translate contentKey="tempApp.purchaseOrder.delete.title">Confirm delete operation</Translate>
      </ModalHeader>
      <ModalBody id="purchaseOrders.delete.question">
        <Translate contentKey="tempApp.purchaseOrder.delete.question" interpolate={{ id: purchaseOrderEntity.id }}>
          Are you sure you want to delete this Supplier?
        </Translate>
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" onClick={handleClose}>
          <FontAwesomeIcon icon="ban" />
          &nbsp;
          <Translate contentKey="common.buttons.cancel">Cancel</Translate>
        </Button>
        <Button id="jhi-confirm-delete-purchaseOrder" data-cy="entityConfirmDeleteButton" color="danger" onClick={confirmDelete}>
          <FontAwesomeIcon icon="trash" />
          &nbsp;
          <Translate contentKey="common.buttons.delete">Delete</Translate>
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default PurchaseOrderDeleteDialog;
