import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Translate } from 'react-jhipster';
import { X, Trash2 } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, deleteEntity } from './transfer-request.reducer';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

export const TransferRequestDeleteDialog = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();

  const [loadModal, setLoadModal] = useState(false);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    dispatch(getEntity(id));
    setLoadModal(true);
  }, []);

  const transferRequestEntity = useAppSelector(state => state.transferRequest.entity);
  const updateSuccess = useAppSelector(state => state.transferRequest.updateSuccess);

  const handleClose = () => {
    setOpen(false);
    navigate(-1);
  };

  useEffect(() => {
    if (updateSuccess && loadModal) {
      handleClose();
      setLoadModal(false);
    }
  }, [updateSuccess]);

  const confirmDelete = () => {
    dispatch(deleteEntity(transferRequestEntity.id));
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="text-xs">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-sm">
            <Translate contentKey="tempApp.transferRequest.delete.title">Confirm delete operation</Translate>
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs">
            <Translate contentKey="tempApp.transferRequest.delete.question" interpolate={{ id: transferRequestEntity.id }}>
              Are you sure you want to delete this Transfer Request?
            </Translate>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleClose}>
            <X className="h-4 w-4 mr-1" />
            <Translate contentKey="common.buttons.cancel">Cancel</Translate>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="h-8 text-xs"
            id="jhi-confirm-delete-transferRequest"
            data-cy="entityConfirmDeleteButton"
            onClick={confirmDelete}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            <Translate contentKey="common.buttons.delete">Delete</Translate>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default TransferRequestDeleteDialog;
