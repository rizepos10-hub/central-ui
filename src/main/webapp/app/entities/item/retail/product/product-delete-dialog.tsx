import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Translate } from 'react-jhipster';
import { X, Trash2 } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import variableRetailItem from "app/entities/item/retail/variable-item/variable-item.reducer";
import { archiveEntity, getEntity } from './product.reducer';
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

export const SimpleDeleteDialog = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();

  const [loadModal, setLoadModal] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    dispatch(getEntity(id));
    setLoadModal(true);
    setOpen(true);
  }, []);

  const product = useAppSelector(state => state.product.entity);
  const updateSuccess = useAppSelector(state => state.product.updateSuccess);

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => navigate(-1), 150);
  };

  useEffect(() => {
    if (updateSuccess && loadModal) {
      handleClose();
      setLoadModal(false);
    }
  }, [updateSuccess]);

  const confirmDelete = () => {
    dispatch(archiveEntity(id));
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base" data-cy="simpleItemDeleteDialogHeading">
            <Translate contentKey="entity.delete.title">Confirm delete operation</Translate>
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs" id="tempApp.restaurant-simple.delete.question">
            <Translate contentKey="items.delete.question" interpolate={{ id: product.id }}>
              Are you sure you want to delete this Simple?
            </Translate>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-8 text-xs" onClick={handleClose}>
            <X className="h-4 w-4 mr-1" />
            <Translate contentKey="entity.action.cancel">Cancel</Translate>
          </AlertDialogCancel>
          <AlertDialogAction
            id="jhi-confirm-delete-restaurant-simple"
            data-cy="entityConfirmDeleteButton"
            className="h-8 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={confirmDelete}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            <Translate contentKey="entity.action.delete">Delete</Translate>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SimpleDeleteDialog;
