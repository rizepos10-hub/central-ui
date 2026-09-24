import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Translate, translate, getSortState, JhiPagination, JhiItemCount } from 'react-jhipster';

import { ASC, DESC, ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntities as getCurrencies } from './currencies.reducer';
import { ICurrencySettings } from "app/shared/model/CURRENCY/currency-settings.model";
import { ICurrency } from "app/shared/model/CURRENCY/currency.model";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import ReactSelect from "react-select";
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import { IBranch } from "app/shared/model/branch.model";
import { getEntity, updateEntity } from "app/entities/settings/currency/currency-settings.reducer";
import { AlertTriangle, Plus, Trash2, Save } from 'lucide-react';


export const Currency = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );
  const currencies = useAppSelector(state => state.currencies.entities);
  const branchList = useAppSelector(state => state.branch.entities);
  const currencySettingsEntity = useAppSelector(state => state.currencySettings.entity);
  const loading = useAppSelector(state => state.currencySettings.loading);


  const [defaultCurrency, setDefaultCurrency] = useState<ICurrency>(null)
  const [currencySettings, setCurrencySettings] = useState<ICurrencySettings>({
    exchangeRates: [],
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);


  const exchangeRatesArray = currencySettings?.exchangeRates || [];
  const currenciesSet = new Set(exchangeRatesArray.map(option => option.currency));

  const filteredExchangeCurrencies = currencies?.filter(currency => !currenciesSet.has(currency));


  console.log(currencySettings, 'currencySettings')

  const confirm1 = () => {
    setShowConfirmDialog(true);
  };

  const handleSetDefaultCurrency = () => {
    setShowConfirmDialog(false);
    handleCurrencyChange(defaultCurrency, "defaultCurrency");
  }

  const handleAddExchangeRate = () => {
    setCurrencySettings((prevSettings) => {
      const updatedExchangeRates = [...prevSettings.exchangeRates, { currency: null, rate: null }];
      return { ...prevSettings, exchangeRates: updatedExchangeRates };
    });
  };

  const handleRemoveExchangeRate = (index: number) => {
    setCurrencySettings((prevSettings) => {
      const updatedExchangeRates = [...prevSettings.exchangeRates.slice(0, index), ...prevSettings.exchangeRates.slice(index + 1)];
      return { ...prevSettings, exchangeRates: updatedExchangeRates };
    });
  };

  const handleExchangeRateChange = (index: number, field: string, value: ICurrency | number) => {
    setCurrencySettings((prevSettings) => {
      const updatedExchangeRates = [...prevSettings.exchangeRates];
      updatedExchangeRates[index] = { ...updatedExchangeRates[index], [field]: value };
      return { ...prevSettings, exchangeRates: updatedExchangeRates };
    });
  };

  const handleBranchCurrencyChange = (index: number, field: string, value: ICurrency | IBranch | string) => {
    setCurrencySettings((prevSettings) => {
      const updatedBranchCurrencies = [...prevSettings.branchDisplayCurrencies];
      updatedBranchCurrencies[index] = { ...updatedBranchCurrencies[index], [field]: value };
      return { ...prevSettings, branchDisplayCurrencies: updatedBranchCurrencies };
    });
  };



  useEffect(() => {
    dispatch(getCurrencies({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));

    dispatch(getBranches({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }))
    dispatch(getEntity());


  }, []);

  useEffect(() => {
    const existingBranchDisplayCurrencies = (currencySettingsEntity?.branchDisplayCurrencies || []).filter(
      branchCurrency => Boolean(branchCurrency?.branch?.id)
    );
    const existingBranches = existingBranchDisplayCurrencies.map(branchCurrency => branchCurrency.branch.id);
    const missingBranches = branchList?.filter(branch => !existingBranches.includes(branch.id)) || [];

    const defaultBranchDisplayCurrencies = [
      ...existingBranchDisplayCurrencies,
      ...missingBranches.map(branch => ({ branch, currency: null }))
    ];

    setCurrencySettings({
      ...currencySettingsEntity,
      branchDisplayCurrencies: defaultBranchDisplayCurrencies
    });
  }, [currencySettingsEntity, branchList]);


  const handleCurrencyChange = (selectedCurrency, currencyField) => {
    setCurrencySettings((prevState) => ({
      ...prevState,
      [currencyField]: selectedCurrency
    }))
  };

  const handleSave = () => {
    const assignedBranchesCurrencies = currencySettings?.branchDisplayCurrencies?.filter((branchCur) => branchCur?.currency)
    const entity = {
      ...currencySettings,
      branchDisplayCurrencies: assignedBranchesCurrencies
    }
    dispatch(updateEntity(entity))
  }



  return (
    <PageWrapper>
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold">
            Currency Settings
          </h2>
        </div>
        <div className="flex flex-col gap-5 p-4 bg-white rounded-lg shadow-sm max-w-4xl">
          <Alert variant="default" className="border-yellow-500 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-xs">
              Kindly be advised that after the implementation of the default currency, any alterations or modifications become permanent and cannot be reversed.
            </AlertDescription>
          </Alert>

          <div className="flex gap-3 items-center" data-tour="default-currency">
            <label className="text-sm font-semibold whitespace-nowrap">
              Default Currency:
            </label>
            <ReactSelect
              value={currencySettings?.defaultCurrency ?? defaultCurrency}
              options={currencies}
              placeholder="Select a Currency"
              isDisabled={currencySettings?.defaultCurrency !== null}
              onChange={(currency) => setDefaultCurrency(currency)}
              getOptionLabel={option => option.name}
              getOptionValue={option => option.code}
              className="min-w-[200px]"
            />
            {currencySettings?.defaultCurrency === null && (
              <Button
                disabled={defaultCurrency === null}
                onClick={confirm1}
                className="h-7 text-xs"
                data-tour="currency-save-button">
                Set Default Currency
              </Button>
            )}
          </div>

          <div className="flex gap-3 items-center">
            <label className="text-sm font-semibold whitespace-nowrap">
              Display Currency:
            </label>
            <ReactSelect
              value={currencySettings?.displayCurrency}
              onChange={(currency) => handleCurrencyChange(currency, "displayCurrency")}
              options={currencies}
              isClearable
              getOptionLabel={option => option.name}
              getOptionValue={option => option.code}
              placeholder="Select a Currency"
              className="min-w-[200px]"
            />
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold">
                Exchange Rates
              </label>
              <Button onClick={handleAddExchangeRate} className="h-7 text-xs gap-1">
                <Plus className="h-3 w-3" />
                Add Exchange Rate
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Currency</TableHead>
                  <TableHead className="text-xs">Rate</TableHead>
                  <TableHead className="text-xs w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currencySettings?.exchangeRates?.map((exchangeRate, index) => {
                  const { currency } = exchangeRate
                  console.log(currency, 'currency')
                  return (
                    <TableRow key={index}>
                      <TableCell className="text-xs">
                        <ReactSelect
                          value={currency}
                          onChange={(selectedCurrency) => handleExchangeRateChange(index, 'currency', selectedCurrency)}
                          options={filteredExchangeCurrencies}
                          placeholder="Select a Currency"
                          getOptionLabel={option => option.name}
                          getOptionValue={option => option.code}
                        />
                      </TableCell>
                      <TableCell className="text-xs">
                        {currency?.code &&
                          <Input
                            type="number"
                            step="0.01"
                            value={exchangeRate.rate ?? ''}
                            onChange={(e) => handleExchangeRateChange(index, 'rate', Number(e.target.value))}
                            className="h-7 text-xs"
                            placeholder="0.00"
                          />}
                      </TableCell>
                      <TableCell className="text-xs">
                        <Button
                          variant="destructive"
                          onClick={() => handleRemoveExchangeRate(index)}
                          className="h-7 text-xs gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <label className="text-sm font-semibold">
              Branches Currencies
            </label>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Branch</TableHead>
                  <TableHead className="text-xs">Currency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currencySettings?.branchDisplayCurrencies?.map((branchCurrency, index) => {
                  return (
                    <TableRow key={index}>
                      <TableCell className="text-xs">
                        {branchCurrency?.branch?.name}
                      </TableCell>
                      <TableCell className="text-xs">
                        <ReactSelect
                          value={typeof branchCurrency?.currency === 'string'
                            ? currencies?.find(c => c.id === branchCurrency?.currency)
                            : branchCurrency?.currency}
                          onChange={(selectedCurrency: ICurrency) => handleBranchCurrencyChange(index, 'currency', selectedCurrency || null)}
                          options={currencies}
                          placeholder="Select a Currency"
                          isClearable
                          getOptionLabel={(option: ICurrency) => option.name}
                          getOptionValue={(option: ICurrency) => option.id}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            <div className="flex justify-end mt-2">
              <Button onClick={handleSave} className="h-8 text-xs gap-1">
                <Save className="h-4 w-4" />
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Confirmation</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSetDefaultCurrency} className="h-8 text-xs">
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageWrapper>
  );
};

export default Currency;
