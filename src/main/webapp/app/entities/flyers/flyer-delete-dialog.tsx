import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Translate } from 'react-jhipster';
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
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { deleteEntity, getEntity } from './flyer.reducer';
import { IFlyer } from 'app/shared/model/flyer.model';

export const FlyerDeleteDialog = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();

  const [loadModal, setLoadModal] = useState(false);

  useEffect(() => {
    dispatch(getEntity(id));
    setLoadModal(true);
  }, [dispatch, id]);

  const flyer: IFlyer = useAppSelector(state => state.flyer.entity);
  const updateSuccess = useAppSelector(state => state.flyer.updateSuccess);

  const handleClose = () => {
    navigate(-1);
  };

  useEffect(() => {
    if (updateSuccess && loadModal) {
      handleClose();
      setLoadModal(false);
    }
  }, [loadModal, updateSuccess]);

  const confirmDelete = () => {
    dispatch(deleteEntity(flyer.id));
  };

  return (
    <AlertDialog open={loadModal} onOpenChange={open => !open && handleClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base">
            <Translate contentKey="entity.delete.title">Confirm delete operation</Translate>
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs">
            Are you sure you want to delete this Flyer?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose} className="h-8 text-xs">
            <Translate contentKey="entity.action.cancel">Cancel</Translate>
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmDelete}
            className="h-8 bg-destructive text-xs hover:bg-destructive/90"
            data-cy="entityConfirmDeleteButton"
          >
            <Translate contentKey="entity.action.delete">Delete</Translate>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default FlyerDeleteDialog;
