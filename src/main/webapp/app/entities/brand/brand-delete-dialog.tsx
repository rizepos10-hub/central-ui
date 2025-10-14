import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Translate } from 'react-jhipster';
import { Trash2, X } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, deleteEntity } from './brand.reducer';

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

const BrandDeleteDialog = () => {
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

  const brandEntity = useAppSelector(state => state.brand.entity);
  const updateSuccess = useAppSelector(state => state.brand.updateSuccess);

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
    dispatch(deleteEntity(brandEntity.id));
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="max-w-md p-3">
        <AlertDialogHeader className="p-2">
          <AlertDialogTitle className="text-sm font-semibold">
            <Translate contentKey="entity.delete.title">Confirm delete operation</Translate>
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs">
            <Translate contentKey="tempApp.brand.delete.question" interpolate={{ name: brandEntity.name || brandEntity.id }}>
              Are you sure you want to delete this brand?
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
              id="jhi-confirm-delete-brand"
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

export default BrandDeleteDialog;
