import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'react-toastify';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import { IBranch } from 'app/shared/model/branch.model';
import { IBranchOnAccountDebit, OnAccountBalanceType } from 'app/shared/model/on-account-settings.model';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { changeEntityField, getOnAccountSettings, updateOnAccountSettings } from './on-account-settings.reducer';

const OnAccountSettingsPage = () => {
  const dispatch = useAppDispatch();
  const branchList: IBranch[] = useAppSelector(state => state.branch.entities);
  const onAccountSettings = useAppSelector(state => state.onAccountSettings.entity);
  const loading = useAppSelector(state => state.onAccountSettings.loading);
  const updating = useAppSelector(state => state.onAccountSettings.updating);
  const updateSuccess = useAppSelector(state => state.onAccountSettings.updateSuccess);

  useEffect(() => {
    dispatch(getOnAccountSettings());
    dispatch(
      getBranches({
        page: 0,
        size: 500,
        sort: 'asc',
      })
    );
  }, [dispatch]);

  useEffect(() => {
    if (updateSuccess) {
      toast.success('On account settings saved.');
    }
  }, [updateSuccess]);

  const parseNumericField = (value: string) => {
    const parsedValue = parseFloat(value);
    return Number.isNaN(parsedValue) ? 0 : parsedValue;
  };

  const handleFieldChange = (name: 'onAccountBalanceType' | 'onAccountDebitLimit' | 'warningThreshold' | 'criticalThreshold', value: any) => {
    dispatch(changeEntityField({ name, value }));
  };

  const getBranchOnAccountDebit = (branchId: string): IBranchOnAccountDebit => {
    return onAccountSettings?.branchOnAccountDebits?.[branchId] || { debitLimit: 0, debitUsed: 0 };
  };

  const handleBranchOnAccountDebitChange = (branchId: string, field: keyof IBranchOnAccountDebit, value: number) => {
    dispatch(
      changeEntityField({
        name: 'branchOnAccountDebits',
        value: {
          ...(onAccountSettings?.branchOnAccountDebits || {}),
          [branchId]: {
            ...getBranchOnAccountDebit(branchId),
            [field]: value,
          },
        },
      })
    );
  };

  const onSave = async () => {
    try {
      await dispatch(updateOnAccountSettings(onAccountSettings)).unwrap();
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to save on account settings.';
      toast.error(message);
    }
  };

  return (
    <PageWrapper className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold">On Account Settings</h2>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="h-8 text-xs">
            <Link to="/details">
              <ArrowLeft className="h-3 w-3 mr-1" />
              Back
            </Link>
          </Button>
          <Button type="button" className="h-8 text-xs" disabled={updating} onClick={onSave}>
            <Save className="h-3 w-3 mr-1" />
            Save
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Global On Account Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Balance Type</Label>
            <RadioGroup
              value={onAccountSettings?.onAccountBalanceType || OnAccountBalanceType.BY_BRANCH}
              onValueChange={value => handleFieldChange('onAccountBalanceType', value)}
              className="flex flex-col gap-2 md:flex-row md:gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={OnAccountBalanceType.BY_BUSINESS} id="on-account-by-business" />
                <Label htmlFor="on-account-by-business" className="text-xs cursor-pointer">By Business</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={OnAccountBalanceType.BY_BRANCH} id="on-account-by-branch" />
                <Label htmlFor="on-account-by-branch" className="text-xs cursor-pointer">By Branch</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="on-account-debit-limit" className="text-xs font-semibold">Business Debit Limit</Label>
              <Input
                id="on-account-debit-limit"
                type="number"
                min={0}
                step="0.01"
                value={onAccountSettings?.onAccountDebitLimit ?? 0}
                onChange={e => handleFieldChange('onAccountDebitLimit', parseNumericField(e.target.value))}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="warning-threshold" className="text-xs font-semibold">Warning Threshold</Label>
              <Input
                id="warning-threshold"
                type="number"
                min={0}
                step="0.01"
                value={onAccountSettings?.warningThreshold ?? 0}
                onChange={e => handleFieldChange('warningThreshold', parseNumericField(e.target.value))}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="critical-threshold" className="text-xs font-semibold">Critical Threshold</Label>
              <Input
                id="critical-threshold"
                type="number"
                min={0}
                step="0.01"
                value={onAccountSettings?.criticalThreshold ?? 0}
                onChange={e => handleFieldChange('criticalThreshold', parseNumericField(e.target.value))}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">Branch Debit Limits</Label>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Branch</TableHead>
                    <TableHead className="text-xs">Debit Limit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branchList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-xs text-center text-muted-foreground py-4">
                        No branches available
                      </TableCell>
                    </TableRow>
                  ) : (
                    branchList.map(branch => (
                      <TableRow key={branch.id}>
                        <TableCell className="text-xs">{branch.name}</TableCell>
                        <TableCell className="text-xs">
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            className="h-8 text-xs"
                            value={getBranchOnAccountDebit(branch.id).debitLimit ?? 0}
                            disabled={(onAccountSettings?.onAccountBalanceType || OnAccountBalanceType.BY_BRANCH) !== OnAccountBalanceType.BY_BRANCH}
                            onChange={e => handleBranchOnAccountDebitChange(branch.id, 'debitLimit', parseNumericField(e.target.value))}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {loading ? <p className="text-[11px] text-muted-foreground">Loading on account settings...</p> : null}
        </CardContent>
      </Card>
    </PageWrapper>
  );
};

export default OnAccountSettingsPage;
