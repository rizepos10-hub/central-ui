import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Translate } from 'react-jhipster';
import { Trash2, X } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, deleteEntity } from './branch.reducer';

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
import { Button } from '@/components/ui/button';

export const BranchDeleteDialog = () => {
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

  const branchEntity = useAppSelector(state => state.branch.entity);
  const updateSuccess = useAppSelector(state => state.branch.updateSuccess);

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
    dispatch(deleteEntity(branchEntity.id));
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="max-w-md p-3">
        <AlertDialogHeader className="p-2">
          <AlertDialogTitle className="text-sm font-semibold">
            <Translate contentKey="entity.delete.title">Confirm delete operation</Translate>
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs">
            <Translate contentKey="tempApp.branch.delete.question" interpolate={{ id: branchEntity.name || branchEntity.id }}>
              Are you sure you want to delete this Branch?
            </Translate>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-1 pt-2">
          <AlertDialogCancel asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
              className="h-8 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              <Translate contentKey="entity.action.cancel">Cancel</Translate>
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              size="sm"
              onClick={confirmDelete}
              id="jhi-confirm-delete-branch"
              data-cy="entityConfirmDeleteButton"
              className="h-8 text-xs"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              <Translate contentKey="entity.action.delete">Delete</Translate>
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default BranchDeleteDialog;
