import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Translate } from 'react-jhipster';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { deleteEntity, getEntity } from './custom-definitions.reducer';

const CustomDefinitionsDelete = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();

  const [loadModal, setLoadModal] = useState(false);
  const [deleteRelated, setDeleteRelated] = useState(false)

  useEffect(() => {
    dispatch(getEntity(id));
    setLoadModal(true);
  }, []);



  const customDefinition = useAppSelector(state => state.customDefinitions.entity);

  const handleClose = () => {
    navigate(-1);
  };

  const confirmDelete = () => {
    dispatch(deleteEntity({
      id: customDefinition.id,
      deleteRelated
    })).then(() => {
      handleClose()
      setLoadModal(false);
    })
  };

  return (
    <AlertDialog open={loadModal} onOpenChange={(open) => !open && handleClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base">
            <Translate contentKey="retailAttributes.delete.title">Confirm delete operation</Translate>
          </AlertDialogTitle>
          <AlertDialogDescription id="customDefinition.delete.question" className="text-xs">
            <Translate contentKey="customDefinition.delete.question" interpolate={{ id: customDefinition.id }}>
              Are you sure you want to delete this custom definition?
            </Translate>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex items-center gap-2 px-6">
          <Checkbox
            id="custom-definitions-required-checkbox"
            checked={deleteRelated}
            onCheckedChange={(checked) => setDeleteRelated(checked === true)}
          />
          <Label htmlFor="custom-definitions-required-checkbox" className="text-xs font-normal cursor-pointer">
            <Translate contentKey={'customDefinition.delete.deleteRelated'}>
              Delete related field values?
            </Translate>
          </Label>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose} className="h-8 text-xs">
            <Translate contentKey="entity.action.cancel">Cancel</Translate>
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmDelete}
            className="h-8 text-xs bg-destructive hover:bg-destructive/90"
            id="jhi-confirm-delete-custom-definitions"
            data-cy="entityConfirmDeleteButton"
          >
            <Translate contentKey="entity.action.delete">Delete</Translate>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CustomDefinitionsDelete;
