import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Translate } from 'react-jhipster';
import { Ban, Trash2 } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, deleteEntity } from './addon.reducer';

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

export const AddonDeleteDialog = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();

  const [loadModal, setLoadModal] = useState(false);

  useEffect(() => {
    dispatch(getEntity(id));
    setLoadModal(true);
  }, []);

  const addonEntity = useAppSelector(state => state.addon.entity);
  const updateSuccess = useAppSelector(state => state.addon.updateSuccess);

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
    dispatch(deleteEntity(addonEntity.id));
  };

  return (
    <AlertDialog open={true} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            <Translate contentKey="common.deleteTitle">Confirm delete operation</Translate>
          </AlertDialogTitle>
          <AlertDialogDescription>
            <Translate contentKey="addons.delete.question" interpolate={{ param: addonEntity.name }}>
              Are you sure you want to delete this Addon?
            </Translate>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose} className="h-8 text-xs">
            <Ban className="h-4 w-4 mr-1" />
            <Translate contentKey="common.buttons.cancel">Cancel</Translate>
          </AlertDialogCancel>
          <AlertDialogAction onClick={confirmDelete} className="h-8 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90">
            <Trash2 className="h-4 w-4 mr-1" />
            <Translate contentKey="common.buttons.delete">Delete</Translate>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AddonDeleteDialog;
