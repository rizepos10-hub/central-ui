import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';
import { Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, deleteEntity } from './item-restaurant-category.reducer';

export const DeleteItemRestaurantCategoryDialog = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();

  const [loadModal, setLoadModal] = useState(false);

  useEffect(() => {
    dispatch(getEntity(id));
    setLoadModal(true);
  }, []);

  const termEntity = useAppSelector(state => state.restaurantCategory.entity);
  const updateSuccess = useAppSelector(state => state.restaurantCategory.updateSuccess);

  const handleClose = () => {
    navigate('/category/restaurant-items' + location.search);
  };

  useEffect(() => {
    if (updateSuccess && loadModal) {
      handleClose();
      setLoadModal(false);
    }
  }, [updateSuccess]);

  const confirmDelete = () => {
    dispatch(deleteEntity(termEntity.id));
  };

  return (
    <Modal isOpen toggle={handleClose}>
      <ModalHeader toggle={handleClose} data-cy="termDeleteDialogHeading">
        <Translate contentKey="restaurantCategories.delete.title"/>
      </ModalHeader>
      <ModalBody id="tempApp.term.delete.question">
        <Translate contentKey="restaurantCategories.delete.question" interpolate={{ id: termEntity.id }}>
          Are you sure you want to delete this Term?
        </Translate>
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" onClick={handleClose}>
          <FontAwesomeIcon icon="ban" />
          &nbsp;
          <Translate contentKey="common.buttons.cancel"/>
        </Button>
        <Button id="jhi-confirm-delete-term" data-cy="entityConfirmDeleteButton" color="danger" onClick={confirmDelete}>
          <FontAwesomeIcon icon="trash" />
          &nbsp;
          <Translate contentKey="common.buttons.delete"/>
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default DeleteItemRestaurantCategoryDialog;
