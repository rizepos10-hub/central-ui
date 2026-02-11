import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { translate, Translate } from 'react-jhipster';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { IPaymentMethodSetting } from 'app/shared/model/payment-method-setting.model';
import { TransactionMethodEnum } from 'app/shared/model/service-charge.model';
import { getAllEntities } from './payment-method-setting.reducer';
import { Pencil, Trash2, RefreshCw, Plus, Loader2 } from 'lucide-react';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const PaymentMethodSetting = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const paymentMethodSettings: IPaymentMethodSetting[] = useAppSelector(state => state.paymentMethodSetting.entities);
  const loading = useAppSelector(state => state.paymentMethodSetting.loading);

  useEffect(() => {
    dispatch(getAllEntities());
  }, []);

  const handleSyncList = () => {
    dispatch(getAllEntities());
  };

  const handleCreate = () => {
    navigate('/payment-method-setting/new');
  };

  const formatTransactionMethod = (method: string) => {
    if (!method) return '-';
    return method
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  };

  const nameColumnTemplate = (rowData: IPaymentMethodSetting) => {
    const editUrl = `/payment-method-setting/${rowData.id}/edit`;
    return (
      <Link className="font-normal text-xs hover:underline" to={editUrl}>
        {rowData.name || '-'}
      </Link>
    );
  };

  const editColumnTemplate = (rowData: IPaymentMethodSetting) => {
    const editUrl = `/payment-method-setting/${rowData.id}/edit`;
    return (
      <Link to={editUrl}>
        <Pencil className="h-3 w-3 text-muted-foreground hover:text-foreground" />
      </Link>
    );
  };

  const deleteColumnTemplate = (rowData: IPaymentMethodSetting) => {
    // Only show delete for custom transaction methods
    if (rowData.transactionMethod !== TransactionMethodEnum.custom) {
      return <span className="text-xs text-muted-foreground">-</span>;
    }
    const deleteUrl = `/payment-method-setting/${rowData.id}/delete`;
    return (
      <Link to={deleteUrl}>
        <Trash2 className="h-3 w-3 text-destructive" />
      </Link>
    );
  };

  return (
    <PageWrapper>
      {/* Header */}
      <div className="bg-muted/50 p-2 flex justify-between items-center">
        <h2 className="text-xl font-bold">
          <Translate contentKey="payment-method-setting.title">Payment Method Settings</Translate>
        </h2>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={handleSyncList}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
            {translate('common.refreshList')}
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs"
            onClick={handleCreate}
          >
            <Plus className="h-4 w-4 mr-1" />
            {translate('common.createNew')}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-md mt-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Transaction Method</TableHead>
              <TableHead className="text-xs">Name</TableHead>
              <TableHead className="text-xs">Show</TableHead>
              <TableHead className="text-xs w-10">Edit</TableHead>
              <TableHead className="text-xs w-10">Delete</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : paymentMethodSettings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-xs py-8">
                  No payment method settings found
                </TableCell>
              </TableRow>
            ) : (
              paymentMethodSettings.map(setting => (
                <TableRow key={setting.id}>
                  <TableCell className="text-xs">
                    {formatTransactionMethod(setting.transactionMethod)}
                  </TableCell>
                  <TableCell className="text-xs">{nameColumnTemplate(setting)}</TableCell>
                  <TableCell className="text-xs">
                    {setting.show ? (
                      <span className="text-green-600">Yes</span>
                    ) : (
                      <span className="text-gray-500">No</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">{editColumnTemplate(setting)}</TableCell>
                  <TableCell className="text-xs">{deleteColumnTemplate(setting)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </PageWrapper>
  );
};

export default PaymentMethodSetting;
