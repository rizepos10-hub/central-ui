import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Translate } from 'react-jhipster';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, deleteEntity } from './course-definition.reducer';
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

export const CourseDefinitionDeleteDialog = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();

  const [loadModal, setLoadModal] = useState(false);

  useEffect(() => {
    dispatch(getEntity(id));
    setLoadModal(true);
  }, []);

  const courseDefinitionEntity = useAppSelector(state => state.courseDefinition.entity);
  const updateSuccess = useAppSelector(state => state.courseDefinition.updateSuccess);

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
    dispatch(deleteEntity(courseDefinitionEntity.id));
  };

  return (
    <AlertDialog open={true} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle data-cy="courseDeleteDialogHeading">
            <Translate contentKey="entity.delete.title">Confirm delete operation</Translate>
          </AlertDialogTitle>
          <AlertDialogDescription id="tempApp.course.delete.question">
            <Translate contentKey="tempApp.course.delete.question" interpolate={{ id: courseDefinitionEntity.id }}>
              Are you sure you want to delete this Addon?
            </Translate>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose}>
            <Translate contentKey="entity.action.cancel">Cancel</Translate>
          </AlertDialogCancel>
          <AlertDialogAction
            id="jhi-confirm-delete-course"
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

export default CourseDefinitionDeleteDialog;
