import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Label } from 'reactstrap';
import { Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { deleteEntity, getEntity } from './custom-definitions.reducer';
import { Checkbox } from 'primereact/checkbox';

const CustomDefinitionsDelete = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();

  const [loadModal, setLoadModal] = useState(false);
  const [deleteRelated, setDeleteRelated] = useState(false)

  useEffect(() => {
    dispatch(getEntity(id));
    setLoadModal(true);
  }, []);



  const customDefinition = useAppSelector(state => state.customDefinitions.entity);

  const handleClose = () => {
    navigate(-1);
  };

  const confirmDelete = () => {
    dispatch(deleteEntity({
      id: customDefinition.id,
      deleteRelated
    })).then(() => {
      handleClose()
      setLoadModal(false);
    })
  };

  return (
    <Modal isOpen toggle={handleClose}>
      <ModalHeader toggle={handleClose}>
        <Translate contentKey="retailAttributes.delete.title">Confirm delete operation</Translate>
      </ModalHeader>
      <ModalBody id="customDefinition.delete.question">
        <Translate contentKey="customDefinition.delete.question" interpolate={{ id: customDefinition.id }}>
          Are you sure you want to delete this custom definition?
        </Translate>
        <div className='d-flex gap-2 mt-2'>
          <Label htmlFor="authorities-checkbox">
            <Translate contentKey={'customDefinition.delete.deleteRelated'}>
              Delete related field values?
            </Translate>
          </Label>
          <Checkbox
            id="custom-definitions-required-checkbox"
            checked={deleteRelated}
            onChange={e => setDeleteRelated(e.checked)}
          />
        </div>
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" onClick={handleClose}>
          <FontAwesomeIcon icon="ban" />
          &nbsp;
          <Translate contentKey="entity.action.cancel">Cancel</Translate>
        </Button>
        <Button id="jhi-confirm-delete-custom-definitions" data-cy="entityConfirmDeleteButton" color="danger" onClick={confirmDelete}>
          <FontAwesomeIcon icon="trash" />
          &nbsp;
          <Translate contentKey="entity.action.delete">Delete</Translate>
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default CustomDefinitionsDelete;
