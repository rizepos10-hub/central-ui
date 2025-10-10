import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Translate } from 'react-jhipster';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, deleteEntity } from './pizza-size.reducer';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export const PizzaSizeDeleteDialog = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();

  const [loadModal, setLoadModal] = useState(false);

  useEffect(() => {
    dispatch(getEntity(id));
    setLoadModal(true);
  }, []);

  const pizzaSizeEntity = useAppSelector(state => state.pizzaSize.entity);
  const updateSuccess = useAppSelector(state => state.pizzaSize.updateSuccess);

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
    dispatch(deleteEntity(pizzaSizeEntity.id));
  };

  return (
    <AlertDialog open={true} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base">
            <Translate contentKey="entity.delete.title">Confirm delete operation</Translate>
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs">
            <Translate contentKey="tempApp.pizzaSize.delete.question" interpolate={{ id: pizzaSizeEntity.id }}>
              Are you sure you want to delete this Pizza Size?
            </Translate>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose} className="h-8 text-xs">
            <Translate contentKey="entity.action.cancel">Cancel</Translate>
          </AlertDialogCancel>
          <AlertDialogAction onClick={confirmDelete} className="h-8 text-xs bg-destructive hover:bg-destructive/90">
            <Translate contentKey="entity.action.delete">Delete</Translate>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PizzaSizeDeleteDialog;
