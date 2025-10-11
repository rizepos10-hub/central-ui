import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Translate } from 'react-jhipster';
import { X, Trash2 } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, deleteEntity } from './loyalty-card.reducer';
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

export const LoyaltyCardDeleteDialog = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();

  const [loadModal, setLoadModal] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    dispatch(getEntity(id));
    setLoadModal(true);
  }, []);

  const customerEntity = useAppSelector(state => state.customer.entity);
  const updateSuccess = useAppSelector(state => state.customer.updateSuccess);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => navigate(-1), 150);
  };

  useEffect(() => {
    if (updateSuccess && loadModal) {
      handleClose();
      setLoadModal(false);
    }
  }, [updateSuccess]);

  const confirmDelete = () => {
    dispatch(deleteEntity(customerEntity.id));
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="text-xs">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-sm" data-cy="customerDeleteDialogHeading">
            <Translate contentKey="common.deleteTitle">Confirm delete operation</Translate>
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs" id="tempApp.customer.delete.question">
            <Translate contentKey="tempApp.customer.delete.question" interpolate={{ customer: customerEntity.id }}>
              Are you sure you want to delete this Customer?
            </Translate>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose} className="h-8 text-xs">
            <X className="h-3 w-3" />
            <Translate contentKey="entity.action.cancel">Cancel</Translate>
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmDelete}
            className="h-8 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
            id="jhi-confirm-delete-customer"
            data-cy="entityConfirmDeleteButton"
          >
            <Trash2 className="h-3 w-3" />
            <Translate contentKey="entity.action.delete">Delete</Translate>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default LoyaltyCardDeleteDialog;
