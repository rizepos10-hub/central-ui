import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Translate } from 'react-jhipster';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, deleteEntity } from './void-reason.reducer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const VoidReasonDeleteDialog = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();

  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    dispatch(getEntity(id));
  }, []);

  const voidReasonsEntity = useAppSelector(state => state.voidReason.entity);
  const updateSuccess = useAppSelector(state => state.voidReason.updateSuccess);

  const handleClose = () => {
    setIsOpen(false);
    navigate(-1);
  };

  useEffect(() => {
    if (updateSuccess) {
      handleClose();
    }
  }, [updateSuccess]);

  const confirmDelete = () => {
    dispatch(deleteEntity(voidReasonsEntity.id));
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle data-cy="void-reasonsDeleteDialogHeading">
            <Translate contentKey="entity.delete.title">Confirm delete operation</Translate>
          </AlertDialogTitle>
          <AlertDialogDescription id="tempApp.void-reasons.delete.question">
            <Translate contentKey="tempApp.voidReasons.delete.question" interpolate={{ id: voidReasonsEntity.id }}>
              Are you sure you want to delete this Void Reason?
            </Translate>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose} className="h-8 text-xs">
            <Translate contentKey="entity.action.cancel">Cancel</Translate>
          </AlertDialogCancel>
          <AlertDialogAction
            id="jhi-confirm-delete-void-reasons"
            data-cy="entityConfirmDeleteButton"
            onClick={confirmDelete}
            className="h-8 text-xs bg-destructive hover:bg-destructive/90"
          >
            <Translate contentKey="entity.action.delete">Delete</Translate>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default VoidReasonDeleteDialog;
