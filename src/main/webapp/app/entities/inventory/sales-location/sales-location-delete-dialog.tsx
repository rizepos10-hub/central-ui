import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Translate } from 'react-jhipster';
import { X, Trash2 } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, deleteEntity } from './sales-location.reducer';
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
    navigate(-1);
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
    <AlertDialog open={loadModal} onOpenChange={(open) => !open && handleClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base">
            <Translate contentKey="tempApp.salesLocation.delete.title">Confirm delete operation</Translate>
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs">
            <Translate contentKey="tempApp.salesLocation.delete.question" interpolate={{ id: salesLocationEntity.id }}>
              Are you sure you want to delete this Sales Location?
            </Translate>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-8 text-xs" onClick={handleClose}>
            <X className="h-4 w-4 mr-1" />
            <Translate contentKey="common.buttons.cancel">Cancel</Translate>
          </AlertDialogCancel>
          <AlertDialogAction
            className="h-8 text-xs bg-destructive hover:bg-destructive/90"
            onClick={confirmDelete}
            id="jhi-confirm-delete-salesLocation"
            data-cy="entityConfirmDeleteButton"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            <Translate contentKey="common.buttons.delete">Delete</Translate>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SalesLocationDeleteDialog;
