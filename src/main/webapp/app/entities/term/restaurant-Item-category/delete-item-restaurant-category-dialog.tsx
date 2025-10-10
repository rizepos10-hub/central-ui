import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Translate } from 'react-jhipster';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, deleteEntity } from './item-restaurant-category.reducer';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Ban, Trash2 } from 'lucide-react';

export const DeleteItemRestaurantCategoryDialog = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();

  const [loadModal, setLoadModal] = useState(false);

  useEffect(() => {
    dispatch(getEntity(id));
    setLoadModal(true);
  }, []);

  const termEntity = useAppSelector(state => state.restaurantCategory.entity);
  const updateSuccess = useAppSelector(state => state.restaurantCategory.updateSuccess);

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
    dispatch(deleteEntity(termEntity.id));
  };

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-base">
            <Translate contentKey="itemCategories.delete.title">Confirm delete operation</Translate>
          </DialogTitle>
          <DialogDescription className="text-xs">
            <Translate contentKey="itemCategories.delete.question" interpolate={{ id: termEntity.id }}>
              Are you sure you want to delete this category?
            </Translate>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="h-8 text-xs"
            onClick={handleClose}
          >
            <Ban className="h-4 w-4 mr-2" />
            <Translate contentKey="common.buttons.cancel">Cancel</Translate>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="h-8 text-xs"
            onClick={confirmDelete}
            data-cy="entityConfirmDeleteButton"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            <Translate contentKey="common.buttons.delete">Delete</Translate>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteItemRestaurantCategoryDialog;
