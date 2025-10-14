import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Translate } from 'react-jhipster';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, deleteEntity } from './tag-group.reducer';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Ban, Trash2 } from 'lucide-react';

const TagGroupDeleteDialog = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();

  const [loadModal, setLoadModal] = useState(false);

  useEffect(() => {
    dispatch(getEntity(id));
    setLoadModal(true);
  }, []);

  const tagGroupEntity = useAppSelector(state => state.tagGroup.entity);
  const updateSuccess = useAppSelector(state => state.tagGroup.updateSuccess);

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
    dispatch(deleteEntity(tagGroupEntity.id));
  };

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-base">
            <Translate contentKey="retailAttributes.delete.title">Confirm delete operation</Translate>
          </DialogTitle>
          <DialogDescription className="text-xs">
            <Translate contentKey="tagGroup.delete.question" interpolate={{ id: tagGroupEntity.id }}>
              Are you sure you want to delete this tag?
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
            <Translate contentKey="entity.action.cancel">Cancel</Translate>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="h-8 text-xs"
            onClick={confirmDelete}
            data-cy="entityConfirmDeleteButton"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            <Translate contentKey="entity.action.delete">Delete</Translate>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TagGroupDeleteDialog;
