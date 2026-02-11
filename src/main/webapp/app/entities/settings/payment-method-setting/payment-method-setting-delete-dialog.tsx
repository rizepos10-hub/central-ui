import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Translate } from 'react-jhipster';
import { Ban, Trash2 } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, deleteEntity } from './payment-method-setting.reducer';
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
import { TransactionMethodEnum } from 'app/shared/model/service-charge.model';

export const PaymentMethodSettingDeleteDialog = () => {
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

  const paymentMethodSetting = useAppSelector(state => state.paymentMethodSetting.entity);
  const updateSuccess = useAppSelector(state => state.paymentMethodSetting.updateSuccess);

  const handleClose = () => {
    setOpen(false);
    navigate(-1);
  };

  useEffect(() => {
    if (updateSuccess && loadModal) {
      navigate('/payment-method-setting');
      setLoadModal(false);
    }
  }, [updateSuccess]);

  const confirmDelete = () => {
    // Only allow deletion of custom methods
    if (paymentMethodSetting.transactionMethod === TransactionMethodEnum.custom) {
      dispatch(deleteEntity(paymentMethodSetting.id));
    }
  };

  const isCustomMethod = paymentMethodSetting.transactionMethod === TransactionMethodEnum.custom;

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="text-xs">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-sm">
            <Translate contentKey="entity.delete.title">Confirm delete operation</Translate>
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs">
            {isCustomMethod ? (
              <Translate 
                contentKey="tempApp.paymentMethodSetting.delete.question" 
                interpolate={{ name: paymentMethodSetting.name || 'this payment method' }}
              >
                Are you sure you want to delete this Payment Method Setting?
              </Translate>
            ) : (
              <span className="text-red-600">
                This payment method cannot be deleted. Only custom payment methods can be deleted.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose} className="h-8 text-xs">
            <Ban className="h-4 w-4" />
            <Translate contentKey="entity.action.cancel">Cancel</Translate>
          </AlertDialogCancel>
          {isCustomMethod && (
            <AlertDialogAction
              onClick={confirmDelete}
              id="jhi-confirm-delete-paymentMethodSetting"
              data-cy="entityConfirmDeleteButton"
              className="h-8 text-xs bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4" />
              <Translate contentKey="entity.action.delete">Delete</Translate>
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PaymentMethodSettingDeleteDialog;
