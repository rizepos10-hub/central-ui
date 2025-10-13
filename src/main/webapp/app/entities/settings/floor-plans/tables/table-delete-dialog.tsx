import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Translate } from 'react-jhipster';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, deleteEntity } from './table.reducer';
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

export const FloorPlanTableDeleteDialog = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();

  const [loadModal, setLoadModal] = useState(false);

  useEffect(() => {
    dispatch(getEntity(id));
    setLoadModal(true);
  }, []);

  const floorPlanTableEntity = useAppSelector(state => state.floorPlanTable.entity);
  const updateSuccess = useAppSelector(state => state.floorPlanTable.updateSuccess);

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
    dispatch(deleteEntity(floorPlanTableEntity.id));
  };

  return (
    <AlertDialog open={true} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle data-cy="floorPlanTableDeleteDialogHeading">
            <Translate contentKey="entity.delete.title">Confirm delete operation</Translate>
          </AlertDialogTitle>
          <AlertDialogDescription id="tempApp.table.delete.question">
            <Translate contentKey="tempApp.table.delete.question" interpolate={{ id: floorPlanTableEntity.id }}>
              Are you sure you want to delete this Addon?
            </Translate>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose}>
            <Translate contentKey="entity.action.cancel">Cancel</Translate>
          </AlertDialogCancel>
          <AlertDialogAction
            id="jhi-confirm-delete-floorPlanTable"
            data-cy="entityConfirmDeleteButton"
            onClick={confirmDelete}
            className="bg-red-500 hover:bg-red-600"
          >
            <Translate contentKey="entity.action.delete">Delete</Translate>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default FloorPlanTableDeleteDialog;
