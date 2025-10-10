import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Translate } from 'react-jhipster';
import { X, Trash2 } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, deleteEntity } from './supplier.reducer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

export const SupplierDeleteDialog = () => {
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

  const supplierEntity = useAppSelector(state => state.supplier.entity);
  const updateSuccess = useAppSelector(state => state.supplier.updateSuccess);

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
    dispatch(deleteEntity(supplierEntity.id));
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base" data-cy="supplierDeleteDialogHeading">
            <Translate contentKey="tempApp.supplier.delete.title">Confirm delete operation</Translate>
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs" id="suppliers.delete.question">
            <Translate contentKey="tempApp.supplier.delete.question" interpolate={{ param: supplierEntity.name }}>
              Are you sure you want to delete this Supplier?
            </Translate>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-8 text-xs" onClick={handleClose}>
            <X className="h-4 w-4 mr-1" />
            <Translate contentKey="common.buttons.cancel">Cancel</Translate>
          </AlertDialogCancel>
          <AlertDialogAction
            className="h-8 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={confirmDelete}
            id="jhi-confirm-delete-supplier"
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

export default SupplierDeleteDialog;
